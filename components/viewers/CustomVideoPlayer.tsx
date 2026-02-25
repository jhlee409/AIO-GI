/**
 * Custom Video Player Component
 * Video player with custom controls: play, pause, stop, progress bar
 * 
 * 이 컴포넌트의 포맷은 템플릿으로 저장되어 있습니다.
 * 다른 화면에서 동일한 포맷을 적용하려면:
 * - 이 컴포넌트를 직접 사용하거나
 * - @/components/viewers/templates/videoPlayerFormat.ts 템플릿을 참고하세요.
 * 
 * 템플릿 문서: components/viewers/templates/VIDEO_PLAYER_FORMAT.md
 */
'use client';

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useVideoWatchTime } from '@/lib/hooks/useVideoWatchTime';

export interface CustomVideoPlayerRef {
    saveWatchTime: () => void;
}

interface CustomVideoPlayerProps {
    videoUrl: string;
    onPlay?: () => void;
    onEnded?: () => void;
    onClose?: () => void; // 종료 시 호출되는 콜백
    // 시청 시간 추적 관련 props
    userEmail?: string | null;
    userPosition?: string;
    userName?: string;
    userHospital?: string;
    videoTitle?: string;
    category?: string;
    onThresholdReached?: () => void;
}

const CustomVideoPlayer = forwardRef<CustomVideoPlayerRef, CustomVideoPlayerProps>(({ 
    videoUrl, 
    onPlay, 
    onEnded,
    onClose,
    userEmail,
    userPosition,
    userName,
    userHospital,
    videoTitle,
    category,
    onThresholdReached
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [volume, setVolume] = useState(1); // 0.0 ~ 1.0
    const userPausedRef = useRef<boolean>(false); // 사용자가 의도적으로 일시정지했는지 추적

    // 'Dx EGD 실전 강의' 카테고리인 경우에만 시청 시간 추적
    // category가 'advanced-f1'이고 videoTitle이 Dx EGD 실전 강의 목록에 속하는 경우
    const dxEgdLectureTitles = [
        'Complication_Sedation', 'Description_Impression', 'Photo_Report',
        'Biopsy_NBI', 'Stomach_benign', 'Stomach_malignant', 'Duodenum',
        'Lx_Phx_Esophagus', 'SET'
    ];
    const isDxEgdLectureCategory = (category === 'advanced-f1' || category?.includes('Advanced course for F1')) &&
                                   videoTitle && dxEgdLectureTitles.some(title => videoTitle.includes(title));
    
    // 디버깅 로그
    useEffect(() => {
        if (videoTitle && category) {
            console.log('[CustomVideoPlayer] Video tracking check:', {
                videoTitle,
                category,
                isDxEgdLectureCategory,
                userEmail,
                userPosition,
                userName
            });
        }
    }, [videoTitle, category, isDxEgdLectureCategory, userEmail, userPosition, userName]);
    const { trackWatchTime, saveFinalWatchTime } = useVideoWatchTime({
        userEmail,
        userPosition,
        userName,
        userHospital,
        videoUrl,
        videoTitle,
        category,
        onThresholdReached
    });

    // trackWatchTime과 saveFinalWatchTime을 ref로 저장하여 useEffect dependency 문제 방지
    const trackWatchTimeRef = useRef(trackWatchTime);
    const saveFinalWatchTimeRef = useRef(saveFinalWatchTime);
    
    useEffect(() => {
        trackWatchTimeRef.current = trackWatchTime;
        saveFinalWatchTimeRef.current = saveFinalWatchTime;
    }, [trackWatchTime, saveFinalWatchTime]);

    // 부모 컴포넌트에서 saveWatchTime을 호출할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
        saveWatchTime: async () => {
            console.log('[CustomVideoPlayer] saveWatchTime called via ref:', {
                isDxEgdLectureCategory,
                videoTitle,
                category,
                hasVideo: !!videoRef.current,
                hasSaveFunction: !!saveFinalWatchTimeRef.current
            });
            
            if (isDxEgdLectureCategory) {
                const video = videoRef.current;
                if (video && saveFinalWatchTimeRef.current) {
                    const finalTime = video.currentTime;
                    const finalDuration = video.duration;
                    console.log('[CustomVideoPlayer] Saving via ref:', {
                        finalTime,
                        finalDuration,
                        percentage: finalDuration > 0 ? (finalTime / finalDuration * 100).toFixed(2) + '%' : 'N/A'
                    });
                    if (!isNaN(finalTime) && !isNaN(finalDuration) && finalDuration > 0) {
                        await saveFinalWatchTimeRef.current(finalTime, finalDuration);
                    } else {
                        console.warn('[CustomVideoPlayer] Invalid time values in ref save:', {
                            finalTime,
                            finalDuration
                        });
                    }
                } else {
                    console.warn('[CustomVideoPlayer] Cannot save via ref:', {
                        hasVideo: !!video,
                        hasSaveFunction: !!saveFinalWatchTimeRef.current
                    });
                }
            } else {
                console.warn('[CustomVideoPlayer] Not Dx EGD lecture category, skipping save');
            }
        }
    }), [isDxEgdLectureCategory, videoTitle, category]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Reset states when video URL changes
        setIsLoading(true);
        setIsVideoReady(false);
        setIsPlaying(false);
        userPausedRef.current = false; // 비디오 변경 시 리셋
        
        // Pause and reset video when URL changes
        video.pause();
        video.currentTime = 0;

        const updateTime = () => {
            const current = video.currentTime;
            const total = video.duration;
            setCurrentTime(current);
            
            // 'Dx EGD 실전 강의' 카테고리인 경우에만 시청 시간 추적
            if (isDxEgdLectureCategory && !isNaN(current) && !isNaN(total) && total > 0) {
                trackWatchTimeRef.current(current, total);
            }
        };
        const updateDuration = () => {
            setDuration(video.duration);
        };
        const handleLoadedData = () => {
            // First frame is fully loaded with full quality
            setIsVideoReady(true);
            setIsLoading(false);
        };
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };
        const handleCanPlay = () => {
            // Video can start playing with better quality
            setIsVideoReady(true);
            setIsLoading(false);
        };
        const handlePlay = () => {
            userPausedRef.current = false; // 재생 중이면 사용자가 일시정지하지 않음
            setIsPlaying(true);
            // 동영상 재생 중임을 localStorage에 저장 (자동 로그아웃 방지)
            if (typeof window !== 'undefined') {
                localStorage.setItem('isVideoPlaying', 'true');
            }
        };
        const handlePause = (e?: Event) => {
            setIsPlaying(false);
            
            // 사용자가 의도적으로 일시정지하지 않은 경우에만 자동 재생
            if (!userPausedRef.current) {
                const video = videoRef.current;
                if (video && !video.ended) {
                    // 약간의 지연 후 재생 재개 (브라우저의 기본 동작 완료 후)
                    setTimeout(() => {
                        if (video && !video.ended && video.paused && !userPausedRef.current) {
                            video.play().catch(err => {
                                // 재생 실패는 무시
                                console.log('Video auto-play prevented:', err);
                            });
                        }
                    }, 100);
                } else {
                    // 동영상이 종료되었거나 일시정지된 경우 localStorage 업데이트
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('isVideoPlaying', 'false');
                    }
                }
            } else {
                // 사용자가 의도적으로 일시정지한 경우
                if (typeof window !== 'undefined') {
                    localStorage.setItem('isVideoPlaying', 'false');
                }
            }
        };
        const handleEnded = () => {
            setIsPlaying(false);
            const finalTime = video.currentTime;
            const finalDuration = video.duration;
            
            // 동영상 종료 시 localStorage 업데이트
            if (typeof window !== 'undefined') {
                localStorage.setItem('isVideoPlaying', 'false');
            }
            
            // 'Dx EGD 실전 강의' 카테고리인 경우 동영상 종료 시 최종 시청 시간 저장
            if (isDxEgdLectureCategory && saveFinalWatchTimeRef.current && !isNaN(finalTime) && !isNaN(finalDuration) && finalDuration > 0) {
                saveFinalWatchTimeRef.current(finalTime, finalDuration);
            }
            
            setCurrentTime(0);
            // Call onEnded callback if provided
            if (onEnded) {
                onEnded();
            }
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        // 최종 시청 시간 저장 함수 (외부에서 호출 가능)
        const saveFinalTime = () => {
            console.log('[CustomVideoPlayer] saveFinalTime called:', {
                isDxEgdLectureCategory,
                videoTitle,
                category,
                currentTime: video.currentTime,
                duration: video.duration,
                hasSaveFunction: !!saveFinalWatchTimeRef.current
            });
            
            if (isDxEgdLectureCategory && saveFinalWatchTimeRef.current) {
                const finalTime = video.currentTime;
                const finalDuration = video.duration;
                
                if (!isNaN(finalTime) && !isNaN(finalDuration) && finalDuration > 0) {
                    console.log('[CustomVideoPlayer] Calling saveFinalWatchTime:', {
                        finalTime,
                        finalDuration,
                        percentage: (finalTime / finalDuration * 100).toFixed(2) + '%'
                    });
                    saveFinalWatchTimeRef.current(finalTime, finalDuration);
                } else {
                    console.warn('[CustomVideoPlayer] Invalid time values:', {
                        finalTime,
                        finalDuration,
                        isNaNTime: isNaN(finalTime),
                        isNaNDuration: isNaN(finalDuration),
                        durationValid: finalDuration > 0
                    });
                }
            } else {
                console.warn('[CustomVideoPlayer] Not saving watch time:', {
                    isDxEgdLectureCategory,
                    hasSaveFunction: !!saveFinalWatchTimeRef.current
                });
            }
        };

        // beforeunload 이벤트로 페이지 이동 시 최종 시청 시간 저장
        const handleBeforeUnload = () => {
            saveFinalTime();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // 컴포넌트 언마운트 시 최종 시청 시간 저장
            saveFinalTime();
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // 동영상 플레이어가 언마운트될 때 localStorage 정리
            if (typeof window !== 'undefined') {
                localStorage.setItem('isVideoPlaying', 'false');
            }

            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
        // NOTE: 의도적으로 dependency를 videoUrl과 isDxEgdLectureCategory로만 제한합니다.
        // trackWatchTime과 saveFinalWatchTime은 ref를 통해 접근하므로 dependency에 포함하지 않습니다.
        // onEnded는 재생 중간에 바뀌어도 상관 없고,
        // onEnded가 렌더마다 새 함수가 되어도 effect가 불필요하게 다시 실행되며
        // 비디오가 pause/리셋되는 문제를 막기 위함입니다.
    }, [videoUrl, isDxEgdLectureCategory]);

    // 볼륨 상태를 실제 비디오 엘리먼트에 반영
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = volume;
    }, [volume]);

    const handlePlayPause = async () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            userPausedRef.current = true; // 사용자가 의도적으로 일시정지
            video.pause();
        } else {
            userPausedRef.current = false; // 사용자가 재생 시작
            // Call onPlay callback if provided (for logging) - call before play attempt
            if (onPlay && !isPlaying) {
                onPlay();
            }

            // Try to play immediately
            try {
                const playPromise = video.play();
                
                // If play() returns a promise, wait for it
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (error: any) {
                // If play fails, wait for video to be ready and try again
                if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                    console.error('Playback not allowed:', error);
                    return;
                }

                // For other errors (like AbortError or network issues), wait for video to load
                if (video.readyState < 2) {
                    // Wait for at least some data to be loaded
                    try {
                        await new Promise<void>((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                video.removeEventListener('canplay', handleCanPlay);
                                video.removeEventListener('error', handleError);
                                reject(new Error('Video loading timeout'));
                            }, 5000); // 5 second timeout

                            const handleCanPlay = () => {
                                clearTimeout(timeout);
                                video.removeEventListener('canplay', handleCanPlay);
                                video.removeEventListener('error', handleError);
                                resolve();
                            };

                            const handleError = () => {
                                clearTimeout(timeout);
                                video.removeEventListener('canplay', handleCanPlay);
                                video.removeEventListener('error', handleError);
                                reject(new Error('Video loading error'));
                            };

                            // If already ready, resolve immediately
                            if (video.readyState >= 2) {
                                clearTimeout(timeout);
                                resolve();
                            } else {
                                video.addEventListener('canplay', handleCanPlay);
                                video.addEventListener('error', handleError);
                            }
                        });

                        // Try to play again after video is ready
                        try {
                            await video.play();
                        } catch (retryError: any) {
                            if (retryError.name !== 'AbortError') {
                                console.error('Error playing video after loading:', retryError);
                            }
                        }
                    } catch (waitError) {
                        console.error('Error waiting for video to be ready:', waitError);
                    }
                } else {
                    // Video has some data, try playing again
                    try {
                        await video.play();
                    } catch (retryError: any) {
                        if (retryError.name !== 'AbortError') {
                            console.error('Error retrying video play:', retryError);
                        }
                    }
                }
            }
        }
    };

    // 동영상 화면 클릭으로 재생 / 일시정지 토글
    const handleVideoClick = async () => {
        await handlePlayPause();
    };

    const handleStop = async () => {
        const video = videoRef.current;
        if (!video) return;

        userPausedRef.current = true; // 사용자가 의도적으로 정지
        video.pause();
        video.currentTime = 0;
        setIsPlaying(false);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = (parseFloat(e.target.value) / 100) * duration;
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        const video = videoRef.current;
        if (video) {
            video.volume = newVolume;
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-black rounded-lg overflow-hidden h-full flex flex-col">
            {/* Video Element */}
            <div 
                className="flex items-center justify-center bg-black overflow-hidden" 
                style={{ height: '900px' }}
                onMouseLeave={() => {
                    // 마우스가 영역 밖으로 나가도 재생 유지
                    const video = videoRef.current;
                    if (video && !video.paused && !video.ended) {
                        // 재생 중이면 계속 재생 유지
                        // pause 이벤트가 발생하면 handlePause에서 처리
                    }
                }}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="object-contain"
                    preload="auto"
                    playsInline
                    onClick={handleVideoClick}
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        width: 'auto', 
                        height: '900px'
                    }}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Custom Controls */}
            <div className="bg-gray-900 p-2">
                {/* 상단: 재생 위치 바 + 시간 표시 */}
                <div className="mb-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progressPercentage}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #374151 ${progressPercentage}%, #374151 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* 하단: 재생/정지 + 볼륨 조절 */}
                <div className="flex items-center justify-between space-x-4">
                    {/* Control Buttons */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handlePlayPause}
                            className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                        <button
                            onClick={handleStop}
                            className="flex items-center justify-center w-9 h-9 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
                            aria-label="Stop"
                        >
                            <Square className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-2 text-xs text-gray-300">
                        <span className="whitespace-nowrap">볼륨</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                    </div>
                </div>

                {isLoading && (
                    <div className="text-center text-gray-400 text-xs mt-1">
                        동영상을 불러오는 중...
                    </div>
                )}
            </div>

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                }

                .slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';

export default CustomVideoPlayer;

