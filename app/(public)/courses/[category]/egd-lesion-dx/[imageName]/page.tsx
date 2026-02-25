/**
 * EGD Lesion Dx Image Detail Page
 * Displays a single image with a back button to return to the list
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function EgdLesionDxImagePage() {
    const params = useParams();
    const router = useRouter();
    const category = params?.category as string;
    const imageName = params?.imageName as string;

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadImage = async () => {
            if (!imageName) return;

            setLoading(true);
            setError(null);

            try {
                const decodedImageName = decodeURIComponent(imageName);
                const response = await fetch(`/api/egd-dx-image-url?imageName=${encodeURIComponent(decodedImageName)}`);

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || '이미지를 불러오는 중 오류가 발생했습니다.');
                }

                const data = await response.json();
                setImageUrl(data.url);
            } catch (err: any) {
                setError(err.message || '이미지를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [imageName]);

    const handleBackToList = () => {
        router.push(`/courses/${category}?selectedItem=egd-lesion-dx`);
    };

    return (
        <div className="relative w-full h-[150vh] bg-gray-100 flex flex-col">
            {/* 닫기 버튼 */}
            <button
                onClick={handleBackToList}
                className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                aria-label="닫기"
            >
                <X className="w-6 h-6 text-gray-800" />
            </button>

            {/* Image container */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                {loading ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">이미지를 불러오는 중...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 max-w-md">
                        <p className="font-semibold mb-2">오류 발생</p>
                        <p>{error}</p>
                    </div>
                ) : imageUrl ? (
                    <div className="max-w-full max-h-full flex items-center justify-center">
                        <img
                            src={imageUrl}
                            alt={decodeURIComponent(imageName)}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                ) : null}
            </div>

            {/* Image name footer */}
            {imageUrl && (
                <div className="bg-white border-t border-gray-200 px-6 py-3">
                    <p className="text-sm text-gray-600 text-center">
                        {decodeURIComponent(imageName)}
                    </p>
                </div>
            )}
        </div>
    );
}

