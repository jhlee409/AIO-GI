/**
 * PBL F2 14 Page
 * Problem-Based Learning for F2 - Dumping syndrome의 진단
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
1. 20년전에 조기위암으로 STG with Billroth II reconstruction을 시행받고 잘 지내던 73세 남자 환자로, 1년 전 환자 말로는 급성 쇼크 증상이 처음 시작되었다고 합니다.
2. 환자가 말하는 쇼크 증상은  갑자기 가슴이 답답해지고, 어지러우며, 빈맥, 발한이 있으면서, 상체가 떨리고,호흡 가빠지는 증상을 말하고, 가만히 휴식을 취하면 20분 안에 사라진다고 합니다.
3. 그 후 3개월 후에 한 번 더 왔고, 이후로는 한 달에 한 두번 정도 발생한다고 합니다. 발생은 주로 아침 8시에서 11시 사이에 발생한다고 합니다.
4. 처음 증상이 왔을 때는 응급실을 방문했고, 검사에서 이상소견이 없었으며, 약물 부작용으로 생각했는데, 이후에도 계속 발생해서 심장내과와 호흡기 내과에서 검사를 받았는데 아무 이상이 없었다고 합니다.
5. 이 증상이 있을 때 메슥거림과 더부룩한 소화불량도 같이 있어 소화기 내과에서 약을 몇 차례나 복용했는데도 효과가 없어, 본원을 방문하게 되었다고 합니다.
6. 가지고 온 자료 중에는 3 개월 전에 종합 검진에서 시행한 EGD와 복부 CT의 사진과 결과가 포함되어 있으며 두 검사에서 STG 상태 외에는 큰 이상은 없었다고 들었습니다.
그럼 EGD image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD Image',
        content: '그럼 감별진단을 위해 환자에게 추가로 물어보아야 할 질문 중 가장 감별진단에 도움이 되지 않는 질문은 몇 번 질문일까요?',
        buttonText: ''
    },
    4: {
        step: 4,
        type: 'multipleChoice',
        content: '',
        options: [
            '이 증상이 생길 때 설사가 동반되는 지',
            '식사를 한 후 얼마 있다가 증상이 시작되는 지',
            '최근 하루 몇 끼를 드시고, 식단은 탄수화물 위주인지',
            '식사 하면서 국 등의 액체를 많이 드시는 지, 혹은 당도가 높은 음료를 자주 드시는 지',
            '구토를 하시는 지, 하신다면 녹색의 담즙이 섞인 구토인지 담즙이 없는 구토인지'
        ],
        correctAnswer: 4
    },
    5: {
        step: 5,
        type: 'message',
        content: '예, 맞습니다.\n우선 각 질문의 의의를 설명하기 전에 현재까지 환자가 제공한 자료를 통해 알 수 있는 사항을 말씀드릴까요?',
        buttonText: '예'
    },
    6: {
        step: 6,
        type: 'message',
        content: `현재까지의 증상을 보면 한 달에 한 두번 정도 증상이 있는 사이에는 무증상이고, 마치 저혈량성 쇽과 유사한 전신 증상이 두드러지는 특징을 보입니다.
물론 처음에 이런 증상을 소화기 질환으로 생각하는 것은 무리입니다. 심장내과와 호흡기 내과 및 3개월전 종합검진에서 다른 이상 소견이 없고, 심인성으로 보기 어렵기 때문에 마지막으로 소화기 원인을 생각해게 되는 상황입니다.
소화기 질환이라면, 일반적인 FD와는 거리가 있으며, 소화불량이 동반되는 것을 보아서는 postgastrectomy long-term complication 가능성을 생각해 보아야 합니다.
가장 큰 카테고리인 mechanical obstruction인지 motility disoder인지를 가장 먼저 구분해야 하는데 환자의 증상은 mechanical obstruction과는 거리가 멉니다. mechanical obsturction이라면 이렇게 한 달에 한 두번만 발생하고, 증상이 20분만에 소실되는 경과를 보이지는 않기 때문입니다.
그럼 postgastrectomy motility disorder인데, 사진과 전신 증상을 고려하면, postvagotomy diarrhea와 alkaline gastritis, gastric statsis, SIBO와는 맞지 않으므로, dumping syndrome이 가장 가능성이 높습니다.
그렇다면 다음 질문은 dumping syndrome에 합당하는 지 추가 확인을 위한 질문이 되어야 합니다.
그런 면에서 각 질문의 의의를 설명드릴까요?`,
        buttonText: '예'
    },
    7: {
        step: 7,
        type: 'message',
        content: `1. postgastrectomy motility disoder에서 rapid transit이 특징인 경우는 diarrhea를 흔히 동반합니다. 이 환자에서는 그 증상이 있을 때 무른 변을 하루 2-3회 봤다고 하였습니다.
2. early dumping syndrome은 특징적으로 식후 15-30분 정도 후부터 증상이 시작되고 20분 이내에 소실되는 특징을 보입니다. 수 시간 후에 생기는 late dumping syndrome은 매우 드뭅니다. 이 환자는 식후 증상 발생이 일정하지 않았다고 했습니다.
3. 20여년전 수술하고 잘 지내다가 1년전부터 dumping syndrome이 왔다면 환자의 식생활이 변했다는 것을 의미합니다. 그래서 1년전부터 하루 세끼 탄수화물 위주의 일반적인 양의 식사를 하게 되었는지를 물어보는 것이 매우 중요한데, 환자는 그냥 가족들과 세끼 식사를 하고 있다고 대답했습니다.
4. 특히 식사 하면서 음료나 국을 많이 드시는 분들은 dumping 증후군을 겪을 가능성이 있는데, 이 환자는 식사 중 국을 즐겨 했고, 무엇보다 커피를 좋아해서 하루에 세네잔을 마셨다고 하였습니다.
5. mechanical obstruction이 주된 병인이라면 복통과 vomiting이 주된 증상이고 막힌 부위에 따라 담즙이 섞이거나 없거나 하는 중요한 정보를 주는 것은 맞지만 앞에서 언급한대로 이 환자의 증상은 mechanical obstruction과는 거리가 멉니다. 따라서 이 질문의 중요성이 가장 낮습니다.
여기까지의 추론으로 early dumping syndrome의 가능성이 높다고 보고, 일반 FD에 주는 약과 함께 식단을 다시 조절하는 방법에 대해 설명드리고 한 달 뒤에 예약을 잡도록 했습니다. 그 조절 방법을 말씀 드릴까요?`,
        buttonText: '예'
    },
    8: {
        step: 8,
        type: 'message',
        content: `1. 한끼 식사량을 평소보다 줄이되, 대신 하루 4번 식사를 하시도록 했습니다.
2. 식단은 밥 등 탄수화물을 줄이고, 채소, 고기 등 비탄수화물 반찬의 비중을 높이도록 설명했습니다.
3. 식사 중에서는 액체를 가능하면 줄이도록 했습니다. 대신 식사 중간에 당분이 없는 음료를 충분히 섭취하시라고 설명했습니다. 이 환자에서는 식후 커피를 즐기는 습관을 없애고, 대신 커피는 식사 중간 설탕없이 드시도록 해야 합니다.
4. 전 비유를 들 때 큰 대접에 꿀물 한 사발을 들이키면 졸도한다고 설명합니다. 많은 양, 액체, 당분위주의 결정체입니다.
한 달 뒤에 방문하신 환자분은 약을 드시면서 식사 습관을 고쳤고 이후 다시는 그런 증상이 생기지 않았다고 했습니다.
환자 증상의 호전이 투약의 효과일 수 있었기 때문에, 이후 추가로 한달 간 약 없이 교정된 식사 습관만 지키시도록 하고 다시 방문하셨을 때도 증상이 없었음을 알려 주셨습니다.
결국 이 증례는 수술 후 오랜 시간이 지나 느슨해진 식습관에 의한 dumping syndrome 이었던 것입니다.`,
        buttonText: ''
    },
    9: {
        step: 9,
        type: 'final_assignment',
        content: `그럼, 과제입니다. UptoDate에 나와 있는 postgastrectomy complication을 정리하여 PBL_amc_F2_14_이름.docx 파일로 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_14', onImageLoad }: ImageDisplayProps) {
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
                                    AMC GI 상부 F2용 PBL 14 과정을 모두 완료하셨습니다.<br />
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

export interface PblF214PageProps {
    onClose: () => void;
}

export function PblF214Page({ onClose }: PblF214PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_14`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_14 - Dumping syndrome의 진단
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

