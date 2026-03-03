'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { X } from 'lucide-react';
import CustomVideoPlayer, { CustomVideoPlayerRef } from '@/components/viewers/CustomVideoPlayer';

export interface FullScreenVideoPlayerRef {
    saveWatchTime: () => Promise<void>;
}

interface FullScreenVideoPlayerProps {
    isOpen: boolean;
    videoUrl: string | null;
    onClose: () => void;
    onPlay?: () => void;
    onEnded?: () => void;
    // 시청 시간 추적 props
    userEmail?: string | null;
    userPosition?: string;
    userName?: string;
    userHospital?: string;
    videoTitle?: string;
    category?: string;
    onThresholdReached?: () => void;
}

const FullScreenVideoPlayer = forwardRef<FullScreenVideoPlayerRef, FullScreenVideoPlayerProps>(({
    isOpen,
    videoUrl,
    onClose,
    onPlay,
    onEnded,
    userEmail,
    userPosition,
    userName,
    userHospital,
    videoTitle,
    category,
    onThresholdReached
}, ref) => {
    const videoPlayerRef = useRef<CustomVideoPlayerRef>(null);

    // 부모 컴포넌트에서 saveWatchTime을 호출할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
        saveWatchTime: async () => {
            await videoPlayerRef.current?.saveWatchTime();
        }
    }), []);

    const handleClose = () => {
        // 닫기 전에 시청 시간 저장
        videoPlayerRef.current?.saveWatchTime();
        // onClose 호출 전에 CustomVideoPlayer가 언마운트되면서 cleanup이 실행되어
        // 최종 시청 시간이 자동으로 저장됩니다.
        onClose();
    };

    if (!isOpen || !videoUrl) return null;

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* 닫기 버튼 */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                aria-label="닫기"
                title="닫기"
            >
                <X className="w-6 h-6 text-gray-800" />
            </button>
            
            {/* 동영상 플레이어 */}
            <div className="w-full h-full flex items-center justify-center p-4">
                <CustomVideoPlayer 
                    ref={videoPlayerRef}
                    videoUrl={videoUrl} 
                    onPlay={onPlay}
                    onEnded={onEnded || handleClose}
                    onClose={handleClose}
                    userEmail={userEmail}
                    userPosition={userPosition}
                    userName={userName}
                    userHospital={userHospital}
                    videoTitle={videoTitle}
                    category={category}
                    onThresholdReached={onThresholdReached}
                />
            </div>
        </div>
    );
});

FullScreenVideoPlayer.displayName = 'FullScreenVideoPlayer';

export default FullScreenVideoPlayer;

