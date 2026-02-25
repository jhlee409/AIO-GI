/**
 * CPX Chat Hook
 * CPX 채팅 기능을 관리하는 hook
 */
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface UseCpxChatOptions {
    scenario?: string;
    onMessageSent?: (message: ChatMessage) => void;
    onResponseReceived?: (message: ChatMessage) => void;
    onChatEnded?: () => void;
    onError?: (error: Error) => void;
}

export interface UseCpxChatReturn {
    messages: ChatMessage[];
    sendMessage: (content: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
    chatEnded: boolean;
    resetChat: () => void;
}

export function useCpxChat(options: UseCpxChatOptions = {}): UseCpxChatReturn {
    const { scenario, onMessageSent, onResponseReceived, onChatEnded, onError } = options;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [chatEnded, setChatEnded] = useState(false);
    const api = useApi<{ message: string; isEnded: boolean }>();

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || loading || chatEnded) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: content.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        onMessageSent?.(userMessage);

        try {
            setLoading(true);
            setError(null);

            const data = await api.call('/api/cpx/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: newMessages,
                    scenario: scenario,
                }),
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.message,
            };

            setMessages(prev => [...prev, assistantMessage]);
            onResponseReceived?.(assistantMessage);

            if (data.isEnded) {
                setChatEnded(true);
                onChatEnded?.();
            }
        } catch (err) {
            const error = err instanceof Error 
                ? err 
                : new Error('메시지 전송 중 오류가 발생했습니다.');
            setError(error);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    }, [messages, loading, chatEnded, scenario, api, onMessageSent, onResponseReceived, onChatEnded, onError]);

    const resetChat = useCallback(() => {
        setMessages([]);
        setChatEnded(false);
        setError(null);
    }, []);

    return {
        messages,
        sendMessage,
        loading: loading || api.loading,
        error: error || api.error,
        chatEnded,
        resetChat,
    };
}
