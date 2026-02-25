/**
 * PBL F2 08 Page
 * Problem-Based Learning for F2 - esophageal large SET의 Mx
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
		1. 무증상인 54세의 남자 환자가 2012년에 처음 검진 내시경을 시행 받고 식도에 혹이 있다고 해서 본원을 방문하였습니다.
		2. EGD를 시행하니 large SET가 중부 식도에 관찰되었습니다. 점막 결손이 없어 조직생검은 하지 않았습니다.
		3. 크기가 크기 때문에, 정확한 상태를 알기 위해, EUS, chest CT, esophagogram을 시행하였습니다.`,
        buttonText: ''
    },
    3: {
        step: 3,
        type: 'multipleImages',
        images: [
            { fileName: 'EGD EUS.png', alt: 'EGD EUS Image' },
            { fileName: 'esophagogram chest CT.png', alt: 'Esophagogram Chest CT' }
        ],
        content: '검사 결과  mid esophagus에 longitudinally 6 cm인 pm origin의 SET로 나왔습니다. 그럼 다음 단계로 어떤 조치를 취하는 것이 합리적이라고 보시나요?',
        options: [
            '주변으로의 침윤이나 LN 혹은 distant metastasis 소견은 없으나 크기가 크므로 정확한 진단을 위해 EUS FNBx를 의뢰한다.',
            'EUS FNBx 보다는 jumbo biopsy forceps로 bite on bite 방식으로 깊게 조직생검을 하면 된다.',
            'Bx의 결과가 뭐가 나와도 크기가 크기 때문에 수술적 절제가 필요하므로 흉부외과에 수술적 절제를 의뢰한다.',
            'malignant feature나 sign이 없으므로, 병리조직학적 진단 없이 우선 6개월 뒤에 크기 변화가 있는지를 본 후 치료 방법을 결정한다.',
            '식도의 pm origin의 leiomyoma나 GIST는 악성화 화지 않으므로 걱정하지 말라고 안심시키고 돌려 보낸다.'
        ],
        correctAnswer: 3
    },
    4: {
        step: 4,
        type: 'message',
        content: `예, 맞습니다. 이 항목에 대해서는 약간 논란의 여지가 있습니다. 많은 선생들이 1번을 답이라고 생각할 겁니다. 그런데 저는 4번 방식으로 진료합니다. 우선 각 항목에 대해 저의 생각을 말씀 드리면,
		1. EUS FNBx로 보려는 것은 leimyoma와 GIST의 구분, 세포 모양, mitosis, Ki 67로 aggressiveness 진단입니다. 논리적으로는 적절하지만 뒤에서 얘기하는 사항을 고려하면 저는 이렇게 하지 않습니다.
		2. 무식하게(!) jumbo biopsy forceps로 한 곳을 계속 파다가는 출혈합니다. 하지 마세요.
		3. 물론 크기가 크다는 것은 좋지 않은 sign이기 때문에 예전에는 수술 보냈습니다. 그러나 과연 적절한 선택일까요?
		4. 저는 이 방식으로 진료합니다.
		5. 악성화할 가능성이 0은 아닙니다. 그냥 돌려 보내는 것은 적절치 않습니다.

그럼 제가 왜 4번과 같은 경과 관찰 쪽을 선호하는지 그 근거를 말씀 드리겠습니다.
	물론 최종적으로는 환자의 선택이 제일 중요하지만 저는 다음과 같은 이유로 환자에서 경과 관찰을 선택지를 줍니다.
		1) 식도 육종은 매우 드웁니다. 2021년 우리나라 암등록에 보고된 식도 육종의 발생이 6건이었습니다.
		2) 식도 GIST는 leiomyosarcoma보다 오히려 예후가 좋아서 굳이 구분이 필수적이지는 않습니다.
		3) 예후가 좋지 않은 leiomyosarcoma는 크기도 더 크고, 보통 무증상인 경우는 없고, 연하곤란 등의 증상이 있고, 내시경이나 다른 검사 소견도 악성을 시사하는 소견이 동반됩니다.
		4) 무증상의 6 cm 정도에 궤양이나 주변 침윤이 없는 경우, 6개월 후 크기가 자라면 그 때 수술해도 됩니다. 그 사이 때를 놓치는 경우는 없었습니다.
		5) 식도 수술도 tumorectomy만 하면 괜찮은데, esophagectomy를 시행하는 경우도 많아 매우 destructive treatment가 시행됩니다. 이 점을 감안해야 합니다.
	이런 점들을 감안하여 저는 수술로 보내기 보다는 일단 6개월 후 추적검사를 해서 악성의심 소견이 있을 경우에 WU해서 수술 보낸다는 전략을 선택했는데 6cm 이상의 식도 SET 환자 몇 분에서 크기 변화 없이 5년이상 경과관찰 중이고, 결국 수술 보내야 했던 환자는 없었습니다.
	그러나 이건 제가 구할 수 있는 자료를 통해 분석한 저의 방식이고, 통상적으로는 FNBx 해서 수술을 의뢰해도 전혀 문제가 되지 않습니다. 모든 의사들이 식도 leiomyosarcoma를 염려하기 때문입니다.
	이 PBL 과정이 뻔한 증례를 다루는 것이 아니라 전임의 2년차 즉 스텝 바로 전단계의 높은 수준의 reasoning과 decision making을 훈련하기 위한 것이니, 이런 논쟁적인 증례를 낸 것에 대해 양해 하기 바랍니다. 이 증례가 자신의 전략을 세우는 계기가 된다면 교육 목적을 달성한 것이 될 것입니다.

그럼 실제 진료에서는 경과 관찰에서 어떤 진단 modality를 사용할 지가 고민이 되실 겁니다. 각 진단  modality의 장단점을 설명 드릴까요?`,
        buttonText: '예'
    },
    5: {
        step: 5,
        type: 'message',
        content: `각 검사의 장단점을 요약하면 다음과 같습니다.
		1. EGD는 식도에 보이는 면만을 봅니다. 궤양 등의 발생을 볼 수는 있지만 식도 벽 넘어의 상태는 알 수가 없습니다.
		2. longitudinal하게 긴 tumor는 오히려 식도 조영술로 보는 것이 더 객관적입니다. 그러나 역시 식도 벽 바깥의 변화는 보기 어렵습니다.
		3. EUS는 어떻게 보면 제일 정확하지만 매년 EUS 평생하라고 하는 것는 무리입니다. 변화가 보이면 그 때 추가하는 방식이 적절합니다.
		4. chest CT는 악성화의 지표인 metastasis와 주변으로의 침윤 그리고 크기의 증가를 모두 볼 수 있는 면에서는 제일 좋은 tool이나 매년 평생을 CT를 한다는 점에서 역시 무리입니다.
	그렇기 때문에 EGD를 매년 하고 간혹 낌새가 이상하면 chest CT나 EUS를 추가하는 방식이 제일 무난합니다.
	이 환자는 2024년말 현재까지 크기의 변화 없이 경과 관찰을 계속 하고 있습니다.
	당연한 얘기지만, 만약 FU 도중 지속적으로 크기가 증가하거나 주변 조직으로의 침윤이 관찰되면, 악성을 시사하므로, 적극적으로 조직검사를 하고, 수술적 절제를 시행해야 합니다.`,
        buttonText: ''
    },
    6: {
        step: 6,
        type: 'final_assignment',
        content: `그럼, 과제입니다. 이처럼 6 cm나 되는 식도 SET에 대해 경과관찰을 하는 것에 모두 동의하기는 어려울 겁니다. 각자의 의견을 적어 PBL_amc_F2_08_이름.docx 파일로 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_08', onImageLoad }: ImageDisplayProps) {
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
                        // 8번 Esophageal SET 증례에서
                        // "검사 결과 mid esophagus에 longitudinally 6 cm인 pm origin의 SET..." 질문(step 3)의
                        // 선택 버튼은 한 줄에 한 개씩 표시
                        let buttonsPerRow: number;
                        if (stepData.step === 3 || maxLength >= 30) {
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
                                            className={`bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm ${textAlign} whitespace-nowrap ${buttonsPerRow === 1
                                                ? 'w-full'
                                                : buttonsPerRow === 2
                                                    ? 'flex-1 max-w-[calc(50%-0.375rem)]'
                                                    : 'flex-1 min-w-0 max-w-sm'
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
                                    AMC GI 상부 F2용 PBL 08 과정을 모두 완료하셨습니다.<br />
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

export interface PblF208PageProps {
    onClose: () => void;
}

export function PblF208Page({ onClose }: PblF208PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_08`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_08 - esophageal large SET의 Mx
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
        if (currentStep === 2 && !completedSteps.includes(2)) {
            const timer = setTimeout(() => {
                setCurrentStep(3);
                setCompletedSteps(prev => [...prev, 2]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

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

