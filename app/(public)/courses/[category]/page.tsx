/**
 * Course Page
 * Dynamic page for each course category with sidebar navigation
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Download, Upload, Video, FileText, Music, X, Trash2 } from 'lucide-react';
import CustomVideoPlayer from '@/components/viewers/CustomVideoPlayer';
import { useAuth } from '@/components/AuthProvider';
import { convertBmpToJpg, isBmpFile } from '@/lib/image-converter';
import { useVideoUpload } from '@/lib/hooks/useVideoUpload';
import { InstructorInfo } from '@/lib/instructor-utils';
import { isAdmin } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { courseConfig, CourseItem, CourseSection } from './config/courseConfig';
import { removeEmptyLines, removeEmptyLinesAndUnderscores } from './utils/textUtils';
import ImageWindow from './components/ImageWindow';
import FullScreenVideoPlayer, { FullScreenVideoPlayerRef } from './components/FullScreenVideoPlayer';
import ActionButton from './components/ActionButton';
import ClickableCard from './components/ClickableCard';

const PblF201Page = dynamic(() => import('@/components/pbl/PblF201Page').then(mod => ({ default: mod.PblF201Page })), { ssr: false });
const PblF202Page = dynamic(() => import('@/components/pbl/PblF202Page').then(mod => ({ default: mod.PblF202Page })), { ssr: false });
const PblF203Page = dynamic(() => import('@/components/pbl/PblF203Page').then(mod => ({ default: mod.PblF203Page })), { ssr: false });
const PblF204Page = dynamic(() => import('@/components/pbl/PblF204Page').then(mod => ({ default: mod.PblF204Page })), { ssr: false });
const PblF205Page = dynamic(() => import('@/components/pbl/PblF205Page').then(mod => ({ default: mod.PblF205Page })), { ssr: false });
const PblF206Page = dynamic(() => import('@/components/pbl/PblF206Page').then(mod => ({ default: mod.PblF206Page })), { ssr: false });
const PblF207Page = dynamic(() => import('@/components/pbl/PblF207Page').then(mod => ({ default: mod.PblF207Page })), { ssr: false });
const PblF208Page = dynamic(() => import('@/components/pbl/PblF208Page').then(mod => ({ default: mod.PblF208Page })), { ssr: false });
const PblF209Page = dynamic(() => import('@/components/pbl/PblF209Page').then(mod => ({ default: mod.PblF209Page })), { ssr: false });
const PblF210Page = dynamic(() => import('@/components/pbl/PblF210Page').then(mod => ({ default: mod.PblF210Page })), { ssr: false });
const PblF211Page = dynamic(() => import('@/components/pbl/PblF211Page').then(mod => ({ default: mod.PblF211Page })), { ssr: false });
const PblF212Page = dynamic(() => import('@/components/pbl/PblF212Page').then(mod => ({ default: mod.PblF212Page })), { ssr: false });
const PblF213Page = dynamic(() => import('@/components/pbl/PblF213Page').then(mod => ({ default: mod.PblF213Page })), { ssr: false });
const PblF214Page = dynamic(() => import('@/components/pbl/PblF214Page').then(mod => ({ default: mod.PblF214Page })), { ssr: false });

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = params?.category as string;
    const { user } = useAuth();

    // 공통 인증 체크 함수
    const checkAuth = (): boolean => {
        if (!user) {
            alert('로그인을 먼저 시행해 주십시오');
            return false;
        }
        return true;
    };

    // Redirect to home if category is invalid
    useEffect(() => {
        if (category && !courseConfig[category]) {
            router.replace('/');
        }
    }, [category, router]);

    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingVideo, setLoadingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [logCreated, setLogCreated] = useState(false);
    const [userProfile, setUserProfile] = useState<{ position: string; name: string; hospital: string } | null>(null);
    const [showVideo, setShowVideo] = useState(false);
    const [mtDemoVideoUrl, setMtDemoVideoUrl] = useState<string | null>(null);
    const [loadingMtDemo, setLoadingMtDemo] = useState(false);
    const [mtDemoError, setMtDemoError] = useState<string | null>(null);
    const [showMtDemo, setShowMtDemo] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [downloadingEgd, setDownloadingEgd] = useState(false);
    const [downloadingNarration, setDownloadingNarration] = useState(false);
    const [shtOrientationVideoUrl, setShtOrientationVideoUrl] = useState<string | null>(null);
    const [loadingShtOrientation, setLoadingShtOrientation] = useState(false);
    const [shtOrientationError, setShtOrientationError] = useState<string | null>(null);
    const [showShtOrientation, setShowShtOrientation] = useState(false);
    const [shtExpertDemoVideoUrl, setShtExpertDemoVideoUrl] = useState<string | null>(null);
    const [loadingShtExpertDemo, setLoadingShtExpertDemo] = useState(false);
    const [shtExpertDemoError, setShtExpertDemoError] = useState<string | null>(null);
    const [showShtExpertDemo, setShowShtExpertDemo] = useState(false);
    const [shtUploadFile, setShtUploadFile] = useState<File | null>(null);
    const [uploadingSht, setUploadingSht] = useState(false);
    const [isDraggingSht, setIsDraggingSht] = useState(false);

    // LHT video states
    const [lhtOrientationVideoUrl, setLhtOrientationVideoUrl] = useState<string | null>(null);
    const [loadingLhtOrientation, setLoadingLhtOrientation] = useState(false);
    const [lhtOrientationError, setLhtOrientationError] = useState<string | null>(null);
    const [showLhtOrientation, setShowLhtOrientation] = useState(false);
    const [lhtExpertDemoVideoUrl, setLhtExpertDemoVideoUrl] = useState<string | null>(null);
    const [loadingLhtExpertDemo, setLoadingLhtExpertDemo] = useState(false);
    const [lhtExpertDemoError, setLhtExpertDemoError] = useState<string | null>(null);
    const [showLhtExpertDemo, setShowLhtExpertDemo] = useState(false);
    const [lhtUploadFile, setLhtUploadFile] = useState<File | null>(null);
    const [uploadingLht, setUploadingLht] = useState(false);
    const [isDraggingLht, setIsDraggingLht] = useState(false);
    const [emtOrientationVideoUrl, setEmtOrientationVideoUrl] = useState<string | null>(null);
    const [loadingEmtOrientation, setLoadingEmtOrientation] = useState(false);
    const [emtOrientationError, setEmtOrientationError] = useState<string | null>(null);
    const [showEmtOrientation, setShowEmtOrientation] = useState(false);
    const [emtExemplaryVideoUrl, setEmtExemplaryVideoUrl] = useState<string | null>(null);
    const [loadingEmtExemplary, setLoadingEmtExemplary] = useState(false);
    const [emtExemplaryError, setEmtExemplaryError] = useState<string | null>(null);
    const [showEmtExemplary, setShowEmtExemplary] = useState(false);
    const [emtUploadFiles, setEmtUploadFiles] = useState<File[]>([]);
    const [uploadingEmt, setUploadingEmt] = useState(false);
    const [isDraggingEmt, setIsDraggingEmt] = useState(false);
    const [analyzingEmt, setAnalyzingEmt] = useState(false);
    const [emtProgress, setEmtProgress] = useState(0); // 0-100
    const [emtProgressMessage, setEmtProgressMessage] = useState('');
    const [emtVisualizationUrls, setEmtVisualizationUrls] = useState<Array<{ frame: number; time: number; url: string; hasMarker: boolean }>>([]);
    const [showEmtVisualization, setShowEmtVisualization] = useState(false);
    const [emtVisualizationIndex, setEmtVisualizationIndex] = useState(0);
    const [emtVersion, setEmtVersion] = useState<'EMT' | 'EMT-L'>('EMT'); // EMT 버전 선택
    const [emtEndoscopeModel, setEmtEndoscopeModel] = useState<'CV 260' | 'CV 290' | 'X1 660'>('CV 290'); // EMT-L 내시경 모델 (ROI 적용)

    // EMT 시각화 이미지 자동 재생 (1초에 3프레임)
    useEffect(() => {
        if (showEmtVisualization && emtVisualizationUrls.length > 0) {
            console.log('[Visualization] 모달 표시됨:', { urlsCount: emtVisualizationUrls.length, currentIndex: emtVisualizationIndex });
        }
    }, [showEmtVisualization, emtVisualizationUrls.length, emtVisualizationIndex]);

    useEffect(() => {
        if (!showEmtVisualization || emtVisualizationUrls.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            setEmtVisualizationIndex(prev => {
                if (prev < emtVisualizationUrls.length - 1) {
                    return prev + 1;
                } else {
                    // 마지막 프레임에 도달하면 처음으로 돌아감
                    return 0;
                }
            });
        }, 1000 / 3); // 1초에 3프레임 = 약 333ms마다 전환

        return () => clearInterval(interval);
    }, [showEmtVisualization, emtVisualizationUrls.length]);

    const [dxEgdLectureVideoUrl, setDxEgdLectureVideoUrl] = useState<string | null>(null);
    const [loadingDxEgdLecture, setLoadingDxEgdLecture] = useState(false);
    const [dxEgdLectureError, setDxEgdLectureError] = useState<string | null>(null);
    const [showDxEgdLecture, setShowDxEgdLecture] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
    const [dxEgdLectureLogCreated, setDxEgdLectureLogCreated] = useState<Set<string>>(new Set());
    const [otherLectureVideoUrl, setOtherLectureVideoUrl] = useState<string | null>(null);
    const [loadingOtherLecture, setLoadingOtherLecture] = useState(false);
    const [otherLectureError, setOtherLectureError] = useState<string | null>(null);
    const [showOtherLecture, setShowOtherLecture] = useState(false);
    const [selectedOtherLecture, setSelectedOtherLecture] = useState<string | null>(null);
    const [otherLectureLogCreated, setOtherLectureLogCreated] = useState<Set<string>>(new Set());

    // Hemoclip video states
    const [hemoclipVideoUrl, setHemoclipVideoUrl] = useState<string | null>(null);
    const [loadingHemoclip, setLoadingHemoclip] = useState(false);
    const [hemoclipError, setHemoclipError] = useState<string | null>(null);
    const [showHemoclip, setShowHemoclip] = useState(false);
    const [hemoclipLogCreated, setHemoclipLogCreated] = useState(false);

    // Injection video states
    const [injectionVideoUrl, setInjectionVideoUrl] = useState<string | null>(null);
    const [loadingInjection, setLoadingInjection] = useState(false);
    const [injectionError, setInjectionError] = useState<string | null>(null);
    const [showInjection, setShowInjection] = useState(false);
    const [injectionLogCreated, setInjectionLogCreated] = useState(false);

    // APC video states
    const [apcVideoUrl, setApcVideoUrl] = useState<string | null>(null);
    const [loadingApc, setLoadingApc] = useState(false);
    const [apcError, setApcError] = useState<string | null>(null);
    const [showApc, setShowApc] = useState(false);
    const [apcLogCreated, setApcLogCreated] = useState(false);

    // NexPowder video states
    const [nexpowderVideoUrl, setNexpowderVideoUrl] = useState<string | null>(null);
    const [loadingNexpowder, setLoadingNexpowder] = useState(false);
    const [nexpowderError, setNexpowderError] = useState<string | null>(null);
    const [showNexpowder, setShowNexpowder] = useState(false);
    const [nexpowderLogCreated, setNexpowderLogCreated] = useState(false);

    // EVL video states
    const [evlVideoUrl, setEvlVideoUrl] = useState<string | null>(null);
    const [loadingEvl, setLoadingEvl] = useState(false);
    const [evlError, setEvlError] = useState<string | null>(null);
    const [showEvl, setShowEvl] = useState(false);
    const [evlLogCreated, setEvlLogCreated] = useState(false);

    // PEG video states
    const [pegVideoUrl, setPegVideoUrl] = useState<string | null>(null);
    const [loadingPeg, setLoadingPeg] = useState(false);
    const [pegError, setPegError] = useState<string | null>(null);
    const [showPeg, setShowPeg] = useState(false);
    const [pegLogCreated, setPegLogCreated] = useState(false);

    // NVUGIB overview video states
    const [nvugibOverviewVideoUrl, setNvugibOverviewVideoUrl] = useState<string | null>(null);
    const [loadingNvugibOverview, setLoadingNvugibOverview] = useState(false);
    const [nvugibOverviewError, setNvugibOverviewError] = useState<string | null>(null);
    const [showNvugibOverview, setShowNvugibOverview] = useState(false);
    const [nvugibOverviewLogCreated, setNvugibOverviewLogCreated] = useState(false);

    // NVUGIB case video states
    const [nvugibCaseVideoUrl, setNvugibCaseVideoUrl] = useState<string | null>(null);
    const [loadingNvugibCase, setLoadingNvugibCase] = useState(false);
    const [nvugibCaseError, setNvugibCaseError] = useState<string | null>(null);
    const [showNvugibCase, setShowNvugibCase] = useState(false);
    const [selectedNvugibCase, setSelectedNvugibCase] = useState<string | null>(null);
    const [nvugibCaseLogCreated, setNvugibCaseLogCreated] = useState<Set<string>>(new Set());

    // Diagnostic EUS lecture video states
    const [diagnosticEusVideoUrl, setDiagnosticEusVideoUrl] = useState<string | null>(null);
    const [loadingDiagnosticEus, setLoadingDiagnosticEus] = useState(false);
    const [diagnosticEusError, setDiagnosticEusError] = useState<string | null>(null);
    const [showDiagnosticEus, setShowDiagnosticEus] = useState(false);
    const [selectedDiagnosticEus, setSelectedDiagnosticEus] = useState<string | null>(null);
    const [diagnosticEusLogCreated, setDiagnosticEusLogCreated] = useState<Set<string>>(new Set());

    // EGD lesion Dx images states
    const [egdDxImages, setEgdDxImages] = useState<string[]>([]);
    const [loadingEgdDxImages, setLoadingEgdDxImages] = useState(false);
    const [egdDxImagesError, setEgdDxImagesError] = useState<string | null>(null);
    const [showEgdDxImage, setShowEgdDxImage] = useState(false);
    const [selectedEgdDxImage, setSelectedEgdDxImage] = useState<string | null>(null);
    const [egdDxImageUrl, setEgdDxImageUrl] = useState<string | null>(null);
    const [loadingEgdDxImage, setLoadingEgdDxImage] = useState(false);
    const [egdDxImageError, setEgdDxImageError] = useState<string | null>(null);
    const [egdDxInstruction1, setEgdDxInstruction1] = useState<string>('');
    const [egdDxInstruction2, setEgdDxInstruction2] = useState<string>('');
    const [loadingEgdDxInstruction1, setLoadingEgdDxInstruction1] = useState(false);
    const [loadingEgdDxInstruction2, setLoadingEgdDxInstruction2] = useState(false);
    const [egdDxInstruction1Error, setEgdDxInstruction1Error] = useState<string | null>(null);
    const [egdDxInstruction2Error, setEgdDxInstruction2Error] = useState<string | null>(null);
    const [showEgdDxInstruction2, setShowEgdDxInstruction2] = useState(false);
    const [showEgdDxImageWindow, setShowEgdDxImageWindow] = useState(false);
    const [showEgdDxImageWindowF2, setShowEgdDxImageWindowF2] = useState(false);

    // EGD lesion Dx F2 images states
    const [egdDxImagesF2, setEgdDxImagesF2] = useState<string[]>([]);
    const [loadingEgdDxImagesF2, setLoadingEgdDxImagesF2] = useState(false);
    const [egdDxImagesErrorF2, setEgdDxImagesErrorF2] = useState<string | null>(null);
    const [showEgdDxImageF2, setShowEgdDxImageF2] = useState(false);
    const [selectedEgdDxImageF2, setSelectedEgdDxImageF2] = useState<string | null>(null);
    const [egdDxImageUrlF2, setEgdDxImageUrlF2] = useState<string | null>(null);
    const [loadingEgdDxImageF2, setLoadingEgdDxImageF2] = useState(false);
    const [egdDxImageErrorF2, setEgdDxImageErrorF2] = useState<string | null>(null);
    const [egdDxInstruction1F2, setEgdDxInstruction1F2] = useState<string>('');
    const [egdDxInstruction2F2, setEgdDxInstruction2F2] = useState<string>('');
    const [loadingEgdDxInstruction1F2, setLoadingEgdDxInstruction1F2] = useState(false);
    const [loadingEgdDxInstruction2F2, setLoadingEgdDxInstruction2F2] = useState(false);
    const [egdDxInstruction1ErrorF2, setEgdDxInstruction1ErrorF2] = useState<string | null>(null);
    const [egdDxInstruction2ErrorF2, setEgdDxInstruction2ErrorF2] = useState<string | null>(null);
    const [showEgdDxInstruction2F2, setShowEgdDxInstruction2F2] = useState(false);

    // Dx EGD 실전 강의 목록
    const dxEgdLectures = [
        'Complication_Sedation',
        'Description_Impression',
        'Photo_Report',
        'Biopsy_NBI',
        'Stomach_benign',
        'Stomach_malignant',
        'Duodenum',
        'Lx_Phx_Esophagus',
        'SET',
    ];

    // Other lectures 목록
    const otherLectures = [
        'Bx.? or not?',
    ];

    // NVUGIB case 목록
    const nvugibCases = [
        'angiodysplasia_01',
        'angiodysplasia_02',
        'barogenic_tear_01',
        'cancer_bleeding_01',
        'cancer_bleeding_02',
        'Dieulafoy_01',
        'Dieulafoy_02',
        'Dieulafoy_03',
        'diffuse_oozing_01',
        'MW_tear_01',
        'MW_tear_02',
        'ESD_ulcer_01',
        'ESD_ulcer_02',
        'ulcer_base_01',
        'ulcer_base_02',
        'ulcer_base_03',
    ];

    // EGD variation 목록 (이미지와 동일한 레이아웃)
    const egdVariationItems = [
        { description: '가장 먼저 보세요: 전체 과정 해설 동영상은 A2 (A1은 작동 안됨)', codes: ['A1'] },
        { description: '정상 위에서 Expert의 검사 전과정 B', codes: ['B1', 'B2'] },
        { description: 'STG with Bilroth II reconstruction state에서 검사 전과정 C', codes: ['C1', 'C2'] },
        { description: 'STG with Bilroth I reconstruction state에서 검사 전과정 D', codes: ['D1', 'D2'] },
        { description: '후두부 접근 시 구역이 심해 후두를 관찰할 수 없다 E', codes: ['E1', 'E2', 'E3', 'E4'] },
        { description: 'epiglotis가 닫혀서 후부두 전체가 보이는 사진을 찍을 수가 없다 F', codes: ['F1', 'F2', 'F3'] },
        { description: '식도가 너무 tortuous 해서 화면 중앙에 놓고 전진하기 힘든다 G', codes: ['G1'] },
        { description: 'z line이 stomach 쪽으로 내려가 있어 z line이 보이지 않는다 H', codes: ['H1', 'H2'] },
        { description: 'fundus, HB 경계부위가 심하게 꺽어져 있어, antrum 쪽으로 진입이 안된다 I', codes: ['I1', 'I2'] },
        { description: 'pyloric ring이 계속 닫혀있고 움직여서 scope의 통과가 어렵다 J', codes: ['J1', 'J2', 'J3', 'J4', 'J5'] },
        { description: '십이지장 벽에 닿기만 하고, SDA의 위치를 찾지 못하겠다 K', codes: ['K1'] },
        { description: 'bulb에 들어가 보니, SDA가 사진 상 우측이 아니라 좌측에 있다 L', codes: ['L1'] },
        { description: '제2부에서 scope를 당기면 전진해야 하는데, 전진하지 않고 그냥 빠진다 M', codes: ['M1'] },
        { description: '십이지장 2nd portion인데, ampulla가 안보이는데 prox 쪽에 있는 것 같다 N', codes: ['N1', 'N2', 'N3'] },
        { description: 'minor papilla를 AOP로 착각하지 않으려면 O', codes: ['O1', 'O2', 'O3'] },
        { description: 'antrum GC에 transverse fold가 있어 그 distal part 부분이 가려져 있다 P', codes: ['P1', 'P2'] },
        { description: '전정부에서 노브를 up을 했는데도, antrum에 붙어서, angle을 관찰할 수 없다 Q', codes: ['Q1', 'Q2', 'Q3'] },
        { description: '환자의 belcing이 너무 심해 공기가 빠져 fold가 펴지지 않는다 R', codes: ['R1', 'R2', 'R3'] },
        { description: 'proximal gastrectomy with double tract reconstruction에서 검사 전과정 S', codes: ['S1'] },
        { description: 'McKeown/Ivor_Lewis op 받은 환자에서 EGD 검사 T', codes: ['T1', 'T2'] },
    ];

    const [egdVariationVideoUrl, setEgdVariationVideoUrl] = useState<string | null>(null);
    const [loadingEgdVariation, setLoadingEgdVariation] = useState(false);
    const [egdVariationError, setEgdVariationError] = useState<string | null>(null);
    const [showEgdVariation, setShowEgdVariation] = useState(false);

    // PBL F2 01 states
    const [showPblF201, setShowPblF201] = useState(false);

    // PBL F2 02 states
    const [showPblF202, setShowPblF202] = useState(false);

    // 비디오 플레이어 refs (사이드바 클릭 시 시청 시간 저장용)
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

    // 현재 열려있는 비디오 플레이어의 시청 시간 저장 함수
    const saveCurrentVideoWatchTime = React.useCallback(async () => {
        const savePromises: Promise<void>[] = [];

        if (showVideo && videoPlayerRef.current) {
            savePromises.push(videoPlayerRef.current.saveWatchTime());
        }
        if (showMtDemo && mtDemoPlayerRef.current) {
            savePromises.push(mtDemoPlayerRef.current.saveWatchTime());
        }
        if (showShtOrientation && shtOrientationPlayerRef.current) {
            savePromises.push(shtOrientationPlayerRef.current.saveWatchTime());
        }
        if (showShtExpertDemo && shtExpertDemoPlayerRef.current) {
            savePromises.push(shtExpertDemoPlayerRef.current.saveWatchTime());
        }
        if (showLhtOrientation && lhtOrientationPlayerRef.current) {
            savePromises.push(lhtOrientationPlayerRef.current.saveWatchTime());
        }
        if (showLhtExpertDemo && lhtExpertDemoPlayerRef.current) {
            savePromises.push(lhtExpertDemoPlayerRef.current.saveWatchTime());
        }
        if (showEmtOrientation && emtOrientationPlayerRef.current) {
            savePromises.push(emtOrientationPlayerRef.current.saveWatchTime());
        }
        if (showEmtExemplary && emtExemplaryPlayerRef.current) {
            savePromises.push(emtExemplaryPlayerRef.current.saveWatchTime());
        }
        if (showDxEgdLecture && dxEgdLecturePlayerRef.current) {
            savePromises.push(dxEgdLecturePlayerRef.current.saveWatchTime());
        }
        if (showOtherLecture && otherLecturePlayerRef.current) {
            savePromises.push(otherLecturePlayerRef.current.saveWatchTime());
        }
        if (showEgdVariation && egdVariationPlayerRef.current) {
            savePromises.push(egdVariationPlayerRef.current.saveWatchTime());
        }
        if (showHemoclip && hemoclipPlayerRef.current) {
            savePromises.push(hemoclipPlayerRef.current.saveWatchTime());
        }
        if (showInjection && injectionPlayerRef.current) {
            savePromises.push(injectionPlayerRef.current.saveWatchTime());
        }
        if (showApc && apcPlayerRef.current) {
            savePromises.push(apcPlayerRef.current.saveWatchTime());
        }
        if (showNexpowder && nexpowderPlayerRef.current) {
            savePromises.push(nexpowderPlayerRef.current.saveWatchTime());
        }
        if (showEvl && evlPlayerRef.current) {
            savePromises.push(evlPlayerRef.current.saveWatchTime());
        }
        if (showPeg && pegPlayerRef.current) {
            savePromises.push(pegPlayerRef.current.saveWatchTime());
        }
        if (showNvugibOverview && nvugibOverviewPlayerRef.current) {
            savePromises.push(nvugibOverviewPlayerRef.current.saveWatchTime());
        }
        if (showNvugibCase && nvugibCasePlayerRef.current) {
            savePromises.push(nvugibCasePlayerRef.current.saveWatchTime());
        }
        if (showDiagnosticEus && diagnosticEusPlayerRef.current) {
            savePromises.push(diagnosticEusPlayerRef.current.saveWatchTime());
        }

        // 모든 저장 작업이 완료될 때까지 대기
        await Promise.all(savePromises);
    }, [
        showVideo, showMtDemo, showShtOrientation, showShtExpertDemo,
        showLhtOrientation, showLhtExpertDemo, showEmtOrientation, showEmtExemplary,
        showDxEgdLecture, showOtherLecture, showEgdVariation, showHemoclip,
        showInjection, showApc, showNexpowder, showEvl, showPeg,
        showNvugibOverview, showNvugibCase, showDiagnosticEus
    ]);

    // PBL F2 03 states
    const [showPblF203, setShowPblF203] = useState(false);

    // PBL F2 04 states
    const [showPblF204, setShowPblF204] = useState(false);

    // PBL F2 05 states
    const [showPblF205, setShowPblF205] = useState(false);

    // PBL F2 06-14 states
    const [showPblF206, setShowPblF206] = useState(false);
    const [showPblF207, setShowPblF207] = useState(false);
    const [showPblF208, setShowPblF208] = useState(false);
    const [showPblF209, setShowPblF209] = useState(false);
    const [showPblF210, setShowPblF210] = useState(false);
    const [showPblF211, setShowPblF211] = useState(false);
    const [showPblF212, setShowPblF212] = useState(false);
    const [showPblF213, setShowPblF213] = useState(false);
    const [showPblF214, setShowPblF214] = useState(false);
    const [selectedEgdVariationCode, setSelectedEgdVariationCode] = useState<string | null>(null);
    const [egdVariationLogCreated, setEgdVariationLogCreated] = useState<Set<string>>(new Set());

    // Handle adding files to EMT upload list
    const handleEmtAddFiles = async (newFiles: File[]) => {
        // Validate files
        const videoFiles = newFiles.filter(f => f.type.startsWith('video/'));
        const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));

        // Check if adding new video would exceed limit
        const existingVideoFiles = emtUploadFiles.filter(f => f.type.startsWith('video/'));
        if (videoFiles.length > 0 && existingVideoFiles.length > 0) {
            alert('동영상은 한 개만 선택할 수 있습니다.');
            return;
        }

        // Validate file types
        const validFiles: File[] = [];
        for (const file of newFiles) {
            const isVideo = file.type.startsWith('video/');
            const isImage = isBmpFile(file); // BMP만 허용

            // 동영상: AVI, MP4만 허용
            const isValidVideo = isVideo && (file.type === 'video/avi' || file.type === 'video/mp4' || file.type === 'video/x-msvideo');

            if (isValidVideo) {
                // 동영상 파일 크기 검증 (60MB)
                if (file.size > 60 * 1024 * 1024) {
                    alert(`${file.name} 파일 크기는 60MB 이하여야 합니다.`);
                    continue;
                }
                validFiles.push(file);
            } else if (isImage) {
                // BMP만 허용, JPG로 변환
                try {
                    const jpgFile = await convertBmpToJpg(file);
                    validFiles.push(jpgFile);
                } catch (error: any) {
                    console.error('BMP 변환 오류:', error);
                    alert(`${file.name} 파일을 JPG로 변환하는 중 오류가 발생했습니다: ${error.message}`);
                    continue;
                }
            }
        }

        if (validFiles.length !== newFiles.length) {
            alert('동영상: AVI, MP4만 가능합니다.\n이미지: BMP만 가능합니다.');
            return;
        }

        // Add files to existing list
        setEmtUploadFiles(prev => [...prev, ...validFiles]);
    };

    // Handle removing a file from EMT upload list
    const handleEmtRemoveFile = (index: number) => {
        setEmtUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle EMT video and image upload and analysis
    const handleEmtUpload = async () => {
        if (!user || !userProfile) {
            alert('사용자 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const isUserAdmin = isAdmin(user);

        // 버전 정보 확인 로깅
        console.log('[Client] handleEmtUpload called with emtVersion:', emtVersion);
        console.log('[Client] emtVersion type:', typeof emtVersion);
        console.log('[Client] emtVersion === "EMT-L":', emtVersion === 'EMT-L');

        if (emtUploadFiles.length === 0) {
            alert('분석할 파일을 선택해주세요.');
            return;
        }

        // Separate video and image files
        const videoFiles = emtUploadFiles.filter(f => f.type.startsWith('video/'));
        const imageFiles = emtUploadFiles.filter(f => f.type.startsWith('image/'));

        // Validate: only one video file (관리자는 동영상 없어도 진행 가능)
        if (videoFiles.length === 0 && !isUserAdmin) {
            alert('동영상 파일을 최소 1개 선택해주세요.');
            return;
        }
        if (videoFiles.length > 1) {
            alert('동영상은 한 개만 선택할 수 있습니다.');
            return;
        }

        // Hide video players
        setShowEmtOrientation(false);
        setEmtOrientationVideoUrl(null);
        setShowEmtExemplary(false);
        setEmtExemplaryVideoUrl(null);

        setUploadingEmt(true);
        setEmtProgress(0);
        setEmtProgressMessage('파일 업로드 준비 중...');
        try {
            let videoStoragePath = '';

            // 동영상이 있는 경우에만 업로드
            if (videoFiles.length > 0) {
                // Step 1: Upload files to Firebase Storage EMT_result folder
                const { storage } = await import('@/lib/firebase-client');
                const { ref, uploadBytesResumable } = await import('firebase/storage');

                if (!storage) {
                    throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                }

                // Upload video file
                const videoFile = videoFiles[0];
                // Get file extension from file name
                const fileExtension = videoFile.name.split('.').pop() || 'mp4';
                const timestamp = Date.now();
                videoStoragePath = `Simulator_training/EMT/EMT_result/${userProfile.position}-${userProfile.name}-EMT-${timestamp}.${fileExtension}`;
                const videoStorageRef = ref(storage, videoStoragePath);

                await new Promise<void>((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(videoStorageRef, videoFile);
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // 업로드 진행률을 전체의 0-30%로 매핑
                            const totalProgress = Math.floor(uploadProgress * 0.3);
                            setEmtProgress(totalProgress);
                            setEmtProgressMessage(`동영상 업로드 중... ${Math.floor(uploadProgress)}%`);
                            console.log(`Video upload progress: ${uploadProgress.toFixed(2)}%`);
                        },
                        (error) => {
                            reject(error);
                        },
                        () => {
                            setEmtProgress(30);
                            setEmtProgressMessage('업로드 완료, 분석 시작 중...');
                            resolve();
                        }
                    );
                });
            } else {
                // 관리자인 경우 동영상이 없어도 진행
                setEmtProgress(30);
                setEmtProgressMessage('분석 시작 중...');
            }

            // 이미지는 Storage에 저장하지 않음 - 개수 확인만 수행
            // 이미지는 로컬에서만 검증하고 버림 (용량 절약 및 시간 절약)
            // 관리자는 이미지 개수 검증 건너뛰기
            // 버전별 검증 기준 적용
            const imageMin = emtVersion === 'EMT-L' ? 42 : 62;
            const imageMax = emtVersion === 'EMT-L' ? 48 : 66;
            const isValidImageCount = imageFiles.length >= imageMin && imageFiles.length <= imageMax;

            console.log('Images validated locally (not uploaded to Storage):', {
                imageCount: imageFiles.length,
                version: emtVersion,
                min: imageMin,
                max: imageMax,
                isValid: isValidImageCount,
                isAdmin: isUserAdmin
            });

            // 이미지 개수 검증 (관리자는 건너뛰기)
            if (!isUserAdmin && !isValidImageCount) {
                const errorMessage = emtVersion === 'EMT-L'
                    ? `이미지는 ${imageMin}개에서 ${imageMax}개 사이여야 합니다. 현재: ${imageFiles.length}개`
                    : `이미지는 ${imageMin}개에서 ${imageMax}개 사이여야 합니다. 현재: ${imageFiles.length}개`;
                alert(errorMessage);
                setUploadingEmt(false);
                setEmtProgress(0);
                setEmtProgressMessage('');
                return;
            }

            // Step 2: Create job and get jobId
            // 동영상이 없는 경우 (관리자만 가능) 처리
            if (!videoStoragePath && isUserAdmin) {
                // 관리자인 경우 동영상 없이도 결과만 표시
                const imageMin = emtVersion === 'EMT-L' ? 42 : 62;
                const imageMax = emtVersion === 'EMT-L' ? 48 : 66;
                const videoMin = emtVersion === 'EMT-L' ? 190 : 300; // 3분10초 vs 5분
                const videoMax = emtVersion === 'EMT-L' ? 210 : 330; // 3분30초 vs 5분30초

                const adminResultMessage = `=== ${emtVersion} 분석 결과 (관리자 모드) ===\n\n` +
                    `사진 개수: ${imageFiles.length}개 (기준 범위: ${imageMin}-${imageMax}개)\n` +
                    (imageFiles.length < imageMin || imageFiles.length > imageMax
                        ? `⚠️ 사진 개수가 기준(${imageMin}-${imageMax}개)을 벗어났습니다.\n\n`
                        : `\n`) +
                    `동영상: 업로드되지 않음 (기준 범위: ${emtVersion === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초'}, ${videoMin}-${videoMax}초)\n\n` +
                    `관리자 모드에서는 동영상 없이도 진행할 수 있습니다.\n` +
                    `==========================`;

                alert(adminResultMessage);
                setUploadingEmt(false);
                setAnalyzingEmt(false);
                setEmtUploadFiles([]);
                return;
            }

            console.log('Sending to /api/emt-upload:', {
                videoPath: videoStoragePath,
                imageCount: imageFiles.length,
                version: emtVersion,
                isAdmin: isUserAdmin
            });

            const response = await fetch('/api/emt-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoPath: videoStoragePath,      // Firebase Storage path: "Simulator_training/EMT/EMT_result/position-name-EMT-timestamp.ext"
                    imageCount: imageFiles.length,    // 이미지 개수만 전달 (Storage 경로 대신)
                    userEmail: user.email || '',
                    position: userProfile.position,
                    name: userProfile.name,
                    hospital: userProfile.hospital,
                    isAdmin: isUserAdmin,             // 관리자 여부 전달
                    version: emtVersion,              // EMT 버전 전달
                    ...(emtVersion === 'EMT-L' && { endoscopeModel: emtEndoscopeModel }), // EMT-L 시 내시경 모델(ROI)
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    const text = await response.text();
                    errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
                } catch (parseError) {
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                }

                const errorMessage = errorData.error || '업로드에 실패했습니다.';
                const errorDetails = errorData.details ? `\n\n상세 정보: ${errorData.details.substring(0, 1000)}` : '';
                console.error('Upload failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                throw new Error(errorMessage + errorDetails);
            }

            const jobResponse = await response.json();
            const jobId = jobResponse.jobId;

            if (!jobId) {
                throw new Error('Job ID를 받지 못했습니다.');
            }

            console.log('Job created:', jobId);
            // analyzingEmt를 먼저 true로 설정하여 스피너가 사라지지 않도록 함
            // React의 상태 업데이트는 배치되므로 동시에 설정해도 안전함
            setAnalyzingEmt(true);
            setEmtProgress(35);
            setEmtProgressMessage('분석 작업 생성 완료, 분석 진행 중...');
            // uploadingEmt는 나중에 false로 설정 (analyzingEmt가 이미 true이므로 스피너는 계속 표시됨)
            setTimeout(() => {
                setUploadingEmt(false);
            }, 0);

            // Step 3: Poll job status
            const pollJobStatus = async (): Promise<void> => {
                const maxAttempts = 600; // 10 minutes max (1 second intervals)
                let attempts = 0;
                let lastProgress = 35;

                const poll = async (): Promise<void> => {
                    attempts++;

                    try {
                        const statusResponse = await fetch(`/api/emt-job-status?jobId=${encodeURIComponent(jobId)}`);

                        if (!statusResponse.ok) {
                            let msg = `상태 확인 실패: HTTP ${statusResponse.status}`;
                            try {
                                const errBody = await statusResponse.json();
                                if (errBody?.error && statusResponse.status === 404) {
                                    msg = '분석 작업을 찾을 수 없습니다. (작업이 만료되었거나 서버가 재시작되었을 수 있습니다. 새로고침 후 다시 시도해 주세요.)';
                                }
                            } catch (_) { /* ignore */ }
                            throw new Error(msg);
                        }

                        const statusData = await statusResponse.json();
                        console.log(`Job status (attempt ${attempts}):`, statusData.status, statusData.progress);

                        // 진행률 업데이트
                        if (statusData.progress !== undefined) {
                            const progress = Math.min(95, Math.max(35, statusData.progress));
                            setEmtProgress(progress);
                            lastProgress = progress;

                            // 서버에서 받은 메시지가 있으면 사용, 없으면 기본 메시지
                            if (statusData.progressMessage) {
                                setEmtProgressMessage(`${statusData.progressMessage} ${progress}%`);
                            } else {
                                // 진행률에 따른 기본 메시지
                                if (progress < 50) {
                                    setEmtProgressMessage(`동영상 분석 중... ${progress}%`);
                                } else if (progress < 80) {
                                    setEmtProgressMessage(`데이터 처리 중... ${progress}%`);
                                } else {
                                    setEmtProgressMessage(`결과 생성 중... ${progress}%`);
                                }
                            }
                        } else if (statusData.status === 'processing') {
                            // 진행률이 없으면 시간 기반으로 추정
                            const estimatedProgress = Math.min(90, 35 + (attempts * 0.1));
                            if (estimatedProgress > lastProgress) {
                                setEmtProgress(estimatedProgress);
                                setEmtProgressMessage(`분석 진행 중... ${Math.floor(estimatedProgress)}%`);
                            }
                        }

                        if (statusData.status === 'completed') {
                            // 작업 완료 로그가 나올 때까지 스피너는 계속 표시
                            console.log('[Client] Job completed, processing result...');
                            console.log('[Client] Full statusData:', JSON.stringify(statusData, null, 2));
                            setEmtProgress(100);
                            setEmtProgressMessage('분석 완료!');
                            const result = statusData.result;

                            if (!result) {
                                // 에러 메시지 표시 후 스피너 숨기기
                                alert('분석 결과를 받지 못했습니다.');
                                setAnalyzingEmt(false);
                                throw new Error('분석 결과를 받지 못했습니다.');
                            }

                            // 결과 데이터 로깅
                            console.log('[Client] Analysis result:', {
                                analysisPassed: result.analysisPassed,
                                visualizationUrls: result.visualizationUrls,
                                visualizationUrlsLength: result.visualizationUrls?.length || 0
                            });

                            // 관리자인 경우 특별 처리
                            if (isUserAdmin) {
                                // 버전별 기준 정보
                                const imageMin = emtVersion === 'EMT-L' ? 42 : 62;
                                const imageMax = emtVersion === 'EMT-L' ? 48 : 66;
                                const videoMin = emtVersion === 'EMT-L' ? 190 : 300; // 3분10초 vs 5분
                                const videoMax = emtVersion === 'EMT-L' ? 210 : 330; // 3분30초 vs 5분30초
                                const videoRangeText = emtVersion === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초';

                                // 관리자는 결과 창에 모든 정보 표시
                                let adminResultMessage = `=== ${emtVersion} 분석 결과 (관리자 모드) ===\n\n`;

                                // 사진 개수 정보
                                adminResultMessage += `사진 개수: ${imageFiles.length}개 (기준 범위: ${imageMin}-${imageMax}개)\n`;
                                if (imageFiles.length < imageMin || imageFiles.length > imageMax) {
                                    adminResultMessage += `⚠️ 사진 개수가 기준(${imageMin}-${imageMax}개)을 벗어났습니다.\n`;
                                }
                                adminResultMessage += '\n';

                                // 동영상 길이 정보
                                if (result.videoDuration !== undefined) {
                                    const minutes = Math.floor(result.videoDuration / 60);
                                    const seconds = Math.floor(result.videoDuration % 60);
                                    adminResultMessage += `동영상 길이: ${minutes}분 ${seconds}초 (기준 범위: ${videoRangeText}, ${videoMin}-${videoMax}초)\n`;
                                    if (result.videoDuration < videoMin || result.videoDuration > videoMax) {
                                        adminResultMessage += `⚠️ 동영상 길이가 기준(${videoRangeText})을 벗어났습니다.\n`;
                                    }
                                    adminResultMessage += '\n';
                                }

                                // 마커 인식 프레임 정보
                                if (result.detectedFrames !== undefined && result.totalFrames !== undefined) {
                                    const detectionRate = ((result.detectedFrames / result.totalFrames) * 100).toFixed(1);
                                    adminResultMessage += `마커 인식: ${result.detectedFrames}/${result.totalFrames} 프레임 (${detectionRate}%)\n`;
                                    adminResultMessage += '\n';
                                }

                                // 분석 결과
                                adminResultMessage += `분석 결과: ${result.analysisPassed ? '합격' : '불합격'}\n`;
                                if (result.analysisScore !== undefined) {
                                    adminResultMessage += `판단 점수: ${result.analysisScore.toFixed(4)}\n`;
                                }
                                if (result.meanG !== undefined) {
                                    adminResultMessage += `Mean G: ${result.meanG.toFixed(4)}\n`;
                                }
                                if (result.stdG !== undefined) {
                                    adminResultMessage += `Std G: ${result.stdG.toFixed(4)}\n`;
                                }
                                if (result.analysisMessage) {
                                    adminResultMessage += `\n메시지: ${result.analysisMessage}\n`;
                                }
                                if (result.reportUrl) {
                                    adminResultMessage += `\n평가서 링크: ${result.reportUrl}\n`;
                                }

                                adminResultMessage += '\n==========================';

                                // 시각화 이미지 확인 및 로그
                                console.log('=== EMT 분석 결과 (관리자) ===');
                                console.log('visualizationUrls:', result.visualizationUrls);
                                console.log('visualizationUrls length:', result.visualizationUrls?.length || 0);

                                // 시각화 이미지가 있으면 메시지에 추가
                                if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                    adminResultMessage += `\n시각화 이미지: ${result.visualizationUrls.length}개 생성됨\n`;
                                    adminResultMessage += `(결과 창 닫은 후 자동으로 표시됩니다)\n`;
                                }

                                alert(adminResultMessage);

                                // 시각화 이미지가 있으면 표시 (alert 이후 약간의 지연)
                                if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                    console.log('시각화 이미지 표시:', result.visualizationUrls.length, '개');
                                    setTimeout(() => {
                                        setEmtVisualizationUrls(result.visualizationUrls);
                                        setEmtVisualizationIndex(0);
                                        setShowEmtVisualization(true);
                                    }, 500); // alert가 닫힌 후 표시
                                } else {
                                    console.log('시각화 이미지가 없습니다.');
                                }

                                // 관리자는 이메일 전송 건너뛰고 종료
                                setAnalyzingEmt(false);
                                setEmtUploadFiles([]);
                                return;
                            }

                            // 일반 사용자 처리
                            // Check if analysis passed
                            if (result.analysisPassed) {
                                // 디버깅: 콘솔에 값 출력
                                console.log(`=== ${emtVersion} 분석 성공 결과 ===`);
                                console.log('result:', result);
                                console.log('result.instructors:', result.instructors);
                                console.log('userProfile:', userProfile);
                                console.log('===========================');

                                if (!userProfile) {
                                    console.error('userProfile is missing');
                                    alert('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                                } else {
                                    // 버전별 기준 정보
                                    const imageMin = emtVersion === 'EMT-L' ? 42 : 62;
                                    const imageMax = emtVersion === 'EMT-L' ? 48 : 66;
                                    const videoMin = emtVersion === 'EMT-L' ? 190 : 300;
                                    const videoMax = emtVersion === 'EMT-L' ? 210 : 330;
                                    const videoRangeText = emtVersion === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초';

                                    // 모든 교육자 정보 확인
                                    const instructors = result.instructors || [];
                                    if (instructors.length === 0) {
                                        console.error('Instructors not found:', {
                                            hospital: userProfile.hospital,
                                            result: result
                                        });
                                        alert(`교육자 이메일을 찾을 수 없습니다.\n병원: ${userProfile.hospital}\n관리자에게 문의해주세요.`);
                                    } else {
                                        // 합격 결과 먼저 표시
                                        let successMessage = `동영상 분석이 완료되었고 합격되었습니다!\n\n`;

                                        // 사진 개수 정보 추가
                                        successMessage += `사진 개수: ${imageFiles.length}개 (기준 범위: ${imageMin}-${imageMax}개)\n`;

                                        // 동영상 길이 정보 추가
                                        if (result.videoDuration !== undefined) {
                                            const minutes = Math.floor(result.videoDuration / 60);
                                            const seconds = Math.floor(result.videoDuration % 60);
                                            successMessage += `동영상 길이: ${minutes}분 ${seconds}초 (기준 범위: ${videoRangeText}, ${videoMin}-${videoMax}초)\n`;
                                        }
                                        successMessage += '\n';

                                        // 마커 인식 프레임 정보 추가
                                        if (result.detectedFrames !== undefined && result.totalFrames !== undefined) {
                                            const detectionRate = ((result.detectedFrames / result.totalFrames) * 100).toFixed(1);
                                            successMessage += `마커 인식: ${result.detectedFrames}/${result.totalFrames} 프레임 (${detectionRate}%)\n\n`;
                                        }

                                        // 분석 결과 정보 추가
                                        if (result.analysisScore !== undefined) {
                                            successMessage += `판단 점수: ${result.analysisScore.toFixed(4)}\n`;
                                        }
                                        if (result.meanG !== undefined) {
                                            successMessage += `Mean G: ${result.meanG.toFixed(4)}\n`;
                                        }
                                        if (result.stdG !== undefined) {
                                            successMessage += `Std G: ${result.stdG.toFixed(4)}\n`;
                                        }

                                        successMessage += '\n';

                                        // 시각화 이미지 확인 및 로그
                                        console.log(`=== ${emtVersion} 분석 결과 (일반 사용자 - 합격) ===`);
                                        console.log('visualizationUrls:', result.visualizationUrls);
                                        console.log('visualizationUrls length:', result.visualizationUrls?.length || 0);

                                        // 시각화 이미지가 있으면 메시지에 추가
                                        if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                            successMessage += `\n시각화 이미지: ${result.visualizationUrls.length}개 생성됨\n`;
                                            successMessage += `(결과 창 닫은 후 자동으로 표시됩니다)\n`;
                                        }

                                        // ghlee409@amc.seoul.kr 합격 시 관리자 이메일 미발송 안내
                                        if (result.adminReportEmailSent === false) {
                                            successMessage += `\n※ 관리자(ghlee409@amc.seoul.kr)에게 합격 리포트 이메일이 발송되지 않았습니다.\n서버 환경 변수(GMAIL_USER, GMAIL_APP_PASSWORD)를 확인해 주세요.\n`;
                                        }

                                        alert(successMessage);

                                        // 시각화 이미지가 있으면 표시 (alert 이후 약간의 지연)
                                        if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                            console.log('시각화 이미지 표시:', result.visualizationUrls.length, '개');
                                            setTimeout(() => {
                                                setEmtVisualizationUrls(result.visualizationUrls);
                                                setEmtVisualizationIndex(0);
                                                setShowEmtVisualization(true);
                                            }, 500); // alert가 닫힌 후 표시
                                        } else {
                                            console.log('시각화 이미지가 없습니다.');
                                        }

                                        // jhlee409@gmail.com인 경우 메일 전송 대신 리포트만 새 창에 표시
                                        const isSpecialUser = user?.email === 'jhlee409@gmail.com';

                                        if (isSpecialUser) {
                                            // 리포트 내용을 새 창에 표시
                                            if (result.reportUrl) {
                                                const reportWindow = window.open('', '_blank');
                                                if (reportWindow) {
                                                    reportWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>${emtVersion} 평가서</title>
                                                                <meta charset="utf-8">
                                                                <style>
                                                                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                                                    pre { white-space: pre-wrap; word-wrap: break-word; }
                                                                    a { color: #0066cc; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <h1>${emtVersion} 평가서</h1>
                                                                <p><a href="${result.reportUrl}" target="_blank">평가서 다운로드 링크</a></p>
                                                                <p>평가서 링크: <a href="${result.reportUrl}" target="_blank">${result.reportUrl}</a></p>
                                                            </body>
                                                        </html>
                                                    `);
                                                    reportWindow.document.close();
                                                }
                                            }
                                            setAnalyzingEmt(false);
                                            setEmtUploadFiles([]);
                                            return;
                                        }

                                        const subject = `[${emtVersion}] ${userProfile.name}님의 수행 동영상 및 이미지 제출`;
                                        const senderInfo = `${userProfile.position} ${userProfile.name} (${user?.email || ''})`;
                                        const instructorNames = instructors.map((i: InstructorInfo) => i.name).join(', ');
                                        const instructorEmails = instructors.map((i: InstructorInfo) => i.email);

                                        let body = `안녕하세요,\n\n` +
                                            `${userProfile.position} ${userProfile.name}님이 EGD Method Training (${emtVersion}) 수행 동영상 및 이미지 분석 결과를 제출했습니다.\n\n` +
                                            `제출 정보:\n` +
                                            `- 발신자: ${senderInfo}\n` +
                                            `- 병원: ${userProfile.hospital}\n` +
                                            `- 제출 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;

                                        if (result.reportUrl) {
                                            body += `평가서 다운로드 링크:\n${result.reportUrl}\n\n` +
                                                `위 링크를 클릭하여 평가서를 확인하실 수 있습니다.\n\n`;
                                        }

                                        body += `감사합니다.`;

                                        // 이메일 내용을 보여주고 확인 받기
                                        const emailPreview = `이메일을 보내시겠습니까?\n\n` +
                                            `=== 이메일 내용 미리보기 ===\n\n` +
                                            `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                                            `교육자 수: ${instructors.length}명\n` +
                                            `제목: ${subject}\n\n` +
                                            `내용:\n${body}\n\n` +
                                            `==========================\n\n` +
                                            `위 내용으로 교육자 ${instructors.length}명에게 이메일을 보내시겠습니까?`;

                                        const userConfirmed = confirm(emailPreview);

                                        if (userConfirmed) {
                                            // 서버에서 이메일 전송
                                            try {
                                                const response = await fetch('/api/emt-send-email', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        instructors: instructors,
                                                        subject: subject,
                                                        body: body
                                                    }),
                                                });

                                                const data = await response.json();

                                                if (response.ok && data.success) {
                                                    alert(`이메일이 성공적으로 전송되었습니다!\n\n` +
                                                        `${data.sentCount}명의 교육자에게 전송되었습니다.\n\n` +
                                                        `수신자: ${instructorEmails.join(', ')}`);
                                                } else {
                                                    alert(`이메일 전송에 실패했습니다.\n\n` +
                                                        `오류: ${data.error || '알 수 없는 오류'}\n\n` +
                                                        `수동으로 이메일을 보내주세요:\n\n` +
                                                        `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                                                        `제목: ${subject}\n\n` +
                                                        `내용:\n${body}`);
                                                }
                                            } catch (error: any) {
                                                console.error('Error sending email:', error);
                                                alert(`이메일 전송 중 오류가 발생했습니다.\n\n` +
                                                    `오류: ${error.message || '알 수 없는 오류'}\n\n` +
                                                    `수동으로 이메일을 보내주세요:\n\n` +
                                                    `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                                                    `제목: ${subject}\n\n` +
                                                    `내용:\n${body}`);
                                            }
                                        } else {
                                            alert('이메일 전송이 취소되었습니다.\n\n나중에 아래 정보로 직접 이메일을 보내주세요:\n\n' +
                                                `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                                                `제목: ${subject}\n\n` +
                                                `평가서 링크: ${result.reportUrl || '없음'}`);
                                        }
                                    }
                                }
                            } else {
                                // Show detailed failure reason
                                const failureDetails = result.analysisMessage || '다시 시도해주세요.';

                                // 버전별 기준 정보 (표시 안내와 동일: EMT-L 3분10초-3분30초 = 190-210초)
                                const imageMin = emtVersion === 'EMT-L' ? 42 : 62;
                                const imageMax = emtVersion === 'EMT-L' ? 48 : 66;
                                const videoMin = emtVersion === 'EMT-L' ? 190 : 300;
                                const videoMax = emtVersion === 'EMT-L' ? 210 : 330;
                                const videoRangeText = emtVersion === 'EMT-L' ? '3분10초-3분30초' : '5분-5분30초';

                                let detailedMessage = `동영상 분석 결과: 불합격\n\n`;

                                // 사진 개수 정보 추가
                                detailedMessage += `사진 개수: ${imageFiles.length}개 (기준 범위: ${imageMin}-${imageMax}개)\n`;

                                // 동영상 길이 정보 추가
                                if (result.videoDuration !== undefined) {
                                    const minutes = Math.floor(result.videoDuration / 60);
                                    const seconds = Math.floor(result.videoDuration % 60);
                                    detailedMessage += `동영상 길이: ${minutes}분 ${seconds}초 (기준 범위: ${videoRangeText}, ${videoMin}-${videoMax}초)\n`;
                                }
                                detailedMessage += '\n';

                                // 마커 인식 프레임 정보 추가
                                if (result.detectedFrames !== undefined && result.totalFrames !== undefined) {
                                    const detectionRate = ((result.detectedFrames / result.totalFrames) * 100).toFixed(1);
                                    detailedMessage += `마커 인식: ${result.detectedFrames}/${result.totalFrames} 프레임 (${detectionRate}%)\n\n`;
                                }

                                detailedMessage += failureDetails;

                                // EMT-L 불합격 시 재시도 안내 추가
                                if (emtVersion === 'EMT-L') {
                                    detailedMessage += `\n\n불합격된 동영상은 Firebase에 업로드되지 않았습니다.\n다시 시도해주세요.`;
                                }

                                // 시각화 이미지 확인 및 로그
                                console.log(`=== ${emtVersion} 분석 결과 (일반 사용자 - 불합격) ===`);
                                console.log('visualizationUrls:', result.visualizationUrls);
                                console.log('visualizationUrls length:', result.visualizationUrls?.length || 0);

                                // 시각화 이미지가 있으면 메시지에 추가
                                if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                    detailedMessage += `\n\n시각화 이미지: ${result.visualizationUrls.length}개 생성됨\n`;
                                    detailedMessage += `(결과 창 닫은 후 자동으로 표시됩니다)\n`;
                                }

                                alert(detailedMessage);

                                // 시각화 이미지가 있으면 표시 (alert 이후 약간의 지연)
                                if (result.visualizationUrls && result.visualizationUrls.length > 0) {
                                    console.log('시각화 이미지 표시:', result.visualizationUrls.length, '개');
                                    setTimeout(() => {
                                        setEmtVisualizationUrls(result.visualizationUrls);
                                        setEmtVisualizationIndex(0);
                                        setShowEmtVisualization(true);
                                    }, 500); // alert가 닫힌 후 표시
                                } else {
                                    console.log('시각화 이미지가 없습니다.');
                                }
                            }

                            // 모든 메시지 표시 후 스피너 숨기기
                            setAnalyzingEmt(false);
                            setEmtUploadFiles([]);
                            return;
                        } else if (statusData.status === 'failed') {
                            let errorMessage = statusData.error || '분석 중 오류가 발생했습니다.';
                            if (emtVersion === 'EMT-L' && (String(errorMessage).includes('404') || String(errorMessage).toLowerCase().includes('not found'))) {
                                errorMessage = 'EMT-L 분석 서버에 연결할 수 없습니다. (EMT-L API가 아직 배포되지 않았을 수 있습니다. Python 서버 배포 후 다시 시도해 주세요.)';
                            }
                            setAnalyzingEmt(false);
                            setEmtProgress(0);
                            setEmtProgressMessage('');
                            throw new Error(errorMessage);
                        } else if (statusData.status === 'pending' || statusData.status === 'processing') {
                            // Continue polling
                            if (attempts >= maxAttempts) {
                                const timeoutError = new Error('분석 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.');
                                // 에러 메시지 표시 후 스피너 숨기기
                                setAnalyzingEmt(false);
                                setEmtProgress(0);
                                setEmtProgressMessage('');
                                throw timeoutError;
                            }
                            setTimeout(poll, 1000); // Poll every 1 second
                        } else {
                            // Unknown status
                            if (attempts >= maxAttempts) {
                                const unknownError = new Error('분석 상태를 확인할 수 없습니다.');
                                // 에러 메시지 표시 후 스피너 숨기기
                                setAnalyzingEmt(false);
                                setEmtProgress(0);
                                setEmtProgressMessage('');
                                throw unknownError;
                            }
                            setTimeout(poll, 1000);
                        }
                    } catch (error: any) {
                        // catch 블록에서는 스피너를 숨기지 않음 - alert 표시 후 finally에서 처리
                        throw error;
                    }
                };

                await poll();
            };

            await pollJobStatus();
        } catch (error: any) {
            console.error('Upload error:', error);
            console.error('Error type:', typeof error);
            console.error('Error object:', error);

            // Extract error message from various possible formats
            let errorMessage = '업로드에 실패했습니다.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (error?.error) {
                errorMessage = error.error;
            } else if (typeof error === 'object') {
                errorMessage = JSON.stringify(error);
            }

            // Show detailed error message (스피너는 alert 표시 후 숨김)
            alert(`업로드 오류:\n\n${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`);
            // 에러 메시지 표시 후 스피너 숨기기
            setUploadingEmt(false);
            setAnalyzingEmt(false);
            setEmtProgress(0);
            setEmtProgressMessage('');
        }
    };

    // SHT Video Upload Hook
    const shtUploadHook = useVideoUpload({
        videoType: 'SHT',
        user,
        userProfile,
        maxFileSize: 200 * 1024 * 1024, // 200MB
        apiEndpoint: '/api/sht-video-upload',
        onSuccess: async (result) => {
            // 디버깅: 콘솔에 값 출력
            console.log('=== SHT 업로드 성공 결과 ===');
            console.log('result:', result);
            console.log('result.instructors:', result.instructors);
            console.log('userProfile:', userProfile);
            console.log('===========================');

            if (!userProfile) {
                console.error('userProfile is missing');
                alert('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // 모든 교육자 정보 확인
            const instructors = result.instructors || [];
            if (instructors.length === 0) {
                console.error('Instructors not found:', {
                    hospital: userProfile.hospital,
                    result: result
                });
                alert(`교육자 이메일을 찾을 수 없습니다.\n병원: ${userProfile.hospital}\n관리자에게 문의해주세요.`);
                return;
            }

            const subject = `[SHT] ${userProfile.name}님의 수행 동영상 제출`;
            const senderInfo = `${userProfile.position} ${userProfile.name} (${user?.email || ''})`;
            const instructorNames = instructors.map((i: InstructorInfo) => i.name).join(', ');
            const instructorEmails = instructors.map((i: InstructorInfo) => i.email);

            let body = `안녕하세요,\n\n` +
                `${userProfile.position} ${userProfile.name}님이 Speech-Hearing Training (SHT) 수행 동영상을 제출했습니다.\n\n` +
                `제출 정보:\n` +
                `- 발신자: ${senderInfo}\n` +
                `- 병원: ${userProfile.hospital}\n` +
                `- 제출 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;

            if (result.videoUrl) {
                body += `동영상 링크:\n${result.videoUrl}\n\n` +
                    `위 링크를 클릭하여 동영상을 확인하실 수 있습니다.\n\n`;
            }

            body += `감사합니다.`;

            // 이메일 내용을 보여주고 확인 받기
            const emailPreview = `동영상이 성공적으로 업로드되었습니다!\n\n` +
                `=== 이메일 내용 미리보기 ===\n\n` +
                `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                `교육자 수: ${instructors.length}명\n` +
                `제목: ${subject}\n\n` +
                `내용:\n${body}\n\n` +
                `==========================\n\n` +
                `위 내용으로 교육자 ${instructors.length}명에게 이메일을 보내시겠습니까?`;

            const userConfirmed = confirm(emailPreview);

            if (userConfirmed) {
                // 서버에서 이메일 전송
                try {
                    const response = await fetch('/api/sht-send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            instructors: instructors,
                            subject: subject,
                            body: body
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        alert(`이메일이 성공적으로 전송되었습니다!\n\n` +
                            `${data.sentCount}명의 교육자에게 전송되었습니다.\n\n` +
                            `수신자: ${instructorEmails.join(', ')}`);
                    } else {
                        alert(`이메일 전송에 실패했습니다.\n\n` +
                            `오류: ${data.error || '알 수 없는 오류'}\n\n` +
                            `수동으로 이메일을 보내주세요:\n\n` +
                            `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                            `제목: ${subject}\n\n` +
                            `내용:\n${body}`);
                    }
                } catch (error: any) {
                    console.error('Error sending email:', error);
                    alert(`이메일 전송 중 오류가 발생했습니다.\n\n` +
                        `오류: ${error.message || '알 수 없는 오류'}\n\n` +
                        `수동으로 이메일을 보내주세요:\n\n` +
                        `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                        `제목: ${subject}\n\n` +
                        `내용:\n${body}`);
                }
            } else {
                alert('이메일 전송이 취소되었습니다.\n\n나중에 아래 정보로 직접 이메일을 보내주세요:\n\n' +
                    `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                    `제목: ${subject}\n\n` +
                    `동영상 링크: ${result.videoUrl || '없음'}`);
            }

            setShtUploadFile(null);
        },
        onError: (error) => {
            alert(error.message || '업로드에 실패했습니다.');
        },
    });

    // Sync uploading state
    useEffect(() => {
        setUploadingSht(shtUploadHook.uploading);
    }, [shtUploadHook.uploading]);

    // Handle SHT video upload
    const handleShtVideoUpload = async (file: File) => {
        // Hide video players
        setShowShtOrientation(false);
        setShtOrientationVideoUrl(null);
        setShowShtExpertDemo(false);
        setShtExpertDemoVideoUrl(null);

        try {
            await shtUploadHook.uploadVideo(file);
        } catch (error) {
            // Error is already handled by onError callback
        }
    };

    // LHT Video Upload Hook
    const lhtUploadHook = useVideoUpload({
        videoType: 'LHT',
        user,
        userProfile,
        maxFileSize: 200 * 1024 * 1024, // 200MB
        apiEndpoint: '/api/lht-video-upload',
        onSuccess: async (result) => {
            // 디버깅: 콘솔에 값 출력
            console.log('=== LHT 업로드 성공 결과 ===');
            console.log('result:', result);
            console.log('result.instructors:', result.instructors);
            console.log('userProfile:', userProfile);
            console.log('===========================');

            if (!userProfile) {
                console.error('userProfile is missing');
                alert('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // 모든 교육자 정보 확인
            const instructors = result.instructors || [];
            if (instructors.length === 0) {
                console.error('Instructors not found:', {
                    hospital: userProfile.hospital,
                    result: result
                });
                alert(`교육자 이메일을 찾을 수 없습니다.\n병원: ${userProfile.hospital}\n관리자에게 문의해주세요.`);
                return;
            }

            const subject = `[LHT] ${userProfile.name}님의 수행 동영상 제출`;
            const senderInfo = `${userProfile.position} ${userProfile.name} (${user?.email || ''})`;
            const instructorNames = instructors.map((i: InstructorInfo) => i.name).join(', ');
            const instructorEmails = instructors.map((i: InstructorInfo) => i.email);

            let body = `안녕하세요,\n\n` +
                `${userProfile.position} ${userProfile.name}님이 Left Hand Trainer (LHT) 수행 동영상을 제출했습니다.\n\n` +
                `제출 정보:\n` +
                `- 발신자: ${senderInfo}\n` +
                `- 병원: ${userProfile.hospital}\n` +
                `- 제출 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;

            if (result.videoUrl) {
                body += `동영상 링크:\n${result.videoUrl}\n\n` +
                    `위 링크를 클릭하여 동영상을 확인하실 수 있습니다.\n\n`;
            }

            body += `감사합니다.`;

            // 이메일 내용을 보여주고 확인 받기
            const emailPreview = `동영상이 성공적으로 업로드되었습니다!\n\n` +
                `=== 이메일 내용 미리보기 ===\n\n` +
                `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                `교육자 수: ${instructors.length}명\n` +
                `제목: ${subject}\n\n` +
                `내용:\n${body}\n\n` +
                `==========================\n\n` +
                `위 내용으로 교육자 ${instructors.length}명에게 이메일을 보내시겠습니까?`;

            const userConfirmed = confirm(emailPreview);

            if (userConfirmed) {
                // 서버에서 이메일 전송
                try {
                    const response = await fetch('/api/lht-send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            instructors: instructors,
                            subject: subject,
                            body: body
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        alert(`이메일이 성공적으로 전송되었습니다!\n\n` +
                            `${data.sentCount}명의 교육자에게 전송되었습니다.\n\n` +
                            `수신자: ${instructorEmails.join(', ')}`);
                    } else {
                        alert(`이메일 전송에 실패했습니다.\n\n` +
                            `오류: ${data.error || '알 수 없는 오류'}\n\n` +
                            `수동으로 이메일을 보내주세요:\n\n` +
                            `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                            `제목: ${subject}\n\n` +
                            `내용:\n${body}`);
                    }
                } catch (error: any) {
                    console.error('Error sending email:', error);
                    alert(`이메일 전송 중 오류가 발생했습니다.\n\n` +
                        `오류: ${error.message || '알 수 없는 오류'}\n\n` +
                        `수동으로 이메일을 보내주세요:\n\n` +
                        `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                        `제목: ${subject}\n\n` +
                        `내용:\n${body}`);
                }
            } else {
                alert('이메일 전송이 취소되었습니다.\n\n나중에 아래 정보로 직접 이메일을 보내주세요:\n\n' +
                    `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                    `제목: ${subject}\n\n` +
                    `동영상 링크: ${result.videoUrl || '없음'}`);
            }

            setLhtUploadFile(null);
        },
        onError: (error) => {
            alert(error.message || '업로드에 실패했습니다.');
        },
    });

    // Sync uploading state
    useEffect(() => {
        setUploadingLht(lhtUploadHook.uploading);
    }, [lhtUploadHook.uploading]);

    // Handle LHT video upload
    const handleLhtVideoUpload = async (file: File) => {
        // Hide video players
        setShowLhtOrientation(false);
        setLhtOrientationVideoUrl(null);
        setShowLhtExpertDemo(false);
        setLhtExpertDemoVideoUrl(null);

        try {
            await lhtUploadHook.uploadVideo(file);
        } catch (error) {
            // Error is already handled by onError callback
        }
    };

    // MT Video Upload Hook
    const mtUploadHook = useVideoUpload({
        videoType: 'MT',
        user,
        userProfile,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        apiEndpoint: '/api/mt-video-upload',
        onSuccess: async (result) => {
            // 디버깅: 콘솔에 값 출력
            console.log('=== MT 업로드 성공 결과 ===');
            console.log('result:', result);
            console.log('result.instructors:', result.instructors);
            console.log('userProfile:', userProfile);
            console.log('===========================');

            if (!userProfile) {
                console.error('userProfile is missing');
                alert('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // 모든 교육자 정보 확인
            const instructors = result.instructors || [];
            if (instructors.length === 0) {
                console.error('Instructors not found:', {
                    hospital: userProfile.hospital,
                    result: result
                });
                alert(`교육자 이메일을 찾을 수 없습니다.\n병원: ${userProfile.hospital}\n관리자에게 문의해주세요.`);
                return;
            }

            const subject = `[MT] ${userProfile.name}님의 암기 동영상 제출`;
            const senderInfo = `${userProfile.position} ${userProfile.name} (${user?.email || ''})`;
            const instructorNames = instructors.map((i: InstructorInfo) => i.name).join(', ');
            const instructorEmails = instructors.map((i: InstructorInfo) => i.email);

            let body = `안녕하세요,\n\n` +
                `${userProfile.position} ${userProfile.name}님이 Memory Training (MT) 암기 동영상을 제출했습니다.\n\n` +
                `제출 정보:\n` +
                `- 발신자: ${senderInfo}\n` +
                `- 병원: ${userProfile.hospital}\n` +
                `- 제출 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;

            if (result.videoUrl) {
                body += `동영상 링크:\n${result.videoUrl}\n\n` +
                    `위 링크를 클릭하여 동영상을 확인하실 수 있습니다.\n\n`;
            }

            body += `감사합니다.`;

            // 이메일 내용을 보여주고 확인 받기
            const emailPreview = `동영상이 성공적으로 업로드되었습니다!\n\n` +
                `=== 이메일 내용 미리보기 ===\n\n` +
                `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                `교육자 수: ${instructors.length}명\n` +
                `제목: ${subject}\n\n` +
                `내용:\n${body}\n\n` +
                `==========================\n\n` +
                `위 내용으로 교육자 ${instructors.length}명에게 이메일을 보내시겠습니까?`;

            const userConfirmed = confirm(emailPreview);

            if (userConfirmed) {
                // 서버에서 이메일 전송
                try {
                    const response = await fetch('/api/mt-send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            instructors: instructors,
                            subject: subject,
                            body: body
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        alert(`이메일이 성공적으로 전송되었습니다!\n\n` +
                            `${data.sentCount}명의 교육자에게 전송되었습니다.\n\n` +
                            `수신자: ${instructorEmails.join(', ')}`);
                    } else {
                        alert(`이메일 전송에 실패했습니다.\n\n` +
                            `오류: ${data.error || '알 수 없는 오류'}\n\n` +
                            `수동으로 이메일을 보내주세요:\n\n` +
                            `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                            `제목: ${subject}\n\n` +
                            `내용:\n${body}`);
                    }
                } catch (error: any) {
                    console.error('Error sending email:', error);
                    alert(`이메일 전송 중 오류가 발생했습니다.\n\n` +
                        `오류: ${error.message || '알 수 없는 오류'}\n\n` +
                        `수동으로 이메일을 보내주세요:\n\n` +
                        `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                        `제목: ${subject}\n\n` +
                        `내용:\n${body}`);
                }
            } else {
                alert('이메일 전송이 취소되었습니다.\n\n나중에 아래 정보로 직접 이메일을 보내주세요:\n\n' +
                    `숨은 참조(BCC): ${instructorEmails.join(', ')}\n` +
                    `제목: ${subject}\n\n` +
                    `동영상 링크: ${result.videoUrl || '없음'}`);
            }

            setUploadFile(null);
        },
        onError: (error) => {
            alert(error.message || '업로드에 실패했습니다.');
        },
    });

    // Sync uploading state
    useEffect(() => {
        setUploading(mtUploadHook.uploading);
    }, [mtUploadHook.uploading]);

    // Handle MT video upload
    const handleMtVideoUpload = async (file: File) => {
        // Hide video player
        setShowMtDemo(false);
        setMtDemoVideoUrl(null);

        try {
            await mtUploadHook.uploadVideo(file);
        } catch (error) {
            // Error is already handled by onError callback
        }
    };

    const course = courseConfig[category];

    useEffect(() => {
        // Reset selection when category changes
        setSelectedItem(null);
        setVideoUrl(null);
        setVideoError(null);
        setShowVideo(false);
        setShowMtDemo(false);
        setMtDemoVideoUrl(null);
        setMtDemoError(null);
        setShowShtOrientation(false);
        setShtOrientationVideoUrl(null);
        setShtOrientationError(null);
        setShowShtExpertDemo(false);
        setShtExpertDemoVideoUrl(null);
        setShtExpertDemoError(null);
        setShowEmtOrientation(false);
        setEmtOrientationVideoUrl(null);
        setEmtOrientationError(null);
        setShowEmtExemplary(false);
        setEmtExemplaryVideoUrl(null);
        setEmtExemplaryError(null);
        setShowDxEgdLecture(false);
        setDxEgdLectureVideoUrl(null);
        setSelectedLecture(null);
        setShowOtherLecture(false);
        setOtherLectureVideoUrl(null);
        setShowEgdVariation(false);
        setEgdVariationVideoUrl(null);
        setSelectedEgdVariationCode(null);
        setShowHemoclip(false);
        setHemoclipVideoUrl(null);
        setHemoclipLogCreated(false);
        setShowInjection(false);
        setInjectionVideoUrl(null);
        setInjectionLogCreated(false);
        setShowApc(false);
        setApcVideoUrl(null);
        setApcLogCreated(false);
        setShowNexpowder(false);
        setNexpowderVideoUrl(null);
        setNexpowderLogCreated(false);
        setShowEvl(false);
        setEvlVideoUrl(null);
        setEvlLogCreated(false);
        setShowPeg(false);
        setPegVideoUrl(null);
        setPegLogCreated(false);
        setShowNvugibOverview(false);
        setNvugibOverviewVideoUrl(null);
        setNvugibOverviewLogCreated(false);
        setShowNvugibCase(false);
        setNvugibCaseVideoUrl(null);
        setSelectedNvugibCase(null);
        setShowDiagnosticEus(false);
        setDiagnosticEusVideoUrl(null);
        setSelectedDiagnosticEus(null);
        setShowEgdDxImage(false);
        setEgdDxImageUrl(null);
        setSelectedEgdDxImage(null);
        setEgdDxImageError(null);
        setEgdDxInstruction1('');
        setEgdDxInstruction2('');
        setEgdDxInstruction1Error(null);
        setEgdDxInstruction2Error(null);
        setShowEgdDxInstruction2(false);
        setShowEgdDxImageF2(false);
        setEgdDxImageUrlF2(null);
        setSelectedEgdDxImageF2(null);
        setEgdDxImageErrorF2(null);
        setEgdDxInstruction1F2('');
        setEgdDxInstruction2F2('');
        setEgdDxInstruction1ErrorF2(null);
        setEgdDxInstruction2ErrorF2(null);
        setShowEgdDxInstruction2F2(false);
    }, [category]);

    // Read selectedItem from URL query parameter
    useEffect(() => {
        const itemFromUrl = searchParams.get('selectedItem');
        if (itemFromUrl) {
            setSelectedItem(itemFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        // Reset video when selected item changes to a different item
        if (selectedItem && selectedItem !== 'sim-orientation') {
            setShowVideo(false);
            setVideoUrl(null);
            setVideoError(null);
            setLogCreated(false);
        }
        // Reset MT demo video when selected item changes
        if (selectedItem !== 'memory-training') {
            setShowMtDemo(false);
            setMtDemoVideoUrl(null);
            setMtDemoError(null);
        }
        // Reset SHT videos when selected item changes
        if (selectedItem !== 'scope-handling') {
            setShowShtOrientation(false);
            setShtOrientationVideoUrl(null);
            setShtOrientationError(null);
            setShowShtExpertDemo(false);
            setShtExpertDemoVideoUrl(null);
            setShtExpertDemoError(null);
        }
        // Reset EMT videos when selected item changes
        if (selectedItem !== 'egd-method') {
            setShowEmtOrientation(false);
            setEmtOrientationVideoUrl(null);
            setEmtOrientationError(null);
            setShowEmtExemplary(false);
            setEmtExemplaryVideoUrl(null);
            setEmtExemplaryError(null);
        }
        // Reset all videos when going back to default view
        if (selectedItem === null) {
            setShowVideo(false);
            setVideoUrl(null);
            setShowMtDemo(false);
            setMtDemoVideoUrl(null);
            setShowShtOrientation(false);
            setShtOrientationVideoUrl(null);
            setShowShtExpertDemo(false);
            setShtExpertDemoVideoUrl(null);
            setShowEmtOrientation(false);
            setEmtOrientationVideoUrl(null);
            setShowEmtExemplary(false);
            setEmtExemplaryVideoUrl(null);
        }
        // Reset all videos when going back to default view
        if (selectedItem === null) {
            setShowVideo(false);
            setVideoUrl(null);
            setShowMtDemo(false);
            setMtDemoVideoUrl(null);
            setShowShtOrientation(false);
            setShtOrientationVideoUrl(null);
            setShowShtExpertDemo(false);
            setShtExpertDemoVideoUrl(null);
            setShowEmtOrientation(false);
            setEmtOrientationVideoUrl(null);
            setShowEmtExemplary(false);
            setEmtExemplaryVideoUrl(null);
        }
    }, [selectedItem]);

    // 페이지 언마운트 시 또는 브라우저 종료/새로고침 시 시청 시간 저장
    useEffect(() => {
        let isUnmounting = false;

        // visibilitychange 이벤트: 탭이 숨겨지거나 다른 탭으로 전환할 때
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'hidden' && !isUnmounting) {
                await saveCurrentVideoWatchTime();
            }
        };

        // 커스텀 이벤트: 홈 버튼 클릭 등으로 인한 명시적 저장 요청
        const handleSaveWatchTime = async () => {
            if (!isUnmounting) {
                await saveCurrentVideoWatchTime();
            }
        };

        // beforeunload 이벤트: 브라우저를 닫거나 새로고침할 때
        // beforeunload에서는 비동기 작업을 완료할 수 없으므로, 
        // visibilitychange와 cleanup에서 처리하는 것이 더 안전함
        const handleBeforeUnload = () => {
            // beforeunload에서는 동기적으로만 처리 가능
            // 실제 저장은 visibilitychange와 cleanup에서 처리됨
        };

        // 이벤트 리스너 등록
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('saveVideoWatchTime', handleSaveWatchTime);

        // cleanup 함수 반환: 컴포넌트 언마운트 시 시청 시간 저장
        return () => {
            isUnmounting = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('saveVideoWatchTime', handleSaveWatchTime);
            // 컴포넌트 언마운트 시 시청 시간 저장
            // React의 cleanup은 동기적으로 실행되지만, 
            // fetch 요청은 브라우저가 완료할 때까지 기다릴 수 있음
            saveCurrentVideoWatchTime().catch((error) => {
                console.error('Error saving watch time on unmount:', error);
            });
        };
    }, [saveCurrentVideoWatchTime]);

    // Load EGD Dx images when egd-lesion-dx is selected
    useEffect(() => {
        const loadEgdDxImages = async () => {
            if ((category === 'advanced' || category === 'advanced-f1') && selectedItem === 'egd-lesion-dx') {
                setLoadingEgdDxImages(true);
                setEgdDxImagesError(null);
                try {
                    const response = await fetch('/api/egd-dx-images?version=F1');
                    if (!response.ok) {
                        throw new Error('이미지 목록을 불러오는 중 오류가 발생했습니다.');
                    }
                    const data = await response.json();
                    setEgdDxImages(data.fileNames || []);
                } catch (error: any) {
                    setEgdDxImagesError(error.message || '이미지 목록을 불러오는 중 오류가 발생했습니다.');
                    setEgdDxImages([]);
                } finally {
                    setLoadingEgdDxImages(false);
                }
            } else {
                setEgdDxImages([]);
                setEgdDxImagesError(null);
            }
        };

        loadEgdDxImages();
    }, [category, selectedItem]);

    // Load EGD Dx F2 images when egd-lesion-dx-f2 is selected
    useEffect(() => {
        const loadEgdDxImagesF2 = async () => {
            if (category === 'advanced' && selectedItem === 'egd-lesion-dx-f2') {
                setLoadingEgdDxImagesF2(true);
                setEgdDxImagesErrorF2(null);
                try {
                    const response = await fetch('/api/egd-dx-images?version=F2');
                    if (!response.ok) {
                        throw new Error('이미지 목록을 불러오는 중 오류가 발생했습니다.');
                    }
                    const data = await response.json();
                    setEgdDxImagesF2(data.fileNames || []);
                } catch (error: any) {
                    setEgdDxImagesErrorF2(error.message || '이미지 목록을 불러오는 중 오류가 발생했습니다.');
                    setEgdDxImagesF2([]);
                } finally {
                    setLoadingEgdDxImagesF2(false);
                }
            } else {
                setEgdDxImagesF2([]);
                setEgdDxImagesErrorF2(null);
            }
        };

        loadEgdDxImagesF2();
    }, [category, selectedItem]);


    // Load user profile when user is logged in
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.email) {
                setUserProfile(null);
                return;
            }

            try {
                const response = await fetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setUserProfile({
                            position: data.position || '',
                            name: data.name || '',
                            hospital: data.hospital || '',
                        });
                    } else {
                        console.error('Expected JSON but got:', contentType);
                        setUserProfile(null);
                    }
                } else {
                    console.error('Failed to load user profile:', response.status, response.statusText);
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                setUserProfile(null);
            }
        };

        loadUserProfile();
    }, [user]);

    // Handle play button click - 로그는 80% 시청 시 자동 생성되므로 여기서는 아무것도 하지 않음
    const handleVideoPlay = async () => {
        // 시청 시간 추적 Hook이 80% 도달 시 자동으로 로그를 생성합니다
    };

    // 공통 동영상 플레이어 props
    const getVideoPlayerProps = (videoTitle: string, videoCategory?: string) => ({
        userEmail: user?.email,
        userPosition: userProfile?.position,
        userName: userProfile?.name,
        userHospital: userProfile?.hospital,
        videoTitle: videoTitle,
        category: videoCategory || category,
    });

    // Show loading state while category is being determined
    if (!category) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    // Find selected content - handle both flat items and nested sections
    const selectedContent = selectedItem
        ? (category === 'advanced-f1' && course.sections
            ? course.sections
                .flatMap(section => section.items)
                .find(item => item.id === selectedItem)
            : course.items.find(item => item.id === selectedItem))
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="w-full px-4 py-4">
                <div className="flex gap-4 h-[calc(100vh-120px)]">
                    {/* Left Sidebar - 2/10 (20%) */}
                    <aside className="w-[20%] flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {course.name}
                            </h2>
                            <div className="mb-4"></div>
                            <nav className="space-y-1">
                                {category === 'advanced-f1' && course.sections ? (
                                    // Advanced F1: 계층 구조 (섹션 + 항목)
                                    course.sections.map((section) => (
                                        <div key={section.id} className="mb-4">
                                            <div className="text-xl font-bold text-gray-700 mb-2 ml-3">
                                                {section.title}
                                            </div>
                                            {section.items.map((item) => (
                                                <div key={item.id}>
                                                    <button
                                                        onClick={async () => {
                                                            // 현재 재생 중인 비디오의 시청 시간 저장
                                                            await saveCurrentVideoWatchTime();
                                                            // Hide all video players when selecting a new item
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);
                                                            setSelectedItem(item.id);
                                                        }}
                                                        className={`w-full text-left py-3 rounded-lg transition ${selectedItem === item.id
                                                            ? 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div className="ml-6">
                                                            {item.title}
                                                        </div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    // Basic course 및 기타: 평면 구조
                                    course.items.map((item) => (
                                        <div key={item.id}>
                                            {category === 'basic' || category === 'advanced' ? (
                                                <>
                                                    <button
                                                        onClick={async () => {
                                                            // 현재 재생 중인 비디오의 시청 시간 저장
                                                            await saveCurrentVideoWatchTime();
                                                            // Hide all video players when selecting a new item
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);

                                                            setSelectedItem(item.id);
                                                        }}
                                                        className={`w-full text-left py-3 rounded-lg transition ${selectedItem === item.id
                                                            ? 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div className="ml-3">
                                                            {item.title}
                                                        </div>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        // 현재 재생 중인 비디오의 시청 시간 저장
                                                        await saveCurrentVideoWatchTime();
                                                        // Hide all video players when selecting a new item
                                                        setShowVideo(false);
                                                        setVideoUrl(null);
                                                        setShowMtDemo(false);
                                                        setMtDemoVideoUrl(null);
                                                        setShowShtOrientation(false);
                                                        setShtOrientationVideoUrl(null);
                                                        setShowShtExpertDemo(false);
                                                        setShtExpertDemoVideoUrl(null);
                                                        setShowLhtOrientation(false);
                                                        setLhtOrientationVideoUrl(null);
                                                        setShowLhtExpertDemo(false);
                                                        setLhtExpertDemoVideoUrl(null);
                                                        setShowEmtOrientation(false);
                                                        setEmtOrientationVideoUrl(null);
                                                        setShowEmtExemplary(false);
                                                        setEmtExemplaryVideoUrl(null);
                                                        setShowDxEgdLecture(false);
                                                        setDxEgdLectureVideoUrl(null);
                                                        setSelectedLecture(null);
                                                        setShowOtherLecture(false);
                                                        setOtherLectureVideoUrl(null);
                                                        setShowEgdVariation(false);
                                                        setEgdVariationVideoUrl(null);
                                                        setSelectedEgdVariationCode(null);
                                                        setShowHemoclip(false);
                                                        setHemoclipVideoUrl(null);
                                                        setHemoclipLogCreated(false);
                                                        setSelectedItem(item.id);
                                                    }}
                                                    className={`w-full text-left py-3 rounded-lg transition ${selectedItem === item.id
                                                        ? 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="ml-3">
                                                        {item.title}
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                                {/* 초기 화면으로 이동 버튼 */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={async () => {
                                            // 현재 재생 중인 비디오의 시청 시간 저장
                                            await saveCurrentVideoWatchTime();
                                            setSelectedItem(null);
                                            setShowVideo(false);
                                            setVideoUrl(null);
                                            setShowMtDemo(false);
                                            setMtDemoVideoUrl(null);
                                            setShowShtOrientation(false);
                                            setShtOrientationVideoUrl(null);
                                            setShowShtExpertDemo(false);
                                            setShtExpertDemoVideoUrl(null);
                                            setShowLhtOrientation(false);
                                            setLhtOrientationVideoUrl(null);
                                            setShowLhtExpertDemo(false);
                                            setLhtExpertDemoVideoUrl(null);
                                            setShowEmtOrientation(false);
                                            setEmtOrientationVideoUrl(null);
                                            setShowEmtExemplary(false);
                                            setEmtExemplaryVideoUrl(null);
                                            setShowDxEgdLecture(false);
                                            setDxEgdLectureVideoUrl(null);
                                            setSelectedLecture(null);
                                            setShowEgdVariation(false);
                                            setEgdVariationVideoUrl(null);
                                            setSelectedEgdVariationCode(null);
                                            setShowHemoclip(false);
                                            setHemoclipVideoUrl(null);
                                            setHemoclipLogCreated(false);
                                            setShowInjection(false);
                                            setInjectionVideoUrl(null);
                                            setInjectionLogCreated(false);
                                            setShowApc(false);
                                            setApcVideoUrl(null);
                                            setApcLogCreated(false);
                                            setShowNexpowder(false);
                                            setNexpowderVideoUrl(null);
                                            setNexpowderLogCreated(false);
                                            setShowEvl(false);
                                            setEvlVideoUrl(null);
                                            setEvlLogCreated(false);
                                            setShowPeg(false);
                                            setPegVideoUrl(null);
                                            setPegLogCreated(false);
                                            setShowNvugibOverview(false);
                                            setNvugibOverviewVideoUrl(null);
                                            setNvugibOverviewLogCreated(false);
                                            setShowNvugibCase(false);
                                            setNvugibCaseVideoUrl(null);
                                            setSelectedNvugibCase(null);
                                            setShowDiagnosticEus(false);
                                            setDiagnosticEusVideoUrl(null);
                                            setSelectedDiagnosticEus(null);
                                        }}
                                        className={`w-full text-left py-3 rounded-lg transition ${selectedItem === null
                                            ? 'bg-gray-200 text-gray-800 font-semibold'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="ml-3">
                                            초기 화면으로
                                        </div>
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Right Content Area - 8/10 (80%) */}
                    <main className="w-[80%] flex-1 min-h-0">
                        <div className={`bg-white rounded-lg shadow-lg p-8 h-full flex flex-col ${selectedContent ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                            {selectedContent ? (
                                <div className="flex flex-col h-full">
                                    {/* Basic orientation: 동영상 플레이어가 표시될 때 전체 영역을 차지 */}
                                    {category === 'basic' && selectedItem === 'sim-orientation' ? (
                                        showVideo && videoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={videoPlayerRef}
                                                isOpen={showVideo}
                                                videoUrl={videoUrl}
                                                onPlay={handleVideoPlay}
                                                onClose={() => {
                                                    setShowVideo(false);
                                                    setVideoUrl(null);
                                                    setVideoError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowVideo(false);
                                                    setVideoUrl(null);
                                                }}
                                                {...getVideoPlayerProps(selectedContent?.title || 'SIM Orientation', 'basic')}
                                                onThresholdReached={() => {
                                                    setLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 표시되지 않을 때: 일반 콘텐츠 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                {/* Basic orientation 제목 */}
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700 leading-relaxed">
                                                        이 과정은 서울 아산병원 시뮬레이션 센터에서 제공되는 Basic course 전반에 대한 orientation 동영상입니다.
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* Basic orientation 동영상 시청 */}
                                                <div className="mb-8">
                                                    <ActionButton
                                                        onClick={async () => {
                                                            if (!checkAuth()) return;
                                                            setLoadingVideo(true);
                                                            setVideoError(null);
                                                            setLogCreated(false);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/Sim/simulation_center_orientation.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    const errorData = await response.json().catch(() => ({ error: '동영상을 불러오는 중 오류가 발생했습니다.' }));
                                                                    throw new Error(errorData.error || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setVideoUrl(data.url);
                                                                setShowVideo(true);
                                                            } catch (error: any) {
                                                                setVideoError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingVideo(false);
                                                            }
                                                        }}
                                                        disabled={loadingVideo}
                                                        loading={loadingVideo}
                                                        icon={Video}
                                                        loadingText="동영상 불러오는 중..."
                                                    >
                                                        동영상 시청
                                                    </ActionButton>
                                                    {videoError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {videoError}
                                                        </div>
                                                    )}
                                                    {loadingVideo && !videoError && (
                                                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                                                            <div className="flex items-center">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                                <p className="text-gray-600">동영상을 불러오는 중...</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ) : category === 'basic' && selectedItem === 'memory-training' ? (
                                        // Memory Training: 동영상 플레이어가 표시될 때 전체 영역을 차지
                                        showMtDemo && mtDemoVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={mtDemoPlayerRef}
                                                isOpen={showMtDemo}
                                                videoUrl={mtDemoVideoUrl}
                                                onClose={() => {
                                                    setShowMtDemo(false);
                                                    setMtDemoVideoUrl(null);
                                                    setMtDemoError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowMtDemo(false);
                                                    setMtDemoVideoUrl(null);
                                                }}
                                                {...getVideoPlayerProps('Memory Training Demo', 'basic')}
                                            />
                                        ) : (
                                            // 플레이어가 표시되지 않을 때: 일반 콘텐츠 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                {/* Memory Training 제목 */}
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* EGD 시행 동작 순서 파일 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <FileText className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">EGD 시행 동작 순서 description 파일</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <ActionButton
                                                        onClick={async () => {
                                                            // Hide video player when other button is clicked
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);

                                                            setDownloadingEgd(true);
                                                            try {
                                                                const storagePath = 'Simulator_training/MT/EGD 시행 동작 순서 Bx 포함 2024.docx';
                                                                const fileName = 'EGD 시행 동작 순서 Bx 포함 2024.docx';

                                                                // Use file-download API to stream file directly
                                                                const response = await fetch(
                                                                    `/api/file-download?path=${encodeURIComponent(storagePath)}&fileName=${encodeURIComponent(fileName)}`
                                                                );

                                                                if (!response.ok) {
                                                                    const errorData = await response.json().catch(() => ({ error: '파일을 불러오는 중 오류가 발생했습니다.' }));
                                                                    throw new Error(errorData.error || '파일을 불러오는 중 오류가 발생했습니다.');
                                                                }

                                                                // Convert response to blob
                                                                const blob = await response.blob();

                                                                // Create download link
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = fileName;
                                                                document.body.appendChild(link);
                                                                link.click();

                                                                // Cleanup
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error: any) {
                                                                console.error('Error downloading file:', error);
                                                                alert(error.message || '파일 다운로드에 실패했습니다.');
                                                            } finally {
                                                                setDownloadingEgd(false);
                                                            }
                                                        }}
                                                        disabled={downloadingEgd}
                                                        loading={downloadingEgd}
                                                        icon={Download}
                                                        loadingText="다운로드 중..."
                                                    >
                                                        EGD 시행 순서 description 파일 다운로드
                                                    </ActionButton>
                                                </div>

                                                {/* 나레이션 mp3 다운로드 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Music className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">나레이션 mp3 다운로드</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            // Hide video player when other button is clicked
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);

                                                            setDownloadingNarration(true);
                                                            try {
                                                                const storagePath = 'Simulator_training/MT/memory test narration 13분.mp3';
                                                                const fileName = 'memory test narration 13분.mp3';

                                                                // Use file-download API to stream file directly
                                                                const response = await fetch(
                                                                    `/api/file-download?path=${encodeURIComponent(storagePath)}&fileName=${encodeURIComponent(fileName)}`
                                                                );

                                                                if (!response.ok) {
                                                                    const errorData = await response.json().catch(() => ({ error: '파일을 불러오는 중 오류가 발생했습니다.' }));
                                                                    throw new Error(errorData.error || '파일을 불러오는 중 오류가 발생했습니다.');
                                                                }

                                                                // Convert response to blob
                                                                const blob = await response.blob();

                                                                // Create download link
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = fileName;
                                                                document.body.appendChild(link);
                                                                link.click();

                                                                // Cleanup
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error: any) {
                                                                console.error('Error downloading file:', error);
                                                                alert(error.message || '파일 다운로드에 실패했습니다.');
                                                            } finally {
                                                                setDownloadingNarration(false);
                                                            }
                                                        }}
                                                        disabled={downloadingNarration}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Download className="w-5 h-5 mr-2" />
                                                        {downloadingNarration ? '다운로드 중...' : '나레이션 mp3 다운로드'}
                                                    </button>
                                                </div>

                                                {/* MT demo 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">MT demo 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <p className="text-gray-700 mb-4">
                                                        한 피교육자가 모범적인 암기 구술 동영상입니다.
                                                    </p>
                                                    <button
                                                        onClick={async () => {
                                                            if (!checkAuth()) return;
                                                            setLoadingMtDemo(true);
                                                            setMtDemoError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/MT/MT_demo.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setMtDemoVideoUrl(data.url);
                                                                setShowMtDemo(true);
                                                            } catch (error: any) {
                                                                setMtDemoError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingMtDemo(false);
                                                            }
                                                        }}
                                                        disabled={loadingMtDemo}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingMtDemo ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {mtDemoError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {mtDemoError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 암기 영상 업로드 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Upload className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">암기 영상 업로드</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <p className="text-gray-700 mb-4">
                                                        업로드할 암기 동영상(mp4)을 선택하세요 (100 MB 이하로 해주세요.):
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <div
                                                            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-300'
                                                                }`}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setIsDragging(true);
                                                            }}
                                                            onDragLeave={() => {
                                                                setIsDragging(false);
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                setIsDragging(false);

                                                                const file = e.dataTransfer.files[0];
                                                                if (file) {
                                                                    // 파일 확장자 및 타입 검증
                                                                    const fileName = file.name.toLowerCase();
                                                                    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
                                                                    const allowedExtensions = ['.avi', '.mp4', '.mpeg4', '.m4v'];
                                                                    const allowedTypes = ['video/avi', 'video/mp4', 'video/mpeg4', 'video/x-msvideo', 'video/quicktime'];

                                                                    const isValidExtension = allowedExtensions.includes(fileExtension);
                                                                    const isValidType = allowedTypes.includes(file.type);

                                                                    if (!isValidType && !isValidExtension) {
                                                                        alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                        return;
                                                                    }
                                                                    if (file.size > 100 * 1024 * 1024) {
                                                                        alert('파일 크기는 100MB 이하여야 합니다.');
                                                                        return;
                                                                    }
                                                                    handleMtVideoUpload(file);
                                                                }
                                                            }}
                                                        >
                                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                            <p className="text-gray-700 mb-2">Drag and drop file here</p>
                                                            <p className="text-sm text-gray-500">Limit 100MB per file • AVI, MP4, MPEG4</p>
                                                            {uploading && (
                                                                <div className="mt-4">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                                    <p className="text-sm text-gray-700">업로드 중...</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out cursor-pointer flex items-center">
                                                                <Upload className="w-5 h-5 mr-2" />
                                                                Browse files
                                                                <input
                                                                    type="file"
                                                                    accept="video/avi,video/mp4,video/mpeg4,video/x-msvideo"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            // 파일 확장자 및 타입 검증
                                                                            const fileName = file.name.toLowerCase();
                                                                            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
                                                                            const allowedExtensions = ['.avi', '.mp4', '.mpeg4', '.m4v'];
                                                                            const allowedTypes = ['video/avi', 'video/mp4', 'video/mpeg4', 'video/x-msvideo', 'video/quicktime'];

                                                                            const isValidExtension = allowedExtensions.includes(fileExtension);
                                                                            const isValidType = allowedTypes.includes(file.type);

                                                                            if (!isValidType && !isValidExtension) {
                                                                                alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            if (file.size > 100 * 1024 * 1024) {
                                                                                alert('파일 크기는 100MB 이하여야 합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            handleMtVideoUpload(file);
                                                                            e.target.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : category === 'basic' && selectedItem === 'scope-handling' ? (
                                        // SHT: 동영상 플레이어가 표시될 때 전체 영역을 차지
                                        (showShtOrientation && shtOrientationVideoUrl) || (showShtExpertDemo && shtExpertDemoVideoUrl) ? (
                                            <>
                                                {showShtOrientation && shtOrientationVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={shtOrientationPlayerRef}
                                                        isOpen={showShtOrientation}
                                                        videoUrl={shtOrientationVideoUrl}
                                                        onClose={() => {
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShtOrientationError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('SHT Orientation', 'basic')}
                                                    />
                                                )}
                                                {showShtExpertDemo && shtExpertDemoVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={shtExpertDemoPlayerRef}
                                                        isOpen={showShtExpertDemo}
                                                        videoUrl={shtExpertDemoVideoUrl}
                                                        onClose={() => {
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShtExpertDemoError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('SHT Expert Demo', 'basic')}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            // 플레이어가 표시되지 않을 때: 일반 콘텐츠 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                {/* SHT 제목 */}
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* SHT orientation 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">SHT (Scope Handling Training) orientation 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!checkAuth()) return;
                                                            // Hide other video players
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);

                                                            setLoadingShtOrientation(true);
                                                            setShtOrientationError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/SHT/SHT_orientation.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setShtOrientationVideoUrl(data.url);
                                                                setShowShtOrientation(true);
                                                            } catch (error: any) {
                                                                setShtOrientationError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingShtOrientation(false);
                                                            }
                                                        }}
                                                        disabled={loadingShtOrientation}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingShtOrientation ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {shtOrientationError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {shtOrientationError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* SHT expert demo 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">SHT expert demo 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);

                                                            if (!checkAuth()) return;
                                                            setLoadingShtExpertDemo(true);
                                                            setShtExpertDemoError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/SHT/SHT_expert_demo.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setShtExpertDemoVideoUrl(data.url);
                                                                setShowShtExpertDemo(true);
                                                            } catch (error: any) {
                                                                setShtExpertDemoError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingShtExpertDemo(false);
                                                            }
                                                        }}
                                                        disabled={loadingShtExpertDemo}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingShtExpertDemo ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {shtExpertDemoError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {shtExpertDemoError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* SHT 수행 동영상 업로드 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Upload className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">SHT 수행 동영상 업로드</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <p className="text-gray-700 mb-4">
                                                        업로드할 SHT 수행 동영상을 선택하세요 (100 MB 이하로 해주세요.):
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <div
                                                            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDraggingSht
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-300'
                                                                }`}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingSht(true);
                                                            }}
                                                            onDragLeave={() => {
                                                                setIsDraggingSht(false);
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingSht(false);

                                                                const file = e.dataTransfer.files[0];
                                                                if (file) {
                                                                    if (file.type !== 'video/avi' && file.type !== 'video/mp4' && file.type !== 'video/mpeg4' && file.type !== 'video/x-msvideo') {
                                                                        alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                        return;
                                                                    }
                                                                    if (file.size > 200 * 1024 * 1024) {
                                                                        alert('파일 크기는 200MB 이하여야 합니다.');
                                                                        return;
                                                                    }
                                                                    handleShtVideoUpload(file);
                                                                }
                                                            }}
                                                        >
                                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                            <p className="text-gray-700 mb-2">Drag and drop file here</p>
                                                            <p className="text-sm text-gray-500">Limit 200MB per file • AVI, MP4, MPEG4</p>
                                                            {uploadingSht && (
                                                                <div className="mt-4">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                                    <p className="text-sm text-gray-700">업로드 중...</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out cursor-pointer flex items-center">
                                                                <Upload className="w-5 h-5 mr-2" />
                                                                Browse files
                                                                <input
                                                                    type="file"
                                                                    accept="video/avi,video/mp4,video/mpeg4,video/x-msvideo"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            if (file.type !== 'video/avi' && file.type !== 'video/mp4' && file.type !== 'video/mpeg4' && file.type !== 'video/x-msvideo') {
                                                                                alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            if (file.size > 200 * 1024 * 1024) {
                                                                                alert('파일 크기는 200MB 이하여야 합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            handleShtVideoUpload(file);
                                                                            e.target.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : category === 'basic' && selectedItem === 'egd-method' ? (
                                        // EMT: 동영상 플레이어가 표시될 때 전체 영역을 차지
                                        (showEmtOrientation && emtOrientationVideoUrl) || (showEmtExemplary && emtExemplaryVideoUrl) ? (
                                            <>
                                                {showEmtOrientation && emtOrientationVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={emtOrientationPlayerRef}
                                                        isOpen={showEmtOrientation}
                                                        videoUrl={emtOrientationVideoUrl}
                                                        onClose={() => {
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setEmtOrientationError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('EMT Orientation', 'basic')}
                                                    />
                                                )}
                                                {showEmtExemplary && emtExemplaryVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={emtExemplaryPlayerRef}
                                                        isOpen={showEmtExemplary}
                                                        videoUrl={emtExemplaryVideoUrl}
                                                        onClose={() => {
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setEmtExemplaryError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('EMT Exemplary', 'basic')}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            // 플레이어가 표시되지 않을 때: 일반 콘텐츠 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                {/* EMT 제목 */}
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* EMT orientation 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">EMT (EGD Method Training) orientation 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!checkAuth()) return;
                                                            // Hide other video players
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);

                                                            setLoadingEmtOrientation(true);
                                                            setEmtOrientationError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/EMT/EMT_orientation.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    const errorData = await response.json().catch(() => ({ error: '동영상을 불러오는 중 오류가 발생했습니다.' }));
                                                                    if (response.status === 404) {
                                                                        throw new Error(`동영상 파일을 찾을 수 없습니다.\n경로: Simulator_training/EMT/EMT_orientation.mp4\n\nFirebase Storage에 해당 파일이 존재하는지 확인해주세요.`);
                                                                    }
                                                                    throw new Error(errorData.error || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setEmtOrientationVideoUrl(data.url);
                                                                setShowEmtOrientation(true);
                                                            } catch (error: any) {
                                                                setEmtOrientationError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingEmtOrientation(false);
                                                            }
                                                        }}
                                                        disabled={loadingEmtOrientation}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingEmtOrientation ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {emtOrientationError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {emtOrientationError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* EMT 수행 모범 동영상 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">EMT 수행 모범 동영상</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <p className="text-gray-700 mb-4">
                                                        EMT 수행 모범 동영상입니다. 잘보고 어떤 점에서 초심자와 차이가 나는지 연구해 보세요.
                                                    </p>
                                                    <button
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);

                                                            setLoadingEmtExemplary(true);
                                                            setEmtExemplaryError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/EMT/EMT_expert_demo.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    const errorData = await response.json().catch(() => ({ error: '동영상을 불러오는 중 오류가 발생했습니다.' }));
                                                                    if (response.status === 404) {
                                                                        throw new Error(`동영상 파일을 찾을 수 없습니다.\n경로: Simulator_training/EMT/EMT_expert_demo.mp4\n\nFirebase Storage에 해당 파일이 존재하는지 확인해주세요.`);
                                                                    }
                                                                    throw new Error(errorData.error || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setEmtExemplaryVideoUrl(data.url);
                                                                setShowEmtExemplary(true);
                                                            } catch (error: any) {
                                                                setEmtExemplaryError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingEmtExemplary(false);
                                                            }
                                                        }}
                                                        disabled={loadingEmtExemplary}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingEmtExemplary ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {emtExemplaryError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {emtExemplaryError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 수행 동영상 및 이미지 파일 업로드 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Upload className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">수행 동영상 및 이미지 파일 업로드, 분석 및 최종 평가서 전송</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>

                                                    {/* EMT 버전 선택 라디오 버튼 */}
                                                    <div className="mb-4">
                                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">EMT 버전 선택: 이전의 구강부터 십이지장 2nd portion까지 갖춘 AnyMedi의 시뮬레이터를 사용한 경우는 EMT를 선택하시고, 새로 만들어진 AIO 시스템에서 위와 십이지장 bulb만 훈련하는 새 모델을 사용한 경우는 EMT-L을 선택하세요.</label>
                                                        <div className="flex gap-6">
                                                            <label className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="emtVersion"
                                                                    value="EMT"
                                                                    checked={emtVersion === 'EMT'}
                                                                    onChange={(e) => {
                                                                        console.log('[Client] EMT selected, value:', e.target.value);
                                                                        setEmtVersion(e.target.value as 'EMT' | 'EMT-L');
                                                                    }}
                                                                    className="mr-2"
                                                                />
                                                                <span className="text-gray-700">EMT</span>
                                                            </label>
                                                            <label className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="emtVersion"
                                                                    value="EMT-L"
                                                                    checked={emtVersion === 'EMT-L'}
                                                                    onChange={(e) => {
                                                                        console.log('[Client] EMT-L selected, value:', e.target.value);
                                                                        setEmtVersion(e.target.value as 'EMT' | 'EMT-L');
                                                                    }}
                                                                    className="mr-2"
                                                                />
                                                                <span className="text-gray-700">EMT-L</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    {/* EMT-L 선택 시에만: 내시경 모델 선택 (ROI 적용) */}
                                                    {emtVersion === 'EMT-L' && (
                                                        <div className="mb-4 pl-4 border-l-2 border-gray-200">
                                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">내시경 모델 (분석 영역 ROI):</label>
                                                            <div className="flex flex-wrap gap-4">
                                                                <label className="flex items-center cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name="emtEndoscopeModel"
                                                                        value="CV 260"
                                                                        checked={emtEndoscopeModel === 'CV 260'}
                                                                        onChange={(e) => setEmtEndoscopeModel(e.target.value as 'CV 260' | 'CV 290' | 'X1 660')}
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-gray-700">Olympus CV 260</span>
                                                                </label>
                                                                <label className="flex items-center cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name="emtEndoscopeModel"
                                                                        value="CV 290"
                                                                        checked={emtEndoscopeModel === 'CV 290'}
                                                                        onChange={(e) => setEmtEndoscopeModel(e.target.value as 'CV 260' | 'CV 290' | 'X1 660')}
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-gray-700">Olympus CV 290</span>
                                                                </label>
                                                                <label className="flex items-center cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name="emtEndoscopeModel"
                                                                        value="X1 660"
                                                                        checked={emtEndoscopeModel === 'X1 660'}
                                                                        onChange={(e) => setEmtEndoscopeModel(e.target.value as 'CV 260' | 'CV 290' | 'X1 660')}
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-gray-700">Olympus X1 660</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-gray-700 text-sm">
                                                        <p className="font-medium mb-2">EMT 과정의 수료는 이 동영상 및 사진 분석 과정에서 pass 해야만 수료로 인정됩니다. fail의 경우에는 수료가 되지 않으니, 다시 시도해 주세요.</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>EMT 일 경우 pass 조건: 사진 62-66장 &amp; 동영상 시간 5분-5분30초 &amp; 동작 분석 pass</li>
                                                            <li>EMT-L 일 경우 pass 조건: 사진 42-48장 &amp; 동영상 시간 3분 10초-3분 30초 &amp; 동작 분석 pass</li>
                                                        </ul>
                                                    </div>
                                                    <p className="text-gray-700 mb-4">
                                                        분석할 파일들(avi, mp4, bmp)을 탐색기에서 찾아 모두 선택해주세요 단 동영상은 한개만 선택할 수 있습니다.
                                                    </p>
                                                    {/* 드롭 박스 위 오른쪽: 전체 삭제 버튼 */}
                                                    <div className="flex justify-end mb-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEmtUploadFiles([])}
                                                            disabled={emtUploadFiles.length === 0 || uploadingEmt || analyzingEmt}
                                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            전체 삭제
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div
                                                            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDraggingEmt
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-300'
                                                                }`}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingEmt(true);
                                                            }}
                                                            onDragLeave={() => {
                                                                setIsDraggingEmt(false);
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingEmt(false);

                                                                // Hide video players
                                                                setShowEmtOrientation(false);
                                                                setEmtOrientationVideoUrl(null);
                                                                setShowEmtExemplary(false);
                                                                setEmtExemplaryVideoUrl(null);

                                                                const files = Array.from(e.dataTransfer.files);
                                                                if (files.length > 0) {
                                                                    handleEmtAddFiles(files);
                                                                }
                                                            }}
                                                        >
                                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                            <p className="text-gray-700 mb-2">Drag and drop files here</p>
                                                            <p className="text-sm text-gray-500">
                                                                <span className="block mb-1">동영상: limit 60 MB, AVI, MP4 가능, 한 개의 동영상만 업로드 가능함.</span>
                                                                <span className="block">이미지: BMP (BMP는 자동으로 JPG로 변환되어 용량이 줄어듭니다)</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out cursor-pointer flex items-center">
                                                                <Upload className="w-5 h-5 mr-2" />
                                                                Browse files
                                                                <input
                                                                    type="file"
                                                                    accept="video/avi,video/mp4,video/mpeg4,video/x-msvideo,image/bmp,image/x-ms-bmp"
                                                                    multiple
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        // Hide video players
                                                                        setShowEmtOrientation(false);
                                                                        setEmtOrientationVideoUrl(null);
                                                                        setShowEmtExemplary(false);
                                                                        setEmtExemplaryVideoUrl(null);

                                                                        const files = Array.from(e.target.files || []);
                                                                        if (files.length > 0) {
                                                                            handleEmtAddFiles(files);
                                                                            e.target.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* 드래그 박스 바로 아래 로딩 스피너 - 업로드 또는 분석 중일 때 표시 */}
                                                    {(uploadingEmt || analyzingEmt) && (
                                                        <div className="mt-4 w-full bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                                {uploadingEmt ? '업로드 중...' : analyzingEmt ? '분석 중...' : '처리 중...'}
                                                            </p>
                                                            {analyzingEmt && (
                                                                <p className="text-xs text-gray-500 text-center">
                                                                    분석에는 몇 분이 소요될 수 있습니다. 잠시만 기다려주세요.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* 파일 목록 표시 */}
                                                    {emtUploadFiles.length > 0 && !uploadingEmt && !analyzingEmt && (
                                                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">선택된 파일 목록 ({emtUploadFiles.length}개)</h3>
                                                            <div className="space-y-3">
                                                                {/* 동영상 파일 */}
                                                                {emtUploadFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">동영상 파일</h4>
                                                                        <div className="space-y-1">
                                                                            {emtUploadFiles
                                                                                .filter(f => f.type.startsWith('video/'))
                                                                                .map((file, idx) => {
                                                                                    const originalIndex = emtUploadFiles.indexOf(file);
                                                                                    return (
                                                                                        <div key={originalIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                                                                                            <span className="text-sm text-gray-700">
                                                                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                                                            </span>
                                                                                            <button
                                                                                                onClick={() => handleEmtRemoveFile(originalIndex)}
                                                                                                className="text-red-600 hover:text-red-800 text-sm px-2"
                                                                                            >
                                                                                                삭제
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 이미지 파일 */}
                                                                {emtUploadFiles.filter(f => f.type.startsWith('image/')).length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">이미지 파일 ({emtUploadFiles.filter(f => f.type.startsWith('image/')).length}개)</h4>
                                                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                                                            {emtUploadFiles
                                                                                .filter(f => f.type.startsWith('image/'))
                                                                                .map((file, idx) => {
                                                                                    const originalIndex = emtUploadFiles.indexOf(file);
                                                                                    return (
                                                                                        <div key={originalIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                                                                                            <span className="text-sm text-gray-700">
                                                                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                                                            </span>
                                                                                            <button
                                                                                                onClick={() => handleEmtRemoveFile(originalIndex)}
                                                                                                className="text-red-600 hover:text-red-800 text-sm px-2"
                                                                                            >
                                                                                                삭제
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 분석 버튼 */}
                                                            <div className="mt-4 flex justify-end">
                                                                <button
                                                                    onClick={() => {
                                                                        // Hide video players
                                                                        setShowEmtOrientation(false);
                                                                        setEmtOrientationVideoUrl(null);
                                                                        setShowEmtExemplary(false);
                                                                        setEmtExemplaryVideoUrl(null);
                                                                        handleEmtUpload();
                                                                    }}
                                                                    disabled={uploadingEmt || analyzingEmt}
                                                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <Upload className="w-5 h-5 mr-2" />
                                                                    분석 시작
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ) : selectedItem === 'dx-egd-lecture' ? (
                                        // Dx EGD 실전 강의: 카드 형식으로 강의 목록 표시
                                        showDxEgdLecture && dxEgdLectureVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={dxEgdLecturePlayerRef}
                                                isOpen={showDxEgdLecture}
                                                videoUrl={dxEgdLectureVideoUrl}
                                                onClose={() => {
                                                    setShowDxEgdLecture(false);
                                                    setDxEgdLectureVideoUrl(null);
                                                    setSelectedLecture(null);
                                                    setDxEgdLectureError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowDxEgdLecture(false);
                                                    setDxEgdLectureVideoUrl(null);
                                                    setSelectedLecture(null);
                                                }}
                                                {...getVideoPlayerProps(selectedLecture || 'Dx EGD Lecture', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    if (selectedLecture) {
                                                        setDxEgdLectureLogCreated(prev => new Set(prev).add(selectedLecture));
                                                    }
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 그리드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* 강의 목록 카드 그리드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    {dxEgdLectures.map((lecture) => (
                                                        <ClickableCard
                                                            key={lecture}
                                                            onClick={async () => {
                                                                // Hide other video players
                                                                setShowVideo(false);
                                                                setVideoUrl(null);
                                                                setShowMtDemo(false);
                                                                setMtDemoVideoUrl(null);
                                                                setShowShtOrientation(false);
                                                                setShtOrientationVideoUrl(null);
                                                                setShowShtExpertDemo(false);
                                                                setShtExpertDemoVideoUrl(null);
                                                                setShowEmtOrientation(false);
                                                                setEmtOrientationVideoUrl(null);
                                                                setShowEmtExemplary(false);
                                                                setEmtExemplaryVideoUrl(null);

                                                                if (!checkAuth()) return;
                                                                setLoadingDxEgdLecture(true);
                                                                setDxEgdLectureError(null);
                                                                setSelectedLecture(lecture);
                                                                try {
                                                                    const videoFileName = `${lecture}.mp4`;
                                                                    const storagePath = `Lectures/${videoFileName}`;
                                                                    const response = await fetch(
                                                                        `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                    );
                                                                    if (!response.ok) {
                                                                        throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                    }
                                                                    const data = await response.json();
                                                                    setDxEgdLectureVideoUrl(data.url);
                                                                    setShowDxEgdLecture(true);
                                                                } catch (error: any) {
                                                                    setDxEgdLectureError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                } finally {
                                                                    setLoadingDxEgdLecture(false);
                                                                }
                                                            }}
                                                        >
                                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                                {lecture}
                                                            </h3>
                                                            <p className="text-white text-sm">
                                                                클릭하여 동영상 시청
                                                            </p>
                                                        </ClickableCard>
                                                    ))}
                                                </div>

                                                {/* 에러 메시지 */}
                                                {dxEgdLectureError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {dxEgdLectureError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingDxEgdLecture && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'other-lectures' ? (
                                        // Other lectures: 카드 형식으로 강의 목록 표시
                                        showOtherLecture && otherLectureVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={otherLecturePlayerRef}
                                                isOpen={showOtherLecture}
                                                videoUrl={otherLectureVideoUrl}
                                                userEmail={user?.email || null}
                                                userPosition={userProfile?.position}
                                                userName={userProfile?.name}
                                                userHospital={userProfile?.hospital}
                                                videoTitle={selectedOtherLecture || undefined}
                                                category="Advanced course for F1"
                                                onClose={() => {
                                                    setShowOtherLecture(false);
                                                    setOtherLectureVideoUrl(null);
                                                    setSelectedOtherLecture(null);
                                                    setOtherLectureError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowOtherLecture(false);
                                                    setOtherLectureVideoUrl(null);
                                                    setSelectedOtherLecture(null);
                                                }}
                                                onThresholdReached={() => {
                                                    if (selectedOtherLecture) {
                                                        setOtherLectureLogCreated(prev => new Set(prev).add(selectedOtherLecture));
                                                    }
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 그리드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* 강의 목록 카드 그리드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    {otherLectures.map((lecture) => (
                                                        <div
                                                            key={lecture}
                                                            className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                            onClick={async () => {
                                                                // Hide other video players
                                                                setShowVideo(false);
                                                                setVideoUrl(null);
                                                                setShowMtDemo(false);
                                                                setMtDemoVideoUrl(null);
                                                                setShowShtOrientation(false);
                                                                setShtOrientationVideoUrl(null);
                                                                setShowShtExpertDemo(false);
                                                                setShtExpertDemoVideoUrl(null);
                                                                setShowEmtOrientation(false);
                                                                setEmtOrientationVideoUrl(null);
                                                                setShowEmtExemplary(false);
                                                                setEmtExemplaryVideoUrl(null);
                                                                setShowDxEgdLecture(false);
                                                                setDxEgdLectureVideoUrl(null);
                                                                setSelectedLecture(null);

                                                                setLoadingOtherLecture(true);
                                                                setOtherLectureError(null);
                                                                setSelectedOtherLecture(lecture);
                                                                try {
                                                                    // 강의 이름을 파일명으로 사용 (예: "Bx.? or not?" -> "Bx_or_no_Bx.mp4")
                                                                    const videoFileName = lecture === 'Bx.? or not?' ? 'Bx_or_no_Bx.mp4' : `${lecture}.mp4`;
                                                                    const storagePath = `Lectures/${videoFileName}`;
                                                                    const response = await fetch(
                                                                        `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                    );
                                                                    if (!response.ok) {
                                                                        throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                    }
                                                                    const data = await response.json();
                                                                    setOtherLectureVideoUrl(data.url);
                                                                    setShowOtherLecture(true);
                                                                } catch (error: any) {
                                                                    setOtherLectureError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                } finally {
                                                                    setLoadingOtherLecture(false);
                                                                }
                                                            }}
                                                        >
                                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                                {lecture}
                                                            </h3>
                                                            <p className="text-white text-sm">
                                                                클릭하여 동영상 시청
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* 에러 메시지 */}
                                                {otherLectureError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {otherLectureError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingOtherLecture && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'lht' ? (
                                        // LHT: 동영상 플레이어가 표시될 때 전체 영역을 차지
                                        (showLhtOrientation && lhtOrientationVideoUrl) || (showLhtExpertDemo && lhtExpertDemoVideoUrl) ? (
                                            <>
                                                {showLhtOrientation && lhtOrientationVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={lhtOrientationPlayerRef}
                                                        isOpen={showLhtOrientation}
                                                        videoUrl={lhtOrientationVideoUrl}
                                                        onClose={() => {
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setLhtOrientationError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('LHT Orientation', 'advanced-f1')}
                                                    />
                                                )}
                                                {showLhtExpertDemo && lhtExpertDemoVideoUrl && (
                                                    <FullScreenVideoPlayer
                                                        ref={lhtExpertDemoPlayerRef}
                                                        isOpen={showLhtExpertDemo}
                                                        videoUrl={lhtExpertDemoVideoUrl}
                                                        onClose={() => {
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setLhtExpertDemoError(null);
                                                        }}
                                                        onEnded={() => {
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                        }}
                                                        {...getVideoPlayerProps('LHT Expert Demo', 'advanced-f1')}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            // 플레이어가 표시되지 않을 때: 일반 콘텐츠 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                {/* LHT 제목 */}
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* LHT orientation 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">LHT (Left Hand Trainer) orientation 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);

                                                            setLoadingLhtOrientation(true);
                                                            setLhtOrientationError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/LHT/LHT_orientation.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setLhtOrientationVideoUrl(data.url);
                                                                setShowLhtOrientation(true);
                                                            } catch (error: any) {
                                                                setLhtOrientationError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingLhtOrientation(false);
                                                            }
                                                        }}
                                                        disabled={loadingLhtOrientation}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingLhtOrientation ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {lhtOrientationError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {lhtOrientationError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* LHT expert demo 동영상 시청 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Video className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">LHT expert demo 동영상 시청</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <button
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);

                                                            if (!checkAuth()) return;
                                                            setLoadingLhtExpertDemo(true);
                                                            setLhtExpertDemoError(null);
                                                            try {
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent('Simulator_training/LHT/LHT_expert_demo.mp4')}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setLhtExpertDemoVideoUrl(data.url);
                                                                setShowLhtExpertDemo(true);
                                                            } catch (error: any) {
                                                                setLhtExpertDemoError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingLhtExpertDemo(false);
                                                            }
                                                        }}
                                                        disabled={loadingLhtExpertDemo}
                                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out flex items-center disabled:opacity-50"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {loadingLhtExpertDemo ? '동영상 불러오는 중...' : '동영상 시청'}
                                                    </button>
                                                    {lhtExpertDemoError && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                            {lhtExpertDemoError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* LHT 수행 동영상 업로드 */}
                                                <div className="mb-8">
                                                    <div className="flex items-center mb-4">
                                                        <Upload className="w-6 h-6 text-gray-700 mr-2" />
                                                        <h2 className="text-2xl font-bold text-gray-900">LHT 수행 동영상 업로드</h2>
                                                    </div>
                                                    <div className="border-t border-gray-300 mb-4"></div>
                                                    <p className="text-gray-700 mb-4">
                                                        업로드할 LHT 수행 동영상을 선택하세요 (200 MB 이하로 해주세요.):
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <div
                                                            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDraggingLht
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-300'
                                                                }`}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingLht(true);
                                                            }}
                                                            onDragLeave={() => {
                                                                setIsDraggingLht(false);
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                setIsDraggingLht(false);

                                                                const file = e.dataTransfer.files[0];
                                                                if (file) {
                                                                    if (file.type !== 'video/avi' && file.type !== 'video/mp4' && file.type !== 'video/mpeg4' && file.type !== 'video/x-msvideo') {
                                                                        alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                        return;
                                                                    }
                                                                    if (file.size > 200 * 1024 * 1024) {
                                                                        alert('파일 크기는 200MB 이하여야 합니다.');
                                                                        return;
                                                                    }
                                                                    handleLhtVideoUpload(file);
                                                                }
                                                            }}
                                                        >
                                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                            <p className="text-gray-700 mb-2">Drag and drop file here</p>
                                                            <p className="text-sm text-gray-500">Limit 200MB per file • AVI, MP4, MPEG4</p>
                                                            {uploadingLht && (
                                                                <div className="mt-4">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                                    <p className="text-sm text-gray-700">업로드 중...</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out cursor-pointer flex items-center">
                                                                <Upload className="w-5 h-5 mr-2" />
                                                                Browse files
                                                                <input
                                                                    type="file"
                                                                    accept="video/avi,video/mp4,video/mpeg4,video/x-msvideo"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            if (file.type !== 'video/avi' && file.type !== 'video/mp4' && file.type !== 'video/mpeg4' && file.type !== 'video/x-msvideo') {
                                                                                alert('AVI, MP4 또는 MPEG4 파일만 업로드 가능합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            if (file.size > 200 * 1024 * 1024) {
                                                                                alert('파일 크기는 200MB 이하여야 합니다.');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            handleLhtVideoUpload(file);
                                                                            e.target.value = '';
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : selectedItem === 'hemoclip' ? (
                                        // Hemoclip: 카드 형식으로 표시
                                        showHemoclip && hemoclipVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={hemoclipPlayerRef}
                                                isOpen={showHemoclip}
                                                videoUrl={hemoclipVideoUrl}
                                                onClose={() => {
                                                    setShowHemoclip(false);
                                                    setHemoclipVideoUrl(null);
                                                    setHemoclipError(null);
                                                    setHemoclipLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowHemoclip(false);
                                                    setHemoclipVideoUrl(null);
                                                    setHemoclipLogCreated(false);
                                                    setShowInjection(false);
                                                    setInjectionVideoUrl(null);
                                                    setInjectionLogCreated(false);
                                                    setShowApc(false);
                                                    setApcVideoUrl(null);
                                                    setApcLogCreated(false);
                                                    setShowNexpowder(false);
                                                    setNexpowderVideoUrl(null);
                                                    setNexpowderLogCreated(false);
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlLogCreated(false);
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                                {...getVideoPlayerProps('Hemoclip', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    setHemoclipLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* Hemoclip 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingHemoclip(true);
                                                            setHemoclipError(null);
                                                            try {
                                                                const videoFileName = 'hemoclip_orientation.mp4';
                                                                const storagePath = `Simulator_training/Hemoclip/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setHemoclipVideoUrl(data.url);
                                                                setShowHemoclip(true);
                                                            } catch (error: any) {
                                                                setHemoclipError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingHemoclip(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            Hemoclip
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {hemoclipError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {hemoclipError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingHemoclip && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'injection' ? (
                                        // Injection: 카드 형식으로 표시
                                        showInjection && injectionVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={injectionPlayerRef}
                                                isOpen={showInjection}
                                                videoUrl={injectionVideoUrl}
                                                onClose={() => {
                                                    setShowInjection(false);
                                                    setInjectionVideoUrl(null);
                                                    setInjectionError(null);
                                                    setInjectionLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowInjection(false);
                                                    setInjectionVideoUrl(null);
                                                    setInjectionLogCreated(false);
                                                    setShowApc(false);
                                                    setApcVideoUrl(null);
                                                    setApcLogCreated(false);
                                                    setShowNexpowder(false);
                                                    setNexpowderVideoUrl(null);
                                                    setNexpowderLogCreated(false);
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlLogCreated(false);
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                                {...getVideoPlayerProps('Injection', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    setInjectionLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* Injection 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingInjection(true);
                                                            setInjectionError(null);
                                                            try {
                                                                const videoFileName = 'Injection_orientation.mp4';
                                                                const storagePath = `Simulator_training/Injection/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setInjectionVideoUrl(data.url);
                                                                setShowInjection(true);
                                                            } catch (error: any) {
                                                                setInjectionError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingInjection(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            Injection
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {injectionError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {injectionError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingInjection && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'apc' ? (
                                        // APC: 카드 형식으로 표시
                                        showApc && apcVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={apcPlayerRef}
                                                isOpen={showApc}
                                                videoUrl={apcVideoUrl}
                                                onClose={() => {
                                                    setShowApc(false);
                                                    setApcVideoUrl(null);
                                                    setApcError(null);
                                                    setApcLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowApc(false);
                                                    setApcVideoUrl(null);
                                                    setApcLogCreated(false);
                                                    setShowNexpowder(false);
                                                    setNexpowderVideoUrl(null);
                                                    setNexpowderLogCreated(false);
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlLogCreated(false);
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                                {...getVideoPlayerProps('APC', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    setApcLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* APC 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingApc(true);
                                                            setApcError(null);
                                                            try {
                                                                const videoFileName = 'APC_orientation.mp4';
                                                                const storagePath = `Simulator_training/APC/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setApcVideoUrl(data.url);
                                                                setShowApc(true);
                                                            } catch (error: any) {
                                                                setApcError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingApc(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            Argon plasma coagulation (APC)
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {apcError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {apcError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingApc && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'nexpowder' ? (
                                        // NexPowder: 카드 형식으로 표시
                                        showNexpowder && nexpowderVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={nexpowderPlayerRef}
                                                isOpen={showNexpowder}
                                                videoUrl={nexpowderVideoUrl}
                                                onClose={() => {
                                                    setShowNexpowder(false);
                                                    setNexpowderVideoUrl(null);
                                                    setNexpowderError(null);
                                                    setNexpowderLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowNexpowder(false);
                                                    setNexpowderVideoUrl(null);
                                                    setNexpowderLogCreated(false);
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlLogCreated(false);
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                                {...getVideoPlayerProps('NexPowder', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    setNexpowderLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* NexPowder 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingNexpowder(true);
                                                            setNexpowderError(null);
                                                            try {
                                                                const videoFileName = 'Nexpowder 사용법과 cases.mp4';
                                                                const storagePath = `Simulator_training/NexPowder/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setNexpowderVideoUrl(data.url);
                                                                setShowNexpowder(true);
                                                            } catch (error: any) {
                                                                setNexpowderError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingNexpowder(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            NexPowder
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {nexpowderError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {nexpowderError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingNexpowder && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'evl' ? (
                                        // EVL: 카드 형식으로 표시
                                        showEvl && evlVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={evlPlayerRef}
                                                isOpen={showEvl}
                                                videoUrl={evlVideoUrl}
                                                onClose={() => {
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlError(null);
                                                    setEvlLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowEvl(false);
                                                    setEvlVideoUrl(null);
                                                    setEvlLogCreated(false);
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                                {...getVideoPlayerProps('EVL', 'advanced-f1')}
                                                onThresholdReached={() => {
                                                    setEvlLogCreated(true);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* EVL 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingEvl(true);
                                                            setEvlError(null);
                                                            try {
                                                                const videoFileName = 'EVL multiband 사용방법 및 demo.mp4';
                                                                const storagePath = `Simulator_training/EVL/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setEvlVideoUrl(data.url);
                                                                setShowEvl(true);
                                                            } catch (error: any) {
                                                                setEvlError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingEvl(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            EVL
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {evlError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {evlError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingEvl && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'peg' ? (
                                        // PEG: 카드 형식으로 표시
                                        showPeg && pegVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={pegPlayerRef}
                                                isOpen={showPeg}
                                                videoUrl={pegVideoUrl}
                                                onPlay={async () => {
                                                    // Create log file when video starts playing
                                                    if (userProfile && !pegLogCreated) {
                                                        try {
                                                            const logFileName = `${userProfile.position}-${userProfile.name}-PEG`;
                                                            const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F1
Section: 치료 내시경 기초
Item: PEG
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                            const response = await fetch('/api/log/create', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    fileName: logFileName,
                                                                    content: logContent,
                                                                }),
                                                            });

                                                            if (response.ok) {
                                                                setPegLogCreated(true);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error creating log file:', error);
                                                        }
                                                    }
                                                }}
                                                onClose={() => {
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegError(null);
                                                    setPegLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowPeg(false);
                                                    setPegVideoUrl(null);
                                                    setPegLogCreated(false);
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* PEG 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingPeg(true);
                                                            setPegError(null);
                                                            try {
                                                                const videoFileName = 'PEG_orientation.mp4';
                                                                const storagePath = `Simulator_training/PEG/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setPegVideoUrl(data.url);
                                                                setShowPeg(true);
                                                            } catch (error: any) {
                                                                setPegError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingPeg(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            PEG
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {pegError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {pegError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingPeg && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'nvugib-lecture' ? (
                                        // NVUGIB 총론 강의: 카드 형식으로 표시
                                        showNvugibOverview && nvugibOverviewVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={nvugibOverviewPlayerRef}
                                                isOpen={showNvugibOverview}
                                                videoUrl={nvugibOverviewVideoUrl}
                                                onPlay={async () => {
                                                    // Create log file when video starts playing
                                                    if (userProfile && !nvugibOverviewLogCreated) {
                                                        try {
                                                            const logFileName = `${userProfile.position}-${userProfile.name}-NVUGIB_overview`;
                                                            const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F1
Section: 치료 내시경 임상
Item: NVUGIB 총론 강의
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                            const response = await fetch('/api/log/create', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    fileName: logFileName,
                                                                    content: logContent,
                                                                }),
                                                            });

                                                            if (response.ok) {
                                                                setNvugibOverviewLogCreated(true);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error creating log file:', error);
                                                        }
                                                    }
                                                }}
                                                onClose={() => {
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewError(null);
                                                    setNvugibOverviewLogCreated(false);
                                                }}
                                                onEnded={() => {
                                                    setShowNvugibOverview(false);
                                                    setNvugibOverviewVideoUrl(null);
                                                    setNvugibOverviewLogCreated(false);
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* NVUGIB 총론 강의 카드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setHemoclipLogCreated(false);
                                                            setShowInjection(false);
                                                            setInjectionVideoUrl(null);
                                                            setInjectionLogCreated(false);
                                                            setShowApc(false);
                                                            setApcVideoUrl(null);
                                                            setApcLogCreated(false);
                                                            setShowNexpowder(false);
                                                            setNexpowderVideoUrl(null);
                                                            setNexpowderLogCreated(false);
                                                            setShowEvl(false);
                                                            setEvlVideoUrl(null);
                                                            setEvlLogCreated(false);
                                                            setShowPeg(false);
                                                            setPegVideoUrl(null);
                                                            setPegLogCreated(false);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setNvugibOverviewLogCreated(false);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            setLoadingNvugibOverview(true);
                                                            setNvugibOverviewError(null);
                                                            try {
                                                                const videoFileName = 'NVUGIB_overview.mp4';
                                                                const storagePath = `EGD_Hemostasis_training/lecture/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setNvugibOverviewVideoUrl(data.url);
                                                                setShowNvugibOverview(true);
                                                            } catch (error: any) {
                                                                setNvugibOverviewError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingNvugibOverview(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                            NVUGIB 총론 강의
                                                        </h3>
                                                        <p className="text-white text-sm">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {nvugibOverviewError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {nvugibOverviewError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingNvugibOverview && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : selectedItem === 'nvugib-case' ? (
                                        // NVUGIB case 해설: 카드 형식으로 강의 목록 표시
                                        showNvugibCase && nvugibCaseVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={nvugibCasePlayerRef}
                                                isOpen={showNvugibCase}
                                                videoUrl={nvugibCaseVideoUrl}
                                                onPlay={async () => {
                                                    // Create log file when video starts playing
                                                    if (selectedNvugibCase && userProfile && !nvugibCaseLogCreated.has(selectedNvugibCase)) {
                                                        try {
                                                            const logFileName = `${userProfile.position}-${userProfile.name}-${selectedNvugibCase}`;
                                                            const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F1
Section: 치료 내시경 임상
Item: NVUGIB case 해설
Case: ${selectedNvugibCase}
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                            const response = await fetch('/api/log/create', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    fileName: logFileName,
                                                                    content: logContent,
                                                                }),
                                                            });

                                                            if (response.ok) {
                                                                setNvugibCaseLogCreated(prev => new Set(prev).add(selectedNvugibCase));
                                                            }
                                                        } catch (error) {
                                                            console.error('Error creating log file:', error);
                                                        }
                                                    }
                                                }}
                                                onClose={() => {
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setNvugibCaseError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowNvugibCase(false);
                                                    setNvugibCaseVideoUrl(null);
                                                    setSelectedNvugibCase(null);
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 그리드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* NVUGIB case 목록 카드 그리드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    {nvugibCases.map((caseItem) => (
                                                        <div
                                                            key={caseItem}
                                                            className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                            onClick={async () => {
                                                                // Hide other video players
                                                                setShowVideo(false);
                                                                setVideoUrl(null);
                                                                setShowMtDemo(false);
                                                                setMtDemoVideoUrl(null);
                                                                setShowShtOrientation(false);
                                                                setShtOrientationVideoUrl(null);
                                                                setShowShtExpertDemo(false);
                                                                setShtExpertDemoVideoUrl(null);
                                                                setShowEmtOrientation(false);
                                                                setEmtOrientationVideoUrl(null);
                                                                setShowEmtExemplary(false);
                                                                setEmtExemplaryVideoUrl(null);
                                                                setShowDxEgdLecture(false);
                                                                setDxEgdLectureVideoUrl(null);
                                                                setSelectedLecture(null);
                                                                setShowOtherLecture(false);
                                                                setOtherLectureVideoUrl(null);
                                                                setShowEgdVariation(false);
                                                                setEgdVariationVideoUrl(null);
                                                                setSelectedEgdVariationCode(null);
                                                                setShowHemoclip(false);
                                                                setHemoclipVideoUrl(null);
                                                                setHemoclipLogCreated(false);
                                                                setShowInjection(false);
                                                                setInjectionVideoUrl(null);
                                                                setInjectionLogCreated(false);
                                                                setShowApc(false);
                                                                setApcVideoUrl(null);
                                                                setApcLogCreated(false);
                                                                setShowNexpowder(false);
                                                                setNexpowderVideoUrl(null);
                                                                setNexpowderLogCreated(false);
                                                                setShowEvl(false);
                                                                setEvlVideoUrl(null);
                                                                setEvlLogCreated(false);
                                                                setShowPeg(false);
                                                                setPegVideoUrl(null);
                                                                setPegLogCreated(false);
                                                                setShowNvugibOverview(false);
                                                                setNvugibOverviewVideoUrl(null);
                                                                setNvugibOverviewLogCreated(false);

                                                                setLoadingNvugibCase(true);
                                                                setNvugibCaseError(null);
                                                                setSelectedNvugibCase(caseItem);
                                                                try {
                                                                    const videoFileName = `${caseItem}.mp4`;
                                                                    const storagePath = `EGD_Hemostasis_training/cases/${videoFileName}`;
                                                                    const response = await fetch(
                                                                        `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                    );
                                                                    if (!response.ok) {
                                                                        throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                    }
                                                                    const data = await response.json();
                                                                    setNvugibCaseVideoUrl(data.url);
                                                                    setShowNvugibCase(true);
                                                                } catch (error: any) {
                                                                    setNvugibCaseError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                } finally {
                                                                    setLoadingNvugibCase(false);
                                                                }
                                                            }}
                                                        >
                                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                                {caseItem}
                                                            </h3>
                                                            <p className="text-white text-sm">
                                                                클릭하여 동영상 시청
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* 에러 메시지 */}
                                                {nvugibCaseError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {nvugibCaseError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingNvugibCase && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : category === 'advanced' && selectedItem === 'diagnostic-eus-lecture' ? (
                                        // 진단 EUS 강의: 카드 형식으로 표시
                                        showDiagnosticEus && diagnosticEusVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={diagnosticEusPlayerRef}
                                                isOpen={showDiagnosticEus}
                                                videoUrl={diagnosticEusVideoUrl}
                                                userEmail={user?.email || null}
                                                userPosition={userProfile?.position}
                                                userName={userProfile?.name}
                                                userHospital={userProfile?.hospital}
                                                videoTitle={selectedDiagnosticEus || undefined}
                                                category="Advanced course for F2"
                                                onPlay={async () => {
                                                    // Create log file when video starts playing
                                                    if (selectedDiagnosticEus && userProfile && !diagnosticEusLogCreated.has(selectedDiagnosticEus)) {
                                                        try {
                                                            const logFileName = `${userProfile.position}-${userProfile.name}-${selectedDiagnosticEus}`;
                                                            const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F2
Section: 진단 EUS 강의
Lecture Title: ${selectedDiagnosticEus}
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                            const response = await fetch('/api/log/create', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    fileName: logFileName,
                                                                    content: logContent,
                                                                }),
                                                            });

                                                            if (response.ok) {
                                                                setDiagnosticEusLogCreated(prev => new Set(prev).add(selectedDiagnosticEus));
                                                            }
                                                        } catch (error) {
                                                            console.error('Error creating log file:', error);
                                                        }
                                                    }
                                                }}
                                                onClose={() => {
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                    setDiagnosticEusError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowDiagnosticEus(false);
                                                    setDiagnosticEusVideoUrl(null);
                                                    setSelectedDiagnosticEus(null);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 카드 그리드 표시
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* 진단 EUS 강의 카드 그리드 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-[60%]">
                                                    {/* EUS_basic 카드 */}
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer flex flex-col text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            const lectureName = 'EUS_basic';
                                                            setLoadingDiagnosticEus(true);
                                                            setDiagnosticEusError(null);
                                                            setSelectedDiagnosticEus(lectureName);
                                                            try {
                                                                const videoFileName = `${lectureName}.mp4`;
                                                                const storagePath = `Lectures/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setDiagnosticEusVideoUrl(data.url);
                                                                setShowDiagnosticEus(true);
                                                            } catch (error: any) {
                                                                setDiagnosticEusError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingDiagnosticEus(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-4 flex-1">
                                                            EUS_basic
                                                        </h3>
                                                        <p className="text-white text-sm mt-auto text-left">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>

                                                    {/* EUS_SET 카드 */}
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer flex flex-col text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            const lectureName = 'EUS_SET';
                                                            setLoadingDiagnosticEus(true);
                                                            setDiagnosticEusError(null);
                                                            setSelectedDiagnosticEus(lectureName);
                                                            try {
                                                                const videoFileName = `${lectureName}.mp4`;
                                                                const storagePath = `Lectures/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setDiagnosticEusVideoUrl(data.url);
                                                                setShowDiagnosticEus(true);
                                                            } catch (error: any) {
                                                                setDiagnosticEusError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingDiagnosticEus(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-4 flex-1">
                                                            EUS_SET
                                                        </h3>
                                                        <p className="text-white text-sm mt-auto text-left">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>

                                                    {/* EUS_case 카드 */}
                                                    <div
                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer flex flex-col text-white"
                                                        onClick={async () => {
                                                            // Hide other video players
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                            setShowDxEgdLecture(false);
                                                            setDxEgdLectureVideoUrl(null);
                                                            setSelectedLecture(null);
                                                            setShowOtherLecture(false);
                                                            setOtherLectureVideoUrl(null);
                                                            setShowEgdVariation(false);
                                                            setEgdVariationVideoUrl(null);
                                                            setSelectedEgdVariationCode(null);
                                                            setShowHemoclip(false);
                                                            setHemoclipVideoUrl(null);
                                                            setShowNvugibOverview(false);
                                                            setNvugibOverviewVideoUrl(null);
                                                            setShowNvugibCase(false);
                                                            setNvugibCaseVideoUrl(null);
                                                            setSelectedNvugibCase(null);
                                                            setShowDiagnosticEus(false);
                                                            setDiagnosticEusVideoUrl(null);
                                                            setSelectedDiagnosticEus(null);

                                                            const lectureName = 'EUS_case';
                                                            setLoadingDiagnosticEus(true);
                                                            setDiagnosticEusError(null);
                                                            setSelectedDiagnosticEus(lectureName);
                                                            try {
                                                                const videoFileName = `${lectureName}.mp4`;
                                                                const storagePath = `Lectures/${videoFileName}`;
                                                                const response = await fetch(
                                                                    `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                );
                                                                if (!response.ok) {
                                                                    throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                }
                                                                const data = await response.json();
                                                                setDiagnosticEusVideoUrl(data.url);
                                                                setShowDiagnosticEus(true);
                                                            } catch (error: any) {
                                                                setDiagnosticEusError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                            } finally {
                                                                setLoadingDiagnosticEus(false);
                                                            }
                                                        }}
                                                    >
                                                        <h3 className="text-xl font-semibold text-white mb-4 flex-1">
                                                            EUS_case
                                                        </h3>
                                                        <p className="text-white text-sm mt-auto text-left">
                                                            클릭하여 동영상 시청
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 에러 메시지 */}
                                                {diagnosticEusError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {diagnosticEusError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingDiagnosticEus && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (category === 'advanced' || category === 'advanced-f1') && selectedItem === 'egd-lesion-dx' ? (
                                        // EGD lesion Dx: 카드 형식으로 표시
                                        showEgdDxImage && egdDxImageUrl ? (
                                            // 이미지 뷰어가 표시될 때: 좌우 분할 레이아웃
                                            <div className="relative w-full h-full flex bg-black">
                                                {/* 닫기 버튼 */}
                                                <button
                                                    onClick={() => {
                                                        setShowEgdDxImage(false);
                                                        setEgdDxImageUrl(null);
                                                        setSelectedEgdDxImage(null);
                                                        setEgdDxImageError(null);
                                                        setEgdDxInstruction1('');
                                                        setEgdDxInstruction2('');
                                                        setEgdDxInstruction1Error(null);
                                                        setEgdDxInstruction2Error(null);
                                                        setShowEgdDxInstruction2(false);
                                                    }}
                                                    className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                                    aria-label="닫기"
                                                >
                                                    <X className="w-6 h-6 text-gray-800" />
                                                </button>

                                                {/* 왼쪽: 이미지 영역 (50% 너비) */}
                                                <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 relative">
                                                    {/* 파일명 마지막 2글자 (숫자) 표시 */}
                                                    {selectedEgdDxImage && (() => {
                                                        const base = selectedEgdDxImage.replace(/\.[^/.]+$/, '');
                                                        const label = base.length > 6 ? base.slice(-6) : base;
                                                        return (
                                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/90 text-xl font-semibold bg-black/50 px-3 py-1.5 rounded text-center">
                                                                {label}
                                                            </div>
                                                        );
                                                    })()}
                                                    {loadingEgdDxImage ? (
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                                            <p className="text-white">이미지를 불러오는 중...</p>
                                                        </div>
                                                    ) : egdDxImageError ? (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 max-w-md">
                                                            <p className="font-semibold mb-2">오류 발생</p>
                                                            <p>{egdDxImageError}</p>
                                                        </div>
                                                    ) : egdDxImageUrl ? (
                                                        <>
                                                            <div
                                                                className="w-full flex-1 flex items-center justify-center cursor-pointer"
                                                                onClick={() => setShowEgdDxImageWindow(true)}
                                                            >
                                                                <img
                                                                    src={egdDxImageUrl}
                                                                    alt={selectedEgdDxImage || ''}
                                                                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                                                                />
                                                            </div>
                                                            <p className="text-white/70 text-sm mt-2 text-center">
                                                                이미지를 더 크게 보려면 이미지를 클릭해서 새창을 여세요
                                                            </p>
                                                        </>
                                                    ) : null}
                                                </div>

                                                {/* 오른쪽: 메시지 박스 영역 (50% 너비) */}
                                                <div className="w-1/2 h-full flex flex-col gap-4 p-4 overflow-y-auto">
                                                    {/* 첫 번째 메시지 박스 */}
                                                    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 ${showEgdDxInstruction2 ? 'flex-none' : 'flex-1'} overflow-y-auto`}>
                                                        {loadingEgdDxInstruction1 ? (
                                                            <div className="flex items-center justify-center h-full">
                                                                <div className="text-center">
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                                                                    <p className="text-white text-xs">로딩 중...</p>
                                                                </div>
                                                            </div>
                                                        ) : egdDxInstruction1Error ? (
                                                            <p className="text-red-300 text-sm">{egdDxInstruction1Error}</p>
                                                        ) : egdDxInstruction1 ? (
                                                            <div className="text-white text-sm whitespace-pre-wrap leading-[2]">
                                                                {removeEmptyLines(egdDxInstruction1)}
                                                            </div>
                                                        ) : (
                                                            <p className="text-white/50 text-sm">내용이 없습니다.</p>
                                                        )}
                                                    </div>

                                                    {/* 진행 버튼 */}
                                                    <button
                                                        onClick={async () => {
                                                            setShowEgdDxInstruction2(true);

                                                            // Create log file
                                                            if (userProfile && selectedEgdDxImage) {
                                                                try {
                                                                    // Remove extension from image name
                                                                    const imageNameWithoutExt = selectedEgdDxImage.replace(/\.[^/.]+$/, '');
                                                                    const logFileName = `${userProfile.position}-${userProfile.name}-F1_${imageNameWithoutExt}`;

                                                                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F1
Section: EGD lesion Dx
Image Name: ${selectedEgdDxImage}
Action: Progress Button Click
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                                    const response = await fetch('/api/log/egd-lesion-dx', {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            fileName: logFileName,
                                                                            content: logContent,
                                                                        }),
                                                                    });

                                                                    if (!response.ok) {
                                                                        console.error('Failed to create log file');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error creating log file:', error);
                                                                }
                                                            }
                                                        }}
                                                        disabled={showEgdDxInstruction2 || !egdDxInstruction2}
                                                        className={`px-6 py-3 rounded-lg font-medium transition-colors flex-none ${showEgdDxInstruction2 || !egdDxInstruction2
                                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                            : 'bg-blue-500 hover:bg-blue-400 text-white transition-all duration-300 ease-in-out'
                                                            }`}
                                                    >
                                                        진행
                                                    </button>

                                                    {/* 두 번째 메시지 박스 (조건부 표시) */}
                                                    {showEgdDxInstruction2 && (
                                                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 flex-none overflow-visible">
                                                            {loadingEgdDxInstruction2 ? (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <div className="text-center">
                                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                                                                        <p className="text-white text-xs">로딩 중...</p>
                                                                    </div>
                                                                </div>
                                                            ) : egdDxInstruction2Error ? (
                                                                <p className="text-red-300 text-sm">{egdDxInstruction2Error}</p>
                                                            ) : egdDxInstruction2 ? (
                                                                <div className="text-white text-sm whitespace-pre-wrap leading-[2]">
                                                                    {removeEmptyLinesAndUnderscores(egdDxInstruction2)}
                                                                </div>
                                                            ) : (
                                                                <p className="text-white/50 text-sm">내용이 없습니다.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* EGD lesion Dx 카드 그리드 */}
                                                {loadingEgdDxImages ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                            <p className="text-gray-600">이미지 목록을 불러오는 중...</p>
                                                        </div>
                                                    </div>
                                                ) : egdDxImagesError ? (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {egdDxImagesError}
                                                    </div>
                                                ) : egdDxImages.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                        {egdDxImages.map((imageName, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEgdDxImage(imageName);
                                                                    setLoadingEgdDxImage(true);
                                                                    setEgdDxImageError(null);
                                                                    setEgdDxInstruction1('');
                                                                    setEgdDxInstruction2('');
                                                                    setEgdDxInstruction1Error(null);
                                                                    setEgdDxInstruction2Error(null);
                                                                    setLoadingEgdDxInstruction1(true);
                                                                    setLoadingEgdDxInstruction2(true);
                                                                    setShowEgdDxImage(true);
                                                                    setShowEgdDxInstruction2(false);

                                                                    // Load image
                                                                    try {
                                                                        const response = await fetch(`/api/egd-dx-image-url?imageName=${encodeURIComponent(imageName)}&version=F1`);
                                                                        if (!response.ok) {
                                                                            const contentType = response.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data = await response.json();
                                                                                throw new Error(data.error || '이미지를 불러오는 중 오류가 발생했습니다.');
                                                                            } else {
                                                                                throw new Error('이미지를 불러오는 중 오류가 발생했습니다.');
                                                                            }
                                                                        }
                                                                        const contentType = response.headers.get('content-type');
                                                                        if (contentType && contentType.includes('application/json')) {
                                                                            const data = await response.json();
                                                                            setEgdDxImageUrl(data.url);
                                                                        } else {
                                                                            throw new Error('예상치 못한 응답 형식입니다.');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxImageError(err.message || '이미지를 불러오는 중 오류가 발생했습니다.');
                                                                    } finally {
                                                                        setLoadingEgdDxImage(false);
                                                                    }

                                                                    // Load instruction 1
                                                                    try {
                                                                        const response1 = await fetch(`/api/egd-dx-docx-content?imageName=${encodeURIComponent(imageName)}&fileNumber=1&version=F1`);
                                                                        if (response1.ok) {
                                                                            const contentType = response1.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data1 = await response1.json();
                                                                                setEgdDxInstruction1(data1.text || '');
                                                                            } else {
                                                                                setEgdDxInstruction1('');
                                                                            }
                                                                        } else {
                                                                            // File not found is okay, just leave empty
                                                                            setEgdDxInstruction1('');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxInstruction1Error(err.message || '');
                                                                        setEgdDxInstruction1('');
                                                                    } finally {
                                                                        setLoadingEgdDxInstruction1(false);
                                                                    }

                                                                    // Load instruction 2
                                                                    try {
                                                                        const response2 = await fetch(`/api/egd-dx-docx-content?imageName=${encodeURIComponent(imageName)}&fileNumber=2&version=F1`);
                                                                        if (response2.ok) {
                                                                            const contentType = response2.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data2 = await response2.json();
                                                                                setEgdDxInstruction2(data2.text || '');
                                                                            } else {
                                                                                setEgdDxInstruction2('');
                                                                            }
                                                                        } else {
                                                                            // File not found is okay, just leave empty
                                                                            setEgdDxInstruction2('');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxInstruction2Error(err.message || '');
                                                                        setEgdDxInstruction2('');
                                                                    } finally {
                                                                        setLoadingEgdDxInstruction2(false);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        // onClick과 동일한 로직
                                                                    }
                                                                }}
                                                                tabIndex={0}
                                                                role="button"
                                                                className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                            >
                                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                                    {imageName}
                                                                </h3>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 text-gray-500">
                                                        이미지가 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : category === 'advanced' && selectedItem === 'egd-lesion-dx-f2' ? (
                                        // EGD lesion Dx F2: 카드 형식으로 표시
                                        showEgdDxImageF2 && egdDxImageUrlF2 ? (
                                            // 이미지 뷰어가 표시될 때: 좌우 분할 레이아웃
                                            <div className="relative w-full h-full flex bg-black">
                                                {/* 닫기 버튼 */}
                                                <button
                                                    onClick={() => {
                                                        setShowEgdDxImageF2(false);
                                                        setEgdDxImageUrlF2(null);
                                                        setSelectedEgdDxImageF2(null);
                                                        setEgdDxImageErrorF2(null);
                                                        setEgdDxInstruction1F2('');
                                                        setEgdDxInstruction2F2('');
                                                        setEgdDxInstruction1ErrorF2(null);
                                                        setEgdDxInstruction2ErrorF2(null);
                                                        setShowEgdDxInstruction2F2(false);
                                                    }}
                                                    className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                                    aria-label="닫기"
                                                >
                                                    <X className="w-6 h-6 text-gray-800" />
                                                </button>

                                                {/* 왼쪽: 이미지 영역 (50% 너비) */}
                                                <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 relative">
                                                    {/* 파일명 마지막 2글자 (숫자) 표시 */}
                                                    {selectedEgdDxImageF2 && (() => {
                                                        const base = selectedEgdDxImageF2.replace(/\.[^/.]+$/, '');
                                                        const label = base.length > 6 ? base.slice(-6) : base;
                                                        return (
                                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/90 text-xl font-semibold bg-black/50 px-3 py-1.5 rounded text-center">
                                                                {label}
                                                            </div>
                                                        );
                                                    })()}
                                                    {loadingEgdDxImageF2 ? (
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                                            <p className="text-white">이미지를 불러오는 중...</p>
                                                        </div>
                                                    ) : egdDxImageErrorF2 ? (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 max-w-md">
                                                            <p className="font-semibold mb-2">오류 발생</p>
                                                            <p>{egdDxImageErrorF2}</p>
                                                        </div>
                                                    ) : egdDxImageUrlF2 ? (
                                                        <>
                                                            <div
                                                                className="w-full flex-1 flex items-center justify-center cursor-pointer"
                                                                onClick={() => setShowEgdDxImageWindowF2(true)}
                                                            >
                                                                <img
                                                                    src={egdDxImageUrlF2}
                                                                    alt={selectedEgdDxImageF2 || ''}
                                                                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                                                                />
                                                            </div>
                                                            <p className="text-white/70 text-sm mt-2 text-center">
                                                                이미지를 더 크게 보려면 이미지를 클릭해서 새창을 여세요
                                                            </p>
                                                        </>
                                                    ) : null}
                                                </div>

                                                {/* 오른쪽: 메시지 박스 영역 (50% 너비) */}
                                                <div className="w-1/2 h-full flex flex-col gap-4 p-4 overflow-y-auto">
                                                    {/* 첫 번째 메시지 박스 */}
                                                    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 ${showEgdDxInstruction2F2 ? 'flex-none' : 'flex-1'} overflow-y-auto`}>
                                                        {loadingEgdDxInstruction1F2 ? (
                                                            <div className="flex items-center justify-center h-full">
                                                                <div className="text-center">
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                                                                    <p className="text-white text-xs">로딩 중...</p>
                                                                </div>
                                                            </div>
                                                        ) : egdDxInstruction1ErrorF2 ? (
                                                            <p className="text-red-300 text-sm">{egdDxInstruction1ErrorF2}</p>
                                                        ) : egdDxInstruction1F2 ? (
                                                            <div className="text-white text-sm whitespace-pre-wrap leading-[2]">
                                                                {removeEmptyLines(egdDxInstruction1F2)}
                                                            </div>
                                                        ) : (
                                                            <p className="text-white/50 text-sm">내용이 없습니다.</p>
                                                        )}
                                                    </div>

                                                    {/* 진행 버튼 */}
                                                    <button
                                                        onClick={async () => {
                                                            setShowEgdDxInstruction2F2(true);

                                                            // Create log file
                                                            if (userProfile && selectedEgdDxImageF2) {
                                                                try {
                                                                    // Remove extension from image name
                                                                    const imageNameWithoutExt = selectedEgdDxImageF2.replace(/\.[^/.]+$/, '');
                                                                    const logFileName = `${userProfile.position}-${userProfile.name}-F2_${imageNameWithoutExt}`;

                                                                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F2
Section: EGD lesion Dx
Image Name: ${selectedEgdDxImageF2}
Action: Progress Button Click
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                                    const response = await fetch('/api/log/egd-lesion-dx', {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            fileName: logFileName,
                                                                            content: logContent,
                                                                        }),
                                                                    });

                                                                    if (!response.ok) {
                                                                        console.error('Failed to create log file');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error creating log file:', error);
                                                                }
                                                            }
                                                        }}
                                                        disabled={showEgdDxInstruction2F2 || !egdDxInstruction2F2}
                                                        className={`px-6 py-3 rounded-lg font-medium transition-colors flex-none ${showEgdDxInstruction2F2 || !egdDxInstruction2F2
                                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                            : 'bg-blue-500 hover:bg-blue-400 text-white transition-all duration-300 ease-in-out'
                                                            }`}
                                                    >
                                                        진행
                                                    </button>

                                                    {/* 두 번째 메시지 박스 (조건부 표시) */}
                                                    {showEgdDxInstruction2F2 && (
                                                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 flex-none overflow-visible">
                                                            {loadingEgdDxInstruction2F2 ? (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <div className="text-center">
                                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                                                                        <p className="text-white text-xs">로딩 중...</p>
                                                                    </div>
                                                                </div>
                                                            ) : egdDxInstruction2ErrorF2 ? (
                                                                <p className="text-red-300 text-sm">{egdDxInstruction2ErrorF2}</p>
                                                            ) : egdDxInstruction2F2 ? (
                                                                <div className="text-white text-sm whitespace-pre-wrap leading-[2]">
                                                                    {removeEmptyLinesAndUnderscores(egdDxInstruction2F2)}
                                                                </div>
                                                            ) : (
                                                                <p className="text-white/50 text-sm">내용이 없습니다.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* EGD lesion Dx F2 카드 그리드 */}
                                                {loadingEgdDxImagesF2 ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                            <p className="text-gray-600">이미지 목록을 불러오는 중...</p>
                                                        </div>
                                                    </div>
                                                ) : egdDxImagesErrorF2 ? (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {egdDxImagesErrorF2}
                                                    </div>
                                                ) : egdDxImagesF2.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                        {egdDxImagesF2.map((imageName, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEgdDxImageF2(imageName);
                                                                    setLoadingEgdDxImageF2(true);
                                                                    setEgdDxImageErrorF2(null);
                                                                    setEgdDxInstruction1F2('');
                                                                    setEgdDxInstruction2F2('');
                                                                    setEgdDxInstruction1ErrorF2(null);
                                                                    setEgdDxInstruction2ErrorF2(null);
                                                                    setLoadingEgdDxInstruction1F2(true);
                                                                    setLoadingEgdDxInstruction2F2(true);
                                                                    setShowEgdDxImageF2(true);
                                                                    setShowEgdDxInstruction2F2(false);

                                                                    // Load image
                                                                    try {
                                                                        const response = await fetch(`/api/egd-dx-image-url?imageName=${encodeURIComponent(imageName)}&version=F2`);
                                                                        if (!response.ok) {
                                                                            const contentType = response.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data = await response.json();
                                                                                throw new Error(data.error || '이미지를 불러오는 중 오류가 발생했습니다.');
                                                                            } else {
                                                                                throw new Error('이미지를 불러오는 중 오류가 발생했습니다.');
                                                                            }
                                                                        }
                                                                        const contentType = response.headers.get('content-type');
                                                                        if (contentType && contentType.includes('application/json')) {
                                                                            const data = await response.json();
                                                                            setEgdDxImageUrlF2(data.url);
                                                                        } else {
                                                                            throw new Error('예상치 못한 응답 형식입니다.');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxImageErrorF2(err.message || '이미지를 불러오는 중 오류가 발생했습니다.');
                                                                    } finally {
                                                                        setLoadingEgdDxImageF2(false);
                                                                    }

                                                                    // Load instruction 1
                                                                    try {
                                                                        const response1 = await fetch(`/api/egd-dx-docx-content?imageName=${encodeURIComponent(imageName)}&fileNumber=1&version=F2`);
                                                                        if (response1.ok) {
                                                                            const contentType = response1.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data1 = await response1.json();
                                                                                setEgdDxInstruction1F2(data1.text || '');
                                                                            } else {
                                                                                setEgdDxInstruction1F2('');
                                                                            }
                                                                        } else {
                                                                            setEgdDxInstruction1F2('');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxInstruction1ErrorF2(err.message || '');
                                                                        setEgdDxInstruction1F2('');
                                                                    } finally {
                                                                        setLoadingEgdDxInstruction1F2(false);
                                                                    }

                                                                    // Load instruction 2
                                                                    try {
                                                                        const response2 = await fetch(`/api/egd-dx-docx-content?imageName=${encodeURIComponent(imageName)}&fileNumber=2&version=F2`);
                                                                        if (response2.ok) {
                                                                            const contentType = response2.headers.get('content-type');
                                                                            if (contentType && contentType.includes('application/json')) {
                                                                                const data2 = await response2.json();
                                                                                setEgdDxInstruction2F2(data2.text || '');
                                                                            } else {
                                                                                setEgdDxInstruction2F2('');
                                                                            }
                                                                        } else {
                                                                            setEgdDxInstruction2F2('');
                                                                        }
                                                                    } catch (err: any) {
                                                                        setEgdDxInstruction2ErrorF2(err.message || '');
                                                                        setEgdDxInstruction2F2('');
                                                                    } finally {
                                                                        setLoadingEgdDxInstruction2F2(false);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                    }
                                                                }}
                                                                tabIndex={0}
                                                                role="button"
                                                                className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                            >
                                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                                    {imageName}
                                                                </h3>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 text-gray-500">
                                                        이미지가 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : showPblF201 ? (
                                        // PBL F2 01 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF201Page onClose={() => setShowPblF201(false)} />
                                        </div>
                                    ) : showPblF202 ? (
                                        // PBL F2 02 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF202Page onClose={() => setShowPblF202(false)} />
                                        </div>
                                    ) : showPblF203 ? (
                                        // PBL F2 03 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF203Page onClose={() => setShowPblF203(false)} />
                                        </div>
                                    ) : showPblF204 ? (
                                        // PBL F2 04 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF204Page onClose={() => setShowPblF204(false)} />
                                        </div>
                                    ) : showPblF205 ? (
                                        // PBL F2 05 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF205Page onClose={() => setShowPblF205(false)} />
                                        </div>
                                    ) : showPblF206 ? (
                                        // PBL F2 06 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF206Page onClose={() => setShowPblF206(false)} />
                                        </div>
                                    ) : showPblF207 ? (
                                        // PBL F2 07 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF207Page onClose={() => setShowPblF207(false)} />
                                        </div>
                                    ) : showPblF208 ? (
                                        // PBL F2 08 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF208Page onClose={() => setShowPblF208(false)} />
                                        </div>
                                    ) : showPblF209 ? (
                                        // PBL F2 09 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF209Page onClose={() => setShowPblF209(false)} />
                                        </div>
                                    ) : showPblF210 ? (
                                        // PBL F2 10 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF210Page onClose={() => setShowPblF210(false)} />
                                        </div>
                                    ) : showPblF211 ? (
                                        // PBL F2 11 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF211Page onClose={() => setShowPblF211(false)} />
                                        </div>
                                    ) : showPblF212 ? (
                                        // PBL F2 12 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF212Page onClose={() => setShowPblF212(false)} />
                                        </div>
                                    ) : showPblF213 ? (
                                        // PBL F2 13 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF213Page onClose={() => setShowPblF213(false)} />
                                        </div>
                                    ) : showPblF214 ? (
                                        // PBL F2 14 새 창 표시
                                        <div className="relative w-full h-full">
                                            <PblF214Page onClose={() => setShowPblF214(false)} />
                                        </div>
                                    ) : category === 'advanced' && selectedItem === 'problem-oriented-learning' ? (
                                        // Problem-Based Learning (PBL) for F2: 카드 형식으로 표시
                                        <div className="flex flex-col h-full overflow-y-auto">
                                            <div className="mb-6">
                                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                    {selectedContent?.title}
                                                </h1>
                                                <p className="text-lg text-gray-700">
                                                    {selectedContent?.content}
                                                </p>
                                            </div>
                                            <div className="border-t border-gray-300 mb-6"></div>

                                            {/* Problem-Based Learning (PBL) for F2 카드 그리드 */}
                                            <div className="mb-8">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                                    {courseConfig['pbl']?.items.map((item, index) => {
                                                        const itemNumber = String(index + 1).padStart(2, '0');
                                                        const isSelected = selectedItem === item.id;
                                                        const [title, subtitle] = item.content.split('|');
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => {
                                                                    if (!checkAuth()) return;
                                                                    // 01 stage IV AGC 버튼인 경우 새 창 표시
                                                                    if (item.id === 'pbl-f2-01') {
                                                                        setShowPblF201(true);
                                                                    } else if (item.id === 'pbl-f2-02') {
                                                                        setShowPblF202(true);
                                                                    } else if (item.id === 'pbl-f2-03') {
                                                                        setShowPblF203(true);
                                                                    } else if (item.id === 'pbl-f2-04') {
                                                                        setShowPblF204(true);
                                                                    } else if (item.id === 'pbl-f2-05') {
                                                                        setShowPblF205(true);
                                                                    } else if (item.id === 'pbl-f2-06') {
                                                                        setShowPblF206(true);
                                                                    } else if (item.id === 'pbl-f2-07') {
                                                                        setShowPblF207(true);
                                                                    } else if (item.id === 'pbl-f2-08') {
                                                                        setShowPblF208(true);
                                                                    } else if (item.id === 'pbl-f2-09') {
                                                                        setShowPblF209(true);
                                                                    } else if (item.id === 'pbl-f2-10') {
                                                                        setShowPblF210(true);
                                                                    } else if (item.id === 'pbl-f2-11') {
                                                                        setShowPblF211(true);
                                                                    } else if (item.id === 'pbl-f2-12') {
                                                                        setShowPblF212(true);
                                                                    } else if (item.id === 'pbl-f2-13') {
                                                                        setShowPblF213(true);
                                                                    } else if (item.id === 'pbl-f2-14') {
                                                                        setShowPblF214(true);
                                                                    } else {
                                                                        setSelectedItem(item.id);
                                                                    }
                                                                }}
                                                                className={`bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white ${isSelected ? 'border-blue-500 border-2' : 'border-blue-500'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                                        }`}>
                                                                        {itemNumber}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                                            {title}
                                                                        </h3>
                                                                        <p className="text-white text-sm">
                                                                            {subtitle || item.content}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : category === 'pbl' && selectedItem ? (
                                        // PBL: 카드 형식으로 표시
                                        <div className="flex flex-col h-full overflow-y-auto">
                                            <div className="mb-6">
                                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                    {selectedContent?.title}
                                                </h1>
                                                <p className="text-lg text-gray-700">
                                                    {selectedContent?.content?.split('|')[1] || selectedContent?.content}
                                                </p>
                                            </div>
                                            <div className="border-t border-gray-300 mb-6"></div>

                                            {/* PBL 카드 그리드 */}
                                            <div className="flex justify-start mb-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-[50%]">
                                                    {course.items.map((item, index) => {
                                                        const itemNumber = String(index + 1).padStart(2, '0');
                                                        const isSelected = selectedItem === item.id;
                                                        const [title, subtitle] = item.content.split('|');
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => setSelectedItem(item.id)}
                                                                className={`bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer h-[10vh] w-full ${isSelected ? 'border-blue-500 border-2' : 'border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                                        }`}>
                                                                        {itemNumber}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="text-xl font-semibold text-white mb-2">
                                                                            {title}
                                                                        </h3>
                                                                        <p className="text-white text-sm">
                                                                            {subtitle || item.content}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : selectedItem === 'egd-variation' ? (
                                        // EGD variation: 좌우 분할 레이아웃 (이미지와 동일)
                                        showEgdVariation && egdVariationVideoUrl ? (
                                            <FullScreenVideoPlayer
                                                ref={egdVariationPlayerRef}
                                                isOpen={showEgdVariation}
                                                videoUrl={egdVariationVideoUrl || ''}
                                                userEmail={user?.email || null}
                                                userPosition={userProfile?.position}
                                                userName={userProfile?.name}
                                                userHospital={userProfile?.hospital}
                                                videoTitle={selectedEgdVariationCode || undefined}
                                                category="EGD variation"
                                                onPlay={async () => {
                                                    // Create log file when video starts playing
                                                    if (selectedEgdVariationCode && userProfile && !egdVariationLogCreated.has(selectedEgdVariationCode)) {
                                                        try {
                                                            const logFileName = `${userProfile.position}-${userProfile.name}-${selectedEgdVariationCode}`;
                                                            const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Hospital: ${userProfile.hospital}
Email: ${user?.email || ''}
Category: Advanced course for F1
Section: EGD variation
Code: ${selectedEgdVariationCode}
Action: Video Play
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                                                            const response = await fetch('/api/log/create', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    fileName: logFileName,
                                                                    content: logContent,
                                                                }),
                                                            });

                                                            if (response.ok) {
                                                                setEgdVariationLogCreated(prev => new Set(prev).add(selectedEgdVariationCode));
                                                            }
                                                        } catch (error) {
                                                            console.error('Error creating log file:', error);
                                                        }
                                                    }
                                                }}
                                                onClose={() => {
                                                    setShowEgdVariation(false);
                                                    setEgdVariationVideoUrl(null);
                                                    setSelectedEgdVariationCode(null);
                                                    setEgdVariationError(null);
                                                }}
                                                onEnded={() => {
                                                    setShowEgdVariation(false);
                                                    setEgdVariationVideoUrl(null);
                                                    setSelectedEgdVariationCode(null);
                                                }}
                                            />
                                        ) : (
                                            // 플레이어가 없을 때: 좌우 분할 레이아웃
                                            <div className="flex flex-col h-full overflow-y-auto">
                                                <div className="mb-6">
                                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                        {selectedContent?.title}
                                                    </h1>
                                                    <p className="text-lg text-gray-700">
                                                        {selectedContent?.content}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-300 mb-6"></div>

                                                {/* 좌우 분할 레이아웃 */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '1rem', rowGap: '1rem', alignItems: 'start' }}>
                                                    {egdVariationItems.map((item, index) => (
                                                        <React.Fragment key={`variation-${index}`}>
                                                            {/* 왼쪽: 설명 텍스트 */}
                                                            <div className="text-left">
                                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                                    <p className="text-gray-700 whitespace-normal">{item.description}</p>
                                                                </div>
                                                            </div>

                                                            {/* 오른쪽: 코드 버튼들 */}
                                                            <div key={`buttons-${index}`} className="flex-shrink-0">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.codes.map((code) => (
                                                                        <button
                                                                            key={code}
                                                                            onClick={async () => {
                                                                                // Hide other video players
                                                                                setShowVideo(false);
                                                                                setVideoUrl(null);
                                                                                setShowMtDemo(false);
                                                                                setMtDemoVideoUrl(null);
                                                                                setShowShtOrientation(false);
                                                                                setShtOrientationVideoUrl(null);
                                                                                setShowShtExpertDemo(false);
                                                                                setShtExpertDemoVideoUrl(null);
                                                                                setShowEmtOrientation(false);
                                                                                setEmtOrientationVideoUrl(null);
                                                                                setShowEmtExemplary(false);
                                                                                setEmtExemplaryVideoUrl(null);
                                                                                setShowDxEgdLecture(false);
                                                                                setDxEgdLectureVideoUrl(null);
                                                                                setSelectedLecture(null);
                                                                                setShowOtherLecture(false);
                                                                                setOtherLectureVideoUrl(null);

                                                                                setLoadingEgdVariation(true);
                                                                                setEgdVariationError(null);
                                                                                setSelectedEgdVariationCode(code);
                                                                                try {
                                                                                    const videoFileName = `${code}.mp4`;
                                                                                    const storagePath = `EGD_variation/${videoFileName}`;
                                                                                    const response = await fetch(
                                                                                        `/api/video-url?path=${encodeURIComponent(storagePath)}`
                                                                                    );
                                                                                    if (!response.ok) {
                                                                                        throw new Error('동영상을 불러오는 중 오류가 발생했습니다.');
                                                                                    }
                                                                                    const data = await response.json();
                                                                                    setEgdVariationVideoUrl(data.url);
                                                                                    setShowEgdVariation(true);
                                                                                } catch (error: any) {
                                                                                    setEgdVariationError(error.message || '동영상을 불러오는 중 오류가 발생했습니다.');
                                                                                } finally {
                                                                                    setLoadingEgdVariation(false);
                                                                                }
                                                                            }}
                                                                            className={`px-4 py-2 rounded transition-all duration-300 ease-in-out text-sm ${selectedEgdVariationCode === code
                                                                                ? 'bg-blue-500 text-white'
                                                                                : 'bg-blue-500 text-white hover:bg-blue-400'
                                                                                }`}
                                                                        >
                                                                            {code}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                {/* 에러 메시지 */}
                                                {egdVariationError && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                                                        {egdVariationError}
                                                    </div>
                                                )}

                                                {/* 로딩 메시지 */}
                                                {loadingEgdVariation && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-600">
                                                        동영상을 불러오는 중...
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                                                {selectedContent.title}
                                            </h1>
                                            <div className="prose max-w-none">
                                                <p className="text-lg text-gray-700 leading-relaxed">
                                                    {selectedContent.content}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8">
                                    {category === 'basic' || category === 'advanced-f1' ? (
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                                                {course.name}
                                            </h2>
                                            {category === 'advanced-f1' && course.sections ? (
                                                // Advanced F1: 섹션별로 카드 그리드 표시
                                                <div className="space-y-8">
                                                    {course.sections.map((section) => (
                                                        <div key={section.id}>
                                                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                                                                {section.title}
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {section.items.map((item) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                                        onClick={() => {
                                                                            setSelectedItem(item.id);
                                                                            setShowVideo(false);
                                                                            setVideoUrl(null);
                                                                            setShowMtDemo(false);
                                                                            setMtDemoVideoUrl(null);
                                                                            setShowShtOrientation(false);
                                                                            setShtOrientationVideoUrl(null);
                                                                            setShowShtExpertDemo(false);
                                                                            setShtExpertDemoVideoUrl(null);
                                                                            setShowEmtOrientation(false);
                                                                            setEmtOrientationVideoUrl(null);
                                                                            setShowEmtExemplary(false);
                                                                            setEmtExemplaryVideoUrl(null);
                                                                        }}
                                                                    >
                                                                        <h4 className="text-xl font-semibold text-white mb-3">
                                                                            {item.title}
                                                                        </h4>
                                                                        <p className="text-white text-sm mb-4">
                                                                            {item.content}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Basic course: 기존 방식
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                                    {course.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                            onClick={() => {
                                                                setSelectedItem(item.id);
                                                                setShowVideo(false);
                                                                setVideoUrl(null);
                                                                setShowMtDemo(false);
                                                                setMtDemoVideoUrl(null);
                                                                setShowShtOrientation(false);
                                                                setShtOrientationVideoUrl(null);
                                                                setShowShtExpertDemo(false);
                                                                setShtExpertDemoVideoUrl(null);
                                                            }}
                                                        >
                                                            <h3 className="text-xl font-semibold text-white mb-3">
                                                                {item.title}
                                                            </h3>
                                                            <p className="text-white text-sm mb-4">
                                                                {item.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                                {course.name}에 오신 것을 환영합니다
                                            </h2>
                                            <p className="text-xl text-gray-600 mb-8">
                                                왼쪽 사이드바에서 학습 항목을 선택하여 시작하세요.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {course.items.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setSelectedItem(item.id);
                                                            setShowVideo(false);
                                                            setVideoUrl(null);
                                                            setShowMtDemo(false);
                                                            setMtDemoVideoUrl(null);
                                                            setShowShtOrientation(false);
                                                            setShtOrientationVideoUrl(null);
                                                            setShowShtExpertDemo(false);
                                                            setShtExpertDemoVideoUrl(null);
                                                            setShowLhtOrientation(false);
                                                            setLhtOrientationVideoUrl(null);
                                                            setShowLhtExpertDemo(false);
                                                            setLhtExpertDemoVideoUrl(null);
                                                            setShowEmtOrientation(false);
                                                            setEmtOrientationVideoUrl(null);
                                                            setShowEmtExemplary(false);
                                                            setEmtExemplaryVideoUrl(null);
                                                        }}
                                                        className="p-4 bg-blue-500 border border-blue-600 rounded-lg hover:bg-blue-400 transition-all duration-300 ease-in-out text-left text-white"
                                                    >
                                                        <h3 className="font-semibold text-white">{item.title}</h3>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* EGD Dx 이미지 새 창 모달 */}
            <ImageWindow
                isOpen={showEgdDxImageWindow}
                imageUrl={egdDxImageUrl}
                title={selectedEgdDxImage || '이미지'}
                onClose={() => {
                    setShowEgdDxImageWindow(false);
                }}
            />

            {/* EGD Dx F2 이미지 새 창 모달 */}
            <ImageWindow
                isOpen={showEgdDxImageWindowF2}
                imageUrl={egdDxImageUrlF2}
                title={selectedEgdDxImageF2 || '이미지'}
                onClose={() => {
                    setShowEgdDxImageWindowF2(false);
                }}
            />

            {/* EMT 마커 검출 시각화 모달 */}
            {showEmtVisualization && emtVisualizationUrls.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">마커 검출 시각화 (1초에 3프레임)</h2>
                            <button
                                onClick={() => {
                                    setShowEmtVisualization(false);
                                    setEmtVisualizationUrls([]);
                                    setEmtVisualizationIndex(0);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    {emtVisualizationIndex + 1} / {emtVisualizationUrls.length}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEmtVisualizationIndex(prev =>
                                                prev > 0 ? prev - 1 : emtVisualizationUrls.length - 1
                                            );
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        이전
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEmtVisualizationIndex(prev =>
                                                prev < emtVisualizationUrls.length - 1 ? prev + 1 : 0
                                            );
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        다음
                                    </button>
                                </div>
                            </div>

                            {emtVisualizationUrls[emtVisualizationIndex] && (
                                <div className="text-center">
                                    <div className="mb-2">
                                        <span className="text-sm text-gray-600">
                                            프레임: {emtVisualizationUrls[emtVisualizationIndex].frame} |
                                            시간: {Math.floor(emtVisualizationUrls[emtVisualizationIndex].time / 60)}:
                                            {Math.floor(emtVisualizationUrls[emtVisualizationIndex].time % 60).toString().padStart(2, '0')} |
                                            {emtVisualizationUrls[emtVisualizationIndex].hasMarker ? (
                                                <span className="text-green-600 font-bold">마커 검출됨</span>
                                            ) : (
                                                <span className="text-gray-500">마커 미검출</span>
                                            )}
                                        </span>
                                    </div>
                                    <img
                                        src={emtVisualizationUrls[emtVisualizationIndex].url}
                                        alt={`Frame ${emtVisualizationUrls[emtVisualizationIndex].frame}`}
                                        className="max-w-full h-auto mx-auto border-2 border-gray-300 rounded"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-center text-sm text-gray-500">
                            <p>자동 재생: 1초에 3프레임 (약 0.33초마다 자동 전환)</p>
                            <p>빨간 원: 마커가 검출된 위치 (50픽셀 반경)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

