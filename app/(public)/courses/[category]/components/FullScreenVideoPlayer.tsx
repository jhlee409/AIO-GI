'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { X } from 'lucide-react';
import CustomVideoPlayer, { CustomVideoPlayerRef } from '@/components/viewers/CustomVideoPlayer';
import { shouldTrackVideoWatchRoutine, type VideoCompletionMode } from '@/lib/report-watch-time';
import { clearActiveLearningAttempt, getLearningAttempts, getVerifiedLearningExitIssue, recordLearningLogAttempt, setActiveLearningAttempt, startVideoAttempt, waitForLearningRequests } from '@/lib/learning-session';
import { LearningExitDialog } from '@/components/LearningExitDialog';
import { auth } from '@/lib/firebase-client';

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
    completionMode?: VideoCompletionMode;
    completionLogKey?: string;
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
    completionMode,
    completionLogKey,
    onThresholdReached
}, ref) => {
    const videoPlayerRef = useRef<CustomVideoPlayerRef>(null);
    const closingRef = useRef(false);
    const exitActionRef = useRef(onClose);
    const [exitReason, setExitReason] = useState<'incomplete' | 'failed' | null>(null);
    const tracksWatchTime = shouldTrackVideoWatchRoutine(videoTitle, category, { completionMode });
    const activeKey = tracksWatchTime ? (videoUrl ? `${category || ''}::${videoUrl}` : undefined) : completionLogKey;
    const activeKind = tracksWatchTime ? 'video' : completionLogKey ? 'log' : null;

    useEffect(() => {
        if (isOpen && videoUrl && userEmail && activeKey && activeKind) {
            if (activeKind === 'video') startVideoAttempt({ email: userEmail, videoUrl, videoTitle, category });
            else recordLearningLogAttempt({ email: userEmail, key: activeKey, label: videoTitle || '동영상 학습', completedLocally: false });
            setActiveLearningAttempt({ kind: activeKind, key: activeKey, label: videoTitle || '동영상 학습', email: userEmail });
            return () => clearActiveLearningAttempt(activeKey);
        }
        setExitReason(null);
    }, [isOpen, videoUrl, userEmail, videoTitle, category, activeKey, activeKind]);

    useEffect(() => {
        if (!activeKey) return;
        const pause = (event: Event) => {
            if ((event as CustomEvent<{ key: string }>).detail?.key === activeKey) videoPlayerRef.current?.pauseVideo();
        };
        const allowSave = (event: Event) => {
            if ((event as CustomEvent<{ key: string }>).detail?.key === activeKey) videoPlayerRef.current?.allowAnotherSave();
        };
        window.addEventListener('pauseLearningVideo', pause);
        window.addEventListener('allowAnotherVideoSave', allowSave);
        return () => {
            window.removeEventListener('pauseLearningVideo', pause);
            window.removeEventListener('allowAnotherVideoSave', allowSave);
        };
    }, [activeKey]);

    // 부모 컴포넌트에서 saveWatchTime을 호출할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
        saveWatchTime: async () => {
            await videoPlayerRef.current?.saveWatchTime();
        }
    }), []);

    const handleClose = async (afterClose: () => void = onClose) => {
        if (closingRef.current) return;
        closingRef.current = true;
        exitActionRef.current = afterClose;
        try {
            videoPlayerRef.current?.pauseVideo();
            await videoPlayerRef.current?.saveWatchTime();
            await waitForLearningRequests();
            const attempt = userEmail && activeKey && activeKind
                ? getLearningAttempts(userEmail).find(item => item.kind === activeKind && item.key === activeKey)
                : undefined;
            const issue = userEmail && activeKind
                ? await getVerifiedLearningExitIssue(attempt, async () => {
                    if (!auth?.currentUser) throw new Error('Authentication required');
                    return auth.currentUser.getIdToken();
                })
                : null;
            if (issue) {
                setExitReason(issue);
            } else {
                if (attempt) clearActiveLearningAttempt(attempt.key);
                afterClose();
            }
        } finally {
            closingRef.current = false;
        }
    };

    if (!isOpen || !videoUrl) return null;

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* 닫기 버튼 */}
            <button
                onClick={() => { void handleClose(); }}
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
                    onEnded={() => { void handleClose(onEnded || onClose); }}
                    onClose={() => { void handleClose(); }}
                    userEmail={userEmail}
                    userPosition={userPosition}
                    userName={userName}
                    userHospital={userHospital}
                    videoTitle={videoTitle}
                    category={category}
                    completionMode={completionMode}
                    onThresholdReached={onThresholdReached}
                />
            </div>
            {exitReason && (
                <LearningExitDialog
                    label={videoTitle || '동영상 학습'}
                    kind={activeKind || 'video'}
                    reason={exitReason}
                    onStay={() => {
                        videoPlayerRef.current?.allowAnotherSave();
                        setExitReason(null);
                    }}
                    onLeave={() => {
                        if (activeKey) clearActiveLearningAttempt(activeKey);
                        setExitReason(null);
                        exitActionRef.current();
                    }}
                />
            )}
        </div>
    );
});

FullScreenVideoPlayer.displayName = 'FullScreenVideoPlayer';

export default FullScreenVideoPlayer;

