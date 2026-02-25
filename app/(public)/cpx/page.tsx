/**
 * CPX Page
 * CPX 환자 병력청취 훈련 프로그램 페이지
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface CpxItem {
    id: string;
    title: string;
    filename: string;
}

const cpxItems: CpxItem[] = [
    {
        id: 'cpx_01',
        title: 'CPX_01_dysphagia',
        filename: 'CPX_amc_01_dysphagia_M69.xlsx',
    },
    {
        id: 'cpx_02',
        title: 'CPX_02_jaundice',
        filename: 'CPX_amc_02_jaundice_M_63.xlsx',
    },
    {
        id: 'cpx_03',
        title: 'CPX_03_Indigestion',
        filename: 'CPX_amc_03_Indigestion_F_52.xlsx',
    },
    {
        id: 'cpx_04',
        title: 'CPX_04_hematochezia',
        filename: 'CPX_amc_04_hematochezia_F_48.xlsx',
    },
    {
        id: 'cpx_05',
        title: 'CPX_05_abdominal_pain',
        filename: 'CPX_amc_05_abdominal_pain_F_58.xlsx',
    },
    {
        id: 'cpx_06',
        title: 'CPX_06_conspitation',
        filename: 'CPX_amc_06_conspitation_F_26.xlsx',
    },
    {
        id: 'cpx_07',
        title: 'CPX_07_hematemesis',
        filename: 'CPX_amc_07_hematemesis_M50.xlsx',
    },
    {
        id: 'cpx_08',
        title: 'CPX_08_diarrhea',
        filename: 'CPX_amc_08_diarrhea_F_35.xlsx',
    },
    {
        id: 'cpx_09',
        title: 'CPX_09_vomiting',
        filename: 'CPX_amc_09_vomiting_F_55.xlsx',
    },
    {
        id: 'cpx_10',
        title: 'CPX_10_epigastric_pain',
        filename: 'CPX_amc_10_epigastric_pain_M73.xlsx',
    },
];

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function CpxPage() {
    const { user } = useAuth();

    // 공통 인증 체크 함수
    const checkAuth = (): boolean => {
        if (!user) {
            alert('로그인을 먼저 시행해 주십시오');
            return false;
        }
        return true;
    };
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [scenario, setScenario] = useState<string>('');
    const [loadingScenario, setLoadingScenario] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatEnded, setChatEnded] = useState(false);
    const [autoSendFirstMessage, setAutoSendFirstMessage] = useState(false);
    const [userProfile, setUserProfile] = useState<{ position: string; name: string } | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const handleSendMessageWithTextRef = useRef<((text: string) => Promise<void>) | null>(null);

    const selectedContent = selectedItem 
        ? cpxItems.find(item => item.id === selectedItem)
        : null;

    // Extract case number from item id (e.g., 'cpx_01' -> '01')
    const getCaseNumber = (itemId: string) => {
        const match = itemId.match(/\d+/);
        return match ? match[0] : '';
    };

    // Check if speech recognition is supported
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            setIsSpeechSupported(!!SpeechRecognition);
            
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'ko-KR'; // 한국어 설정
                
                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript.trim();
                    if (transcript) {
                        setIsListening(false);
                        // 음성 인식 결과를 입력창에 표시하고 자동 전송
                        setInputMessage(prev => {
                            const newMessage = prev ? prev + ' ' + transcript : transcript;
                            // 자동 전송 (약간의 지연을 두어 상태 업데이트가 완료되도록)
                            setTimeout(() => {
                                if (handleSendMessageWithTextRef.current) {
                                    handleSendMessageWithTextRef.current(newMessage);
                                }
                            }, 150);
                            return newMessage;
                        });
                    } else {
                        setIsListening(false);
                    }
                };
                
                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    if (event.error === 'no-speech') {
                        alert('음성이 감지되지 않았습니다. 다시 시도해주세요.');
                    } else if (event.error === 'not-allowed') {
                        alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
                    }
                };
                
                recognition.onend = () => {
                    setIsListening(false);
                };
                
                recognitionRef.current = recognition;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Start/stop speech recognition
    const toggleListening = () => {
        if (!isSpeechSupported) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (error) {
                    console.error('Error starting speech recognition:', error);
                    setIsListening(false);
                }
            }
        }
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

    // Auto-start chat when item is selected and reset when item changes
    useEffect(() => {
        if (selectedItem) {
            // Reset all chat state when item changes
            setShowChat(true);
            setMessages([]);
            setChatEnded(false);
            setInputMessage('');
            setScenario('');
            setAutoSendFirstMessage(true);
            // Load scenario when item changes
            loadScenario();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItem]);

    // Create log file when chat starts
    useEffect(() => {
        if (selectedItem && showChat && user?.email && userProfile) {
            const createLogFile = async () => {
                try {
                    const caseNumber = getCaseNumber(selectedItem);
                    const fileName = `${userProfile.position}-${userProfile.name}-CPX_${caseNumber}`;
                    
                    const logContent = `Position: ${userProfile.position}
Name: ${userProfile.name}
Email: ${user.email}
Category: CPX 환자 병력청취 훈련 프로그램
Case: CPX_${caseNumber}
Action: CPX Chat Started
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

                    if (!response.ok) {
                        console.error('Failed to create log file');
                    }
                } catch (error) {
                    console.error('Error creating log file:', error);
                }
            };

            createLogFile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItem, showChat, user?.email, userProfile]);

    // Auto-send first message when scenario is loaded
    useEffect(() => {
        if (autoSendFirstMessage && scenario && scenario.trim() !== '' && !loadingScenario && messages.length === 0 && !loadingChat) {
            setAutoSendFirstMessage(false);
            const firstMessage = '어떤 문제로 방문하시게 되었나요?';
            
            // 메시지를 자동으로 전송
            const sendFirstMessage = async () => {
                const userMessage: ChatMessage = {
                    role: 'user',
                    content: firstMessage,
                };

                const newMessages = [userMessage];
                setMessages(newMessages);
                setInputMessage('');
                setLoadingChat(true);

                try {
                    const response = await fetch('/api/cpx/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            messages: newMessages,
                            scenario: scenario,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('API Error:', errorData);
                        throw new Error(errorData.error || `Failed to get response (${response.status})`);
                    }

                    const data = await response.json();
                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: data.message,
                    };

                    setMessages([...newMessages, assistantMessage]);
                    
                    if (data.isEnded) {
                        setChatEnded(true);
                    }
                } catch (error: any) {
                    console.error('Error sending message:', error);
                    alert(`메시지를 보내는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
                } finally {
                    setLoadingChat(false);
                    // Focus input after sending message without scrolling
                    requestAnimationFrame(() => {
                        if (inputRef.current) {
                            inputRef.current.focus({ preventScroll: true });
                        }
                    });
                }
            };

            setTimeout(() => {
                sendFirstMessage();
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSendFirstMessage, scenario, loadingScenario, messages.length, loadingChat]);

    // Focus input when chat is ready
    useEffect(() => {
        if (showChat && !loadingScenario && !loadingChat && inputRef.current && !autoSendFirstMessage) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [showChat, loadingScenario, loadingChat, autoSendFirstMessage]);

    // 자동 스크롤 비활성화 - 사용자가 수동으로 스크롤할 수 있도록
    // useEffect(() => {
    //     if (messagesContainerRef.current && messagesEndRef.current) {
    //         const container = messagesContainerRef.current;
    //         const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    //         
    //         // 사용자가 하단 근처에 있을 때만 자동 스크롤
    //         if (isNearBottom) {
    //             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //         }
    //     }
    // }, [messages]);

    const loadScenario = async () => {
        if (!selectedItem) return;

        setLoadingScenario(true);
        try {
            const caseNumber = getCaseNumber(selectedItem);
            const response = await fetch(`/api/cpx/docx-content?caseNumber=${caseNumber}`);
            
            if (!response.ok) {
                throw new Error('Failed to load scenario');
            }

            const data = await response.json();
            setScenario(data.text);
        } catch (error) {
            console.error('Error loading scenario:', error);
            alert('시나리오를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoadingScenario(false);
        }
    };

    const handleCloseChat = () => {
        setShowChat(false);
        setMessages([]);
        setScenario('');
        setChatEnded(false);
        setInputMessage('');
        setSelectedItem(null);
    };


    const handleSendMessageWithText = async (messageText: string) => {
        if (!messageText.trim() || loadingChat || chatEnded) return;

        // 시나리오가 로드되지 않았으면 대기
        if (!scenario || scenario.trim() === '') {
            alert('시나리오를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 현재 스크롤 위치 저장
        const container = messagesContainerRef.current;
        const scrollTop = container?.scrollTop || 0;
        const scrollHeight = container?.scrollHeight || 0;

        const userMessage: ChatMessage = {
            role: 'user',
            content: messageText.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputMessage('');
        setLoadingChat(true);

        // 스크롤 위치 복원
        requestAnimationFrame(() => {
            if (container) {
                container.scrollTop = scrollTop;
            }
        });

        try {
            // 디버깅: 요청 데이터 확인
            console.log('Sending request (handleSendMessageWithText):', {
                messagesCount: newMessages.length,
                scenarioLength: scenario?.length || 0,
                scenarioPreview: scenario?.substring(0, 100) || 'empty',
            });

            const response = await fetch('/api/cpx/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: newMessages,
                    scenario: scenario,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response (handleSendMessageWithText):', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                });
                throw new Error(errorData.error || `Failed to get response (${response.status} ${response.statusText})`);
            }

            const data = await response.json();
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.message,
            };

            // 응답 메시지 추가 전 스크롤 위치 저장
            const beforeScrollTop = container?.scrollTop || 0;
            const beforeScrollHeight = container?.scrollHeight || 0;

            setMessages([...newMessages, assistantMessage]);
            
            // 메시지 추가 후 스크롤 위치 복원
            requestAnimationFrame(() => {
                if (container) {
                    const heightDiff = container.scrollHeight - beforeScrollHeight;
                    container.scrollTop = beforeScrollTop + heightDiff;
                }
            });
            
            if (data.isEnded) {
                setChatEnded(true);
            }
        } catch (error: any) {
            console.error('Error sending message (handleSendMessageWithText):', error);
            alert(`메시지를 보내는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        } finally {
            setLoadingChat(false);
            // Focus input after sending message without scrolling
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus({ preventScroll: true });
                }
            });
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || loadingChat || chatEnded) return;

        // 시나리오가 로드되지 않았으면 대기
        if (!scenario || scenario.trim() === '') {
            alert('시나리오를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 현재 스크롤 위치 저장
        const container = messagesContainerRef.current;
        const scrollTop = container?.scrollTop || 0;
        const scrollHeight = container?.scrollHeight || 0;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputMessage.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputMessage('');
        setLoadingChat(true);

        // 스크롤 위치 복원
        requestAnimationFrame(() => {
            if (container) {
                container.scrollTop = scrollTop;
            }
        });

        try {
            const response = await fetch('/api/cpx/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: newMessages,
                    scenario: scenario,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(errorData.error || `Failed to get response (${response.status})`);
            }

            const data = await response.json();
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.message,
            };

            // 응답 메시지 추가 전 스크롤 위치 저장
            const beforeScrollTop = container?.scrollTop || 0;
            const beforeScrollHeight = container?.scrollHeight || 0;

            setMessages([...newMessages, assistantMessage]);
            
            // 메시지 추가 후 스크롤 위치 복원
            requestAnimationFrame(() => {
                if (container) {
                    const heightDiff = container.scrollHeight - beforeScrollHeight;
                    container.scrollTop = beforeScrollTop + heightDiff;
                }
            });
            
            if (data.isEnded) {
                setChatEnded(true);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('메시지를 보내는 중 오류가 발생했습니다.');
        } finally {
            setLoadingChat(false);
            // Focus input after sending message without scrolling
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus({ preventScroll: true });
                }
            });
        }
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="w-full px-4 py-4">
                <div className="flex gap-4 h-[calc(100vh-120px)]">
                    {/* Left Sidebar - auto width based on content */}
                    <aside className="flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto flex flex-col">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 whitespace-nowrap">
                                CPX 환자 병력청취 훈련 프로그램
                            </h2>
                            <div className="mb-4"></div>
                            <nav className="space-y-1 flex-1">
                                {cpxItems.map((item) => (
                                    <div key={item.id}>
                                        <button
                                            onClick={() => {
                                                if (!checkAuth()) return;
                                                setSelectedItem(item.id);
                                            }}
                                            className={`w-full text-left py-3 px-3 rounded-lg transition whitespace-nowrap ${
                                                selectedItem === item.id
                                                    ? 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {item.title}
                                        </button>
                                    </div>
                                ))}
                                {/* 이전화면으로 가 버튼 */}
                                <div className="mt-auto pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setSelectedItem(null);
                                            setShowChat(false);
                                        }}
                                        className={`w-full text-left py-3 px-3 rounded-lg transition whitespace-nowrap ${
                                            selectedItem === null
                                                ? 'bg-gray-200 text-gray-800 font-semibold'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        이전화면으로
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Right Content Area - 8/10 (80%) */}
                    <main className="w-[80%] flex-1">
                        <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
                            {showChat && selectedContent ? (
                                /* 채팅 인터페이스 */
                                <div className="w-full h-full flex flex-col relative">
                                        {/* 채팅 헤더 - 고정 */}
                                        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {selectedContent?.title} - 병력청취 훈련
                                            </h3>
                                            <button
                                                onClick={handleCloseChat}
                                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                                aria-label="닫기"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* 메시지 영역 */}
                                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {loadingScenario ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div>
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                        <p className="text-gray-600">시나리오를 불러오는 중...</p>
                                                    </div>
                                                </div>
                                            ) : messages.length === 0 ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <p className="text-gray-600 mb-4">병력청취 훈련을 시작하세요.</p>
                                                        <p className="text-sm text-gray-500">아래 입력창에 질문을 입력하여 환자와 대화를 시작하세요.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                messages
                                                    .filter(message => message.role === 'assistant')
                                                    .map((message, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-start"
                                                        >
                                                            <div className="inline-block rounded-lg px-3 py-2 bg-gray-100 text-gray-900">
                                                                <span className="font-semibold mr-2 text-sm">환자:</span>
                                                                <span className="whitespace-pre-wrap">{message.content}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                            {loadingChat && (
                                                <div className="flex justify-start">
                                                    <div className="inline-block bg-gray-100 rounded-lg px-3 py-2">
                                                        <span className="font-semibold mr-2 text-sm">환자:</span>
                                                        <span className="flex space-x-1 inline-flex items-center">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {chatEnded && (
                                                <div className="flex justify-center">
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                        <p className="text-yellow-800 font-semibold">대화가 종료되었습니다.</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* 입력 영역 */}
                                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                                            <div className="flex gap-2">
                                                <textarea
                                                    ref={inputRef}
                                                    value={inputMessage}
                                                    onChange={(e) => setInputMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                    placeholder={chatEnded ? "대화가 종료되었습니다." : "질문을 입력하세요..."}
                                                    disabled={loadingChat || chatEnded || loadingScenario}
                                                    className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    rows={2}
                                                />
                                                {isSpeechSupported && (
                                                    <button
                                                        onClick={toggleListening}
                                                        disabled={loadingChat || chatEnded || loadingScenario}
                                                        className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                                                            isListening
                                                                ? 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                                : 'bg-blue-500 text-white hover:bg-blue-400 transition-all duration-300 ease-in-out'
                                                        } disabled:bg-blue-300 disabled:text-white disabled:cursor-not-allowed`}
                                                        title={isListening ? '음성 인식 중지' : '음성으로 입력'}
                                                    >
                                                        {isListening ? (
                                                            <MicOff className="w-5 h-5" />
                                                        ) : (
                                                            <Mic className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={!inputMessage.trim() || loadingChat || chatEnded || loadingScenario}
                                                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-400 disabled:bg-blue-300 disabled:text-white disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center gap-2"
                                                >
                                                    <Send className="w-5 h-5" />
                                                    전송
                                                </button>
                                            </div>
                                            {isListening && (
                                                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                                                    음성 인식 중... 말씀해주세요.
                                                </div>
                                            )}
                                        </div>
                                </div>
                            ) : (
                                <div className="py-8 overflow-y-auto">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                        CPX
                                    </h2>
                                    <p className="text-xl text-gray-600 mb-8">
                                        환자 병력청취 훈련 프로그램 항목입니다.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {cpxItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-blue-500 border border-blue-600 rounded-lg shadow-sm p-6 hover:bg-blue-400 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer text-white"
                                                onClick={() => {
                                                    if (!checkAuth()) return;
                                                    setSelectedItem(item.id);
                                                }}
                                            >
                                                <h3 className="text-xl font-semibold text-white mb-3">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

