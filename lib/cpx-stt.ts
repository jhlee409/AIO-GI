const DEFAULT_STT_MODEL = 'gpt-4o-mini-transcribe';

const SUPPORTED_AUDIO_MIME_PREFIXES = [
    'audio/webm',
    'audio/wav',
    'audio/mpeg',
    'audio/mp4',
    'audio/mp3',
    'audio/mpga',
    'audio/m4a',
    'audio/ogg',
    'video/webm',
    'video/mp4',
];

const AUDIO_EXTENSIONS: Record<string, string> = {
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'mp4',
    'video/mp4': 'mp4',
    'audio/mpga': 'mpga',
    'audio/m4a': 'm4a',
    'audio/ogg': 'ogg',
};

type CpxSttKeywordItem = {
    keywords?: unknown;
};

export type CpxSttPromptScenario = {
    title?: string;
    chiefComplaint?: string;
    historyItems?: CpxSttKeywordItem[];
    negativeFindings?: CpxSttKeywordItem[];
    medications?: CpxSttKeywordItem[];
    pastHistory?: CpxSttKeywordItem[];
    socialHistory?: CpxSttKeywordItem[];
    examHistory?: CpxSttKeywordItem[];
};

const CPX_STT_SCENARIO_SECTIONS = [
    'historyItems',
    'negativeFindings',
    'medications',
    'pastHistory',
    'socialHistory',
    'examHistory',
] as const;

const MAX_SCENARIO_STT_KEYWORDS = 80;

export function getCpxSttModel(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): string {
    return env.CPX_STT_MODEL?.trim() || DEFAULT_STT_MODEL;
}

export function normalizeAudioMimeType(mimeType: string): string {
    return mimeType.split(';')[0]?.trim().toLowerCase() || '';
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
    const normalized = normalizeAudioMimeType(mimeType);
    return SUPPORTED_AUDIO_MIME_PREFIXES.includes(normalized);
}

export function getSafeAudioFileName(mimeType: string): string {
    const normalized = normalizeAudioMimeType(mimeType);
    const extension = AUDIO_EXTENSIONS[normalized] || 'webm';
    return `cpx-recording.${extension}`;
}

function addUniqueKeyword(keywords: string[], seen: Set<string>, value: unknown): void {
    if (typeof value !== 'string') return;
    const keyword = value.trim();
    if (!keyword || seen.has(keyword)) return;
    seen.add(keyword);
    keywords.push(keyword);
}

export function collectCpxSttKeywords(
    scenario?: CpxSttPromptScenario | null,
    limit = MAX_SCENARIO_STT_KEYWORDS
): string[] {
    if (!scenario) return [];

    const keywords: string[] = [];
    const seen = new Set<string>();

    addUniqueKeyword(keywords, seen, scenario.title);
    addUniqueKeyword(keywords, seen, scenario.chiefComplaint);

    for (const section of CPX_STT_SCENARIO_SECTIONS) {
        const items = scenario[section];
        if (!Array.isArray(items)) continue;

        for (const item of items) {
            if (!Array.isArray(item?.keywords)) continue;

            for (const keyword of item.keywords) {
                addUniqueKeyword(keywords, seen, keyword);
                if (keywords.length >= limit) return keywords;
            }
        }
    }

    return keywords;
}

export function buildCpxSttPrompt(scenario?: CpxSttPromptScenario | null): string {
    const scenarioKeywords = collectCpxSttKeywords(scenario);
    return [
        '한국어 CPX 환자 병력청취 훈련 중 의사가 말한 질문을 전사합니다.',
        '의학 문진 용어와 소화기 증상 표현을 정확히 보존하세요.',
        '자주 나오는 표현: 연하곤란, 삼킴곤란, 황달, 소화불량, 혈변, 흑변, 복통, 변비, 토혈, 설사, 구토, 상복부 통증, 명치 통증, 체중 감소, 발열, 오심, 복부팽만.',
        scenarioKeywords.length ? `현재 선택된 증례 관련 표현: ${scenarioKeywords.join(', ')}.` : '',
        '말하지 않은 내용을 추가하지 말고, 들린 질문만 자연스러운 한국어 문장으로 전사하세요.',
    ].filter(Boolean).join(' ');
}
