type CpxMessage = {
    role: string;
    content: string;
};

const BROAD_QUESTION_RESPONSE = '한 가지씩 물어봐 주세요.';

function normalizeKoreanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[“”"']/g, '')
        .trim();
}

function isChiefComplaintQuestion(text: string): boolean {
    return /(어디가\s*불편|무엇을\s*도와|뭘\s*도와|왜\s*오셨|방문\s*이유|주된\s*증상|주소|주호소)/.test(text);
}

export function isOverlyBroadCpxQuestion(message: string): boolean {
    const text = normalizeKoreanText(message);
    if (!text || isChiefComplaintQuestion(text)) {
        return false;
    }

    const asksForNarration = /(설명|말해|말씀|얘기|이야기|알려|풀어|정리)/.test(text);
    if (!asksForNarration) {
        return false;
    }

    return /(다|전부|모두|전체|전반|처음부터\s*끝까지|처음부터|자세히|상세히|쭉|상황|경위|경과|있었던\s*일|증상에\s*대해서)/.test(text);
}

export function getCpxBroadQuestionOverride(messages: CpxMessage[]) {
    const latestUserMessage = [...messages].reverse().find(message => message.role === 'user');

    if (!latestUserMessage || !isOverlyBroadCpxQuestion(latestUserMessage.content)) {
        return null;
    }

    return {
        message: BROAD_QUESTION_RESPONSE,
        isEnded: false,
    };
}
