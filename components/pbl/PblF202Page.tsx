/**
 * PBL F2 02 Component
 * Problem-Based Learning for F2 - refractory GERD 환자의 검사와 치료
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

1. 환자는 13년전부터 시작된 substernal heartburn으로 내원한 47세의 남성입니다.
2. 5년전부터는 밤에 수면 중에 이 증상이 있었고, 이는 상체를 높게해서 자거나 개비스콘을 먹으면 좀 호전되었다고 합니다.
3. 그러다가 최근 1년 동안에는 증상이 심해졌고, 목쉼 증상도 나타났다고 합니다.
4. 심장내과에서 이상이 없다고 들었습니다.
5. 이 증상으로 6개월 이상 PPI를 처방 받아 복용해 오고 있으나, 증상이 호전되지 않아 고생하던 중이었습니다.
6. 그러다가 지인을 통해 내시경 치료로 이런 역류 증상이 치료 되었다는 얘기를 듣고, 항역류 내시경 치료를 받고 싶어 방문하였습니다. 환자는 수술은 원치 않습니다.

이 증상의 원인과 항역류 내시경치료의 효과를 예측하기 위해 EGD 외에 전문기능검사를 추가로 시행해야 합니다.
우선 AMC AMIS 3.0에 소화기 전문 기능 검사가 있는지 functional test menu image를 통해 보여드리겠습니다. 어떤 검사를 시행해야 할 지 확인해 보세요.`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'functional test menu.png',
        imageAlt: 'Functional Test Menu',
        content: `이 환자의 경우는 검사 코드로 GF0008 (Esophageal manometry (비진정, Impedance))와 GF0009 (24hrs esophageal pH monitory (Impedance)) 검사를 시행해야 합니다.

그런데 pH에 관한 검사인데 Esophageal manometry도 시행해야 하는 이유가 궁금하지 않으신가요?

1. 첫째 이유는 24hr pH monitoring tip을 LES upper margin의 5 cm 상방에 위치하도록 해야 하는데, LES의 정확한 위치는 Esophageal manometry를 해야 알 수 있기 때문입니다.
2. 둘째 이유는 heartburn 유사 증상이 식도 운동성 질환에서도 동반될 수 있기 때문에 Esophageal manometry를 반드시 같이 시행해야 합니다.

그럼 검사 결과를 확인해 보겠습니다. EGD image, 24hr pH monitoring image, Esophageal manometry image를 차례로 보여드릴까요?`,
        buttonText: '예'
    },
    4: {
        step: 4,
        type: 'multipleImages',
        images: [
            { fileName: 'EGD.png', alt: 'EGD Image' },
            { fileName: 'Esophageal manometry.png', alt: 'Esophageal Manometry' },
            { fileName: '24hr pH monitoring result.png', alt: '24hr pH Monitoring Result' }
        ],
        content: '검사 결과를 종합하면, 이 환자의 증상은 어떤 범주에 든다고 추정할 수 있나요?',
        options: [
            '병적 위산 역류가 있고, 위산의 역류가 증상의 원인인 경우입니다.',
            '병적 위산 역류는 없으나, 위산의 역류가 증상의 원인인 경우(Reflux Hypersensitivity)입니다.',
            '병적 위산의 역류는 없으나, 비산성 역류가 증상의 원인인 경우입니다.',
            '위 내용물의 역류가 증상의 원인이 아니고, 식도 운동성 질환이 있는 경우입니다.(예; Diffuse Esophageal Spasm)',
            '위 내용물의 역류가 증상의 원인이 아니고, 식도 운동성 질환이 없는 경우입니다.(Functional Heartburn)'
        ],
        correctAnswer: 2
    },
    5: {
        step: 5,
        type: 'multipleChoice',
        content: '예, 맞습니다. 그럼 이 환자에서 검사 결과 만으로 볼 때 stretta의 효과가 있을 것이라고 예측할 수 있을까요?',
        options: ['예', '아니오'],
        correctAnswer: 0
    },
    6: {
        step: 6,
        type: 'message',
        content: `예 맞습니다. 정리하면,

1. 이 증례는 6개월 이상 PPI에 호전이 없는 heartburn으로 최근 증상이 악화되고, 항역류 내시경 치료를 원해서 본원을 방문한 환자로 검사에서 비산역류에 의한 증상으로 판정되어, stretta를 시행하면 효과를 기대할 수 있다고 판단한 증례입니다.

2. 핵심 포인트는 refractory GERD에서 항역류치료를 고려할 때, 효과를 예측하기 위해 시행해야 하는 검사와, 그 검사의 결과, 특히 24hr pH monitoring (impedance)의 결과를 해석하는 능력의 습득입니다.

3. stretta는 한 번 시행 비용이 약 390만원이고, 수술적 치료에 비해 장기적인 성적에 미치지는 못하는 것으로 여겨지나, 통상적인 약물치료에 비해 효과적이기 때문에, 수술적 치료의 대안으로는 적절한 치료법입니다.

마지막으로 숙제 입니다. 이후 제시되는 24hr pH monitoring case 에서, DeMeester score, 24hr pH monitoring의 SAP, SI, Impedance의 SAP, SI의 의미를 해석하고, 최종적으로 어느 범주에 들어가는지 적어 PBS_amc_F2_02_이름.docx 파일로 담당 교수님에게 제출하세요.

그럼, case image를 보여드릴까요?`,
        buttonText: '예'
    },
    7: {
        step: 7,
        type: 'final_assignment',
        content: '',
        imageSrc: 'case.png',
        imageAlt: 'Case Image'
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_02', onImageLoad }: ImageDisplayProps) {
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
            {stepData.type !== 'final_assignment' && stepData.content && (
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
                        // step 4 (검사 결과 종합 질문)는 한 줄에 한 개씩
                        const isStep4 = stepData.step === 4;
                        // 텍스트가 30자 이상이면 한 줄에 한 개씩 배치 (대화 상자 가로 길이의 50%를 넘는 경우)
                        const buttonsPerRow = isStep4 || maxLength >= 30 ? 1 : 4;

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
                    {stepData.imageSrc && (
                        <ImageDisplay
                            fileName={stepData.imageSrc}
                            alt={stepData.imageAlt || ''}
                            onImageLoad={onImageLoad}
                        />
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <FileText className="w-16 h-16 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-blue-700 mb-2">학습 완료!</h3>
                                <p className="text-gray-600">
                                    AMC GI 상부 F2용 PBL 02 과정을 모두 완료하셨습니다.<br />
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

export interface PblF202PageProps {
    onClose: () => void;
}

export function PblF202Page({ onClose }: PblF202PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_02`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_02 - refractory GERD 환자의 검사와 치료
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

