/**
 * UI Constants
 * 공통 UI 스타일 상수
 */

export const BUTTON_STYLES = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    disabled: 'bg-gray-400 text-gray-600 cursor-not-allowed',
    sky: 'bg-sky-200 text-sky-900 hover:bg-sky-300',
} as const;

export const BUTTON_BASE = 'px-6 py-3 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * 버튼 스타일 클래스 생성
 */
export function getButtonClass(
    variant: keyof typeof BUTTON_STYLES,
    disabled: boolean = false
): string {
    if (disabled) {
        return `${BUTTON_BASE} ${BUTTON_STYLES.disabled}`;
    }
    return `${BUTTON_BASE} ${BUTTON_STYLES[variant]}`;
}

