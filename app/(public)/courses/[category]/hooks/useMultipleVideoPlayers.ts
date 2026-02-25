/**
 * Multiple Video Players Hook
 * 
 * 여러 비디오 플레이어를 통합 관리하는 Hook
 * 모든 플레이어의 ref와 상태를 관리하고, 시청 시간 저장 기능 제공
 */

import { useRef, useCallback } from 'react';
import { FullScreenVideoPlayerRef } from '../components/FullScreenVideoPlayer';

export interface VideoPlayerRefs {
    videoPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    mtDemoPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    shtOrientationPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    shtExpertDemoPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    lhtOrientationPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    lhtExpertDemoPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    emtOrientationPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    emtExemplaryPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    dxEgdLecturePlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    otherLecturePlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    egdVariationPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    hemoclipPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    injectionPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    apcPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    nexpowderPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    evlPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    pegPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    nvugibOverviewPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    nvugibCasePlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
    diagnosticEusPlayerRef: React.RefObject<FullScreenVideoPlayerRef | null>;
}

export interface VideoPlayerVisibility {
    showVideo: boolean;
    showMtDemo: boolean;
    showShtOrientation: boolean;
    showShtExpertDemo: boolean;
    showLhtOrientation: boolean;
    showLhtExpertDemo: boolean;
    showEmtOrientation: boolean;
    showEmtExemplary: boolean;
    showDxEgdLecture: boolean;
    showOtherLecture: boolean;
    showEgdVariation: boolean;
    showHemoclip: boolean;
    showInjection: boolean;
    showApc: boolean;
    showNexpowder: boolean;
    showEvl: boolean;
    showPeg: boolean;
    showNvugibOverview: boolean;
    showNvugibCase: boolean;
    showDiagnosticEus: boolean;
}

export function useMultipleVideoPlayers() {
    // 모든 비디오 플레이어 ref 생성
    const videoPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const mtDemoPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const shtOrientationPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const shtExpertDemoPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const lhtOrientationPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const lhtExpertDemoPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const emtOrientationPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const emtExemplaryPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const dxEgdLecturePlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const otherLecturePlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const egdVariationPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const hemoclipPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const injectionPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const apcPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const nexpowderPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const evlPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const pegPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const nvugibOverviewPlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const nvugibCasePlayerRef = useRef<FullScreenVideoPlayerRef>(null);
    const diagnosticEusPlayerRef = useRef<FullScreenVideoPlayerRef>(null);

    const refs: VideoPlayerRefs = {
        videoPlayerRef,
        mtDemoPlayerRef,
        shtOrientationPlayerRef,
        shtExpertDemoPlayerRef,
        lhtOrientationPlayerRef,
        lhtExpertDemoPlayerRef,
        emtOrientationPlayerRef,
        emtExemplaryPlayerRef,
        dxEgdLecturePlayerRef,
        otherLecturePlayerRef,
        egdVariationPlayerRef,
        hemoclipPlayerRef,
        injectionPlayerRef,
        apcPlayerRef,
        nexpowderPlayerRef,
        evlPlayerRef,
        pegPlayerRef,
        nvugibOverviewPlayerRef,
        nvugibCasePlayerRef,
        diagnosticEusPlayerRef,
    };

    // 현재 열려있는 모든 비디오 플레이어의 시청 시간 저장
    const saveCurrentVideoWatchTime = useCallback(async (visibility: VideoPlayerVisibility) => {
        const savePromises: Promise<void>[] = [];
        
        const playerMap: Array<[boolean, React.RefObject<FullScreenVideoPlayerRef | null>]> = [
            [visibility.showVideo, videoPlayerRef],
            [visibility.showMtDemo, mtDemoPlayerRef],
            [visibility.showShtOrientation, shtOrientationPlayerRef],
            [visibility.showShtExpertDemo, shtExpertDemoPlayerRef],
            [visibility.showLhtOrientation, lhtOrientationPlayerRef],
            [visibility.showLhtExpertDemo, lhtExpertDemoPlayerRef],
            [visibility.showEmtOrientation, emtOrientationPlayerRef],
            [visibility.showEmtExemplary, emtExemplaryPlayerRef],
            [visibility.showDxEgdLecture, dxEgdLecturePlayerRef],
            [visibility.showOtherLecture, otherLecturePlayerRef],
            [visibility.showEgdVariation, egdVariationPlayerRef],
            [visibility.showHemoclip, hemoclipPlayerRef],
            [visibility.showInjection, injectionPlayerRef],
            [visibility.showApc, apcPlayerRef],
            [visibility.showNexpowder, nexpowderPlayerRef],
            [visibility.showEvl, evlPlayerRef],
            [visibility.showPeg, pegPlayerRef],
            [visibility.showNvugibOverview, nvugibOverviewPlayerRef],
            [visibility.showNvugibCase, nvugibCasePlayerRef],
            [visibility.showDiagnosticEus, diagnosticEusPlayerRef],
        ];

        playerMap.forEach(([isVisible, ref]) => {
            if (isVisible && ref.current) {
                const promise = ref.current.saveWatchTime();
                if (promise) {
                    savePromises.push(promise);
                }
            }
        });
        
        // 모든 저장 작업이 완료될 때까지 대기
        await Promise.all(savePromises);
    }, []);

    return {
        refs,
        saveCurrentVideoWatchTime,
    };
}

