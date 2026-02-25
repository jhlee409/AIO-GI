/**
 * Error Message Component
 * 에러 메시지를 표시하는 컴포넌트
 */
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ErrorMessageProps {
    error: Error | string | null;
    onDismiss?: () => void;
    className?: string;
}

export function ErrorMessage({ error, onDismiss, className = '' }: ErrorMessageProps) {
    if (!error) return null;

    const errorMessage = typeof error === 'string' ? error : error.message;

    return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 ${className}`}>
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-red-800 font-medium">오류가 발생했습니다</p>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
