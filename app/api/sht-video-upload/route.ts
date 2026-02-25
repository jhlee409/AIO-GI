/**
 * API Route: SHT Video Upload Metadata Handler
 * 
 * 리팩토링된 구조:
 * - 이전: 브라우저 → API 라우트 → Storage (파일 전체 전송, 타임아웃 위험)
 * - 현재: 브라우저 → Storage 직접 업로드 → API 라우트 (메타데이터만)
 * 
 * 장점:
 * 1. Firebase Hosting의 60초 프록시 타임아웃에 영향받지 않음
 *    - 파일 업로드는 클라이언트에서 Storage로 직접 진행
 *    - API 라우트는 메타데이터만 처리하므로 수 초 내 완료
 * 2. 서버 메모리 사용량 감소 (파일을 메모리에 로드하지 않음)
 * 3. 네트워크 효율성 향상 (이중 전송 제거)
 */
import { NextRequest, NextResponse } from 'next/server';
import { findAllInstructorsByHospital } from '@/lib/instructor-utils';
import { createLogFile } from '@/lib/log-utils';
import { extractErrorMessage } from '@/lib/error-handler';

// 메타데이터만 처리하므로 타임아웃이 짧아도 안전
export const maxDuration = 60; // 1 minute (충분함)

interface UploadMetadata {
    userEmail: string;
    position: string;
    name: string;
    hospital: string;
    videoUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

export async function POST(request: NextRequest) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    // 요청 시작 로깅
    console.log(`[sht-video-upload:${requestId}] START`, {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
    });
    
    try {
        // JSON 본문 파싱 (메타데이터만 받음)
        let body: UploadMetadata;
        try {
            body = await request.json();
            console.log(`[sht-video-upload:${requestId}] Request body parsed`, {
                hasUserEmail: !!body.userEmail,
                hasPosition: !!body.position,
                hasName: !!body.name,
                hasHospital: !!body.hospital,
                hasVideoUrl: !!body.videoUrl,
                fileName: body.fileName,
                fileSize: body.fileSize,
                fileType: body.fileType,
            });
        } catch (parseError: any) {
            const errorMessage = extractErrorMessage(parseError, 'Failed to parse request body');
            console.error(`[sht-video-upload:${requestId}] JSON parse error:`, {
                message: errorMessage,
                stack: parseError.stack,
                name: parseError.name,
            });
            return NextResponse.json(
                { error: 'Invalid request format. Expected JSON.' },
                { status: 400 }
            );
        }

        const { userEmail, position, name, hospital, videoUrl, fileName, fileSize, fileType } = body;

        // 필수 필드 검증
        if (!userEmail || !position || !name || !hospital || !videoUrl || !fileName) {
            const missingFields = [];
            if (!userEmail) missingFields.push('userEmail');
            if (!position) missingFields.push('position');
            if (!name) missingFields.push('name');
            if (!hospital) missingFields.push('hospital');
            if (!videoUrl) missingFields.push('videoUrl');
            if (!fileName) missingFields.push('fileName');
            
            console.error(`[sht-video-upload:${requestId}] Missing required fields:`, {
                missingFields,
                received: {
                    hasUserEmail: !!userEmail,
                    hasPosition: !!position,
                    hasName: !!name,
                    hasHospital: !!hospital,
                    hasVideoUrl: !!videoUrl,
                    hasFileName: !!fileName,
                },
            });
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // 파일 크기 검증 (200MB)
        if (fileSize && fileSize > 200 * 1024 * 1024) {
            console.error(`[sht-video-upload:${requestId}] File too large:`, {
                fileSize,
                maxSize: 200 * 1024 * 1024,
            });
            return NextResponse.json(
                { error: 'File size must be less than 200MB' },
                { status: 400 }
            );
        }

        // 1. Find all instructors for the hospital
        const instructorStartTime = Date.now();
        console.log(`[sht-video-upload:${requestId}] Finding instructors...`, { hospital });
        let instructors: Array<{ email: string; name: string }> = [];
        try {
            instructors = await findAllInstructorsByHospital(hospital);
            const instructorDuration = Date.now() - instructorStartTime;
            console.log(`[sht-video-upload:${requestId}] Instructors found`, {
                count: instructors.length,
                emails: instructors.map(i => i.email),
                duration: `${instructorDuration}ms`,
            });
        } catch (instructorError: any) {
            const errorMessage = extractErrorMessage(instructorError, 'Failed to find instructors');
            console.warn(`[sht-video-upload:${requestId}] Failed to find instructors:`, {
                message: errorMessage,
                stack: instructorError.stack,
                name: instructorError.name,
                code: instructorError.code,
            });
            // Continue without instructor emails
        }

        // 2. Create log file
        const logStartTime = Date.now();
        console.log(`[sht-video-upload:${requestId}] Creating log file...`);
        const logFileName = `${position}-${name}-SHT`;
        try {
            await createLogFile(logFileName, {
                position,
                name,
                hospital,
                email: userEmail,
                category: 'Basic course',
                action: 'SHT Video Upload',
                'Video URL': videoUrl,
                'File Name': fileName,
                'File Size': fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                'File Type': fileType || 'Unknown',
            });
            const logDuration = Date.now() - logStartTime;
            console.log(`[sht-video-upload:${requestId}] Log file created`, {
                logFileName,
                duration: `${logDuration}ms`,
            });
        } catch (logError: any) {
            const errorMessage = extractErrorMessage(logError, 'Failed to create log file');
            console.error(`[sht-video-upload:${requestId}] Failed to create log file:`, {
                message: errorMessage,
                stack: logError.stack,
                name: logError.name,
                code: logError.code,
            });
            // Continue even if log creation fails
        }

        const totalDuration = Date.now() - startTime;
        console.log(`[sht-video-upload:${requestId}] SUCCESS`, {
            videoUrl,
            instructorCount: instructors.length,
            instructorEmails: instructors.map(i => i.email),
            totalDuration: `${totalDuration}ms`,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            logPath: `log/${logFileName}`,
            videoUrl,
            instructors: instructors, // 모든 교육자 정보 반환
        });
    } catch (error: any) {
        const errorId = requestId || 'unknown';
        const errorMessage = extractErrorMessage(error, 'Failed to process video upload metadata');
        const totalDuration = Date.now() - startTime;
        
        // 상세 에러 로깅 (GCP/Firebase 로그에 기록)
        console.error(`[sht-video-upload:${errorId}] ERROR:`, {
            message: errorMessage,
            stack: error.stack,
            name: error.name,
            code: error.code,
            cause: error.cause,
            totalDuration: `${totalDuration}ms`,
            timestamp: new Date().toISOString(),
        });
        
        // 브라우저에는 간단한 메시지만 전송
        const errorResponse: any = {
            error: errorMessage,
        };
        
        // 개발 환경이나 알려진 에러 코드가 있는 경우에만 추가 정보 포함
        if (process.env.NODE_ENV === 'development' || error.code) {
            errorResponse.code = error.code;
            if (process.env.NODE_ENV === 'development') {
                errorResponse.stack = error.stack;
            }
        }
        
        return NextResponse.json(
            errorResponse,
            { status: 500 }
        );
    }
}

