/**
 * PBL F2 12 Page
 * Problem-Based Learning for F2 - gastric polyposis
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
1. 증상이나 진단 받은 병이 없던 44세 여자 환자가 처음으로 받은 EGD에서 수 많은 gastric polposis가 발견되어 방문하였습니다.
2. 외부에서 시행한 EGD 소견을 보았고, 외부 조직생검 결과는 hyperplastic gastritis였습니다.
그럼 진단에 중요한 식도와 위가 나와 있는 EGD image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD Image',
        content: '100개 이상의 gastric polyp이 관찰될 때 gastric polyposis라고 정의하고, hyperplastic, hamartomatous, fundic gland polyp 등의 조직학적 진단이 나올 수 있습니다.\n우선 이 사진만으로도 이 환자에서 배제할 수 있는 gastric polyposis syndrome은 무엇일까요?',
        buttonText: ''
    },
    4: {
        step: 4,
        type: 'multipleChoice',
        content: '',
        options: [
            'Juvenile polyposis syndrome',
            'Peutz-Jegher syndrome',
            'Cowden syndrome',
            'Cronkhite-Canada syndrome',
            'gastric adenocarcinoma and proximal polyposis in stomach (GAPPS)'
        ],
        correctAnswer: 2
    },
    5: {
        step: 5,
        type: 'message',
        content: '예 맞습니다. Cowden의 90%에서 식도에 심한 acanthosis를 동반하기 때문에 이처럼 정상인 경우는 Cowden일 가능성이 매우 낮습니다.\n그럼 1st degree 가족에서 대장암 가족력 없고, 40세 때 시행받은 CFS에서 용종은 없었다고 하면 배제할 수 있는 질환은?',
        buttonText: ''
    },
    6: {
        step: 6,
        type: 'multipleChoice',
        content: '',
        options: [
            'FAP, Juvenile polyposis syndrome',
            'Peutz-Jegher syndrome',
            'Cowden syndrome',
            'Cronkhite-Canada syndrome',
            'gastric adenocarcinoma and proximal polyposis in stomach (GAPPS)'
        ],
        correctAnswer: 0
    },
    7: {
        step: 7,
        type: 'message',
        content: `예, 맞습니다. FAP의 경우 아무리 attenuated FAP이라도 가족력도 없고 40세 될 때까지 대장 선종도 없는 경우는 생각하기 힘들고, Juvenile polyposis인 경우 98%에서 대장에서 juvenile polyp이 관찰되므로 다수의 polyp이 없었다면 두 가지의 가능성은 매우 낮습니다.
그럼 다음 문제를 위한 skin image를 보여드릴까요?`,
        buttonText: '예'
    },
    8: {
        step: 8,
        type: 'image',
        imageSrc: 'skin.png',
        imageAlt: 'Skin Image',
        content: '그럼 이 환자에서 그림에서 보여드린 피부 점막 pigmentation이 없다면, 배제할 수 있는 질환은 무엇일까요?',
        buttonText: ''
    },
    9: {
        step: 9,
        type: 'multipleChoice',
        content: '',
        options: [
            'FAP',
            'Peutz-Jegher syndrome',
            'Cowden syndrome',
            'Cronkhite-Canada syndrome',
            'Juvenile polyposis syndrome',
            'gastric adenocarcinoma and proximal polyposis in stomach (GAPPS)'
        ],
        correctAnswer: 1
    },
    10: {
        step: 10,
        type: 'message',
        content: '예, 맞습니다. 그림에서와 같은 pigmentation이 하나도 없는 경우 Peutz Jegher syndrome은 배제할 수 있습니다.\n그럼 다음 문제를 위한 3. hair nail image를 보여드릴까요?',
        buttonText: '예'
    },
    11: {
        step: 11,
        type: 'image',
        imageSrc: 'hair nail.png',
        imageAlt: 'Hair Nail Image',
        content: '그럼 이 환자에서 보여드린 사진과 같은 alopecia와 nail atrophy와 만성 설사가 없다면 배제할 수 있는 질환은 무엇일까요?',
        buttonText: ''
    },
    12: {
        step: 12,
        type: 'multipleChoice',
        content: '',
        options: [
            'FAP',
            'Peutz-Jegher syndrome',
            'Cowden syndrome',
            'Cronkhite-Canada syndrome',
            'Juvenile polyposis syndrome',
            'gastric adenocarcinoma and proximal polyposis in stomach (GAPPS)'
        ],
        correctAnswer: 3
    },
    13: {
        step: 13,
        type: 'message',
        content: '예, 맞습니다. Cronkhite-Canada sysdrome에서 alopecia와 nail atrophy, 만성 설사가 없다면 그 질환일 가능성이 매우 낮습니다.\n그럼 이 환자의 1st degree 가족에서 위암의 병력이 없고, polyp이 antrum에서도 관찰된다면 배제할 수 있는 질환은 무엇일까요?',
        buttonText: ''
    },
    14: {
        step: 14,
        type: 'multipleChoice',
        content: '',
        options: [
            'FAP',
            'Peutz-Jegher syndrome',
            'Cowden syndrome',
            'Cronkhite-Canada syndrome',
            'Juvenile polyposis syndrome',
            'gastric adenocarcinoma and proximal polyposis in stomach (GAPPS)'
        ],
        correctAnswer: 5
    },
    15: {
        step: 15,
        type: 'message',
        content: `예, 맞습니다. GAPPS는 일단 매우 드물고, AD 양상으로 유전되며 antrum 에는 안생기는 질환이므로, 언급한 조건에서는 배제해도 됩니다.
이렇게 좀 간략한 방식이기는 하나, 외래에서 hereditary gastric polyposis sydrome에 대한 screening을 수행하였고. 다행히 유전 질환 중 어느 것도 가능성이 낮아 EGD Bx와 CLO test를 한 후 다시 방문하도록 하였습니다.
검사 결과 역시 hyperplastic gastritis였고, H. pylori 양성이었습니다. 다른 검사나 치료는 필요 없고, 환자도 젊기 때문에 우선 H. pylori 제균을 하고 지켜보기로 하였습니다.
그럼 H. pylori 제균 성공 1년 6개월 후 시행한 EGD after HPE image를 보여드릴까요?`,
        buttonText: '예'
    },
    16: {
        step: 16,
        type: 'image',
        imageSrc: 'EGD after HPE.png',
        imageAlt: 'EGD after HPE',
        content: `이번 증례는 외래에서 gastric polyposis 환자를 보았을 때 간략하게나마 hereditary gastric polyposis syndrome을 screening 하는 요령을 다루어 보았습니다.
한가지 노파심에서 당부하겠지만 우리세계에서 100%와 0%는 없다고 보면됩니다. 모두 확률로 되어 있습니다. 따라서 배제해도 된다고 했을 때 100%가 아니라 높은 확률로나는 전제가 있다는 점은 잊지마세요. 얼마 전 대장에 용종이 없고 위에만 polyposis가 있는 juvenile polyposis 환자도 있었습니다.
그런 희귀한 경우까지 감안해서 진료를 하라고 선생들에게 요구하는 것은 무리입니다. 지금은 이 pbl에서 요구하는 수준의 지식만이라도 잘 알고 있으면 충분합니다.`,
        buttonText: ''
    },
    17: {
        step: 17,
        type: 'final_assignment',
        content: `그럼, 과제입니다. Cowden syndrome에서 나타날 수 있는 피부 병변의 사진은 인터넷에서 3개를 찾아 PBL_amc_F2_12_이름.docx 파일로 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_12', onImageLoad }: ImageDisplayProps) {
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
                                    AMC GI 상부 F2용 PBL 12 과정을 모두 완료하셨습니다.<br />
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

export interface PblF212PageProps {
    onClose: () => void;
}

export function PblF212Page({ onClose }: PblF212PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_12`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_12 - gastric polyposis
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
        if (currentStep === 11 && !completedSteps.includes(11)) {
            const timer = setTimeout(() => {
                setCurrentStep(12);
                setCompletedSteps(prev => [...prev, 11]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    useEffect(() => {
        if (currentStep === 13 && !completedSteps.includes(13)) {
            const timer = setTimeout(() => {
                setCurrentStep(14);
                setCompletedSteps(prev => [...prev, 13]);
                setErrorMessage(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, completedSteps]);

    useEffect(() => {
        if (currentStep === 16 && !completedSteps.includes(16)) {
            const timer = setTimeout(() => {
                setCurrentStep(17);
                setCompletedSteps(prev => [...prev, 16]);
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

