/**
 * Hook for tracking video watch time
 * Manages client-side logic for tracking video watch time
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSaveVideoWatchTime, UseSaveVideoWatchTimeOptions } from './useSaveVideoWatchTime';

export interface UseVideoWatchTimeOptions extends UseSaveVideoWatchTimeOptions {
    onThresholdReached?: () => void;
}

export function useVideoWatchTime(options: UseVideoWatchTimeOptions) {
    const { onThresholdReached, ...saveOptions } = options;
    const { saveWatchTime } = useSaveVideoWatchTime(saveOptions);

    const [maxWatchedTime, setMaxWatchedTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [thresholdReached, setThresholdReached] = useState(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastCheckTimeRef = useRef<number>(0);

    // 주기적으로 시청 시간 체크 및 저장 (30초마다)
    const trackWatchTime = useCallback((currentTime: number, duration: number) => {
        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
            console.warn('[useVideoWatchTime] trackWatchTime called with invalid values:', {
                currentTime,
                duration
            });
            return;
        }

        setTotalDuration(duration);
        
        // 최대 시청 시간 업데이트
        if (currentTime > maxWatchedTime) {
            setMaxWatchedTime(currentTime);
        }

        // 30초마다 서버에 체크 (action: 'check')
        const now = Date.now();
        if (now - lastCheckTimeRef.current >= 30000) {
            lastCheckTimeRef.current = now;
            const actualWatchedTime = Math.max(currentTime, maxWatchedTime);
            console.log('[useVideoWatchTime] 30s check - saving watch time:', {
                currentTime,
                actualWatchedTime,
                duration,
                percentage: (actualWatchedTime / duration * 100).toFixed(2) + '%'
            });
            saveWatchTime(currentTime, duration, 'check', actualWatchedTime);
        }

        // 80% 도달 체크
        const percentage = (currentTime / duration) * 100;
        if (percentage >= 80 && !thresholdReached) {
            setThresholdReached(true);
            console.log('[useVideoWatchTime] 80% threshold reached!');
            if (onThresholdReached) {
                onThresholdReached();
            }
        }
    }, [maxWatchedTime, thresholdReached, onThresholdReached, saveWatchTime]);

    // 최종 시청 시간 저장 (action: 'update')
    const saveFinalWatchTime = useCallback(async (currentTime: number, duration: number) => {
        console.log('[useVideoWatchTime] saveFinalWatchTime called:', {
            currentTime,
            duration,
            maxWatchedTime,
            actualWatchedTime: Math.max(currentTime, maxWatchedTime)
        });
        
        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
            console.warn('[useVideoWatchTime] Invalid parameters for saveFinalWatchTime:', {
                currentTime,
                duration,
                isNaNTime: isNaN(currentTime),
                isNaNDuration: isNaN(duration),
                durationValid: duration > 0
            });
            return null;
        }
        
        const actualWatchedTime = Math.max(currentTime, maxWatchedTime);
        console.log('[useVideoWatchTime] Calling saveWatchTime with update action:', {
            actualWatchedTime,
            duration,
            percentage: (actualWatchedTime / duration * 100).toFixed(2) + '%'
        });
        const result = await saveWatchTime(actualWatchedTime, duration, 'update');
        console.log('[useVideoWatchTime] saveWatchTime result:', result);
        return result;
    }, [maxWatchedTime, saveWatchTime]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, []);

    const percentage = totalDuration > 0 ? (maxWatchedTime / totalDuration) * 100 : 0;

    return {
        trackWatchTime,
        saveFinalWatchTime,
        thresholdReached,
        percentage,
        maxWatchedTime,
        totalDuration,
    };
}

