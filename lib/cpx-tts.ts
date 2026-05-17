import { isStructuredCpxCaseId } from './cpx-case';

const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_TTS_VOICE = 'cedar';
const DEFAULT_TTS_SPEED = 1.3;
const DEFAULT_TTS_INSTRUCTIONS = '50대 후반 한국 남성 환자처럼 한국어로 말합니다. 차분하고 자연스러운 낮은 톤의 존댓말을 사용하고, 과장되거나 연극적인 느낌은 피합니다.';
const MIN_TTS_SPEED = 0.25;
const MAX_TTS_SPEED = 4.0;
const MAX_TTS_TEXT_LENGTH = 1200;

export type CpxTtsProfile = {
    voice?: string;
    speed?: number;
    instructions?: string;
};

type CpxTtsRequestBody = {
    model: string;
    voice: string;
    input: string;
    response_format: 'mp3';
    speed: number;
    instructions?: string;
};

export function getCpxTtsModel(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): string {
    return env.CPX_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL;
}

export function getCpxTtsVoice(
    env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
    profile?: CpxTtsProfile
): string {
    return profile?.voice?.trim() || env.CPX_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE;
}

export function getCpxTtsInstructions(
    env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
    profile?: CpxTtsProfile
): string {
    return profile?.instructions?.trim() || env.CPX_TTS_INSTRUCTIONS?.trim() || DEFAULT_TTS_INSTRUCTIONS;
}

function normalizeCpxTtsSpeed(speed: unknown): number | null {
    const normalizedSpeed = Number(speed);
    if (!Number.isFinite(normalizedSpeed) || normalizedSpeed < MIN_TTS_SPEED || normalizedSpeed > MAX_TTS_SPEED) {
        return null;
    }

    return normalizedSpeed;
}

export function getCpxTtsSpeed(
    env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
    profile?: CpxTtsProfile
): number {
    const profileSpeed = normalizeCpxTtsSpeed(profile?.speed);
    if (profileSpeed !== null) {
        return profileSpeed;
    }

    return normalizeCpxTtsSpeed(env.CPX_TTS_SPEED) ?? DEFAULT_TTS_SPEED;
}

export function isCpxTtsEnabledCase(caseId: string): boolean {
    return isStructuredCpxCaseId(caseId);
}

export function shouldAutoPlayCpxTts(caseId: string): boolean {
    return isCpxTtsEnabledCase(caseId);
}

export function isLikelyBrowserAutoplayBlock(error: unknown): boolean {
    return typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'NotAllowedError';
}

export function sanitizeCpxTtsText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim()
        .slice(0, MAX_TTS_TEXT_LENGTH);
}

function supportsTtsInstructions(model: string): boolean {
    return model.startsWith('gpt-4o-mini-tts');
}

export function buildCpxTtsRequestBody(
    text: string,
    env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
    profile?: CpxTtsProfile
): CpxTtsRequestBody {
    const model = getCpxTtsModel(env);
    const body: CpxTtsRequestBody = {
        model,
        voice: getCpxTtsVoice(env, profile),
        input: text,
        response_format: 'mp3',
        speed: getCpxTtsSpeed(env, profile),
    };

    if (supportsTtsInstructions(model)) {
        body.instructions = getCpxTtsInstructions(env, profile);
    }

    return body;
}
