/**
 * Image Viewer Component
 * Displays images with zoom capability
 */
'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageViewer({ url }: { url: string }) {
    const [scale, setScale] = useState(1);

    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

    return (
        <div className="relative bg-gray-100">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
                <button
                    onClick={handleZoomOut}
                    className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomIn}
                    className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>

            {/* Image */}
            <div className="overflow-auto max-h-[600px] flex items-center justify-center p-8">
                <img
                    src={url}
                    alt="Content"
                    style={{ transform: `scale(${scale})` }}
                    className="transition-transform duration-200 max-w-full"
                />
            </div>
        </div>
    );
}
