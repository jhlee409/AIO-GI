/**
 * API Route: CPX speech-to-text transcription
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    buildCpxSttPrompt,
    getCpxSttModel,
    getSafeAudioFileName,
    isSupportedAudioMimeType,
} from '@/lib/cpx-stt';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const audio = formData.get('audio');

        if (!(audio instanceof File)) {
            return NextResponse.json(
                { error: 'Audio file is required' },
                { status: 400 }
            );
        }

        if (audio.size <= 0) {
            return NextResponse.json(
                { error: 'Audio file is empty' },
                { status: 400 }
            );
        }

        if (audio.size > MAX_AUDIO_BYTES) {
            return NextResponse.json(
                { error: 'Audio file is too large. Maximum size is 25 MB.' },
                { status: 413 }
            );
        }

        if (!isSupportedAudioMimeType(audio.type)) {
            return NextResponse.json(
                { error: `Unsupported audio format: ${audio.type || 'unknown'}` },
                { status: 400 }
            );
        }

        const openAiFormData = new FormData();
        openAiFormData.append('file', audio, audio.name || getSafeAudioFileName(audio.type));
        openAiFormData.append('model', getCpxSttModel());
        openAiFormData.append('language', 'ko');
        openAiFormData.append('prompt', buildCpxSttPrompt());
        openAiFormData.append('response_format', 'json');
        openAiFormData.append('temperature', '0');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: openAiFormData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI transcription error:', errorData);
            return NextResponse.json(
                { error: errorData.error?.message || 'Failed to transcribe audio' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const text = typeof data.text === 'string' ? data.text.trim() : '';

        if (!text) {
            return NextResponse.json(
                { error: 'No speech was transcribed. Please try again.' },
                { status: 422 }
            );
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error('Error in CPX transcription:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process transcription request' },
            { status: 500 }
        );
    }
}
