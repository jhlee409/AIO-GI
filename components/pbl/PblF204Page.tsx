/**
 * PBL F2 04 Page
 * Problem-Based Learning for F2 - non curative ESD 후 수술하고 나온 병리 결과
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
        content: `환자에 대해 설명드리겠습니다.

1. 환자는 고혈압 약제를 복용하면서 큰 문제 없이 지내오던 75세의 남자입니다.
2. 얼마 전 검진 내시경에서 발견된 2-3 cm MB GC adenocarcinoma로 본원을 내원하였습니다.

선생님은 외래에서 EGD와 복부 CT를 의뢰하였습니다. 복부 CT는 정상 소견이었습니다.`,
        buttonText: ''
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD Image',
        content: `내시경 조직생검의 결과는 adenocarcinoma M/D 였습니다.

우선 환자에게 내시경으로 절제된 결과에 따라서는 수술적 절제를 추가로 할 수 있다는 설명을 했고, 환자는 내시경적 절제를 원하여서, ESD를 시행하였습니다. ESD image와 ESD pathology report image를 보시겠습니까?`,
        buttonText: '예'
    },
    4: {
        step: 4,
        type: 'multipleImages',
        images: [
            { fileName: 'ESD.png', alt: 'ESD Image' },
            { fileName: 'ESD pathology report.png', alt: 'ESD Pathology Report' }
        ],
        content: '이 병리 결과로 보면 curative resection일까요? non-curative resection일까요?',
        options: [
            'curative resection',
            'non-curative resection'
        ],
        correctAnswer: 1
    },
    5: {
        step: 5,
        type: 'message',
        content: `예, 맞습니다. PD 인 경우엔 curative resection의 Expanded indication은 En bloc resection, LVI -, HRM-, VRM -, 점막 국한, ulcer -, and 2 cm 이하입니다. 그러나 이 경우는 PD 2.5 cm, sm 1500 um invasion이므로 non curative resection입니다.

이런 경우 재발율에 대해서는 확실하게 정해진 수치는 없지만 20 - 30% 정도 재발율을 보인다고 얘기하는 것이 무난합니다. 즉 수술을 추가로 해야 안전합니다. 환자에게 잘 설명해서 추가 수술을 시행하였습니다.

그런데 수술 후 병리 검사의 결과 no residual cancer, no LN metastasis 였습니다. 환자는 어디서 조언을 구했는지, 안해도 되는 수술을 했다며 선생님에게 해명을 요구합니다.`,
        buttonText: ''
    },
    6: {
        step: 6,
        type: 'multipleChoice',
        content: '이 환자는 그럼 수술을 하지 않았어도 되나요?',
        options: [
            '수술을 하지 않았어도 되는 환자인데 운이 없었다.',
            '아니다 수술을 해야 한다.'
        ],
        correctAnswer: 1
    },
    7: {
        step: 7,
        type: 'final_assignment',
        content: `예, 맞습니다.

1. 놀랍게도, 일부 외과 선생님과 심지어는 소화기 내시경 전문가도 그렇게 얘기하는 경우가 있습니다. 이는 전적으로 틀린 말입니다.
2. 우리가 complete resection을 했음에도, 재발 위험이 20% 있다고 할 때는 현재 수술 후 병리검사에서 발견 가능한 크기의 LN 전이가 20%라는 의미가 아닙니다.
3. 수술 당시에는 병리 검사에서는 찾아낼 수 없는 micrometastasis가 20% 의 확률로 존재해서 1-3년 사이에 CT에서 발견할 수 있을 만큼 커진다는 의미입니다.
4. 이는 병리 검사에서 Sentinel LN가 아닌 일반 node는 가장 직경이 큰 면으로 one plane만 절재해서 검사하는 방식을 생각해 보면 당연한 얘기입니다. 즉 병리 검사 당시 LN meta가 없다고 cancer cell이 없다고 하는 것은 아주 위험한 생각입니다.
5. 따라서 환자에게 이를 잘 설명해 주어야 합니다. '현재 관찰할 수 있을 만큼 큰 전이가 없어도 20%의 확률로 작은 암세포가 숨어 있기 때문에, 수술은 꼭 필요한 치료 였습니다.'라고요.
6. 참고로 병리에서 PD를 진단하는 기준은 분화도가 좋은 portion이 검사 전체에서 50% 안되는 경우에 PD를 줍니다. 병리 report에는 PD %로 기록하는데, 이건 소화기 의사의 요구로 그렇게 쓰는 것이고, 병리 의사는 PD 55%와 75% 사이에 양적인 차이를 의미있다고 봐서 그렇게 적는 것이 아닙니다. 오해 없기를 바랍니다.

그럼 과제를 드리겠습니다. EGC ESD에서 curative resection의 absolute indication과 expanded indication을 정리하여, PBL_amc_F2_04_이름.docx 파일을 교수님에게 제출하시기 바랍니다.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_04', onImageLoad }: ImageDisplayProps) {
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

            {/* Message Content - final_assignment 타입이 아니고 content가 있을 때만 표시 */}
            {/* multipleChoice 타입이 아닐 때만 메시지 박스 표시 */}
            {stepData.type !== 'final_assignment' && stepData.type !== 'multipleChoice' && stepData.content && (
                <div className="bg-sky-100 rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p
                                className="text-gray-800 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: stepData.content }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* multipleChoice 타입일 때 content가 있으면 메시지 박스 표시 */}
            {stepData.type === 'multipleChoice' && stepData.content && (
                <div className="bg-sky-100 rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p
                                className="text-gray-800 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: stepData.content }}
                            />
                        </div>
                    </div>
                </div>
            )}

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
                        const buttonsPerRow = maxLength >= 30 ? 1 : (stepData.options.length === 2 ? 2 : 4);

                        const rows: React.ReactElement[] = [];
                        for (let i = 0; i < stepData.options.length; i += buttonsPerRow) {
                            const rowOptions = stepData.options.slice(i, i + buttonsPerRow);
                            rows.push(
                                <div key={i} className="flex flex-wrap gap-3 justify-start">
                                    {rowOptions.map((rowOption: string, rowIndex: number) => (
                                        <button
                                            key={i + rowIndex}
                                            className={`bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm text-left whitespace-nowrap ${buttonsPerRow === 1 ? 'w-full' : (buttonsPerRow === 2 ? 'flex-1 max-w-[calc(50%-0.375rem)]' : 'flex-1 min-w-0 max-w-sm')
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
                    <div className="bg-sky-100 rounded-lg p-4 mb-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p
                                    className="text-gray-800 leading-relaxed whitespace-pre-line"
                                    dangerouslySetInnerHTML={{ __html: stepData.content }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <FileText className="w-16 h-16 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-blue-700 mb-2">학습 완료!</h3>
                                <p className="text-gray-600">
                                    AMC GI 상부 F2용 PBL 04 과정을 모두 완료하셨습니다.<br />
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

export interface PblF204PageProps {
    onClose: () => void;
}

export function PblF204Page({ onClose }: PblF204PageProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<{ position: string; name: string } | null>(null);
    const logCreatedRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const totalSteps = Object.keys(conversationSteps).length;

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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_04`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_04 - non curative ESD 후 수술하고 나온 병리 결과
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

    // step 2에서 자동으로 step 3으로 넘어가기
    useEffect(() => {
        if (currentStep === 2 && !completedSteps.includes(2)) {
            const timer = setTimeout(() => {
                setCurrentStep(3);
                setCompletedSteps(prev => [...prev, 2]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    // step 5에서 자동으로 step 6으로 넘어가기
    useEffect(() => {
        if (currentStep === 5 && !completedSteps.includes(5)) {
            const timer = setTimeout(() => {
                setCurrentStep(6);
                setCompletedSteps(prev => [...prev, 5]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

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

// Next.js route entry (not used directly via URL)
export default function Page(_props: any) {
    return null;
}

