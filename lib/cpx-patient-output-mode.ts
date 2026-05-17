import { isStructuredCpxCaseId } from './cpx-case';

export type PatientOutputMode = 'text' | 'voice';

export function canUsePatientOutputToggle(caseId: string | null): boolean {
    return isStructuredCpxCaseId(caseId);
}

export function getInitialPatientOutputMode(_caseId: string | null): PatientOutputMode {
    return 'text';
}

export function getNextPatientOutputMode(mode: PatientOutputMode): PatientOutputMode {
    return mode === 'text' ? 'voice' : 'text';
}

export function getNextPatientOutputModeLabel(mode: PatientOutputMode): string {
    return mode === 'text' ? '음성 모드로 전환' : '텍스트 모드로 전환';
}

export function shouldShowPatientText(mode: PatientOutputMode, message = ''): boolean {
    return mode === 'text';
}

export function isPatientTtsMode(mode: PatientOutputMode): boolean {
    return mode === 'voice';
}

export function shouldSpeakPatientMessage(mode: PatientOutputMode, message: string): boolean {
    return isPatientTtsMode(mode);
}
