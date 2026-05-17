export const CPX_CLOSING_SERIOUSNESS_QUESTION = '혹시 이게 심각한 병인가요?';
export const CPX_CLOSING_NEXT_TEST_QUESTION = '그럼 저는 무슨 검사를 받게 되나요?';

interface CpxChatMessage {
    role: string;
    content: string;
}

interface CpxClosingFlowInput {
    scenario: string;
    messages: CpxChatMessage[];
}

interface CpxClosingFlowOverride {
    message: string;
    isEnded: boolean;
}

export function isInterviewClosingIntent(text: string): boolean {
    const normalized = text.trim().replace(/\s+/g, ' ');
    if (!normalized) return false;

    return [
        /문진.*(마치|끝|종료|여기까지)/,
        /인터뷰.*(마치|끝|종료|여기까지)/,
        /(마치|끝내|종료|마무리)겠습니다/,
        /(질문|물어볼 것).*(없|여기까지)/,
        /이상입니다/,
        /여기까지.*하겠습니다/,
    ].some((pattern) => pattern.test(normalized));
}

function isCpx07Scenario(scenario: string): boolean {
    return /케이스 ID:\s*cpx_07/.test(scenario) || /CPX_07_hematemesis/.test(scenario);
}

export function parseScenarioClosingQuestions(scenario: string): string[] {
    const questions: string[] = [];
    let isInClosingQuestionSection = false;

    for (const line of scenario.split('\n')) {
        const sectionMatch = line.match(/^##\s+(.+?)\s*$/);
        if (sectionMatch) {
            isInClosingQuestionSection = normalizeText(sectionMatch[1] || '') === '종료 후 환자 질문';
            continue;
        }

        if (!isInClosingQuestionSection) continue;

        const questionMatch = line.match(/^-\s*(?:\d+\.\s*)?(.+?)\s*$/);
        const question = normalizeText(questionMatch?.[1] || '');
        if (question) {
            questions.push(question);
        }
    }

    return questions;
}

function getScenarioClosingQuestions(scenario: string): string[] {
    const parsedQuestions = parseScenarioClosingQuestions(scenario);
    if (parsedQuestions.length) {
        return parsedQuestions;
    }

    return isCpx07Scenario(scenario)
        ? [CPX_CLOSING_SERIOUSNESS_QUESTION, CPX_CLOSING_NEXT_TEST_QUESTION]
        : [];
}

function lastMessage(messages: CpxChatMessage[]): CpxChatMessage | undefined {
    return messages[messages.length - 1];
}

function hasAssistantMessage(messages: CpxChatMessage[], content: string): boolean {
    return messages.some((message) => message.role === 'assistant' && message.content.includes(content));
}

function normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
}

export const CPX_FINAL_CLOSING_MESSAGE = '알겠습니다. 감사합니다. 선생님.';

export function getCpxClosingFlowOverride(input: CpxClosingFlowInput): CpxClosingFlowOverride | null {
    const latestMessage = lastMessage(input.messages);
    if (!latestMessage || latestMessage.role !== 'user') return null;

    const closingQuestions = getScenarioClosingQuestions(input.scenario);
    if (!closingQuestions.length) return null;

    const askedQuestionCount = closingQuestions.filter(question =>
        hasAssistantMessage(input.messages, question)
    ).length;

    if (askedQuestionCount >= closingQuestions.length) {
        return {
            message: CPX_FINAL_CLOSING_MESSAGE,
            isEnded: true,
        };
    }

    if (askedQuestionCount > 0) {
        return {
            message: closingQuestions[askedQuestionCount],
            isEnded: false,
        };
    }

    if (isInterviewClosingIntent(latestMessage.content)) {
        return {
            message: closingQuestions[0],
            isEnded: false,
        };
    }

    return null;
}
