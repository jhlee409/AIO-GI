/**
 * Video Player State Hook
 * 
 * 비디오 플레이어의 공통 상태를 관리하는 Hook
 * videoUrl, loading, error, show 상태를 통합 관리
 */

import { useState, useCallback } from 'react';

export interface VideoPlayerState {
    videoUrl: string | null;
    loading: boolean;
    error: string | null;
    show: boolean;
    logCreated?: boolean | Set<string>;
}

export interface UseVideoPlayerStateReturn {
    state: VideoPlayerState;
    setState: (updates: Partial<VideoPlayerState>) => void;
    loadVideo: (storagePath: string) => Promise<void>;
    close: () => void;
    reset: () => void;
    setShow: (show: boolean) => void;
    setVideoUrl: (url: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export function useVideoPlayerState(initialState?: Partial<VideoPlayerState>): UseVideoPlayerStateReturn {
    const [state, setStateInternal] = useState<VideoPlayerState>({
        videoUrl: null,
        loading: false,
        error: null,
        show: false,
        logCreated: false,
        ...initialState,
    });

    const setState = useCallback((updates: Partial<VideoPlayerState>) => {
        setStateInternal(prev => ({ ...prev, ...updates }));
    }, []);

    const loadVideo = useCallback(async (storagePath: string) => {
        setStateInternal(prev => ({ ...prev, loading: true, error: null, logCreated: false }));
        try {
            const response = await fetch(
                `/api/video-url?path=${encodeURIComponent(storagePath)}`
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: '동영상을 불러오는 중 오류가 발생했습니다.' }));
                throw new Error(errorData.error || '동영상을 불러오는 중 오류가 발생했습니다.');
            }
            const data = await response.json();
            setStateInternal(prev => ({
                ...prev,
                videoUrl: data.url,
                show: true,
                loading: false,
            }));
        } catch (error: any) {
            setStateInternal(prev => ({
                ...prev,
                error: error.message || '동영상을 불러오는 중 오류가 발생했습니다.',
                loading: false,
            }));
        }
    }, []);

    const close = useCallback(() => {
        setStateInternal(prev => ({
            ...prev,
            show: false,
            videoUrl: null,
            error: null,
        }));
    }, []);

    const reset = useCallback(() => {
        setStateInternal({
            videoUrl: null,
            loading: false,
            error: null,
            show: false,
            logCreated: false,
        });
    }, []);

    const setShow = useCallback((show: boolean) => {
        setStateInternal(prev => ({ ...prev, show }));
    }, []);

    const setVideoUrl = useCallback((url: string | null) => {
        setStateInternal(prev => ({ ...prev, videoUrl: url }));
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        setStateInternal(prev => ({ ...prev, loading }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setStateInternal(prev => ({ ...prev, error }));
    }, []);

    return {
        state,
        setState,
        loadVideo,
        close,
        reset,
        setShow,
        setVideoUrl,
        setLoading,
        setError,
    };
}

