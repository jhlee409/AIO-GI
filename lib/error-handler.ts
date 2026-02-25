/**
 * Error Handler Utilities
 * 공통 에러 처리 유틸리티
 */

/**
 * 에러 메시지 표시
 * @param message 에러 메시지
 * @param details 상세 정보 (선택)
 */
export function showError(message: string, details?: string): void {
    const fullMessage = details 
        ? `${message}\n\n상세 정보: ${details}` 
        : message;
    alert(fullMessage);
    console.error('[Error]', message, details);
}

/**
 * API 에러 처리
 * @param error 에러 객체
 * @param defaultMessage 기본 에러 메시지
 */
export function handleApiError(error: any, defaultMessage: string): void {
    const message = error?.message || error?.error || defaultMessage;
    showError(message);
}

/**
 * 에러 메시지 추출
 * @param error 에러 객체
 * @param defaultMessage 기본 메시지
 * @returns 에러 메시지 문자열
 */
export function extractErrorMessage(error: any, defaultMessage: string): string {
    if (error instanceof Error) {
        return error.message;
    } else if (typeof error === 'string') {
        return error;
    } else if (error?.message) {
        return error.message;
    } else if (error?.error) {
        return error.error;
    } else if (typeof error === 'object') {
        return JSON.stringify(error);
    }
    return defaultMessage;
}

