/**
 * API Route: EMT Job Creation
 * Creates a job in Firestore and returns jobId immediately
 * Actual processing happens asynchronously
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminDb } from '@/lib/firebase-admin';
import { processEmtJob } from '@/lib/emt-processor';
import { isAdminEmail } from '@/lib/auth-server';
import * as os from 'os';

// CORS headers for external access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

// Runtime config
export const runtime = 'nodejs';
export const maxDuration = 60; // Reduced timeout - job creation should be fast

export async function POST(request: NextRequest) {
    console.time('[emt-upload] Job creation');
    console.log('[emt-upload] START', { timestamp: new Date().toISOString() });

    const adminStorage = getAdminStorage();
    const adminDb = getAdminDb();
    const bucket = adminStorage.bucket();

    try {
        // Parse JSON body
        let body;
        try {
            body = await request.json();
            console.log('[emt-upload] Request body parsed', {
                hasVideoPath: !!body.videoPath,
                imageCount: body.imageCount,
                hasUserEmail: !!body.userEmail,
                version: body.version || 'EMT'
            });
        } catch (parseError: any) {
            console.error('[emt-upload] Error parsing request body:', parseError);
            return NextResponse.json(
                { error: 'Invalid request body format' },
                { status: 400, headers: corsHeaders }
            );
        }

        const {
            videoPath,      // Firebase Storage path for video
            imageCount,     // Image count (images are not stored in Storage)
            userEmail,
            position,
            name,
            hospital,
            isAdmin: isUserAdmin = false,  // 관리자 여부 (클라이언트에서 전달)
            version = 'EMT',  // EMT 버전 (EMT 또는 EMT-L)
            endoscopeModel,  // EMT-L 시 내시경 모델 (CV 260 | CV 290 | X1 660, ROI 적용)
        } = body;

        // 관리자 확인 (서버 측에서도 확인)
        const isAdminUser = await isAdminEmail(userEmail) || isUserAdmin;

        // Validate required fields (관리자는 videoPath 없어도 가능)
        if ((!videoPath && !isAdminUser) || imageCount === undefined || !userEmail || !position || !name || !hospital) {
            return NextResponse.json(
                { error: 'Missing required fields: videoPath, imageCount, userEmail, position, name, hospital' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate that videoPath is a Firebase Storage path (not local path)
        if (videoPath && (videoPath.startsWith('/tmp/') || videoPath.startsWith('/var/') || videoPath.startsWith(os.tmpdir()))) {
            return NextResponse.json(
                { error: 'Invalid videoPath: Must be a Firebase Storage path (bucket object name)' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate image count - 버전별 검증 기준 적용, 관리자는 검증 건너뛰기
        const imageMin = version === 'EMT-L' ? 42 : 62;
        const imageMax = version === 'EMT-L' ? 48 : 66;
        if (!isAdminUser && (imageCount < imageMin || imageCount > imageMax)) {
            return NextResponse.json(
                { error: `이미지는 ${imageMin}개에서 ${imageMax}개 사이여야 합니다. 현재: ${imageCount}개` },
                { status: 400, headers: corsHeaders }
            );
        }

        // Verify video file exists in Storage (동영상이 있는 경우만)
        if (videoPath) {
            console.time('[emt-upload] Video existence check');
            const videoFileRef = bucket.file(videoPath);
            const [videoExists] = await videoFileRef.exists();
            console.timeEnd('[emt-upload] Video existence check');

            if (!videoExists) {
                return NextResponse.json(
                    { error: `Video file not found in storage: ${videoPath}` },
                    { status: 404, headers: corsHeaders }
                );
            }
        }

        // Create job in Firestore
        console.time('[emt-upload] Firestore job creation');
        const jobId = `emt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const jobData = {
            videoPath: videoPath || '',  // 관리자는 비어있을 수 있음
            imageCount,
            userEmail,
            position,
            name,
            hospital,
            isAdmin: isAdminUser,  // 관리자 여부 저장
            version: version || 'EMT',  // EMT 버전 저장
            ...(version === 'EMT-L' && endoscopeModel != null && { endoscopeModel }),  // EMT-L 시 내시경 모델(ROI)
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await adminDb.collection('emtJobs').doc(jobId).set(jobData);
        console.timeEnd('[emt-upload] Firestore job creation');

        // Start processing asynchronously (don't await)
        processEmtJob(jobId, jobData).then(async (result) => {
            const updateData: any = {
                status: result.success ? 'completed' : 'failed',
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            };

            // undefined가 아닌 값만 추가
            if (result.success) {
                updateData.progress = 100;
                updateData.progressMessage = '분석 완료!';

                updateData.result = {
                    analysisPassed: result.analysisPassed,
                    analysisMessage: result.analysisMessage,
                    analysisScore: result.analysisScore,
                    meanG: result.meanG,
                    stdG: result.stdG,
                    videoDuration: result.videoDuration,
                    detectedFrames: result.detectedFrames,
                    totalFrames: result.totalFrames,
                    reportUrl: result.reportUrl,
                    instructors: result.instructors,
                    adminReportEmailSent: result.adminReportEmailSent,
                };

                // visualizationUrls가 있는 경우에만 추가 (undefined 방지)
                if (result.visualizationUrls !== undefined && result.visualizationUrls !== null && result.visualizationUrls.length > 0) {
                    updateData.result.visualizationUrls = result.visualizationUrls;
                }
            } else {
                updateData.error = result.error;
            }

            await adminDb.collection('emtJobs').doc(jobId).update(updateData);
            console.log(`[emt-upload] Job ${jobId} completed`, { status: updateData.status });
        }).catch(async (error) => {
            console.error(`[emt-upload] Job ${jobId} processing error:`, error);
            await adminDb.collection('emtJobs').doc(jobId).update({
                status: 'failed',
                progress: 0,
                progressMessage: '오류 발생',
                error: error.message || 'Unknown error',
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            });
        });

        console.timeEnd('[emt-upload] Job creation');
        console.log('[emt-upload] END - Job created', {
            jobId,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            jobId,
            message: 'EMT 분석 작업이 생성되었습니다. 상태를 확인해주세요.',
        }, {
            headers: corsHeaders,
        });
    } catch (error: any) {
        console.timeEnd('[emt-upload] Job creation');
        console.error('[emt-upload] UNHANDLED ERROR:', {
            message: error.message,
            stack: error.stack?.substring(0, 1000),
            name: error.name,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            {
                error: error.message || 'Failed to create analysis job',
                details: error.stack ? error.stack.substring(0, 1000) : undefined,
                stage: 'job_creation'
            },
            {
                status: 500,
                headers: corsHeaders,
            }
        );
    }
}
