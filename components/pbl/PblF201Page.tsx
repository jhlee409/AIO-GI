/**
 * PBL F2 01 Component
 * Problem-Based Learning for F2 - stage IV AGC 환자의 검사와 치료
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, AlertCircle, Home, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

interface ConversationStep {
    step: number;
    type: 'message' | 'image' | 'multipleImages' | 'multipleChoice' | 'final' | 'final_assignment';
    content: string;
    buttonText?: string;
    imageSrc?: string;
    imageAlt?: string;
    images?: Array<{ fileName: string; alt: string }>;
    options?: string[];
    correctAnswer?: number;
    markers?: string[];
    finalContent?: string;
}

const conversationSteps: Record<number, ConversationStep> = {
    1: {
        step: 1,
        type: 'message',
        content: '로딩이 완료 되었습니다. 환자에 대해 말씀 드릴까요?',
        buttonText: '예'
    },
    2: {
        step: 2,
        type: 'message',
        content: '환자에 대해 설명드리겠습니다.<br><br>29세 남자로, 지속되는 심와부 통증으로 타병원에 방문하였고, 상부 위장관 내시경에서 이상 소견이 발견되어 본원으로 전원 되었습니다. 심와부의 중등도 통증 외에 다른 증상은 없습니다.<br><br>EGD image를 보여드릴까요?',
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD 내시경 이미지',
        content: '당연히 EGD 검사 중에 이런 병변이 관찰되었다면 조직생검을 시행합니다. 조직생검 결과를 보여드릴까요?',
        buttonText: '예'
    },
    4: {
        step: 4,
        type: 'image',
        imageSrc: 'Biopsy report.png',
        imageAlt: '조직생검 리포트',
        content: '다음으로 이 병변은 조기위암보다는 진행성 위암으로 판단되므로 위암의 stage를 알기 위해 복부 CT 뿐 아니라, 전신 PET 검사도 시행해야 합니다. 두 검사의 이미지와 결과를 보여드릴까요?',
        buttonText: '예'
    },
    5: {
        step: 5,
        type: 'multipleImages',
        images: [
            { fileName: 'Abdominal CT.png', alt: '복부 CT 이미지' },
            { fileName: 'PET.png', alt: 'PET 스캔 이미지' }
        ],
        content: '이 환자의 위선암의 clinical stage는 무엇입니까?',
        options: ['stage I', 'stage II', 'stage III', 'stage IV'],
        correctAnswer: 3
    },
    6: {
        step: 6,
        type: 'multipleChoice',
        content: '예 맞습니다. 그럼 이 환자에서 선택할 수 있는 치료 전략은 무엇일까요?',
        options: [
            'surgical radical dissection for curative intent',
            'palliative surgery',
            'neoadjuvant chemoTx. and surgery',
            'palliative chemoTx'
        ],
        correctAnswer: 3
    },
    7: {
        step: 7,
        type: 'multipleChoice',
        content: '예 맞습니다. 이 환자의 경우 원칙적으로, 원격전이에 해당하는 paraaortic lymph node로의 전이가 관찰되므로 palliative chemotherapy가 표준 치료 전략입니다. 그런데, 이 환자에서 palliative chemotherapy 후 추적 검사에서 paraaortic node 및 regional lymph node들에 관해가 나타나, R0 resection을 목적으로 surgical resection을 시행하였습니다. 그럼 이와 같이 palliative chemo후 원격전이에 완전 관해가 되어, R0 resection을 목적으로 surgical resection 경우의 수술을 일컫는 용어는 무엇일까요?',
        options: ['R0 resection', 'conversion surgery', 'radical surgery', 'palliative surgery'],
        correctAnswer: 1
    },
    8: {
        step: 8,
        type: 'final',
        content: '예 맞습니다. 그럼 이 환자에서 효과적인 표적항암제를 찾기 위해 내시경 조직 생검에 대해 추가로 요청할 면역화학염색 검사 다섯 가지는 다음과 같습니다.',
        markers: ['c-ERB B2', 'PD-L1', 'EBV', 'MSI', 'Claudin 18'],
        finalContent: '2024년 현재 우리나라에서 보험 적용을 받을 수 있는 위암 4기 표적치료 항암제는 HER2 양성일 경우 trastuzumab 혹은 herceptin, PD-L1 28-8의 CPS 값이 5이상일 경우 nivolumab 이렇게 두 가지입니다. 그럼 이 환자의 IHC report를 보여드릴까요?',
        buttonText: '예'
    },
    9: {
        step: 9,
        type: 'final_assignment',
        content: '마지막으로 과제입니다. 제시되는 실제 환자의 IHC의 결과를 보여주는 병리 report에서 그 5가지 항목의 유무를 해석하고, 이 결과에 따라 사용되는 흔한 chemo regimen 한 가지를 약자로 기술하고, 이 치료를 받은 후 기대할 수 있는 기대 여명을 적어 PBS_amc_F2_01_이름.docx 파일로 제출해 주세요.<br><br>수고하셨습니다.'
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_01', onImageLoad }: ImageDisplayProps) {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchImage() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/pbl-image-url?imageName=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(folder)}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch image');
                }

                const data = await response.json();
                setImageUrl(data.url);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load image');
            } finally {
                setLoading(false);
            }
        }

        if (fileName) {
            fetchImage();
        }
    }, [fileName, folder]);

    const handleImageLoad = () => {
        if (onImageLoad) {
            onImageLoad();
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-red-800 text-sm">이미지를 불러올 수 없습니다: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <img
                src={imageUrl}
                alt={alt}
                className="rounded-lg shadow-md max-w-full h-auto"
                onLoad={handleImageLoad}
            />
        </div>
    );
}

interface ConversationStepComponentProps {
    stepData: ConversationStep;
    onNextStep: (step: number) => void;
    onSelectAnswer: (stepNumber: number, selectedIndex: number) => void;
    onImageLoad?: () => void;
}

function ConversationStepComponent({
    stepData,
    onNextStep,
    onSelectAnswer,
    onImageLoad
}: ConversationStepComponentProps) {
    if (!stepData) return null;

    return (
        <div className="mb-6">
            {/* Image Display */}
            {stepData.type === 'image' && stepData.imageSrc && (
                <ImageDisplay
                    fileName={stepData.imageSrc}
                    alt={stepData.imageAlt || ''}
                    onImageLoad={onImageLoad}
                />
            )}
            {stepData.type === 'multipleImages' && stepData.images && (
                <>
                    {stepData.images.map((img, index) => (
                        <ImageDisplay
                            key={index}
                            fileName={img.fileName}
                            alt={img.alt}
                            onImageLoad={onImageLoad}
                        />
                    ))}
                </>
            )}

            {/* Message Content */}
            <div className="bg-sky-100 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <p
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: stepData.content }}
                        />
                    </div>
                </div>
            </div>

            {/* Buttons based on type */}
            {(stepData.type === 'message' || stepData.type === 'image') && stepData.buttonText && (
                <div className="flex justify-center">
                    <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200"
                        onClick={() => onNextStep(stepData.step + 1)}
                    >
                        {stepData.buttonText}
                    </button>
                </div>
            )}

            {(stepData.type === 'multipleChoice' || stepData.type === 'multipleImages') && stepData.options && (
                <div className="flex flex-col gap-3">
                    {(() => {
                        const maxLength = Math.max(...stepData.options.map(opt => opt.length));
                        // 텍스트가 30자 이상이면 한 줄에 한 개씩 배치 (대화 상자 가로 길이의 50%를 넘는 경우)
                        const buttonsPerRow = maxLength >= 30 ? 1 : 4;

                        const rows: React.ReactElement[] = [];
                        for (let i = 0; i < stepData.options.length; i += buttonsPerRow) {
                            const rowOptions = stepData.options.slice(i, i + buttonsPerRow);
                            rows.push(
                                <div key={i} className="flex flex-wrap gap-3 justify-start">
                                    {rowOptions.map((rowOption: string, rowIndex: number) => (
                                        <button
                                            key={i + rowIndex}
                                            className={`bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm text-left whitespace-nowrap ${buttonsPerRow === 1 ? 'w-full' : 'flex-1 min-w-0 max-w-sm'
                                                }`}
                                            onClick={() => onSelectAnswer(stepData.step, i + rowIndex)}
                                        >
                                            {i + rowIndex + 1}. {rowOption}
                                        </button>
                                    ))}
                                </div>
                            );
                        }
                        return rows;
                    })()}
                </div>
            )}

            {stepData.type === 'final' && (
                <>
                    {/* Marker buttons in single row */}
                    <div className="flex flex-wrap gap-3 justify-center mb-4">
                        {stepData.markers?.map((marker: string, index: number) => (
                            <button
                                key={`marker-${index}`}
                                className="bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm"
                            >
                                {index + 1}. {marker}
                            </button>
                        ))}
                    </div>

                    {/* Final content message */}
                    <div className="bg-sky-100 rounded-lg p-4 mb-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-800 leading-relaxed">
                                    {stepData.finalContent}
                                </p>
                            </div>
                        </div>
                    </div>

                    {stepData.buttonText && (
                        <div className="flex justify-center">
                            <button
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200"
                                onClick={() => onNextStep(stepData.step + 1)}
                            >
                                {stepData.buttonText}
                            </button>
                        </div>
                    )}
                </>
            )}

            {stepData.type === 'final_assignment' && (
                <>
                    <ImageDisplay
                        fileName="IHC report.png"
                        alt="IHC 리포트"
                        onImageLoad={onImageLoad}
                    />

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <FileText className="w-16 h-16 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-blue-700 mb-2">학습 완료!</h3>
                                <p className="text-gray-600">
                                    AMC GI 상부 F2용 PBL 01 과정을 모두 완료하셨습니다.<br />
                                    과제 제출은 별도로 진행해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


export interface PblF201PageProps {
    onClose: () => void;
}

export function PblF201Page({ onClose }: PblF201PageProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<{ position: string; name: string } | null>(null);
    const logCreatedRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 시청 시간 저장 함수
    const saveWatchTimeBeforeNavigation = async () => {
        if (user?.email) {
            try {
                await fetch('/api/video/watch-time/save-on-logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email
                    }),
                    keepalive: true,
                });
            } catch (error) {
                console.error('Error saving watch time:', error);
            }
        }
    };

    // 초기 화면으로 (PBL 목록으로)
    const handleInitialScreen = () => {
        onClose();
    };

    // 이전 화면으로 (courses 페이지로)
    const handlePreviousScreen = async () => {
        await saveWatchTimeBeforeNavigation();
        router.push('/courses/advanced-f2');
    };

    // 홈으로
    const handleHome = async () => {
        await saveWatchTimeBeforeNavigation();
        router.push('/');
    };

    // 로그아웃
    const handleLogout = async () => {
        if (!auth) {
            console.error('Firebase Auth is not initialized');
            return;
        }
        await saveWatchTimeBeforeNavigation();
        await signOut(auth);
        router.push('/login');
    };

    const totalSteps = Object.keys(conversationSteps).length;

    // Load user profile
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.email) {
                setUserProfile(null);
                return;
            }

            try {
                const response = await fetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserProfile({
                        position: data.position || '',
                        name: data.name || '',
                    });
                } else {
                    console.error('Failed to load user profile');
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                setUserProfile(null);
            }
        };

        loadUserProfile();
    }, [user]);

    // Create log file when page loads
    useEffect(() => {
        if (user?.email && userProfile && !logCreatedRef.current) {
            const createLogFile = async () => {
                try {
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_01`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_01 - stage IV AGC 환자의 검사와 치료
Action: PBL Started
Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleString('ko-KR')}`;

                    const response = await fetch('/api/log/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fileName: fileName,
                            content: logContent,
                        }),
                    });

                    if (response.ok) {
                        logCreatedRef.current = true;
                    }
                } catch (error) {
                    console.error('Error creating log file:', error);
                }
            };

            createLogFile();
        }
    }, [user?.email, userProfile]);

    // Auto-scroll to bottom when new content is added
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messagesEndRef.current && scrollContainerRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [completedSteps, currentStep, errorMessage]);

    const handleNextStep = (step: number) => {
        if (step <= totalSteps) {
            setCurrentStep(step);
            setCompletedSteps(prev => [...prev, currentStep]);
            setErrorMessage(null);
        }
    };

    const isValidStep = (step: number): step is keyof typeof conversationSteps => {
        return step in conversationSteps;
    };

    const handleSelectAnswer = (stepNumber: number, selectedIndex: number) => {
        if (!isValidStep(stepNumber)) return;
        const stepData = conversationSteps[stepNumber];

        if ('correctAnswer' in stepData && stepData.correctAnswer !== undefined && selectedIndex === stepData.correctAnswer) {
            handleNextStep(stepNumber + 1);
        } else {
            setErrorMessage('기대한 대답이 아닙니다. 다시 생각해보고 대답해 주세요.');
        }
    };

    const handleImageLoad = () => {
        // 이미지 로드 완료 시 스크롤
        setTimeout(() => {
            if (messagesEndRef.current && scrollContainerRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-100 flex items-center justify-center p-4">
            {/* 창 테두리 */}
            <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300 w-[63%] h-[90vh] flex flex-col relative">
                {/* 네비게이션 버튼들 - 우측 상단 */}
                <div className="absolute top-4 right-16 z-50 flex items-center gap-2">
                    <button
                        onClick={handlePreviousScreen}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition flex items-center gap-2 text-sm"
                        title="이전 화면으로"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>이전 화면으로</span>
                    </button>
                    <button
                        onClick={handleInitialScreen}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition flex items-center gap-2 text-sm"
                        title="초기 화면으로"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>초기 화면으로</span>
                    </button>
                    <button
                        onClick={handleHome}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-400 transition flex items-center gap-2 text-sm"
                        title="홈으로"
                    >
                        <Home className="w-4 h-4" />
                        <span>홈으로</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition flex items-center gap-2 text-sm"
                        title="로그아웃"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>로그아웃</span>
                    </button>
                </div>
                {/* 고정된 닫기 버튼 - 우측 상단 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg border-2 border-gray-300 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-6 h-6 text-gray-800" />
                </button>

                {/* Main Content */}
                <main
                    ref={scrollContainerRef}
                    className="flex-1 container mx-auto px-4 py-6 overflow-y-auto"
                >
                    {/* Conversation Container */}
                    <div>
                        {/* Show completed steps */}
                        {completedSteps.map(step => (
                            <ConversationStepComponent
                                key={`completed-${step}`}
                                stepData={conversationSteps[step as keyof typeof conversationSteps]}
                                onNextStep={handleNextStep}
                                onSelectAnswer={handleSelectAnswer}
                                onImageLoad={handleImageLoad}
                            />
                        ))}

                        {/* Show current step */}
                        <ConversationStepComponent
                            key={`current-${currentStep}`}
                            stepData={conversationSteps[currentStep as keyof typeof conversationSteps]}
                            onNextStep={handleNextStep}
                            onSelectAnswer={handleSelectAnswer}
                            onImageLoad={handleImageLoad}
                        />

                        {/* Show error message if any */}
                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <p className="text-red-800">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </main>
            </div>
        </div>
    );
}

