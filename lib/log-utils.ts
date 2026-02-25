/**
 * Log Utilities
 * 로그 파일 생성 공통 유틸리티
 */
import { getAdminStorage } from '@/lib/firebase-admin';

export interface LogData {
    position: string;
    name: string;
    hospital: string;
    email: string;
    category: string;
    action: string;
    [key: string]: any;
}

/**
 * 로그 파일 생성 (UTF-8 BOM 포함)
 * @param fileName 로그 파일명 (확장자 제외)
 * @param data 로그 데이터
 */
export async function createLogFile(fileName: string, data: LogData): Promise<void> {
    const adminStorage = getAdminStorage();
    const bucket = adminStorage.bucket();
    
    const logContent = Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') + `\nTimestamp: ${new Date().toISOString()}\nDate: ${new Date().toLocaleString('ko-KR')}`;

    const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
    const logBuffer = Buffer.concat([utf8BOM, Buffer.from(logContent, 'utf-8')]);

    const logFile = bucket.file(`log/${fileName}`);
    await logFile.save(logBuffer, {
        metadata: {
            contentType: 'text/plain; charset=utf-8',
        },
    });
}

