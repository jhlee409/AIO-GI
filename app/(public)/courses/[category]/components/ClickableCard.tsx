'use client';

import React from 'react';

interface ClickableCardProps {
    onClick: () => void | Promise<void>;
    children: React.ReactNode;
    className?: string;
    isSelected?: boolean;
}

/**
 * 클릭 가능한 카드 스타일 버튼 컴포넌트
 * 디폴트 화면의 카드 버튼, 강의 카드 등에 사용
 */
export default function ClickableCard({
    onClick,
    children,
    className = '',
    isSelected = false,
}: ClickableCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white ${
                isSelected ? 'border-blue-500 border-2' : ''
            } ${className}`}
        >
            {children}
        </div>
    );
}

