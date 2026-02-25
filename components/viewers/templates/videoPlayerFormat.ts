/**
 * 동영상 플레이어 포맷 템플릿
 * Basic course orientation 동영상 시청 화면에서 사용하는 동영상 플레이어 포맷
 * 
 * 사용 방법:
 * import { VIDEO_PLAYER_FORMAT } from '@/components/viewers/templates/videoPlayerFormat';
 * 
 * 다른 화면에서 이 포맷을 적용하려면 CustomVideoPlayer 컴포넌트를 사용하거나
 * 이 템플릿의 스타일 설정을 참고하여 동일한 포맷을 적용하세요.
 */

export const VIDEO_PLAYER_FORMAT = {
    // 플레이어 컨테이너 스타일
    container: {
        className: 'bg-black rounded-lg overflow-hidden h-full flex flex-col',
    },

    // 동영상 요소 컨테이너 스타일
    videoContainer: {
        className: 'flex-1 flex items-center justify-center min-h-0 bg-black overflow-hidden',
    },

    // 동영상 요소 스타일
    video: {
        className: 'w-full h-full object-contain',
        preload: 'metadata' as const,
        // 비율 유지하며 컨테이너에 맞게 자동 크기 조정 (잘리지 않고 전체 화면이 보이는 최대 크기)
    },

    // 컨트롤 영역 스타일
    controlsContainer: {
        className: 'bg-gray-900 p-2',
    },

    // Progress Bar 스타일
    progressBar: {
        container: {
            className: 'mb-2',
        },
        input: {
            className: 'w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider',
            // 동적 스타일: background는 progressPercentage에 따라 변경
        },
        thumb: {
            webkit: {
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                cursor: 'pointer',
            },
            moz: {
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                cursor: 'pointer',
                border: 'none',
            },
        },
        timeDisplay: {
            className: 'flex justify-between text-xs text-gray-400 mt-0.5',
        },
    },

    // 컨트롤 버튼 스타일
    controlButtons: {
        container: {
            className: 'flex items-center justify-center space-x-3',
        },
        playPause: {
            className: 'flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition',
        },
        stop: {
            className: 'flex items-center justify-center w-9 h-9 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition',
        },
        icon: {
            play: 'w-4 h-4 ml-0.5',
            pause: 'w-4 h-4',
            stop: 'w-3.5 h-3.5',
        },
    },

    // 로딩 메시지 스타일
    loading: {
        className: 'text-center text-gray-400 text-xs mt-1',
    },

    // Progress Bar 배경 그라데이션 색상
    progressColors: {
        played: '#3b82f6', // blue-600
        unplayed: '#374151', // gray-700
    },
} as const;

/**
 * 동영상 플레이어 포맷 사용 예시
 * 
 * 1. CustomVideoPlayer 컴포넌트 사용 (권장):
 *    import CustomVideoPlayer from '@/components/viewers/CustomVideoPlayer';
 *    <CustomVideoPlayer videoUrl={videoUrl} onPlay={handlePlay} />
 * 
 * 2. 템플릿 스타일 직접 적용:
 *    import { VIDEO_PLAYER_FORMAT } from '@/components/viewers/templates/videoPlayerFormat';
 *    // VIDEO_PLAYER_FORMAT의 스타일을 참고하여 동일한 포맷 적용
 */

