import { getCpxInitialAssistantMessage, shouldAutoSendFirstCpxQuestion } from './cpx-initial-flow';
import { canUsePatientOutputToggle, getInitialPatientOutputMode, PatientOutputMode } from './cpx-patient-output-mode';

export interface CpxCaseFlowConfig {
    initialAssistantMessage: string | null;
    shouldAutoSendFirstQuestion: boolean;
    canUsePatientOutputToggle: boolean;
    initialPatientOutputMode: PatientOutputMode;
}

export function getCpxCaseFlowConfig(caseId: string | null): CpxCaseFlowConfig {
    return {
        initialAssistantMessage: getCpxInitialAssistantMessage(caseId),
        shouldAutoSendFirstQuestion: shouldAutoSendFirstCpxQuestion(caseId),
        canUsePatientOutputToggle: canUsePatientOutputToggle(caseId),
        initialPatientOutputMode: getInitialPatientOutputMode(caseId),
    };
}
