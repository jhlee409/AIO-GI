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

    const elapsedPlaybackSecondsRef = useRef(0);
    const playbackStartedAtMsRef = useRef<number | null>(null);
    const [elapsedPlaybackSeconds, setElapsedPlaybackSeconds] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [thresholdReached, setThresholdReached] = useState(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastCheckTimeRef = useRef<number>(0);

    const getNowMs = useCallback(() => {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    }, []);

    const getElapsedPlaybackSeconds = useCallback(() => {
        const startedAtMs = playbackStartedAtMsRef.current;
        if (startedAtMs === null) {
            return elapsedPlaybackSecondsRef.current;
        }

        const runningSeconds = Math.max(0, (getNowMs() - startedAtMs) / 1000);
        return elapsedPlaybackSecondsRef.current + runningSeconds;
    }, [getNowMs]);

    const syncElapsedPlaybackSeconds = useCallback(() => {
        const elapsedSeconds = getElapsedPlaybackSeconds();
        setElapsedPlaybackSeconds(elapsedSeconds);
        return elapsedSeconds;
    }, [getElapsedPlaybackSeconds]);

    const markPlaybackStarted = useCallback(() => {
        if (playbackStartedAtMsRef.current === null) {
            playbackStartedAtMsRef.current = getNowMs();
        }
    }, [getNowMs]);

    const markPlaybackStopped = useCallback(() => {
        if (playbackStartedAtMsRef.current !== null) {
            elapsedPlaybackSecondsRef.current = getElapsedPlaybackSeconds();
            playbackStartedAtMsRef.current = null;
            setElapsedPlaybackSeconds(elapsedPlaybackSecondsRef.current);
        }
    }, [getElapsedPlaybackSeconds]);

    useEffect(() => {
        elapsedPlaybackSecondsRef.current = 0;
        playbackStartedAtMsRef.current = null;
        setElapsedPlaybackSeconds(0);
        setTotalDuration(0);
        setThresholdReached(false);
        lastCheckTimeRef.current = 0;
    }, [saveOptions.videoUrl]);

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
        const actualWatchedTime = syncElapsedPlaybackSeconds();

        // 30초마다 서버에 체크 (action: 'check')
        const now = Date.now();
        if (now - lastCheckTimeRef.current >= 30000) {
            lastCheckTimeRef.current = now;
            console.log('[useVideoWatchTime] 30s check - saving watch time:', {
                currentTime,
                actualWatchedTime,
                duration,
                percentage: (actualWatchedTime / duration * 100).toFixed(2) + '%'
            });
            saveWatchTime(actualWatchedTime, duration, 'check');
        }

        // 80% 도달 체크
        const percentage = (actualWatchedTime / duration) * 100;
        if (percentage >= 80 && !thresholdReached) {
            setThresholdReached(true);
            console.log('[useVideoWatchTime] 80% threshold reached!');
            if (onThresholdReached) {
                onThresholdReached();
            }
        }
    }, [thresholdReached, onThresholdReached, saveWatchTime, syncElapsedPlaybackSeconds]);

    // 최종 시청 시간 저장 (action: 'update')
    const saveFinalWatchTime = useCallback(async (currentTime: number, duration: number) => {
        const actualWatchedTime = getElapsedPlaybackSeconds();
        console.log('[useVideoWatchTime] saveFinalWatchTime called:', {
            currentTime,
            duration,
            actualWatchedTime
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
        
        setElapsedPlaybackSeconds(actualWatchedTime);
        console.log('[useVideoWatchTime] Calling saveWatchTime with update action:', {
            actualWatchedTime,
            duration,
            percentage: (actualWatchedTime / duration * 100).toFixed(2) + '%'
        });
        const result = await saveWatchTime(actualWatchedTime, duration, 'update');
        console.log('[useVideoWatchTime] saveWatchTime result:', result);
        return result;
    }, [getElapsedPlaybackSeconds, saveWatchTime]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, []);

    const percentage = totalDuration > 0 ? (elapsedPlaybackSeconds / totalDuration) * 100 : 0;

    return {
        trackWatchTime,
        saveFinalWatchTime,
        markPlaybackStarted,
        markPlaybackStopped,
        thresholdReached,
        percentage,
        elapsedPlaybackSeconds,
        totalDuration,
    };
}

