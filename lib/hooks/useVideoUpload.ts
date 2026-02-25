/**
 * Video Upload Hook
 * 
 * 동영상 업로드를 위한 재사용 가능한 React Hook
 * Storage 직접 업로드 방식을 사용하여 타임아웃 문제를 해결합니다.
 * 
 * 사용 예시:
 * ```tsx
 * const { uploadVideo, uploading, progress } = useVideoUpload({
 *   videoType: 'SHT',
 *   user,
 *   userProfile,
 *   maxFileSize: 200 * 1024 * 1024, // 200MB
 *   onSuccess: (result) => {
 *     console.log('Upload successful:', result);
 *   },
 *   onError: (error) => {
 *     console.error('Upload failed:', error);
 *   },
 * });
 * 
 * await uploadVideo(file);
 * ```
 */

import { useState, useCallback } from 'react';
import { VideoUploadType, VIDEO_UPLOAD_PATHS } from '@/lib/video-upload-utils';
import { InstructorInfo } from '@/lib/instructor-utils';

export interface UserProfile {
    position: string;
    name: string;
    hospital: string;
}

export interface User {
    email?: string | null;
}

export interface VideoUploadResult {
    videoUrl: string;
    instructorEmail?: string; // 하위 호환성을 위해 선택적
    instructorName?: string; // 하위 호환성을 위해 선택적
    instructors?: InstructorInfo[]; // 모든 교육자 정보
    logPath: string;
}

export interface UseVideoUploadOptions {
    videoType: VideoUploadType;
    user: User | null;
    userProfile: UserProfile | null;
    maxFileSize?: number; // bytes, 기본값: 200MB
    apiEndpoint: string; // 예: '/api/sht-video-upload'
    onSuccess?: (result: VideoUploadResult) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: number) => void; // 0-100
}

export interface UseVideoUploadReturn {
    uploadVideo: (file: File) => Promise<VideoUploadResult>;
    uploading: boolean;
    progress: number; // 0-100
    error: Error | null;
}

const ALLOWED_EXTENSIONS = ['.avi', '.mp4', '.mpeg4', '.m4v'];
const ALLOWED_TYPES = ['video/avi', 'video/mp4', 'video/mpeg4', 'video/x-msvideo', 'video/quicktime'];

/**
 * 파일 확장자로부터 MIME 타입 결정
 */
function getContentTypeFromExtension(fileExtension: string, fileType: string): string {
    if (fileType && ALLOWED_TYPES.includes(fileType)) {
        return fileType;
    }
    
    if (fileExtension === '.avi') {
        return 'video/x-msvideo';
    } else if (fileExtension === '.mp4' || fileExtension === '.m4v') {
        return 'video/mp4';
    } else if (fileExtension === '.mpeg4') {
        return 'video/mpeg4';
    }
    
    return 'video/mp4';
}

/**
 * 파일 검증
 */
function validateFile(file: File, maxFileSize: number): { valid: boolean; error?: string } {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isValidType = ALLOWED_TYPES.includes(file.type);
    
    if (!isValidType && !isValidExtension) {
        return {
            valid: false,
            error: 'AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.',
        };
    }
    
    if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(0);
        return {
            valid: false,
            error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
        };
    }
    
    return { valid: true };
}

export function useVideoUpload(options: UseVideoUploadOptions): UseVideoUploadReturn {
    const {
        videoType,
        user,
        userProfile,
        maxFileSize = 200 * 1024 * 1024, // 기본값: 200MB
        apiEndpoint,
        onSuccess,
        onError,
        onProgress,
    } = options;

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const uploadVideo = useCallback(async (file: File): Promise<VideoUploadResult> => {
        // 사용자 정보 검증
        if (!user || !userProfile) {
            const error = new Error('사용자 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
            setError(error);
            onError?.(error);
            throw error;
        }

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // 파일 검증
            const validation = validateFile(file, maxFileSize);
            if (!validation.valid) {
                const error = new Error(validation.error || '파일 검증에 실패했습니다.');
                setError(error);
                onError?.(error);
                throw error;
            }

            // 파일명 및 경로 생성
            const fileName = file.name.toLowerCase();
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
            const uploadFileExtension = fileExtension || '.mp4';
            const timestamp = Date.now();
            const storageFileName = `${userProfile.position}-${userProfile.name}-${videoType}-${timestamp}${uploadFileExtension}`;
            const storagePath = `${VIDEO_UPLOAD_PATHS[videoType]}/${storageFileName}`;

            // Firebase Client SDK 로드
            const { storage, auth } = await import('@/lib/firebase-client');
            const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');

            if (!storage) {
                const error = new Error('Firebase Storage가 초기화되지 않았습니다.');
                setError(error);
                onError?.(error);
                throw error;
            }

            // Firebase Auth 인증 상태 확인
            if (!auth || !auth.currentUser) {
                const error = new Error('로그인이 필요합니다. 페이지를 새로고침하거나 다시 로그인해주세요.');
                setError(error);
                onError?.(error);
                throw error;
            }

            const storageRef = ref(storage, storagePath);

            // MIME 타입 결정
            const contentType = getContentTypeFromExtension(fileExtension, file.type);

            // Storage에 업로드
            const uploadTask = uploadBytesResumable(storageRef, file, {
                contentType: contentType,
            });

            // 업로드 완료 대기
            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setProgress(uploadProgress);
                        onProgress?.(uploadProgress);
                        console.log(`[${videoType}] Upload progress: ${uploadProgress.toFixed(2)}%`);
                    },
                    (error: any) => {
                        console.error(`[${videoType}] Storage upload error:`, error);
                        
                        // 인증 관련 오류 처리
                        if (error.code === 'unauthenticated' || error.code === 'permission-denied' || error.message?.includes('auth')) {
                            reject(new Error('인증이 만료되었습니다. 페이지를 새로고침하거나 다시 로그인해주세요.'));
                        } else if (error.code === 'storage/unauthorized') {
                            reject(new Error('업로드 권한이 없습니다. 관리자에게 문의해주세요.'));
                        } else {
                            reject(new Error(`업로드 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`));
                        }
                    },
                    async () => {
                        try {
                            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            console.log(`[${videoType}] File uploaded successfully:`, videoUrl);
                            resolve();
                        } catch (urlError: any) {
                            reject(new Error(`다운로드 URL 생성 실패: ${urlError.message}`));
                        }
                    }
                );
            });

            // 업로드 완료 후 메타데이터를 API로 전송
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user.email || '',
                    position: userProfile.position,
                    name: userProfile.name,
                    hospital: userProfile.hospital,
                    videoUrl: videoUrl,
                    fileName: storageFileName,
                    fileSize: file.size,
                    fileType: contentType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: '메타데이터 저장에 실패했습니다.' }));
                const error = new Error(errorData.error || '메타데이터 저장에 실패했습니다.');
                setError(error);
                onError?.(error);
                throw error;
            }

            const result: VideoUploadResult = await response.json();
            
            setProgress(100);
            onSuccess?.(result);
            
            return result;
        } catch (err: any) {
            const error = err instanceof Error ? err : new Error(err?.message || '업로드에 실패했습니다.');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setUploading(false);
        }
    }, [videoType, user, userProfile, maxFileSize, apiEndpoint, onSuccess, onError, onProgress]);

    return {
        uploadVideo,
        uploading,
        progress,
        error,
    };
}

