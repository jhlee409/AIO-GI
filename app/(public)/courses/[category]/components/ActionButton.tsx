'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    icon?: LucideIcon;
    loadingText?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * 공통 액션 버튼 컴포넌트
 * 동영상 시청, 다운로드, 업로드 등에 사용
 */
export default function ActionButton({
    onClick,
    disabled = false,
    loading = false,
    icon: Icon,
    loadingText,
    children,
    className = '',
}: ActionButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            {loading && loadingText ? loadingText : children}
        </button>
    );
}

