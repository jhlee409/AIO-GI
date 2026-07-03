'use client';

import { useMemo } from 'react';
import type { VideoCompletionMode } from '@/lib/report-watch-time';

export interface VideoWatchRoutineUserProfile {
    position?: string;
    name?: string;
    hospital?: string;
}

export interface UseVideoWatchRoutinePropsOptions {
    userEmail?: string | null;
    userProfile?: VideoWatchRoutineUserProfile | null;
    videoTitle: string;
    category?: string;
    completionMode?: VideoCompletionMode;
}

export interface VideoWatchRoutinePlayerProps {
    userEmail?: string | null;
    userPosition?: string;
    userName?: string;
    userHospital?: string;
    videoTitle: string;
    category?: string;
    completionMode: VideoCompletionMode;
}

export function useVideoWatchRoutineProps({
    userEmail,
    userProfile,
    videoTitle,
    category,
    completionMode = 'percentage',
}: UseVideoWatchRoutinePropsOptions): VideoWatchRoutinePlayerProps {
    return useMemo(() => ({
        userEmail,
        userPosition: userProfile?.position,
        userName: userProfile?.name,
        userHospital: userProfile?.hospital,
        videoTitle,
        category,
        completionMode,
    }), [
        userEmail,
        userProfile?.position,
        userProfile?.name,
        userProfile?.hospital,
        videoTitle,
        category,
        completionMode,
    ]);
}
