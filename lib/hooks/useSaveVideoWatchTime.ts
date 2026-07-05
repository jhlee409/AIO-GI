/**
 * Hook for saving video watch time
 * Sends video watch time data to the API endpoint
 */
import { useCallback } from 'react';

export interface UseSaveVideoWatchTimeOptions {
    userEmail?: string | null;
    userPosition?: string;
    userName?: string;
    userHospital?: string;
    videoUrl: string;
    videoTitle?: string;
    category?: string;
}

export interface WatchTimeResult {
    watchedTime: number;
    duration: number;
    percentage: number;
    thresholdReached: boolean;
}

export const ELAPSED_PLAYBACK_TRACKING_METHOD = 'elapsed-playback-v1';

export function useSaveVideoWatchTime(options: UseSaveVideoWatchTimeOptions) {
    const {
        userEmail,
        userPosition,
        userName,
        userHospital,
        videoUrl,
        videoTitle,
        category,
    } = options;

    const saveWatchTime = useCallback(async (
        currentTime: number,
        totalDuration: number,
        action: 'update' | 'check',
        actualWatchedTime?: number // 'check' 액션 시 실제 재생 elapsed seconds
    ): Promise<WatchTimeResult | null> => {
        if (!userEmail || !videoUrl || isNaN(currentTime) || isNaN(totalDuration) || totalDuration <= 0) {
            console.log('[useSaveVideoWatchTime] Missing required fields:', {
                userEmail: !!userEmail,
                videoUrl: !!videoUrl,
                currentTime,
                totalDuration,
                videoTitle,
                category
            });
            return null;
        }

        const payloadWatchedTime = action === 'check' && actualWatchedTime !== undefined
            ? actualWatchedTime
            : currentTime;

        try {
            const payload = {
                email: userEmail,
                position: userPosition,
                name: userName,
                hospital: userHospital,
                videoUrl,
                videoTitle,
                category,
                duration: totalDuration,
                watchedTime: payloadWatchedTime,
                trackingMethod: ELAPSED_PLAYBACK_TRACKING_METHOD,
                action: action,
            };
            
            console.log('[useSaveVideoWatchTime] Saving watch time:', {
                action,
                videoTitle,
                category,
                email: userEmail,
                watchedTime: payloadWatchedTime,
                duration: totalDuration
            });
            
            const response = await fetch('/api/video/watch-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                keepalive: action === 'update', // 'update' (final save) 시에만 keepalive
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[useSaveVideoWatchTime] Watch time saved successfully:', result);
                return result;
            } else {
                const errorText = await response.text();
                console.error('[useSaveVideoWatchTime] Failed to save watch time:', response.status, response.statusText, errorText);
                return null;
            }
        } catch (error) {
            console.error('[useSaveVideoWatchTime] Error saving watch time:', error);
            return null;
        }
    }, [userEmail, userPosition, userName, userHospital, videoUrl, videoTitle, category]);

    return { saveWatchTime };
}

