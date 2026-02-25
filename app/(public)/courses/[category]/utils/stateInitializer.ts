/**
 * State Initializer Utility
 * 
 * 비디오 플레이어 상태 초기화 유틸리티
 * 사이드바 클릭 시 모든 비디오 플레이어 상태를 리셋하는 함수 제공
 */

export interface VideoPlayerStateSetters {
    // Basic
    setShowVideo: (show: boolean) => void;
    setVideoUrl: (url: string | null) => void;
    setVideoError: (error: string | null) => void;
    
    // MT Demo
    setShowMtDemo: (show: boolean) => void;
    setMtDemoVideoUrl: (url: string | null) => void;
    setMtDemoError: (error: string | null) => void;
    
    // SHT
    setShowShtOrientation: (show: boolean) => void;
    setShtOrientationVideoUrl: (url: string | null) => void;
    setShtOrientationError: (error: string | null) => void;
    setShowShtExpertDemo: (show: boolean) => void;
    setShtExpertDemoVideoUrl: (url: string | null) => void;
    setShtExpertDemoError: (error: string | null) => void;
    
    // LHT
    setShowLhtOrientation: (show: boolean) => void;
    setLhtOrientationVideoUrl: (url: string | null) => void;
    setLhtOrientationError: (error: string | null) => void;
    setShowLhtExpertDemo: (show: boolean) => void;
    setLhtExpertDemoVideoUrl: (url: string | null) => void;
    setLhtExpertDemoError: (error: string | null) => void;
    
    // EMT
    setShowEmtOrientation: (show: boolean) => void;
    setEmtOrientationVideoUrl: (url: string | null) => void;
    setEmtOrientationError: (error: string | null) => void;
    setShowEmtExemplary: (show: boolean) => void;
    setEmtExemplaryVideoUrl: (url: string | null) => void;
    setEmtExemplaryError: (error: string | null) => void;
    
    // Dx EGD Lecture
    setShowDxEgdLecture: (show: boolean) => void;
    setDxEgdLectureVideoUrl: (url: string | null) => void;
    setDxEgdLectureError: (error: string | null) => void;
    setSelectedLecture: (lecture: string | null) => void;
    
    // Other Lecture
    setShowOtherLecture: (show: boolean) => void;
    setOtherLectureVideoUrl: (url: string | null) => void;
    setOtherLectureError: (error: string | null) => void;
    setSelectedOtherLecture: (lecture: string | null) => void;
    
    // EGD Variation
    setShowEgdVariation: (show: boolean) => void;
    setEgdVariationVideoUrl: (url: string | null) => void;
    setEgdVariationError: (error: string | null) => void;
    setSelectedEgdVariationCode: (code: string | null) => void;
    
    // Hemoclip
    setShowHemoclip: (show: boolean) => void;
    setHemoclipVideoUrl: (url: string | null) => void;
    setHemoclipError: (error: string | null) => void;
    setHemoclipLogCreated: (created: boolean) => void;
    
    // Injection
    setShowInjection: (show: boolean) => void;
    setInjectionVideoUrl: (url: string | null) => void;
    setInjectionError: (error: string | null) => void;
    setInjectionLogCreated: (created: boolean) => void;
    
    // APC
    setShowApc: (show: boolean) => void;
    setApcVideoUrl: (url: string | null) => void;
    setApcError: (error: string | null) => void;
    setApcLogCreated: (created: boolean) => void;
    
    // NexPowder
    setShowNexpowder: (show: boolean) => void;
    setNexpowderVideoUrl: (url: string | null) => void;
    setNexpowderError: (error: string | null) => void;
    setNexpowderLogCreated: (created: boolean) => void;
    
    // EVL
    setShowEvl: (show: boolean) => void;
    setEvlVideoUrl: (url: string | null) => void;
    setEvlError: (error: string | null) => void;
    setEvlLogCreated: (created: boolean) => void;
    
    // PEG
    setShowPeg: (show: boolean) => void;
    setPegVideoUrl: (url: string | null) => void;
    setPegError: (error: string | null) => void;
    setPegLogCreated: (created: boolean) => void;
    
    // NVUGIB Overview
    setShowNvugibOverview: (show: boolean) => void;
    setNvugibOverviewVideoUrl: (url: string | null) => void;
    setNvugibOverviewError: (error: string | null) => void;
    setNvugibOverviewLogCreated: (created: boolean) => void;
    
    // NVUGIB Case
    setShowNvugibCase: (show: boolean) => void;
    setNvugibCaseVideoUrl: (url: string | null) => void;
    setNvugibCaseError: (error: string | null) => void;
    setSelectedNvugibCase: (caseName: string | null) => void;
    
    // Diagnostic EUS
    setShowDiagnosticEus: (show: boolean) => void;
    setDiagnosticEusVideoUrl: (url: string | null) => void;
    setDiagnosticEusError: (error: string | null) => void;
    setSelectedDiagnosticEus: (eus: string | null) => void;
}

/**
 * 모든 비디오 플레이어 상태를 초기화
 */
export function resetAllVideoPlayers(setters: VideoPlayerStateSetters) {
    // Basic
    setters.setShowVideo(false);
    setters.setVideoUrl(null);
    setters.setVideoError(null);
    
    // MT Demo
    setters.setShowMtDemo(false);
    setters.setMtDemoVideoUrl(null);
    setters.setMtDemoError(null);
    
    // SHT
    setters.setShowShtOrientation(false);
    setters.setShtOrientationVideoUrl(null);
    setters.setShtOrientationError(null);
    setters.setShowShtExpertDemo(false);
    setters.setShtExpertDemoVideoUrl(null);
    setters.setShtExpertDemoError(null);
    
    // LHT
    setters.setShowLhtOrientation(false);
    setters.setLhtOrientationVideoUrl(null);
    setters.setLhtOrientationError(null);
    setters.setShowLhtExpertDemo(false);
    setters.setLhtExpertDemoVideoUrl(null);
    setters.setLhtExpertDemoError(null);
    
    // EMT
    setters.setShowEmtOrientation(false);
    setters.setEmtOrientationVideoUrl(null);
    setters.setEmtOrientationError(null);
    setters.setShowEmtExemplary(false);
    setters.setEmtExemplaryVideoUrl(null);
    setters.setEmtExemplaryError(null);
    
    // Dx EGD Lecture
    setters.setShowDxEgdLecture(false);
    setters.setDxEgdLectureVideoUrl(null);
    setters.setDxEgdLectureError(null);
    setters.setSelectedLecture(null);
    
    // Other Lecture
    setters.setShowOtherLecture(false);
    setters.setOtherLectureVideoUrl(null);
    setters.setOtherLectureError(null);
    setters.setSelectedOtherLecture(null);
    
    // EGD Variation
    setters.setShowEgdVariation(false);
    setters.setEgdVariationVideoUrl(null);
    setters.setEgdVariationError(null);
    setters.setSelectedEgdVariationCode(null);
    
    // Hemoclip
    setters.setShowHemoclip(false);
    setters.setHemoclipVideoUrl(null);
    setters.setHemoclipError(null);
    setters.setHemoclipLogCreated(false);
    
    // Injection
    setters.setShowInjection(false);
    setters.setInjectionVideoUrl(null);
    setters.setInjectionError(null);
    setters.setInjectionLogCreated(false);
    
    // APC
    setters.setShowApc(false);
    setters.setApcVideoUrl(null);
    setters.setApcError(null);
    setters.setApcLogCreated(false);
    
    // NexPowder
    setters.setShowNexpowder(false);
    setters.setNexpowderVideoUrl(null);
    setters.setNexpowderError(null);
    setters.setNexpowderLogCreated(false);
    
    // EVL
    setters.setShowEvl(false);
    setters.setEvlVideoUrl(null);
    setters.setEvlError(null);
    setters.setEvlLogCreated(false);
    
    // PEG
    setters.setShowPeg(false);
    setters.setPegVideoUrl(null);
    setters.setPegError(null);
    setters.setPegLogCreated(false);
    
    // NVUGIB Overview
    setters.setShowNvugibOverview(false);
    setters.setNvugibOverviewVideoUrl(null);
    setters.setNvugibOverviewError(null);
    setters.setNvugibOverviewLogCreated(false);
    
    // NVUGIB Case
    setters.setShowNvugibCase(false);
    setters.setNvugibCaseVideoUrl(null);
    setters.setNvugibCaseError(null);
    setters.setSelectedNvugibCase(null);
    
    // Diagnostic EUS
    setters.setShowDiagnosticEus(false);
    setters.setDiagnosticEusVideoUrl(null);
    setters.setDiagnosticEusError(null);
    setters.setSelectedDiagnosticEus(null);
}

