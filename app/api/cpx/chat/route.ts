/**
 * API Route: CPX Chat with ChatGPT
 * Handles conversation with ChatGPT for patient history taking
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { getCpxBroadQuestionOverride } from '@/lib/cpx-broad-question';
import { getCpxChatMaxTokens } from '@/lib/cpx-chat-config';
import { buildCpxChatSystemPrompt } from '@/lib/cpx-chat-prompt';
import { CPX_FINAL_CLOSING_MESSAGE, getCpxClosingFlowOverride } from '@/lib/cpx-closing-flow';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function POST(request: NextRequest) {
    const access = await requireUser(request);
    if (access instanceof NextResponse) return access;
    try {
        const body = await request.json();
        const { messages, scenario } = body;

        if (!Array.isArray(messages) || messages.length > 100 || messages.some(
            (message: unknown) => !message || typeof message !== 'object' ||
                !('content' in message) || typeof message.content !== 'string' || message.content.length > 10000
        )) {
            console.error('Invalid messages:', messages);
            return NextResponse.json(
                { error: 'Messages array is required', received: typeof messages },
                { status: 400 }
            );
        }

        if (typeof scenario !== 'string' || !scenario.trim() || scenario.length > 20000) {
            console.error('Invalid scenario:', scenario);
            return NextResponse.json(
                { error: 'Scenario is required', received: scenario ? 'empty string' : 'undefined' },
                { status: 400 }
            );
        }

        const closingFlowOverride = getCpxClosingFlowOverride({ messages, scenario });
        if (closingFlowOverride) {
            return NextResponse.json(closingFlowOverride);
        }

        const broadQuestionOverride = getCpxBroadQuestionOverride(messages);
        if (broadQuestionOverride) {
            return NextResponse.json(broadQuestionOverride);
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        // Prepare messages for ChatGPT
        // System message includes the scenario and instructions
        const systemMessage: ChatMessage = {
            role: 'system',
            content: buildCpxChatSystemPrompt(scenario)
        };

        // Convert user messages to ChatGPT format
        const chatMessages: ChatMessage[] = [
            systemMessage,
            ...messages.map((msg: { role: string; content: string }) => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            }))
        ];

        const initialTokenLimit = getCpxChatMaxTokens();
        const tokenLimits = [initialTokenLimit, Math.max(8192, initialTokenLimit * 2)];
        let assistantMessage = '';

        // Reasoning tokens count toward the completion limit. Retry once if they
        // consume the answer budget or the visible response is cut short.
        for (const maxCompletionTokens of tokenLimits) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-6-luna',
                    messages: chatMessages,
                    reasoning_effort: 'low',
                    max_completion_tokens: maxCompletionTokens,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('OpenAI API error:', errorData);
                return NextResponse.json(
                    { error: errorData.error?.message || 'Failed to get response from ChatGPT' },
                    { status: response.status }
                );
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            assistantMessage = choice?.message?.content?.trim() || '';
            if (assistantMessage && choice?.finish_reason === 'stop') {
                break;
            }
            assistantMessage = '';
        }

        if (!assistantMessage) {
            console.error('OpenAI API returned no complete CPX chat response');
            return NextResponse.json(
                { error: '환자 답변을 완성하지 못했습니다. 다시 시도해 주세요.' },
                { status: 502 }
            );
        }

        // Check if conversation should end
        const isEnded = assistantMessage.includes(CPX_FINAL_CLOSING_MESSAGE) ||
                       assistantMessage.includes('대화 종료') ||
                       assistantMessage.toLowerCase().includes('conversation ended');

        return NextResponse.json({
            message: assistantMessage,
            isEnded,
        });
    } catch (error: any) {
        console.error('Error in CPX chat:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat request' },
            { status: 500 }
        );
    }
}

