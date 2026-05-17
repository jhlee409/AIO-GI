/**
 * API Route: CPX patient text-to-speech
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStructuredCpxScenario } from '@/lib/cpx-scenario-registry';
import {
    buildCpxTtsRequestBody,
    isCpxTtsEnabledCase,
    sanitizeCpxTtsText,
} from '@/lib/cpx-tts';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const caseId = typeof body.caseId === 'string' ? body.caseId : '';
        const text = sanitizeCpxTtsText(typeof body.text === 'string' ? body.text : '');

        if (!isCpxTtsEnabledCase(caseId)) {
            return NextResponse.json(
                { error: 'TTS is enabled only for structured CPX cases.' },
                { status: 403 }
            );
        }

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        const scenario = getStructuredCpxScenario(caseId);
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildCpxTtsRequestBody(text, process.env as Record<string, string | undefined>, scenario?.ttsProfile)),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI TTS error:', errorData);
            return NextResponse.json(
                { error: errorData.error?.message || 'Failed to create patient speech' },
                { status: response.status }
            );
        }

        const audio = await response.arrayBuffer();
        return new NextResponse(audio, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        console.error('Error in CPX TTS:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process TTS request' },
            { status: 500 }
        );
    }
}
