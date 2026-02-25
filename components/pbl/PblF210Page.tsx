/**
 * PBL F2 10 Page
 * Problem-Based Learning for F2 - Gastric MALT lymphoma
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
1. 2011년 무증상으로 외부 검진에서 내시경 소견과 조직검사에서 이상이 있다고 본원을 방문하였는데, 과거력과 사회력에 다른 문제는 없었습니다.
2. EGD를 시행하였고, 광범위한 염증 소견이 관찰되어 조직생검과 CLO test를 시행하였습니다.
그럼 진단에 중요한 EGD and biopsy report in 2011 image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD and biopsy report in 2011.png',
        imageAlt: 'EGD and biopsy report in 2011',
        content: '검사 결과 조직생검에서 MALT lymphoma가 진단되었습니다. Helicobacter도 양성이었습니다.\n그럼 다음으로 staging 검사에서 복부 CT와 함께 꼭 필요한 검사는 무엇일까요?',
        buttonText: ''
    },
    4: {
        step: 4,
        type: 'multipleChoice',
        content: '',
        options: [
            'EUS',
            'whole body PET',
            'LDH, serum protein electrophoresis, beta microglobulin',
            'fluorescence in situ hybridization (FISH) or polymerase chain reaction (PCR) testing for t(11;18)',
            'BM exam'
        ],
        correctAnswer: 0
    },
    5: {
        step: 5,
        type: 'message',
        content: `예 맞습니다.
1. EUS는 T staging 꼭 필요합니다.
2. 전신 PET은 advanced lesion이나 atypical lesion이 아니면 필요하지 않습니다.
3. 이 lab들은 일반적인 lymphoma staging WU에서는 의미가 있지만 erosion type의 gastric MALT lymphoma에서는 필요하지 않습니다.
4. uptodate에는 t(11, 18)검사를 하라고 나왔 있지만, FISH는 가격도 비싸고, 이 translocation의 유무는 early stage의 gastric MALT lymphoma에서는 치료 방식에 차이는 없습니다.
5. 공부 좀 했다면 early stage gastric MALT lymphoma에서도 BM involvement가 있다는 걸 보고, BM exam을 하려고 하겠지만 이미 임상적으로 예후에 영향이 없다는 것이 정설입니다.
이 환자에서 복부 CT는 정상 소견이었으니 보여 드릴 필요는 없겠고, EUS 사진은 중요하니 2. EUS image를 보여드릴까요?`,
        buttonText: '예'
    },
    6: {
        step: 6,
        type: 'image',
        imageSrc: 'EUS.png',
        imageAlt: 'EUS Image',
        content: '이 환자의 상태와 치료 과정에 대해 설명드리면,',
        buttonText: ''
    },
    7: {
        step: 7,
        type: 'message',
        content: `1. EUS에서도 T1m 이었고 복부 CT에서도 N0였으므로 Ann Arbor modified by Mussoff classification (1977)에 의해 stage IE1입니다.
2. H. pylori 양성이므로 당연히 clarithromycin 기반 3제 요법 14일을 투여 하였고, 2달 뒤에 시행한 UBT에서 제균이 되었음을 확인했습니다.
3. 전 제균 성공 후 6개월에 한번 EGD를 시행하는데, 복부 CT는 하지 않습니다.
4. 최종 CR 기준은 연속해서 두 번 조직생검에서 probably minimal lesion이나 complete histology remission이 나오면 CR로 판정합니다.
5. CR 이후는 첫 2년은 6개월에 한 번, 나머지 3년은 1년에 한 번 EGD를 하고, 복부 CT는 첫 6개월에 하거나 않하거나 하고, cure 판정 할 때 복부 CT를 찍습니다.
6. CR이 온 후 재발을 감시하는 5년 동안 우리 병원 자료로는 재발율이 약 7%였고, 재발 당시 대부분 Hp 재감염이 발견되기 때문에 다시 제균하면 치료가 잘 됩니다.
따라서, 이 환자에게 이 방식의 치료를 진행하였는데, 3년 후 인 3. EGD and biopsy report in 2014 image를 보여드릴까요?`,
        buttonText: '예'
    },
    8: {
        step: 8,
        type: 'image',
        imageSrc: 'EGD in 2024.png',
        imageAlt: 'EGD in 2024',
        content: '제균 후 3년 째 되는 2014년에 H. pylori 재감염은 없고, 여전히 focal LEL으로 responding residual MALT lymphoma로 PR 혹은 SD입니다.\n그럼 이후로는 어떤 전략을 취해야 할까요?',
        buttonText: ''
    },
    9: {
        step: 9,
        type: 'multipleChoice',
        content: '',
        options: [
            '처음 진단이 stage IE1 erosive type이었고, 병변의 진행도 보이지 않으므로, 6개월에 한 번 내시경을 하면서 경과 관찰한다.',
            'guideline에 의하면 2-3년 되어서도 CR이 없으면 RT나 chemotherapy 치료를 권하고 있으므로 RT나 chemo를 종양내과에 의뢰한다.',
            'RT보다는 항암치료가 장기적인 후유증이 적으니 항암치료를 의뢰한다.'
        ],
        correctAnswer: 0
    },
    10: {
        step: 10,
        type: 'message',
        content: `사실 guideline에는 2번이 제일 효과적인 치료라고 되어 있습니다. 그러나 저는 stage IE1 erosive type에서는 RT나 chemo가 evidince가 부족하고 과한 치료라고 생각하기 때문에 1번 방식의 치료를 하고 있습니다. 그 이유를 설명하면,
1. erosive type의 stage IE1 gastric MALT lymphoma를 치료하는 이유는 MALT lymphoma 자체가 진행하여 사망하거나, DLBCL로 transformation 되어 사망할 가능성 때문입니다.
2. 그런데 2024년 말 현재, 초진이 erosive type의 stage IE1 gastric MALT lymphoma인 환자에서 자체 질환의 진행에 의해 사망하거나, 없던 DLBCL가 위에서 진단된 경우을 보고한 논문은 없습니다.
3. 대부분의 transformation에 대한 보고는 진단 당시 이미 DLBCL가 같이 진단된 경우이거나, 다른 장기에 오랜 시간 후에 발생한 경우입니다.
4. uptodate에서는 RT가 부작용이 적은 치료라고 하였으나, chemo therapy도 포함해서 절대 부작용이 적은 치료가 아닙니다. 자신이나 같이 사는 가족이 그 치료를 받아 본 경험이 없는 의사들이 그렇게 얘기합니다.
5. 따라서 전 적어도 erosive type의 stage IE1 gastric MALT lymphoma의 경우 환자가 충분한 설명을 들은 후 선택한 경우라면, 정기적인 surveillance 로 경과 관찰을 할 수 있다고 생각합니다.
6. 물론 advanced stage, erosive type이 아닌 병변, 그리고 진행하는 경우는 사정이 달라집니다. 그럴 때는 일반적인 guideline을 따르는 것이 필요합니다.`,
        buttonText: ''
    },
    11: {
        step: 11,
        type: 'final_assignment',
        content: `그럼, 과제입니다. 각 선생님들은 3년 되어서도 PR인 경우 어떻게 하실지, 각자의 의견을 적어 PBL_amc_F2_10_이름.docx 파일로 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_10', onImageLoad }: ImageDisplayProps) {
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
                                    AMC GI 상부 F2용 PBL 10 과정을 모두 완료하셨습니다.<br />
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

export interface PblF210PageProps {
    onClose: () => void;
}

export function PblF210Page({ onClose }: PblF210PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_10`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_10 - Gastric MALT lymphoma
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
        if (currentStep === 8 && !completedSteps.includes(8)) {
            const timer = setTimeout(() => {
                setCurrentStep(9);
                setCompletedSteps(prev => [...prev, 8]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    useEffect(() => {
        if (currentStep === 10 && !completedSteps.includes(10)) {
            const timer = setTimeout(() => {
                setCurrentStep(11);
                setCompletedSteps(prev => [...prev, 10]);
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

