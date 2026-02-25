/**
 * EMT Analysis Utilities
 * Helper functions for EMT video and image analysis
 */

import sharp from 'sharp';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse/sync';
import { Matrix } from 'ml-matrix';
import * as fs from 'fs/promises';

export interface VisualizationFrame {
    frame: number;
    time: number;
    url: string;
    hasMarker: boolean;
}

export interface VideoAnalysisResult {
    passed: boolean;
    score: number;
    message: string;
    duration: number;
    meanG: number;
    stdG: number;
    failureReason?: string;
    detectedFrames?: number;
    totalFrames?: number;
    visualizationUrls?: VisualizationFrame[];
}

export interface ImageGridResult {
    imageBuffer: Buffer;
    imagePath: string;
}

/**
 * Validate image count (supports BMP, PNG, JPG)
 */
export function validateBmpCount(bmpFiles: File[]): { valid: boolean; message: string } {
    const count = bmpFiles.length;
    if (count < 62 || count > 66) {
        return {
            valid: false,
            message: `사진의 숫자가 62장에서 66장을 벗어납니다. 현재: ${count}장`
        };
    }
    return { valid: true, message: '' };
}

/**
 * Validate video duration
 */
export function validateVideoDuration(duration: number, version: string = 'EMT'): { valid: boolean; message: string } {
    const min = version === 'EMT-L' ? 190 : 300; // 3분10초 vs 5분
    const max = version === 'EMT-L' ? 210 : 330; // 3분30초 vs 5분30초
    const rangeText = version === 'EMT-L' ? '3분10초에서 3분30초' : '5분에서 5분30초';

    if (duration < min || duration > max) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return {
            valid: false,
            message: `동영상의 길이가 ${rangeText}를 벗어납니다. 현재: ${minutes}분 ${seconds}초`
        };
    }
    return { valid: true, message: '' };
}

/**
 * Analyze video using Cloud Run Python service
 * This calls a Cloud Run service that uses OpenCV for video analysis
 */
export async function analyzeVideoWithPython(
    videoPath: string,
    xTrainPath: string,
    videoStoragePath?: string,
    xTrainStoragePath?: string,
    isAdmin?: boolean,  // 관리자 모드: 길이 검증 건너뛰기
    version?: string    // EMT 버전 (EMT 또는 EMT-L)
): Promise<VideoAnalysisResult> {
    // Get Cloud Run service URL from environment variable
    const cloudRunUrl = process.env.EMT_ANALYSIS_SERVICE_URL || 'https://emt-video-analysis-481900880726.asia-northeast3.run.app';

    // Get bucket name from environment or use default
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'amcgi-bulletin.appspot.com';

    try {
        console.log('=== analyzeVideoWithPython called ===');
        console.log('  Cloud Run URL:', cloudRunUrl);
        console.log('  videoPath (local, NOT used):', videoPath);
        console.log('  xTrainPath (local, NOT used):', xTrainPath);
        console.log('  videoStoragePath (Firebase Storage, SHOULD be used):', videoStoragePath);
        console.log('  xTrainStoragePath (Firebase Storage, SHOULD be used):', xTrainStoragePath);
        console.log('  bucketName:', bucketName);
        console.log('  version:', version);
        console.log('  isAdmin:', isAdmin);

        // Use storage paths if provided, otherwise assume videoPath and xTrainPath are storage paths
        // CRITICAL: Python service expects Firebase Storage bucket object names, NOT local file paths
        // videoStoragePath should be provided (Firebase Storage path), videoPath is local path (NOT used)
        const videoPathForCloudRun = videoStoragePath; // MUST use videoStoragePath, NOT videoPath (which is local)
        const xTrainPathForCloudRun = xTrainStoragePath || xTrainPath;

        // Validate that videoStoragePath was provided
        if (!videoPathForCloudRun) {
            throw new Error('videoStoragePath (Firebase Storage path) is required. videoPath (local path) cannot be used for Python Cloud Run service.');
        }

        console.log('  videoPathForCloudRun (will be sent to Python):', videoPathForCloudRun);
        console.log('  videoPathForCloudRun type:', typeof videoPathForCloudRun);
        console.log('  videoPathForCloudRun starts with /tmp?:', videoPathForCloudRun?.startsWith?.('/tmp/'));
        console.log('  xTrainPathForCloudRun (will be sent to Python):', xTrainPathForCloudRun);

        // Validate that paths are NOT local paths (should be bucket object names)
        if (videoPathForCloudRun.startsWith('/tmp/') || videoPathForCloudRun.startsWith('/var/')) {
            console.error('ERROR: videoPathForCloudRun is a local path!', videoPathForCloudRun);
            throw new Error(`Invalid video path: Python service expects Firebase Storage path (bucket object name), but received local path: ${videoPathForCloudRun}`);
        }
        if (xTrainPathForCloudRun.startsWith('/tmp/') || xTrainPathForCloudRun.startsWith('/var/')) {
            console.error('ERROR: xTrainPathForCloudRun is a local path!', xTrainPathForCloudRun);
            throw new Error(`Invalid x_train path: Python service expects Firebase Storage path (bucket object name), but received local path: ${xTrainPathForCloudRun}`);
        }

        const requestBody = {
            bucketName: bucketName,
            videoPath: videoPathForCloudRun,    // Must be bucket object name (e.g., "Simulator_training/EMT/EMT_result/position-name-EMT-timestamp.ext")
            xTrainPath: xTrainPathForCloudRun,  // Must be bucket object name (e.g., "templates/x_train.csv")
            isAdmin: isAdmin || false,          // 관리자 모드: Python 서버에서 길이 검증 건너뛰기
            version: version || 'EMT',          // EMT 버전 (EMT 또는 EMT-L)
            createVisualization: true,          // 시각화 이미지 생성 여부
        };
        console.log('=== Request body to Python Cloud Run ===');
        console.log(JSON.stringify(requestBody, null, 2));
        console.log('=== Version info ===');
        console.log('  version parameter:', version);
        console.log('  version in requestBody:', requestBody.version);
        console.log('  version type:', typeof requestBody.version);

        // Create AbortController for timeout (5 minutes for video analysis)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes timeout

        let response;
        try {
            console.log('[emt-analysis] Sending request to Python service', {
                url: `${cloudRunUrl}/analyze`,
                bucketName,
                videoPath: videoPathForCloudRun,
                timestamp: new Date().toISOString()
            });

            response = await fetch(`${cloudRunUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            console.log('[emt-analysis] Python service response received', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error('[emt-analysis] Python service fetch error', {
                name: fetchError.name,
                message: fetchError.message,
                stack: fetchError.stack?.substring(0, 500),
                timestamp: new Date().toISOString()
            });

            if (fetchError.name === 'AbortError') {
                throw new Error('Python Cloud Run 서비스 호출이 타임아웃되었습니다. 동영상 분석에 시간이 너무 오래 걸립니다.');
            }
            throw new Error(`Python Cloud Run 서비스 호출 실패: ${fetchError.message}`);
        }

        if (!response.ok) {
            let errorData;
            try {
                const text = await response.text();
                console.error('Error response text:', text);
                errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Analysis result received:', {
            passed: result.passed,
            score: result.score,
            duration: result.duration,
            visualizationUrls: result.visualizationUrls?.length || 0
        });

        // 동영상 길이 정보 상세 로깅
        if (result.duration !== undefined) {
            const minutes = Math.floor(result.duration / 60);
            const seconds = Math.floor(result.duration % 60);
            const videoMin = version === 'EMT-L' ? 190 : 300;
            const videoMax = version === 'EMT-L' ? 210 : 330;
            const rangeText = version === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초';
            const isValid = result.duration >= videoMin && result.duration <= videoMax;

            console.log('=== Video Duration Validation Info ===');
            console.log(`  Version: ${version}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}s (${minutes}분 ${seconds}초)`);
            console.log(`  Expected range: ${videoMin}-${videoMax}s (${rangeText})`);
            console.log(`  Validation: ${isValid ? 'PASSED' : 'FAILED'}`);
            console.log(`  Is Admin: ${isAdmin || false}`);
            console.log('=====================================');
        }

        return {
            passed: result.passed,
            score: result.score,
            message: result.message,
            duration: result.duration,
            meanG: result.meanG,
            stdG: result.stdG,
            failureReason: result.failureReason || undefined,
            detectedFrames: result.detectedFrames || 0,
            totalFrames: result.totalFrames || 0,
            visualizationUrls: result.visualizationUrls || undefined,
        };
    } catch (error: any) {
        console.error('Cloud Run analysis error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });
        throw new Error(`Cloud Run 분석 오류: ${error.message}`);
    }
}

/** EMT-L only: analyze video via /analyze-emtl (x_train_EMT-L.csv). Independent from EMT. */
const X_TRAIN_EMTL_STORAGE_PATH = 'templates/x_train_EMT-L.csv';

export async function analyzeVideoWithPythonEMTL(
    videoStoragePath: string,
    isAdmin?: boolean,
    roi?: [number, number, number, number]
): Promise<VideoAnalysisResult> {
    const cloudRunUrl = process.env.EMT_ANALYSIS_SERVICE_URL || 'https://emt-video-analysis-481900880726.asia-northeast3.run.app';
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'amcgi-bulletin.appspot.com';

    if (!videoStoragePath) {
        throw new Error('videoStoragePath (Firebase Storage path) is required for EMT-L analysis.');
    }
    if (videoStoragePath.startsWith('/tmp/') || videoStoragePath.startsWith('/var/')) {
        throw new Error(`Invalid video path: expected Firebase Storage path, got local path: ${videoStoragePath}`);
    }

    const requestBody: Record<string, unknown> = {
        bucketName,
        videoPath: videoStoragePath,
        xTrainPath: X_TRAIN_EMTL_STORAGE_PATH,
        isAdmin: isAdmin ?? false,
    };
    if (roi && roi.length === 4) {
        requestBody.roi = roi;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    let response: Response;
    try {
        response = await fetch(`${cloudRunUrl}/analyze-emtl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
    } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
            throw new Error('EMT-L 분석 서비스 호출이 타임아웃되었습니다.');
        }
        throw new Error(`EMT-L 분석 서비스 호출 실패: ${fetchError.message}`);
    }

    if (!response.ok) {
        let errorData: { error?: string };
        try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
        } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
        passed: result.passed,
        score: result.score,
        message: result.message,
        duration: result.duration,
        meanG: result.meanG ?? 0,
        stdG: result.stdG ?? 0,
        failureReason: result.failureReason ?? undefined,
        detectedFrames: result.detectedFrames ?? 0,
        totalFrames: result.totalFrames ?? 0,
        visualizationUrls: result.visualizationUrls ?? undefined,
    };
}

/**
 * Create image grid from image files (BMP, PNG, JPG)
 * Accepts either File[] or file paths (string[])
 * Supports BMP, PNG, and JPG formats
 */
export async function createImageGrid(
    bmpFiles: File[] | string[],
    videoDuration: number,
    result: string,
    score: number,
    photoCount: number,
    meanG: number,
    stdG: number
): Promise<ImageGridResult> {
    // A4 size at 300 DPI
    const a4Width = 2480;
    const a4Height = 3508;
    const imagesPerRow = 8;
    const padding = 20;

    // Calculate single image size
    const singleWidth = Math.floor((a4Width - (padding * (imagesPerRow + 1))) / imagesPerRow);

    // Process and composite images
    const composites: sharp.OverlayOptions[] = [];
    let x = padding;
    let y = padding;

    for (let idx = 0; idx < bmpFiles.length; idx++) {
        const bmpFileOrPath = bmpFiles[idx];
        let buffer: Buffer;

        // Check if it's a File object or a file path
        if (typeof bmpFileOrPath === 'string') {
            // It's a file path, read it directly
            buffer = await fs.readFile(bmpFileOrPath);
        } else {
            // It's a File object
            const arrayBuffer = await bmpFileOrPath.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        // Resize image and immediately process to reduce memory usage
        const resized = await sharp(buffer)
            .resize(singleWidth, singleWidth, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();

        // Clear original buffer to free memory
        buffer = Buffer.alloc(0);

        composites.push({
            input: resized,
            left: x,
            top: y
        });

        x += singleWidth + padding;
        if ((idx + 1) % imagesPerRow === 0) {
            x = padding;
            y += singleWidth + padding;
        }
    }

    // Add text at the bottom
    const minutes = Math.floor(videoDuration / 60);
    const seconds = Math.floor(videoDuration % 60);
    const durationText = `${minutes} min ${seconds} sec`;
    const text = `Photo number: ${photoCount}\nDuration: ${durationText}\nResult: ${result}\nSVM_value: ${score.toFixed(4)}\nMean distance: ${meanG.toFixed(4)}\nStd distance: ${stdG.toFixed(4)}`;

    // Create SVG text
    const svgText = Buffer.from(`
        <svg width="${a4Width - (padding * 2)}" height="200" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="30" font-family="Arial, sans-serif" font-size="24" fill="black">
                ${text.split('\n').map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : 30}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`).join('')}
            </text>
        </svg>
    `);

    // Create text image
    const textImage = await sharp(svgText)
        .png()
        .toBuffer();

    composites.push({
        input: textImage,
        left: padding,
        top: a4Height - 200 - padding
    });

    // Create base image and composite all images
    const finalImage = await sharp({
        create: {
            width: a4Width,
            height: a4Height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    })
        .composite(composites)
        .resize(a4Width / 2, a4Height / 2)
        .png()
        .toBuffer();

    return {
        imageBuffer: finalImage,
        imagePath: ''
    };
}

/**
 * Create evaluation report as TXT file
 * @param analysisLogText - When provided (EMT-L), use this as the full analysis section instead of EMT fields
 */
export function createEvaluationReport(
    position: string,
    name: string,
    hospital: string,
    userEmail: string,
    videoDuration: number,
    photoCount: number,
    result: string,
    score: number,
    meanG: number,
    stdG: number,
    videoUrl: string,
    imageUrls: string[],
    failureReason?: string,
    detectedFrames?: number,
    totalFrames?: number,
    analysisLogText?: string
): string {
    const minutes = Math.floor(videoDuration / 60);
    const seconds = Math.floor(videoDuration % 60);
    const durationText = `${minutes}분 ${seconds}초`;
    const date = new Date().toLocaleString('ko-KR');
    const detectionRate = detectedFrames && totalFrames ? ((detectedFrames / totalFrames) * 100).toFixed(1) : 'N/A';

    const analysisSection = analysisLogText != null && analysisLogText !== ''
        ? `분석 결과\n---------\n${analysisLogText}`
        : `분석 결과
---------
평가 결과: ${result}
판단 점수: ${score.toFixed(4)}
Mean G (평균 이동 거리): ${meanG.toFixed(4)}
Std G (이동 거리 표준편차): ${stdG.toFixed(4)}

${result === 'Pass'
            ? 'EGD 수행이 적절하게 진행되어 EMT 과정에서 합격하셨습니다. 수고하셨습니다.'
            : `EGD 수행이 적절하게 진행되지 못해 불합격입니다. 다시 도전해 주세요.

불합격 사유
-----------
${failureReason || '상세한 불합격 사유를 확인할 수 없습니다.'}`}`;

    return `EMT 최종 평가서
==================

기본 정보
---------
직위: ${position}
이름: ${name}
병원: ${hospital}
이메일: ${userEmail}
평가 일시: ${date}

동영상 정보
-----------
동영상 길이: ${durationText}
동영상 링크: ${videoUrl}
${detectedFrames !== undefined && totalFrames !== undefined ? `검출된 프레임: ${detectedFrames}/${totalFrames} (${detectionRate}%)` : ''}

이미지 정보
-----------
사진 수: ${photoCount}장
${imageUrls.length > 0 ? `이미지 링크:\n${imageUrls.map((url, idx) => `${idx + 1}. ${url}`).join('\n')}` : '(이미지는 개수 확인용으로만 사용되었습니다)'}

${analysisSection}

==================
`;
}

