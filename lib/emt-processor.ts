/**
 * EMT Analysis Processor
 * Background job processor for EMT video analysis
 * This will be moved to a Cloud Function later
 */

import { getAdminStorage, getAdminDb } from '@/lib/firebase-admin';
import {
    analyzeVideoWithPython,
    analyzeVideoWithPythonEMTL,
    createEvaluationReport,
    VideoAnalysisResult
} from '@/lib/emt-analysis';
import { findAllInstructorsByHospital } from '@/lib/instructor-utils';
import { isAdminEmail } from '@/lib/auth-server';
import nodemailer from 'nodemailer';

/** EMT-L 내시경 모델별 ROI (x1, y1, x2, y2) */
const EMTL_ROI_BY_MODEL: Record<string, [number, number, number, number]> = {
    'CV 260': [230, 55, 595, 420],
    'CV 290': [171, 36, 581, 446],
    'X1 660': [750, 0, 1830, 1080],
};

export interface EmtJobData {
    videoPath: string;
    imageCount: number;
    userEmail: string;
    position: string;
    name: string;
    hospital: string;
    isAdmin?: boolean;  // 관리자 여부
    version?: string;   // EMT 버전 (EMT 또는 EMT-L)
    endoscopeModel?: 'CV 260' | 'CV 290' | 'X1 660';  // EMT-L 시 내시경 모델(ROI)
}

export interface VisualizationFrame {
    frame: number;
    time: number;
    url: string;
    hasMarker: boolean;
}

export interface EmtJobResult {
    success: boolean;
    analysisPassed?: boolean;
    analysisMessage?: string;
    analysisScore?: number;
    meanG?: number;
    stdG?: number;
    videoDuration?: number;
    detectedFrames?: number;
    totalFrames?: number;
    visualizationUrls?: VisualizationFrame[];
    reportUrl?: string;
    instructors?: Array<{ email: string; name: string }>;
    /** ghlee409@amc.seoul.kr 합격 시 관리자 리포트 이메일 발송 여부 */
    adminReportEmailSent?: boolean;
    error?: string;
}

/**
 * Process EMT analysis job
 * This function performs the actual analysis work
 */
// Helper function to update job progress
async function updateJobProgress(jobId: string, progress: number, message?: string) {
    try {
        const adminDb = getAdminDb();
        const updateData: any = {
            progress,
            updatedAt: new Date(),
        };
        if (message) {
            updateData.progressMessage = message;
        }
        await adminDb.collection('emtJobs').doc(jobId).update(updateData);
    } catch (error) {
        console.error(`[emt-processor:${jobId}] Error updating progress:`, error);
    }
}

// Helper function to send email to ghlee409@amc.seoul.kr
// Returns true if sent, false if skipped or failed (caller can use for result.adminReportEmailSent)
async function sendReportEmailToAdmin(
    userEmail: string,
    position: string,
    name: string,
    hospital: string,
    reportContent: string,
    reportUrl: string,
    version: string
): Promise<boolean> {
    const TARGET_EMAIL = 'ghlee409@amc.seoul.kr';

    // Only send if userEmail is ghlee409@amc.seoul.kr
    if (userEmail.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
        return false;
    }

    // Check if email service is configured
    const hasUser = !!process.env.GMAIL_USER;
    const hasPass = !!process.env.GMAIL_APP_PASSWORD;
    if (!hasUser || !hasPass) {
        console.error('[emt-processor] Admin report email NOT sent: GMAIL_USER=' + (hasUser ? 'set' : 'MISSING') + ', GMAIL_APP_PASSWORD=' + (hasPass ? 'set' : 'MISSING') + '. Set in Cloud Run Variables & Secrets.');
        return false;
    }

    console.log('[emt-processor] Sending admin report email to ghlee409@amc.seoul.kr (from ' + (process.env.GMAIL_USER || '').replace(/^(.{2}).*(@.*)$/, '$1***$2') + ')');
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const subject = `[${version}] ${name}님의 EMT 합격 리포트`;
        const emailBody = `안녕하세요,

${position} ${name}님의 EGD Method Training (${version}) 수행 결과가 합격으로 확인되었습니다.

제출 정보:
- 직위: ${position}
- 이름: ${name}
- 병원: ${hospital}
- 이메일: ${userEmail}
- 평가 일시: ${new Date().toLocaleString('ko-KR')}

평가서 다운로드 링크:
${reportUrl}

위 링크를 클릭하여 평가서를 확인하실 수 있습니다.

평가서 내용:
==================
${reportContent}
==================

감사합니다.`;

        const emailOptions = {
            from: process.env.GMAIL_USER,
            to: TARGET_EMAIL,
            subject: subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>')
        };

        await transporter.sendMail(emailOptions);
        console.log(`[emt-processor] Report email sent successfully to ${TARGET_EMAIL}`);
        return true;
    } catch (error: any) {
        console.error('[emt-processor] Admin report email SEND FAILED:', error.message);
        console.error('[emt-processor] Full error:', { name: error.name, message: error.message, code: error.code, stack: error.stack?.substring(0, 800) });
        return false;
    }
}

export async function processEmtJob(jobId: string, jobData: EmtJobData): Promise<EmtJobResult> {
    console.time(`[emt-processor:${jobId}] Total processing time`);

    const adminStorage = getAdminStorage();
    const adminDb = getAdminDb();
    const bucket = adminStorage.bucket();

    const { videoPath, imageCount, userEmail, position, name, hospital, isAdmin: isUserAdmin = false, version = 'EMT' } = jobData;

    // jhlee409@gmail.com: 교육자 이메일 미발송, 동영상 업로드 안 함, 결과 메시지만 표시
    const isJhlee409 = userEmail.toLowerCase() === 'jhlee409@gmail.com';

    // 관리자 확인 (서버 측에서도 확인)
    const isAdminUser = await isAdminEmail(userEmail) || isUserAdmin;

    try {
        // Update status to processing
        await adminDb.collection('emtJobs').doc(jobId).update({
            status: 'processing',
            updatedAt: new Date(),
        });

        // 동영상이 없는 경우 오류 처리 (모든 사용자 동일하게 적용)
        if (!videoPath) {
            await updateJobProgress(jobId, 100, '오류: 동영상이 없습니다');
            return {
                success: false,
                error: '동영상 파일이 필요합니다.',
            };
        }

        // 1. Analyze video using Python Cloud Run service
        await updateJobProgress(jobId, 40, '동영상 분석 시작 중...');
        console.time(`[emt-processor:${jobId}] Python analysis`);
        console.log(`[emt-processor:${jobId}] Starting Python analysis`, {
            videoPath,
            imageCount,
            version,
            isAdmin: isAdminUser,
            timestamp: new Date().toISOString()
        });

        let analysisResult: VideoAnalysisResult;

        try {
            await updateJobProgress(jobId, 45, '동영상 분석 중...');

            if (version === 'EMT-L') {
                // EMT-L: 독립 프로세스 — /analyze-emtl, x_train_EMT-L.csv, ROI는 내시경 모델별 적용
                const roi = EMTL_ROI_BY_MODEL[jobData.endoscopeModel ?? 'CV 290'] ?? EMTL_ROI_BY_MODEL['CV 290'];
                console.log(`[emt-processor:${jobId}] Calling EMT-L analyzeVideoWithPythonEMTL`, { endoscopeModel: jobData.endoscopeModel ?? 'CV 290', roi });
                analysisResult = await analyzeVideoWithPythonEMTL(videoPath, false, roi);
            } else {
                // EMT: 기존 방식 그대로
                const xTrainStoragePath = 'templates/x_train.csv';
                console.log(`[emt-processor:${jobId}] Calling analyzeVideoWithPython (EMT)`);
                analysisResult = await analyzeVideoWithPython(
                    '',
                    '',
                    videoPath,
                    xTrainStoragePath,
                    false,
                    'EMT'
                );
            }

            await updateJobProgress(jobId, 70, '동영상 분석 완료, 결과 처리 중...');

            // 동영상 길이 검증 정보 상세 로깅
            if (analysisResult.duration !== undefined) {
                const minutes = Math.floor(analysisResult.duration / 60);
                const seconds = Math.floor(analysisResult.duration % 60);
                const videoMin = version === 'EMT-L' ? 190 : 300;
                const videoMax = version === 'EMT-L' ? 210 : 330;
                const rangeText = version === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초';
                const isValid = analysisResult.duration >= videoMin && analysisResult.duration <= videoMax;

                console.log(`[emt-processor:${jobId}] === Video Duration Validation ===`);
                console.log(`[emt-processor:${jobId}]   Version: ${version}`);
                console.log(`[emt-processor:${jobId}]   Duration: ${analysisResult.duration.toFixed(2)}s (${minutes}분 ${seconds}초)`);
                console.log(`[emt-processor:${jobId}]   Expected range: ${videoMin}-${videoMax}s (${rangeText})`);
                console.log(`[emt-processor:${jobId}]   Validation: ${isValid ? 'PASSED' : 'FAILED'}`);
                console.log(`[emt-processor:${jobId}]   Is Admin: ${isAdminUser}`);
                console.log(`[emt-processor:${jobId}] ====================================`);
            }

            console.log(`[emt-processor:${jobId}] Python analysis completed`, {
                passed: analysisResult.passed,
                score: analysisResult.score,
                duration: analysisResult.duration,
                version,
                isAdmin: isAdminUser,
            });
        } catch (error: any) {
            console.timeEnd(`[emt-processor:${jobId}] Python analysis`);
            console.error(`[emt-processor:${jobId}] Python analysis error:`, {
                message: error.message,
                version,
                stack: error.stack?.substring(0, 500),
            });

            // 동영상 길이 검증 오류인 경우 버전 정보 확인
            if (error.message && error.message.includes('동영상의 길이가')) {
                console.error(`[emt-processor:${jobId}] Duration validation error - version=${version}, error message: ${error.message}`);

                // 버전 정보가 제대로 전달되지 않은 경우 오류 메시지에 버전 정보 추가
                if (!error.message.includes(version)) {
                    const videoMin = version === 'EMT-L' ? 190 : 300;
                    const videoMax = version === 'EMT-L' ? 210 : 330;
                    const rangeText = version === 'EMT-L' ? '3분10초에서 3분30초' : '5분에서 5분30초';
                    console.warn(`[emt-processor:${jobId}] Version mismatch detected! Expected version=${version}, but Python server may have used different version. Expected range: ${rangeText} (${videoMin}-${videoMax}s)`);
                }
            }

            // 모든 사용자에 대해 동일하게 오류 처리 (관리자 모드 특별 처리 제거)
            throw error;
        }
        console.timeEnd(`[emt-processor:${jobId}] Python analysis`);

        // 모든 사용자에 대해 실제 분석 결과(사진 수, 동영상 길이, 판별 점수)를 기준으로 합격 여부 판정
        // 로그인한 사람과 무관하게 점수만 보고 판정
        const analysisPassed = analysisResult.passed;
        const analysisMessage = analysisResult.message;

        // 관리자 모드의 강제 통과 처리 제거 - 모든 사용자는 실제 점수 기준으로 판정

        // 이미지는 개수 확인만 수행 - 버전별 검증 기준 적용
        const imageMin = version === 'EMT-L' ? 42 : 62;
        const imageMax = version === 'EMT-L' ? 48 : 66;
        console.log(`[emt-processor:${jobId}] Image count validated`, {
            imageCount,
            version,
            min: imageMin,
            max: imageMax,
            isValid: imageCount >= imageMin && imageCount <= imageMax,
            isAdmin: isAdminUser
        });

        // 2. Create evaluation report (txt file) for passing cases only
        // EMT-L 불합격 시 리포트 생성하지 않음
        // 모든 사용자는 실제 분석 결과 기준으로만 리포트 생성
        await updateJobProgress(jobId, 75, '평가서 생성 중...');
        console.time(`[emt-processor:${jobId}] Report generation`);
        console.log(`[emt-processor:${jobId}] Creating evaluation report`, { analysisPassed, version });
        let reportUrl = '';
        let adminReportEmailSent = false;
        if (analysisPassed) {
            try {
                // jhlee409: 동영상 업로드 안 함 → URL 표시하지 않음, 이후 동영상 삭제
                const videoFileRef = bucket.file(videoPath);
                let videoUrl = 'N/A';
                if (!isJhlee409) {
                    try {
                        const [url] = await videoFileRef.getSignedUrl({
                            action: 'read',
                            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                        });
                        videoUrl = url;
                    } catch (error) {
                        console.error(`[emt-processor:${jobId}] Error generating signed URL for video:`, error);
                    }
                }

                // EMT-L: 분석 로그 전문을 리포트에 사용
                const analysisLogText = version === 'EMT-L' ? analysisResult.message : undefined;
                const reportContent = createEvaluationReport(
                    position,
                    name,
                    hospital,
                    userEmail,
                    analysisResult.duration,
                    imageCount,
                    'Pass',
                    analysisResult.score,
                    analysisResult.meanG,
                    analysisResult.stdG,
                    isJhlee409 ? '(업로드하지 않음)' : (videoUrl || 'N/A'),
                    [],
                    analysisResult.failureReason,
                    analysisResult.detectedFrames,
                    analysisResult.totalFrames,
                    analysisLogText
                );

                const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
                const reportBuffer = Buffer.concat([utf8BOM, Buffer.from(reportContent, 'utf-8')]);

                const resultSuffix = version === 'EMT-L' ? 'EMT-L_result' : 'EMT_result';
                const reportFileName = `Simulator_training/EMT/EMT_result/${position}-${name}-${resultSuffix}.txt`;
                const reportFileRef = bucket.file(reportFileName);
                await reportFileRef.save(reportBuffer, {
                    metadata: {
                        contentType: 'text/plain; charset=utf-8',
                    },
                });

                // Get report download URL
                const [reportUrlResult] = await reportFileRef.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
                }).catch(async () => {
                    await reportFileRef.makePublic();
                    return [`https://storage.googleapis.com/${bucket.name}/${reportFileName}`];
                });

                reportUrl = reportUrlResult;
                console.log(`[emt-processor:${jobId}] Evaluation report created successfully`, { reportUrl });

                // ghlee409@amc.seoul.kr 합격 시 해당 주소로 관리자 리포트 이메일 발송. jhlee409인 경우 미발송
                const TARGET_EMAIL = 'ghlee409@amc.seoul.kr';
                const shouldSendAdminEmail = !isJhlee409 && userEmail.toLowerCase() === TARGET_EMAIL.toLowerCase() && analysisPassed;
                console.log(`[emt-processor:${jobId}] Admin email check: shouldSend=${shouldSendAdminEmail}, userEmail=${userEmail}, isJhlee409=${isJhlee409}, analysisPassed=${analysisPassed}`);
                if (shouldSendAdminEmail) {
                    adminReportEmailSent = await sendReportEmailToAdmin(
                        userEmail,
                        position,
                        name,
                        hospital,
                        reportContent,
                        reportUrl,
                        version || 'EMT'
                    );
                    if (!adminReportEmailSent) {
                        console.warn(`[emt-processor:${jobId}] Admin report email was not sent (check GMAIL_USER/GMAIL_APP_PASSWORD or mail error).`);
                    }
                }
            } catch (error: any) {
                console.error(`[emt-processor:${jobId}] Error creating report file:`, {
                    message: error.message,
                    stack: error.stack?.substring(0, 500)
                });
                // Continue even if report file creation fails
            }
        }
        console.timeEnd(`[emt-processor:${jobId}] Report generation`);

        // 3. Find all instructors for the hospital
        await updateJobProgress(jobId, 85, '교육자 정보 조회 중...');
        console.time(`[emt-processor:${jobId}] Instructor lookup`);
        console.log(`[emt-processor:${jobId}] Finding instructors`, { hospital });
        const instructors = await findAllInstructorsByHospital(hospital);
        console.timeEnd(`[emt-processor:${jobId}] Instructor lookup`);

        // 3.5. EMT/EMT-L 불합격 시 Firebase에서 동영상 삭제
        if (!analysisPassed && videoPath) {
            await updateJobProgress(jobId, 88, '불합격 동영상 삭제 중...');
            console.log(`[emt-processor:${jobId}] ${version} failed: Deleting video from Firebase Storage`, { videoPath });
            try {
                const videoFileRef = bucket.file(videoPath);
                const [exists] = await videoFileRef.exists();
                if (exists) {
                    await videoFileRef.delete();
                    console.log(`[emt-processor:${jobId}] Video deleted successfully from Firebase Storage`);
                } else {
                    console.log(`[emt-processor:${jobId}] Video file does not exist in Firebase Storage, skipping deletion`);
                }
            } catch (error: any) {
                console.error(`[emt-processor:${jobId}] Error deleting video from Firebase Storage:`, {
                    message: error.message,
                    stack: error.stack?.substring(0, 500)
                });
                // Continue even if deletion fails
            }
        }

        // 3.6. jhlee409@gmail.com: 동영상 업로드 안 함 → 분석 후 Storage에서 동영상 삭제
        if (isJhlee409 && videoPath) {
            await updateJobProgress(jobId, 87, '동영상 삭제 중...');
            try {
                const videoFileRef = bucket.file(videoPath);
                const [exists] = await videoFileRef.exists();
                if (exists) {
                    await videoFileRef.delete();
                    console.log(`[emt-processor:${jobId}] jhlee409: Video deleted from Firebase Storage`);
                }
            } catch (error: any) {
                console.error(`[emt-processor:${jobId}] Error deleting video (jhlee409):`, error?.message);
            }
        }

        // 4. Create log file only if analysis passed
        await updateJobProgress(jobId, 90, '로그 파일 생성 중...');
        console.time(`[emt-processor:${jobId}] Log file creation`);
        console.log(`[emt-processor:${jobId}] Creating log file`, { analysisPassed, version });
        if (analysisPassed) {
            try {
                const logFileSuffix = version === 'EMT-L' ? 'EMT-L' : 'EMT';
                const logFileName = `${position}-${name}-${logFileSuffix}`;
                const logContent = `Position: ${position}
Name: ${name}
Hospital: ${hospital}
Email: ${userEmail}
Category: Basic course
Action: EMT Video Upload
Result: Pass
Score: ${analysisResult.score}
Mean G: ${analysisResult.meanG}
Std G: ${analysisResult.stdG}
Video Duration: ${analysisResult.duration} seconds
Image Count: ${imageCount}
Report URL: ${reportUrl || 'N/A'}
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
                const logBuffer = Buffer.concat([utf8BOM, Buffer.from(logContent, 'utf-8')]);

                const logFile = bucket.file(`log/${logFileName}`);
                await logFile.save(logBuffer, {
                    metadata: {
                        contentType: 'text/plain; charset=utf-8',
                    },
                });
            } catch (error) {
                console.error(`[emt-processor:${jobId}] Error creating log file:`, error);
            }
        }
        console.timeEnd(`[emt-processor:${jobId}] Log file creation`);

        await updateJobProgress(jobId, 95, '최종 처리 중...');
        console.timeEnd(`[emt-processor:${jobId}] Total processing time`);

        // jhlee409@gmail.com: 교육자에게 이메일 보내지 않음 → 목록 미제공.
        // ghlee409@amc.seoul.kr: 다른 교육자에게 보내지 않음, 본인(관리자)에게만 리포트 발송 → 목록 미제공.
        const ADMIN_EMAIL = 'ghlee409@amc.seoul.kr';
        const noEducatorEmail = isJhlee409 || userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const instructorsToReturn = noEducatorEmail ? [] : instructors;

        return {
            success: true,
            analysisPassed,
            analysisMessage,
            analysisScore: analysisResult?.score || 0,
            meanG: analysisResult?.meanG || 0,
            stdG: analysisResult?.stdG || 0,
            videoDuration: analysisResult?.duration || 0,
            detectedFrames: analysisResult?.detectedFrames,
            totalFrames: analysisResult?.totalFrames,
            visualizationUrls: analysisResult?.visualizationUrls,
            reportUrl,
            instructors: instructorsToReturn,
            adminReportEmailSent,
        };
    } catch (error: any) {
        console.timeEnd(`[emt-processor:${jobId}] Total processing time`);
        console.error(`[emt-processor:${jobId}] Processing error:`, {
            message: error.message,
            stack: error.stack?.substring(0, 1000),
        });

        return {
            success: false,
            error: error.message || 'EMT 분석 처리 중 오류가 발생했습니다.',
        };
    }
}

