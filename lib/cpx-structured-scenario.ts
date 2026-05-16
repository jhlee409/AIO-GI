export interface CpxFactItem {
    category: string;
    keywords: string[];
    answer: string;
}

export interface StructuredCpxScenario {
    caseId: string;
    title: string;
    chiefComplaint: string;
    patientProfile?: {
        sex?: string;
        age?: number;
    };
    openingAnswer: string;
    historyItems: CpxFactItem[];
    negativeFindings: CpxFactItem[];
    medications: CpxFactItem[];
    pastHistory: CpxFactItem[];
    socialHistory: CpxFactItem[];
    examHistory: CpxFactItem[];
    responseRules: string[];
    endCondition: string;
}

const SECTION_LABELS: Record<string, string> = {
    historyItems: '현병력',
    negativeFindings: '음성 증상',
    medications: '약물력',
    pastHistory: '과거력 및 검사력',
    socialHistory: '사회력',
    examHistory: '가족력 및 기타',
};

function formatFactItem(item: CpxFactItem): string {
    const keywords = item.keywords.join(', ');
    return `- ${item.category}: ${item.answer} (관련 키워드: ${keywords})`;
}

function formatSection(label: string, items: CpxFactItem[]): string {
    if (!items.length) return '';
    return [`## ${label}`, ...items.map(formatFactItem)].join('\n');
}

export function formatStructuredCpxScenario(scenario: StructuredCpxScenario): string {
    const patientProfile = [
        scenario.patientProfile?.sex ? `성별: ${scenario.patientProfile.sex}` : '',
        typeof scenario.patientProfile?.age === 'number' ? `나이: ${scenario.patientProfile.age}` : '',
    ].filter(Boolean).join(', ');

    const sections = [
        formatSection(SECTION_LABELS.historyItems, scenario.historyItems),
        formatSection(SECTION_LABELS.negativeFindings, scenario.negativeFindings),
        formatSection(SECTION_LABELS.medications, scenario.medications),
        formatSection(SECTION_LABELS.pastHistory, scenario.pastHistory),
        formatSection(SECTION_LABELS.socialHistory, scenario.socialHistory),
        formatSection(SECTION_LABELS.examHistory, scenario.examHistory),
    ].filter(Boolean);

    return [
        `# ${scenario.title}`,
        '',
        '당신은 CPX 병력청취 훈련의 환자 역할입니다.',
        '아래 구조화된 환자 사실만 근거로 답하세요.',
        '',
        '## 환자 기본 정보',
        `- 케이스 ID: ${scenario.caseId}`,
        patientProfile ? `- ${patientProfile}` : '',
        `- 주호소: ${scenario.chiefComplaint}`,
        `- 첫 답변: ${scenario.openingAnswer}`,
        '',
        ...sections.flatMap(section => [section, '']),
        '## 응답 규칙',
        ...scenario.responseRules.map(rule => `- ${rule}`),
        '',
        '## 종료 조건',
        `- ${scenario.endCondition}`,
    ].filter(line => line !== '').join('\n');
}
