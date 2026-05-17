'use client';

import { useMemo } from 'react';
import { CpxCaseFlowConfig, getCpxCaseFlowConfig } from '@/lib/cpx-case-flow';

export function useCpxCaseFlow(caseId: string | null): CpxCaseFlowConfig {
    return useMemo(() => getCpxCaseFlowConfig(caseId), [caseId]);
}
