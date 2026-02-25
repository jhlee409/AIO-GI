/**
 * Loading Spinner Component
 * 재사용 가능한 로딩 스피너 컴포넌트
 */
import React from 'react';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
};

export function LoadingSpinner({ 
    size = 'md', 
    message, 
    className = '' 
}: LoadingSpinnerProps) {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
            {message && (
                <p className="mt-4 text-gray-600">{message}</p>
            )}
        </div>
    );
}
