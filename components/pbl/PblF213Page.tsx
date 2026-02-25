/**
 * PBL F2 13 Page
 * Problem-Based Learning for F2 - esophageal SCC sm에서 LN meta 여부의 중요성
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
1. 경구약으로 잘 조절되고 있는 고혈압과 당뇨병을 몇 년간 가지고 있는 68세 남자 환자가 3년만에 시행한 외부 EGD에서 식도에 초기의 암이 발생했다는 얘기를 듣고 방문하였습니다.
2. 외부에서 시행한 EGD 소견을 보았는데, 중부 식도에 표층성 병변이 보이고, 외부 조직생검 결과 보고서에는 squamous cell carcinoma, moderate가 기록되어 있었습니다.
일단 superficial SCC in mid esophagus로 보고, EGD, chest and abdominal CT, EUS, PET를 예약했고, 결과 나올 때가 되어 다시 방문하였습니다.
그럼 EGD image와 EGD report image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'multipleImages',
        images: [
            { fileName: 'EGD.png', alt: 'EGD Image' },
            { fileName: 'EGD report.png', alt: 'EGD Report' }
        ],
        content: '사진에서는 UI 24- 26 cm에 2 cm 크기로 0-IIb+a 형태의 병변이 보여 조직생검을 했습니다.\n소견을 기술할 때, z line, stricture의 유무(성인용 scope 9.8 mm 통과여부)를 기술하라고 했는데, 보통 EUS와 같이 하므로 이런 기술은 EUS에 몰아서 기술합니다.\n그럼 EUS image와 EUS report image를 보여 드릴까요?',
        buttonText: '예'
    },
    4: {
        step: 4,
        type: 'multipleImages',
        images: [
            { fileName: 'EUS.png', alt: 'EUS Image' },
            { fileName: 'EUS report.png', alt: 'EUS Report' }
        ],
        content: 'EUS에서 sm invasion이 관찰되었고 LN는 paracaria에 2.1 x 1. 3 cm의 polymorphic isoehoic homogenous LN가 관찰되었고, 말한대로 병변의 위치, z line 위치, carina 위치, stricture의 여부를 기록했습니다.\nEUS에서 단경이 1 cm 이상, round or ovoid, well demarcated, hypoechoic and homogenous, near to the cancer 등이 metastic LN를 시사하는 지표로 제시 되었지만 조직생검을 완전히 대치하기는 어렵습니다.\n이 EUS 소견을 보면 크기는 크나, 모양이 polymorphic 하고, isoechogenic며, 병변으로부터 떨어진 곳에 있으므로 benign LN enlargement를 favor해서 N0로 판정하였습니다.\n당연히 chest abd CT에서는 LN가 관찰될 것이나, CT에서는 malignacy를 판정해 주지 못하므로, PET에서 uptake가 어떻게 되느냐가 중요하게 되었습니다.\n그럼 PET and report image를 보여드릴까요?',
        buttonText: '예'
    },
    5: {
        step: 5,
        type: 'image',
        imageSrc: 'PET and report.png',
        imageAlt: 'PET and Report',
        content: 'PET에서 paracardia LN에 중등도의 uptake가 관찰되었기 때문에, 종합하면, paracrdia LN enlargement가 있는데 metastatic LN인지 구분이 안된다는 상황입니다.\n이 LN의 metastasis 여부에 따라 T1bN0M0일지 T1bN1M0일지가 나눠지는데, 이 두 결과가 가지는 치료 modality의 차이는 무엇일까요?',
        buttonText: ''
    },
    6: {
        step: 6,
        type: 'multipleChoice',
        content: '',
        options: [
            '어차피 위암과 같이 초기의 SCC 이므로 치료에는 큰 차이가 없다.',
            'T1bN0M0는 upfront surgery가 시행되고, T1bN1M0에서는 preop CRT 후 surgery가 시행되므로 매우 큰 차이가 있다.'
        ],
        correctAnswer: 1
    },
    7: {
        step: 7,
        type: 'message',
        content: `예, 맞습니다. 식도 주변 node가 커져 있을 때 판정 요령은 EUS, CT, PET의 결과가 일치하거나, 불일치 하더라도 치료 방법에 차이가 없으면 추가 조직 검사 없이 그냥 확정하고, 불일치 하는데 이처럼 치료 방법에 중대한 차이가 있으면 조직 검사로 확인하는 것입니다.
uptodate에 따르면 T1bN0M0는 upfront surgery를 권장하고, T1bN1M0일 경우는 preop CRT 후 surgery를 하도록 권유하고 있습니다.
그 근거는 T1bN1M0에서 그냥 바로 수술하는 방법에 비해 CRT를 먼저하고 수술하는 방법의 5년 생존율이, 신뢰할 수 있는 연구를 통해서 보면, 수술 단독보다 14-21%나 증가하기 때문입니다.
암 중에서도 예후가 나쁜 암인 식도암에서 5년 생존율이 14-21%나 높은 것이 엄청난 결과의 차이입니다.
그래서 EUS FNBx를 예약하였습니다.`,
        buttonText: ''
    },
    8: {
        step: 8,
        type: 'final_assignment',
        content: `그럼, 과제입니다. 만약 EUS FNBx 결과 metastatic LN로 진단되어 preop CRT를 시행했다면, chemo therapy와 RT를 어떤 시간 일정에 따라 진행하고, 또 CRT 끝난 후 얼마있다 수술을 하게되는지 적어서, PBL_amc_F2_13_이름.docx를 교수님에게 제출해 주세요..`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_13', onImageLoad }: ImageDisplayProps) {
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

            {(stepData.type === 'message' || stepData.type === 'image' || stepData.type === 'multipleImages') && stepData.buttonText && (
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
                        const buttonsPerRow = maxLength >= 30 ? 1 : (maxLength >= 10 ? 2 : Math.min(stepData.options.length, 4));
                        const justifyClass = buttonsPerRow === 1 ? 'justify-start' : (maxLength >= 10 ? 'justify-start' : 'justify-center');
                        const textAlign = buttonsPerRow === 1 ? 'text-left' : (maxLength >= 10 ? 'text-left' : 'text-center');

                        const rows: React.ReactElement[] = [];
                        for (let i = 0; i < stepData.options.length; i += buttonsPerRow) {
                            const rowOptions = stepData.options.slice(i, i + buttonsPerRow);
                            rows.push(
                                <div key={i} className={`flex flex-wrap gap-3 ${justifyClass}`}>
                                    {rowOptions.map((rowOption: string, rowIndex: number) => (
                                        <button
                                            key={i + rowIndex}
                                            className={`bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm ${textAlign} whitespace-nowrap ${buttonsPerRow === 1 ? 'w-full' : (buttonsPerRow === 2 ? 'flex-1 max-w-[calc(50%-0.375rem)]' : 'flex-1 min-w-0 max-w-sm')
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

            {stepData.type === 'final_assignment' && (
                <>
                    {stepData.imageSrc && (
                        <ImageDisplay
                            fileName={stepData.imageSrc}
                            alt={stepData.imageAlt || ''}
                            onImageLoad={onImageLoad}
                        />
                    )}

                    {stepData.content && (
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

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <FileText className="w-16 h-16 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-blue-700 mb-2">학습 완료!</h3>
                                <p className="text-gray-600">
                                    AMC GI 상부 F2용 PBL 13 과정을 모두 완료하셨습니다.<br />
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

export interface PblF213PageProps {
    onClose: () => void;
}

export function PblF213Page({ onClose }: PblF213PageProps) {
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

    useEffect(() => {
        if (user?.email && userProfile && !logCreatedRef.current) {
            const createLogFile = async () => {
                try {
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_13`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_13 - esophageal SCC sm에서 LN meta 여부의 중요성
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

    useEffect(() => {
        if (currentStep === 7 && !completedSteps.includes(7)) {
            const timer = setTimeout(() => {
                setCurrentStep(8);
                setCompletedSteps(prev => [...prev, 7]);
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
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg border-2 border-gray-300 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-6 h-6 text-gray-800" />
                </button>

                <main
                    ref={scrollContainerRef}
                    className="flex-1 container mx-auto px-4 py-6 overflow-y-auto"
                >
                    <div>
                        {completedSteps.map(step => (
                            <ConversationStepComponent
                                key={`completed-${step}`}
                                stepData={conversationSteps[step as keyof typeof conversationSteps]}
                                onNextStep={handleNextStep}
                                onSelectAnswer={handleSelectAnswer}
                                onImageLoad={handleImageLoad}
                            />
                        ))}

                        <ConversationStepComponent
                            key={`current-${currentStep}`}
                            stepData={conversationSteps[currentStep as keyof typeof conversationSteps]}
                            onNextStep={handleNextStep}
                            onSelectAnswer={handleSelectAnswer}
                            onImageLoad={handleImageLoad}
                        />

                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <p className="text-red-800">{errorMessage}</p>
                                </div>
                            </div>
                        )}

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

