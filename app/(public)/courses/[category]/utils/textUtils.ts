/**
 * 텍스트 처리 유틸리티 함수들
 */

/**
 * 빈 줄과 특정 패턴을 제거하는 함수
 * @param text 원본 텍스트
 * @returns 처리된 텍스트
 */
export const removeEmptyLines = (text: string): string => {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('*---') && !trimmed.includes('* ---');
        })
        .join('\n')
        .replace(/왼쪽에 있는 sidebar에서/g, '아래쪽에 있는');
};

/**
 * 빈 줄, 특정 패턴, 언더스코어를 제거하는 함수
 * @param text 원본 텍스트
 * @returns 처리된 텍스트
 */
export const removeEmptyLinesAndUnderscores = (text: string): string => {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            // Remove empty lines, lines containing "*---" or "* ---", lines containing "___", and lines with no characters
            return trimmed.length > 0 && !trimmed.startsWith('*---') && !trimmed.includes('* ---') && !trimmed.includes('___');
        })
        .join('\n');
};

