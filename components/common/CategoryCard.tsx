/**
 * Category Card Component
 * 카테고리 카드 컴포넌트
 */
import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface CategoryCardProps {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
}

export function CategoryCard({
    id,
    name,
    description,
    icon: Icon,
    color,
    href,
    onClick,
    disabled = false,
}: CategoryCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        
        // onClick이 있고 preventDefault를 호출한 경우에만 기본 동작을 막음
        if (onClick) {
            onClick(e);
            // onClick에서 preventDefault를 호출했다면 기본 동작이 이미 막혔을 것
        }
    };

    return (
        <Link
            href={href}
            className={`group w-full ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleClick}
        >
            <div className="bg-sky-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-full">
                <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
                    <Icon className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold">{name}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600">{description}</p>
                </div>
            </div>
        </Link>
    );
}
