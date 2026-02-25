/**
 * PBL F2 09 Page
 * Problem-Based Learning for F2 - AGC B4의 진단
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
1. 과거력과 사회력에 특이사항 없던 46세의 여성이고, 2달전부터 식욕이 없어지고, 체중이 감소하며, 상복부가 둔하게 불편하면서, 식사를 조금만 해도 포만감이 심해졌다고 합니다.
2. 이 전에는 내시경을 약 4년전쯤 마지막으로 받았고, 이번에 이 증상으로 근처 의원에서 내시경을 시행 받았고 빨리 큰 병원으로 가보라는 권유를 받고 외래를 방문하였습니다.
3. 가져온 EGD에서 body의 fold가 두꺼워져 보이기는 했는데, 명확치 않아 EGD를 예약하였고, 내시경 후 조직생검도 하였습니다.
조직생검 결과는 gastritis였는데, EGD image를 보여드릴까요?`,
        buttonText: '예'
    },
    3: {
        step: 3,
        type: 'image',
        imageSrc: 'EGD.png',
        imageAlt: 'EGD Image',
        content: '이 내시경 소견에서는 body GC의 gastric fold가 전반적으로 두꺼워진 소견이 관찰됩니다. 이런 소견서 조직검사는 당연히 해야하는 것이고, 이런 경우 조직생검의 진단율을 높이기 위해 세 가지를 수행해야 하는데 말씀 드릴까요?',
        buttonText: '예'
    },
    4: {
        step: 4,
        type: 'message',
        content: `이렇게 fold가 두꺼워져 있으면 조직생검의 진단율을 높이기 위해 다음 세가지를 반드시 해야 합니다.
1. 체계적 관찰이 끝나면 공기를 많이 넣었다 뺏다 하면서 wall의 distensibility가 온전한지 확인한다.
2. 조직생검 겸자로 fold를 잡아 이리저리 움직여서, cups에 부서지지 않고 잘 잡히는지, 고정되어 있지 않고, 탄력있게 잘 움직여지는 지를 확인한다.
3. 조직검사의 yield가 높은 점막 결손, 즉 breakthrough를 body PW에서 GC에서 찾아 거기서 bite on bite로 최소 5조각 이상 조직생검한다.
이렇게 하면 전형적인 rugal hyperplastic의 경우, fold가 완전히 펴지고, forcep으로 잡아 흔들면 탄력있게 잘 움직이므로 진단이 그리 어렵지는 않습니다.

그럼 전형적인 rugal hyperplastic gastritis이고 공기를 넣었을 때 fold가 완전히 펴진 경우인 rugal hyperplastic gastritis image를 보여드릴까요?`,
        buttonText: '예'
    },
    5: {
        step: 5,
        type: 'image',
        imageSrc: 'rugal hyperplastic gastritis.png',
        imageAlt: 'Rugal Hyperplastic Gastritis',
        content: '반면에, 이 환자에서는 공기를 넣었을 때 주름이 완전하게 펴지지 않았고 조직생검 겸자로 잡았을 때 잘 부서지고 fix 되어 있었습니다. 그럼 공기의 최대로 주입기 전과 주입한 후의 상태인 EGD after distension image를 보여드릴까요?',
        buttonText: '예'
    },
    6: {
        step: 6,
        type: 'image',
        imageSrc: 'EGD after distension.png',
        imageAlt: 'EGD After Distension',
        content: '다음으로 AGC Borrmann type 4에서 breakthrough에서 조직생검을 하는 image를 보여 드릴까요?',
        buttonText: '예'
    },
    7: {
        step: 7,
        type: 'image',
        imageSrc: 'breakthrough.png',
        imageAlt: 'Breakthrough',
        content: '조직생검 결과가 gastritis 였습니다. 그럼 이 내시경 소견과 \'gastritis\'인 조직생검 결과를 보고, 이후에 조치로서 적절한 것은?',
        buttonText: ''
    },
    8: {
        step: 8,
        type: 'multipleChoice',
        content: '',
        options: [
            '조직검사가 괜찮으므로 안심 시키고 돌려 보낸다.',
            '조직검사는 괜찮았지만 내시경 소견이 찜찜하므로 한 번 더 조직생검을 한다.',
            '좀 찜찜하니 3개월 후 다시 내시경을 예약한다.',
            '내시경 바로 예약하고, 복부 CT, EUS와 PET을 동시에 예약한다.',
            '이 소견은 볼 것 없이 암이므로 복부 CT와 PET 찍고 바로 외과로 보낸다.'
        ],
        correctAnswer: 3
    },
    9: {
        step: 9,
        type: 'message',
        content: `예 맞습니다. 그럼 각 항목에 대해 설명하겠습니다.
1. 공기를 아플 정도로 충분히 넣었는데도 fold가 펴지지 않았습니다. 이 정도면 상부 전임의 2년차라면 AGC B 4를 강하게 의심할 수 있어야 합니다. 돌려보내면 안됩니다.
2. breakthrough가 없다고 했습니다. 조직생검 정도로는 몇 번을 반복해도 암세포를 잡아내기 어렵습니다.
3. AGC B 4 3개월이면 어떻게 상황이 돌변할지 모릅니다. 바로 재검해야 합니다.
4. 좀 과하다 싶을 수 있는데, 이미 마음속으로는 AGC B 4가로 생각했다면 그리 과한 조치는 아니며, UGIS도 찍으면 진단율이 높지만, 최근에는 영상의학과에서 잘 안해서 여기서는 뺐습니다.
5. 조직학적 확진도 안나왔는데 심증만 가지고 다른 추가 검사도 안하고, 상의도 없이 바로 외과 보내면 전문가로서의 자질을 의심받게됩니다.

abdominal CT and PET image와 EUS image를 보여드릴까요?`,
        buttonText: '예'
    },
    10: {
        step: 10,
        type: 'multipleImages',
        images: [
            { fileName: 'abdominal CT and PET.png', alt: 'Abdominal CT and PET' },
            { fileName: 'EUS.png', alt: 'EUS Image' }
        ],
        content: '각 검사의 결과와 이런 상황에서의 각 검사의 장단점을 설명드리겠습니다.',
        buttonText: ''
    },
    11: {
        step: 11,
        type: 'message',
        content: `1) 복부 CT와 PET는 이 환자에서는 주변 LN나 distant meta 소견이 없어 별 도움이 되지 않았습니다. 이 두검사는 AGC B 4 diffuse wall thickening에서 위의 악성 병변에 대한 sensitivity는 낮습니다 그러나 주변 LN와 distant metastasis 여부를 보기 위해서는 필수적인 검사입니다.
2) 이 AGC B 4의 경우에는 EUS가 매우 중요한 검사인데, 층구조가 obliterated되어 있거나 body의 pm layer두께가 4.4 mm 이상인 경우는 malignant infiltration을 강력히 시사하기 때문입니다. 이 환자에서는 6 mm로 두꺼워져 있습니다.
3) UGIS는 의외로 AGC B 4 진단의 정확도가 높은 검사입니다. 그런데 최근에는 수요가 너무 없어 영상의학과에서 잘 하지 않습니다.
4) 정리하면 wall 구조에 의한 진단은 EUS로 하고, 주변 LN나 distant metastasis, acites 등의 소견은 abdominal CT와 PET으로 보게됩니다.
5) 이 환자의 검사 결과는 CT와 PET는 그다지 도움이 되지 않았지만, EUS의 소견은 AGC B IV를 강력하게 의심케합니다.

그럼 마지막 과정으로 조직학적 진단이 남았습니다. 보기 중에서 어떤 modality가 가장 진단율이 높은 검사일까요?`,
        buttonText: ''
    },
    12: {
        step: 12,
        type: 'multipleChoice',
        content: '',
        options: [
            'roofing technique로 점막과 점막하층을 제거해서 pm layer를 노출시키고, pm layer를 점보 Biopsy forcep으로 bite on bite로 조직생검한다.',
            'EMR로 tissue를 얻는다.',
            'EUS FNA를 시행한다.',
            'EUS FN Bx를 시행한다.',
            '외과와 협력하여 수술장에서 full thickeness Bx를 시행한다.'
        ],
        correctAnswer: 3
    },
    13: {
        step: 13,
        type: 'message',
        content: `예 맞습니다. 각 보기를 설명하면,
1) roofing technique는 공격적인 방식으로 조직을 얻을 수 있으나 의외로 진단율이 높지 않고, 출혈의 위험이 있는 방법이라 권하고 싶지 않습니다.
2) EMR도 많은 tissue를 얻을 수 있지만 점막과 점막하층만 얻기 때문에 또한 진단율이 좋지 못합니다.
3) fine needle로 cytology를 얻는 방법은 합병증의 위험은 낮지만 진단율이 낮아 권유하지 않습니다. 특히 이 세가지는 진단율이 높은 위치를 찾아서 조직을 얻는 방식이 아니기 때문에 진단율이 낮습니다.
4) EUS로 제일 두꺼워진 부분을 찾아, 22 G 이상으로 EUS Bx 전용 precut needle을 사용하여 pm layer를 포함한 전층의 조직을 얻을 수 있기 때문에, 현재로서는 EUS FN Bx 가 가장 진단율이 높은 검사이고 합병증도 acceptable한 수준입니다.
5) 실제로는 제일 진단율이 높은 검사 방법이기는 하지만, 우리나라 현실에서 두 과가 수술실을 사용하면서 처방료를 인정받지 못하는 상황에서 시행하기는 쉽지 않습니다.

이 환자에서 EUS FNBx가 시행되었습니다. EUS FNBx and pathology report image를 보여드릴까요?`,
        buttonText: '예'
    },
    14: {
        step: 14,
        type: 'image',
        imageSrc: 'EUS FNBx and pathology report.png',
        imageAlt: 'EUS FNBx and Pathology Report',
        content: '결국 이 과정을 거쳐 AGC B 4가 확진되어 수술을 하게 되었습니다. 추가로, 이 증례에서 adenocarcinoma를 가장 유력한 진단으로 제시한 이유는 워낙 빈도가 높아서이지, 실제로는 malignant lesion이 정확한 표현이고, 드물지만 lymphoma도 이렇게 될 수 있다는 점을 잊어서는 안됩니다.',
        buttonText: ''
    },
    15: {
        step: 15,
        type: 'final_assignment',
        content: `그럼 과제입니다. 우리 병원에서 EUS FN Bx 를 할 때 어떤 needle을 사용하는지 확인해서 PBL_amc_F2_09_이름.docx 파일로 교수님에게 제출하세요.`
    }
};

interface ImageDisplayProps {
    fileName: string;
    alt: string;
    folder?: string;
    onImageLoad?: () => void;
}

function ImageDisplay({ fileName, alt, folder = 'PBL_F2_09', onImageLoad }: ImageDisplayProps) {
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
                                    AMC GI 상부 F2용 PBL 09 과정을 모두 완료하셨습니다.<br />
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

export interface PblF209PageProps {
    onClose: () => void;
}

export function PblF209Page({ onClose }: PblF209PageProps) {
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
                    const fileName = `${userProfile.position}-${userProfile.name}-PBL_F2_09`;

                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: Advanced course for F2
Section: Problem-Based Learning (PBL) for F2
Case: PBL_F2_09 - AGC B4의 진단
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
        if (currentStep === 7 && !completedSteps.includes(7)) {
            const timer = setTimeout(() => {
                setCurrentStep(8);
                setCompletedSteps(prev => [...prev, 7]);
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
        if (currentStep === 14 && !completedSteps.includes(14)) {
            const timer = setTimeout(() => {
                setCurrentStep(15);
                setCompletedSteps(prev => [...prev, 14]);
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

