import { isStructuredCpxCaseId } from './cpx-case';

export const STRUCTURED_CPX_INITIAL_GREETING = '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.';
export const CPX_07_INITIAL_GREETING = STRUCTURED_CPX_INITIAL_GREETING;

export function getCpxInitialAssistantMessage(caseId: string | null): string | null {
    return isStructuredCpxCaseId(caseId) ? STRUCTURED_CPX_INITIAL_GREETING : null;
}

export function shouldAutoSendFirstCpxQuestion(caseId: string | null): boolean {
    return !isStructuredCpxCaseId(caseId);
}
