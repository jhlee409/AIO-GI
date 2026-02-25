/**
 * PBL F2 03 Page
 * Problem-Based Learning for F2 - melena가 동반된 jejunal GIST의 진단과 치료
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

1. 환자는 고혈압과 당뇨, 허혈성 심장질환으로 아스피린을 포함한 여러 종류의 약제를 복용하면서 큰 문제 없이 지내오던 73세의 남자입니다.
2. 응급실 내원 3개월 전부터 무릎 통증으로 정형외과에서 NSAID를 처방 받아 복용해 왔습니다.
3. 6개월 전에 시행한 종합검진에서 외부 대장내시경, 복부 초음파, EGD 및 다른 검사에서 이상 소견은 없었다고 합니다.
4. 3일 전부터 변이 검게 변했고, 어제부터는 기운이 없고 계단 오를 때 숨이 유달리 차면서 식은 땀까지 흘려, 근처 의원을 방문하였고, 그 곳에서 시행한 EGD에서 이상 소견은 없었으나, CBC에서 Hb 8.9 g/dl가 나와, 본원 응급실을 방문하게 되었습니다.
5. 어제 자정 이후로는 더 이상 검은 변은 보지 않았다고 합니다.
6. 응급실에 도착해서 측정한 혈압은 86/55 mmHg 입니다.
7. EGD 사진은 정상 소견을 보였습니다.

당직 선생님은 이 환자에 대해 필요한 응급 조치들을 시행했습니다.`,
        buttonText: ''
    },
    3: {
        step: 3,
        type: 'multipleChoice',
        content: '선생님은 현재의 정보로서 GI tract 어느 부위에 출혈 병변이 있을 것이라 추정하십니까?',
        options: [
            'stomach - duodenum 2nd portion',
            'duodenum 3rd portion - jejunum',
            'ileum - colon',
            'rectum - anus'
        ],
        correctAnswer: 1
    },
    4: {
        step: 4,
        type: 'message',
        content: `예, 맞습니다. 명확하게 GI bleeding이고 melena 양상이기 때문에 ileum과 colon에서의 출혈의 가능성은 낮습니다. 그리고 응급실 오기전 시행한 EGD에서 출혈 병소는 없었기 때문에 duodenum 3rd portion 에서 jejunum 에 병변이 있을 가능성이 높습니다.`,
        buttonText: ''
    },
    5: {
        step: 5,
        type: 'multipleChoice',
        content: '그럼 선생님은 여기 제시하는 다섯 가지 검사 중에서 어떤 검사를 제일 먼저 시행해야 한다고 생각하십니까?',
        options: [
            'CT enterography',
            'Capsule endoscopy',
            'Enteroscopy',
            'radiologic angiography',
            '대장내시경용 scope를 사용한 EGD'
        ],
        correctAnswer: 0
    },
    6: {
        step: 6,
        type: 'message',
        content: `예, 맞습니다. 그 이유를 설명해 보면,

1. duodenum에서 jejunum에 있을 것을 추정되는 이 병변은 대량 출혈 양상을 볼 때 초기 병변은 아니며 extensive 혹은 advanced 병변입니다. 하지만 아직 병변과 주변 상황에 대한 정보가 부족합니다. 천공의 위험이 있는지 등의 상황이 파악이 되어야 endosocpy 등의 invasive한 내시경을 할 수 있습니다. 따라서 현 상황에서 전체적으로 상황을 보여주며, 추가로 소장을 정밀하게 관찰할 수 있는 검사는 CT enterography 입니다.

2. 캡슐 내시경도 출혈 원인을 진단할 수 있는 좋은 선택지 입니다. 하지만 협착여부, 시야를 가리는 소장 내용물의 유무 등의 상황이 파악되지 않은 환경에서는 우선 CT enterography를 시행하고 나서 캡슐내시경을 시행하는 것이 적절합니다.

3. Enteroscopy도 앞에서 말한대로 천공 위험등의 평가가 없는 상황에서 침습적 검사에 속하는 Enterosocpy를 먼저 시행하는 것은 적절한 선택이 아닙니다. 침습적 검사 시행전 가능한 한 많은 정보를 확보한다는 것이 매우 중요한 원칙입니다.

4. Angiography는 출혈 병소를 찾을 수 있고 embolization을 시행할 수 있으나, 현재 출혈이 없는 상황에서는 적절한 검사가 아닙니다., 조영술을 현재 출혈하고 있는데, 다른 수단이 실패하면 시행하는 검사입니다.

5. 대장 내시경용 scope를 가지고 EGD를 하면 소장 jejunum 상부까지 관찰할 수 있어 고려해 볼 수 있으나, 앞에서 말한대로 현상황이 파악되지 않은 상태에서 침습적 검사를 먼저 하는 것은 피해야 합니다.

CT Enterography 를 시행하였습니다. 1. CT Enterography & EGD image를 보여드릴까요? 추가된 EGD는 CT 사진을 확인한 후, colonoscopy를 가지고 시행한 EGD의 key 사진입니다.`,
        buttonText: '예'
    },
    7: {
        step: 7,
        type: 'image',
        imageSrc: 'CT Enterography & EGD.png',
        imageAlt: 'CT Enterography & EGD',
        content: `영상에서 jejunum에 4 cm 크기의 GIST가 의심되는 mass 가 있고 더구나 이로부터 몇 차례의 대량의 출혈이 있었으므로 수술적 절제를 시행해야 하고, 실제로 수술적 절제가 시행되었습니다. GIST pathology report image를 보여드릴까요?`,
        buttonText: '예'
    },
    8: {
        step: 8,
        type: 'image',
        imageSrc: 'GIST pathology report.png',
        imageAlt: 'GIST Pathology Report',
        content: '',
        buttonText: ''
    },
    9: {
        step: 9,
        type: 'multipleChoice',
        content: '수술 후 병리 report를 분석했을 때, 재발을 막기 위해 추가 Gleevec 치료가 필요할까요?',
        options: ['예', '아니오'],
        correctAnswer: 1
    },
    10: {
        step: 10,
        type: 'message',
        content: `예, 맞습니다. 정리하면,

1. jejunum에 생긴 GIST에서 NSAID에 의한 것으로 추정되는 궤양이 생긴 후 여기서 간헐적으로 다량의 출혈이 있었던 증례입니다
2. 체계적인 WU을 통해 jejunum GIST가 진단되어 수술로 완치되었으며, 글리벡의 추가 투여 없이 이후 출혈이나 GIST 재발은 없었습니다.

마지막으로 과제를 드리겠습니다. 다른 환자에서 jejunal GIST의 수술 후 병리 report를 보여 드리겠습니다. 이 case에서 추가로 글리벡의 투여가 필요한 지를 생각해서, 해석하는 과정과 답을 PBL_amc_F2_03_이름.docx에 정리하여 교수님에게 제출해 주세요.

그럼, case image를 보여드릴까요?`,
        buttonText: '예'
    },
    11: {
        step: 11,
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

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_03', onImageLoad }: ImageDisplayProps) {
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
                        // step 3 (GI tract 부위 추정 질문)는 첫 줄 2개, 다음 줄 2개
                        const isStep3 = stepData.step === 3;
                        // step 5 (검사 선택 질문)는 첫 줄 2개, 다음 줄 2개, 마지막 줄 1개
                        const isStep5 = stepData.step === 5;
                        // step 4 (검사 결과 종합 질문)는 한 줄에 한 개씩
                        const isStep4 = stepData.step === 4;
                        // 텍스트가 30자 이상이면 한 줄에 한 개씩 배치 (대화 상자 가로 길이의 50%를 넘는 경우)

                        let buttonsPerRow: number;
                        if (isStep4 || maxLength >= 30) {
                            buttonsPerRow = 1;
                        } else if (isStep3 || isStep5) {
                            buttonsPerRow = 2;
                        } else {
                            buttonsPerRow = 4;
                        }

                        const rows: React.ReactElement[] = [];
                        for (let i = 0; i < stepData.options.length; i += buttonsPerRow) {
                            // step 5의 경우 마지막 옵션(index 4)은 따로 처리
                            if (isStep5 && i === 4) {
                                rows.push(
                                    <div key={i} className="flex flex-wrap gap-3 justify-start">
                                        <button
                                            className="bg-blue-500 text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-400  transition-all duration-200 text-sm text-left flex-1 max-w-[calc(50%-0.375rem)]"
                                            onClick={() => onSelectAnswer(stepData.step, i)}
                                        >
                                            {i + 1}. {stepData.options[i]}
                                        </button>
                                    </div>
                                );
                            } else {
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
                                    AMC GI 상부 F2용 PBL 03 과정을 모두 완료하셨습니다.<br />
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

export interface PblF203PageProps {
    onClose: () => void;
}

export function PblF203Page({ onClose }: PblF203PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_03`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_03 - melena가 동반된 jejunal GIST의 진단과 치료
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

    // step 4에서 자동으로 step 5로 넘어가기
    useEffect(() => {
        if (currentStep === 4 && !completedSteps.includes(4)) {
            const timer = setTimeout(() => {
                setCurrentStep(5);
                setCompletedSteps(prev => [...prev, 4]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    // step 8에서 자동으로 step 9로 넘어가기
    useEffect(() => {
        if (currentStep === 8 && !completedSteps.includes(8)) {
            const timer = setTimeout(() => {
                setCurrentStep(9);
                setCompletedSteps(prev => [...prev, 8]);
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

