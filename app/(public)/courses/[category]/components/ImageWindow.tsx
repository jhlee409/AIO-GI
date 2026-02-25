'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageWindowProps {
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
    onClose: () => void;
}

/** 파일명(또는 title)에서 확장자 제외 후, 마지막 2글자 바로 앞 4자리 + 마지막 2자리 반환 (예: duo_01) */
function getImageLabelFromFilename(name: string): string {
    if (!name || name === '이미지') return '';
    const base = name.replace(/\.[^/.]+$/, '');
    if (base.length <= 6) return base;
    return base.slice(-6);
}

export default function ImageWindow({ isOpen, imageUrl, title, onClose }: ImageWindowProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizing, setResizing] = useState(false);

    // Handle drag
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            setPosition(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragStart]);

    // Handle resize
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            const target = document.querySelector('[data-image-window]') as HTMLElement;
            if (target && isOpen) {
                const rect = target.getBoundingClientRect();
                const isResizeHandle =
                    e.clientX > rect.right - 20 &&
                    e.clientY > rect.bottom - 20;
                if (isResizeHandle) {
                    setResizing(true);
                }
            }
        };

        const handleMouseUp = () => {
            if (resizing) {
                setTimeout(() => {
                    setResizing(false);
                }, 100);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen, resizing]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50"
            onClick={() => {
                if (!resizing) {
                    onClose();
                }
            }}
        >
            <div
                data-image-window
                className="bg-white rounded-lg shadow-2xl flex flex-col w-[80vw] h-[90vh]"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    resize: 'both',
                    overflow: 'auto',
                    minWidth: '400px',
                    minHeight: '300px',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                    cursor: dragging ? 'grabbing' : 'default'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const isResizeHandle =
                        e.clientX > rect.right - 20 &&
                        e.clientY > rect.bottom - 20;
                    if (isResizeHandle) {
                        setResizing(true);
                    }
                }}
                onMouseUp={() => {
                    if (resizing) {
                        setTimeout(() => {
                            setResizing(false);
                        }, 100);
                    }
                }}
            >
                {/* 이미지 영역 */}
                <div className="relative h-full overflow-auto bg-black flex flex-col items-center justify-center p-4">
                    {/* 파일명: 마지막 2글자 앞 4자리 + 마지막 2자리 표시 (예: duo_01), 가운데 정렬 */}
                    {getImageLabelFromFilename(title) ? (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/90 text-xl font-semibold bg-black/50 px-3 py-1.5 rounded text-center">
                            {getImageLabelFromFilename(title)}
                        </div>
                    ) : null}
                    {/* 닫기 버튼 */}
                    <button
                        onClick={() => {
                            onClose();
                            setPosition({ x: 0, y: 0 });
                        }}
                        className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                        aria-label="닫기"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>

                    <img
                        src={imageUrl}
                        alt={title || ''}
                        className="max-w-full h-[81vh] object-contain cursor-pointer"
                        onClick={(e) => {
                            onClose();
                            setPosition({ x: 0, y: 0 });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

