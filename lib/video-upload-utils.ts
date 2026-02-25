/**
 * Video Upload Utilities
 * 동영상 업로드 관련 공통 유틸리티
 */

export const VIDEO_UPLOAD_PATHS = {
    MT: 'Simulator_training/MT/MT_result',
    EMT: 'Simulator_training/EMT/EMT_result',
    LHT: 'Simulator_training/LHT/LHT_result',
    SHT: 'Simulator_training/SHT/SHT_result',
} as const;

export type VideoUploadType = keyof typeof VIDEO_UPLOAD_PATHS;

/**
 * 동영상 파일명 생성
 * @param type 동영상 타입 (MT, EMT, LHT, SHT)
 * @param position 직위
 * @param name 이름
 * @param extension 파일 확장자 (기본값: .mp4)
 * @returns 생성된 파일명
 */
export function generateVideoFileName(
    type: VideoUploadType,
    position: string,
    name: string,
    extension: string = '.mp4'
): string {
    const timestamp = Date.now();
    return `${position}-${name}-${type}-${timestamp}${extension}`;
}

/**
 * 동영상 저장 경로 생성
 * @param type 동영상 타입
 * @param fileName 파일명
 * @returns 전체 저장 경로
 */
export function getVideoStoragePath(
    type: VideoUploadType,
    fileName: string
): string {
    return `${VIDEO_UPLOAD_PATHS[type]}/${fileName}`;
}

