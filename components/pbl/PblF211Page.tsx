/**
 * PBL F2 11 Page
 * Problem-Based Learning for F2 - Bayes theorem
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
1. 고혈압과 허혈성 심질환으로 aspirin과 다른 항혈소판제를 병용 투여 받고 있는 73세의 남성이 2-3달 전부터 시작된 속쓰림으로 내원하였습니다.
2. 속쓰림, 고혈압, 허혈성 심질환 외에 다른 질환이나 특이 사항은 없었습니다.
2. 마지막 위내시경은 5년 전에 받았다하고 당시에 위염 외에는 이상이 없었다고 합니다.
그럼 진단에 중요한 EGD image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD Image',
        content: '보다 시피 십이지장 제2부에 발적을 동반한 flat lesion이 관찰됩니다. 그럼 이 십이지장 표재성 병변에 대해 조직검사를 시행해야 할까요?',
        buttonText: ''
    },
    4: {
        step: 4,
        type: 'multipleChoice',
        content: '',
        options: [
            '예 병변의 소견이 종양성 병변을 완전히 배제하기 어려운 소견이므로, stomach에서처럼 조직생검을 해서 확인해야 합니다.',
            '아니오, 십이지장에서 adenoma carcinoma의 발생이 드물고, 이 환자에서는 조직생검으로 delayed bleeding이 발생할 위험이 있으므로, 조직생검을 하지 않는 것이 좋겠습니다.'
        ],
        correctAnswer: 1
    },
    5: {
        step: 5,
        type: 'message',
        content: `예 맞습니다.
1. 이 문제는 환자 진료에서 밥 먹듯이 쓰는 Bayes' theorem에 대해 다루고자 낸 증례입니다.
2. Bayes' theorem은 검사 결과나 소견이 질환 양성일 때 정말로 질환이 있을 확률은 그 질환의 유병률에 큰 영향을 받는다는 의미를 가지고 있습니다.,
3. 해리슨 내과 교과서 초반 부분에 설명도 나와 있는데 실제 진료에서 잘 사용하지 않는 것을 많이 봤기 때문에 굳이 상부 2년차 전임의 교육 자료로 올렸습니다.
그럼 Bayes theorem image를 보여드릴까요?`,
        buttonText: '예'
    },
    6: {
        step: 6,
        type: 'image',
        imageSrc: 'Bayes theorem.png',
        imageAlt: 'Bayes theorem',
        content: '그냥 봐서는 이해가 안될 것이므로, 예를 들어 설명하겠습니다.',
        buttonText: ''
    },
    7: {
        step: 7,
        type: 'message',
        content: `1. 종양성 병변일 경우 이런 소견이 90%에서 나타나고, 비종양성 병변에서도 10%에서 이런 소견이 나타난다고 가정하겠습니다.
2. 그리고 A나라는 전국민 50%에서 십이지장 종양성 병변을 가지고 있고, B 나라는 1%에서만 가지고 있다고 가정하겠습니다.
3. 그럼 이 소견이 유병률이 50%인 A 나라 환자에서 발견된 것이라면, 십이지장에서 발견된 이 병변이 실제 종양일 최종 확률은 90%가 됩니다.
4. 그러나, 만약 유병률이 1%인 B 나라 환자에서 발견된 것이라면 이 병변이 실제 종양일 최종 확률은 8.3%가 됩니다.
5. 즉 같은 소견의 병변이라도 그 장기에서의 유병률에 따라 그 소견이 종양성 병변일 확률이 달라진다는 의미입니다.
6. 십이지장에서 adenoma의 유병률은 위에 비해 매우 낮으므로, cost-benefit 관점에서 볼 때, 출혈 위험을 무릅쓰고 조직생검을 하는 것은 적절치 않습니다.
물론 stomach에서 조직생검을 하던 습관을 억누르기 어렵고, 실제 종양일 확률이 0은 아니므로 조직생검했다고 혼나지는 않습니다. 그러나 상부 전임의 2년차 쯤 되면, 최소한 cost-benefit을 따져 볼 실력은 갖추어야 합니다.`,
        buttonText: ''
    },
    8: {
        step: 8,
        type: 'final_assignment',
        content: `그럼, 과제입니다. 종양성 병변일 경우 이런 소견이 60%에서 나타나고, 비종양성 병변에서도 10%에서 이런 소견이 나타난다고, 질환의 유병률이 4%라면, 이 소견이 관찰되었을 때, 실제 질환이 있을 확률을 베이즈의 정리로 계산하는 과정을 적어서 PBL_amc_F2_11_이름.docx 화일을 교수님에게 제출해 주세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_11', onImageLoad }: ImageDisplayProps) {
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
                        // PBL 11 Bayes theorem: EGD 후 첫 질문(step 4)은 버튼을 한 줄에 한 개씩 배치
                        let buttonsPerRow: number;
                        if (stepData.step === 4 || maxLength >= 30) {
                            buttonsPerRow = 1;
                        } else if (maxLength >= 10) {
                            buttonsPerRow = 2;
                        } else {
                            buttonsPerRow = Math.min(stepData.options.length, 4);
                        }

                        const justifyClass =
                            buttonsPerRow === 1
                                ? 'justify-start'
                                : maxLength >= 10
                                    ? 'justify-start'
                                    : 'justify-center';

                        const textAlign =
                            buttonsPerRow === 1
                                ? 'text-left'
                                : maxLength >= 10
                                    ? 'text-left'
                                    : 'text-center';

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
                                    AMC GI 상부 F2용 PBL 11 과정을 모두 완료하셨습니다.<br />
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

export interface PblF211PageProps {
    onClose: () => void;
}

export function PblF211Page({ onClose }: PblF211PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_11`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_11 - Bayes theorem
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
        if (currentStep === 3 && !completedSteps.includes(3)) {
            const timer = setTimeout(() => {
                setCurrentStep(4);
                setCompletedSteps(prev => [...prev, 3]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    useEffect(() => {
        if (currentStep === 6 && !completedSteps.includes(6)) {
            const timer = setTimeout(() => {
                setCurrentStep(7);
                setCompletedSteps(prev => [...prev, 6]);
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

