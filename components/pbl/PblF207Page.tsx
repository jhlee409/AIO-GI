/**
 * PBL F2 07 Page
 * Problem-Based Learning for F2 - duodenum NET의 치료
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
		1. 71세의 여자 환자가 3년 전부터 bulb AW에 있는 약 1 cm 정도의 type0-IIa의 병변으로 내시경 추적 검사를 받아오고 있었습니다.
		2. 처음에 선생님은 내시경 소견으로 NET를 의심했으나, 시행한 내시경 조직생검에서는 duodenitis가 나왔고 이후 매년 조직생검에서도 같은 결과를 보였습니다.
		3. 그런데 이번에 시행한 조직생검에서는 NET가 나왔습니다.`,
        buttonText: ''
    },
    3: {
        step: 3,
        type: 'multipleImages',
        images: [
            { fileName: 'EGD.png', alt: 'EGD Image' },
            { fileName: 'EGD Biopsy report.png', alt: 'EGD Biopsy Report' }
        ],
        content: '그럼 치료 modality를 결정하기 위해 복부 CT와 추가로 한가지 검사만 할 수 있다면 어떤 검사를 선택하시겠습니까?',
        options: [
            'Octreotide scan',
            'EUS',
            'Liver MRI',
            'F-18 FDG PET',
            'Ga-68 DOTATATE PET'
        ],
        correctAnswer: 1
    },
    4: {
        step: 4,
        type: 'message',
        content: `예 맞습니다. 각 예문을 설명하면,
		1. octreotide scan 은 해상도가 떨어져 이제는 분화도가 좋은 진행성 NET에는 Ga-68 DOTATATE PET이 분화도가 나쁜 진행성 NET에서는 F-18 FDG PET이 주로 사용됩니다.
		2. EUS는 NET의 depth를 확인하기 위한 중요한 검사입니다. T2 즉 proper muscle 층에 침범했으면 T2로 수술해야 합니다. 해상도는 12 MHz 혹은 20 MHz를 선택해야 합니다.
		3. Uptodate를 보면 하라고 되어 있는데, liver mass가 발견되면 NET meta인지 더 정보를 알기 위해 그 때 하는 검사입니다.
		4. 크기가 1 cm 정도이므로 보통은 PET까지 시행하지 않습니다. CT에서 확정이 안되는 LN나 mass가 있을 때 Ga-68 DOTATATE가 안될 때 시행합니다.
		5. 이 검사는 Ga-68 DOTATOC과 함께 NET에 specific한 검사이고 uptodate에서 시행하라고 했지만 다른 검사에서 발견안되는 functioning gastrinoma를 찾는데 시행하는 검사라고 생각하시면 됩니다. 아무때나 하는 검사 아닙니다.

그럼 검사 결과를 확인해 보겠습니다. CT는 정상이었으니 보여드리지 않겠고. EUS image를 보여드릴까요?`,
        buttonText: '예'
    },
    5: {
        step: 5,
        type: 'image',
        imageSrc: 'EUS.png',
        imageAlt: 'EUS Image',
        content: `검사 결과를 종합하면, 1 cm, Gr 1, T1sm, N0 입니다. EUS 사진 잘보면 sm 층으로 튀어나온 부분이 보일겁니다. 이 경우 적절한 치료 modality는?`,
        buttonText: ''
    },
    6: {
        step: 6,
        type: 'multipleChoice',
        content: '',
        options: [
            'APC',
            'polypectomy',
            'EMR',
            'ESD',
            'surgical resection'
        ],
        correctAnswer: 2
    },
    7: {
        step: 7,
        type: 'message',
        content: `예 맞습니다. 각 예문을 설명하면,
		1 APC는 이 경우 tumor가 두꺼워서 완전 제거가 안됩니다. adenoma라도 이 정도 두께면 APC로는 안됩니다.
		2. polypectomy 주변에 cutting을 하지 않고 snare로만 잡으면 반드시 남습니다.
		3. EMR 주변에 cutting하고 snare로 잡아서 제거합니다. 이 방법이 합병증 대비 완전제거의 효울이 제일 높습니다.
		4. ESD는 submucosal dissection까지 한다는 얘긴데, 초 전문가도 위험해서 잘 안합니다. 천공시 췌장의 손상으로 나중에 Whipple op 할 수 있습니다.
		5. surgical resection은 이 경우에는 과한 치료입니다. 단 시술 후 병리 결과에 따라서는 추가로 수술할 수 있다는 점은 꼭 얘기해 놓아야 합니다.

다행하게도 EMR 시술이 잘 진행되어 나중에 외래에 왔습니다. EMR image와 patholgy report image 보여드릴까요?`,
        buttonText: '예'
    },
    8: {
        step: 8,
        type: 'multipleImages',
        images: [
            { fileName: 'EMR.png', alt: 'EMR Image' },
            { fileName: 'pathology report.png', alt: 'Pathology Report' }
        ],
        content: '병리 결과로 duodenal bulb NET Gr 1, 0.8 cm, mm invasion, LVI present로 나왔습니다. 이 다음에 어떤 조치를 취하는 것이 정석일까요?',
        options: [
            '크기도 0.8 cm으로 작고 Gr 1, invasion to mm 이므로, 비록 LVI 있지만, 첫 3년은 6개월에 한 번 EGD와 CT, 나머지 2년은 1년에 한 번 EGD CT를 하면서 경과 관찰을 한다.',
            'duodenal bulb이고 0.8 cm, mm invasion 이지만 LVI 있으므로 Ga-68 DOTATATE PET을 시행하여 LN meta의심되면 수술한다.',
            'uptodate에서는 LVI있으면 수술하라고 하였으므로 수술 의뢰한다.'
        ],
        correctAnswer: 0
    },
    9: {
        step: 9,
        type: 'final_assignment',
        content: `예 맞습니다. 각 예문을 설명하면,
		1. 십이지장의 경우 1 cm 이하, Gr1, mm invasion에서 LVI가 있던 환자가 나중에 LN metastasis가 발생했다는 증례의 보고는 없습니다.
		2. 이 병리 소견에서는 만약 LN에 metastasis가 있어도 micrometastasis 나 size가 아주 작은 시기라서, 아무리 specific하고 해상도가 높은 검사인 Ga-68 DOTATATE PET을 시행해도 detection하기 어렵습니다.
		3. 이 것이 제일 문제인데, Uptodate에는 LVI이 있으면 수술을 하라고 되어 있습니다. 그런데 뒤져보면 환자의 증례는 없고 통계처리의 결과를 evidence로 한 것이라 모든 환자에게 적용하는 것은 과하다는 생각입니다.
	제 사견으로는 duodenal NET의 경우 1 cm 이하이고 mm인데, 다른 factor가 없고 단지 LVI만 있다면 환자에게 설명해서 경과 관찰을 할 수 있다고 봅니다.
	또 하나 issue는 병리 결과에서 vertical margin +인 경우입니다. 예전에는 걱정을 많이 했지만, 지금은 cautery effect로 잔존 tumor가 남기 어려워서 실제 재발하는 경우는 거의 없다고 보고 있습니다.

그럼 과제입니다. 만약 T1b, N0, M0, gastric NET에 대해 ESD를 시행한 후 병리 결과에서, NET Gr 1, 1.3 cm, sm invasion 인데 LVI present이면, 추가 시술이 필요할까요? 선생님들의 생각을 정리하여 PBL_amc_F2_07_이름.doc 파일로 만들어 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_07', onImageLoad }: ImageDisplayProps) {
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
                        let buttonsPerRow: number;
                        if (maxLength >= 30) {
                            buttonsPerRow = 1;
                        } else if (stepData.options.length === 2 || stepData.options.length === 5) {
                            buttonsPerRow = 2;
                        } else if (stepData.options.length === 3) {
                            buttonsPerRow = 1;
                        } else {
                            buttonsPerRow = 4;
                        }

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
                                    AMC GI 상부 F2용 PBL 07 과정을 모두 완료하셨습니다.<br />
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

export interface PblF207PageProps {
    onClose: () => void;
}

export function PblF207Page({ onClose }: PblF207PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_07`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_07 - duodenum NET의 치료
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

