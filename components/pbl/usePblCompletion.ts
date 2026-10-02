'use client';

import { useEffect, useState } from 'react';
import { clearActiveLearningAttempt, completePblAttempt, startPblAttempt } from '@/lib/learning-session';

export function usePblCompletion(email: string | null | undefined, caseId: string, currentStep: number, totalSteps: number) {
    const [retryCount, setRetryCount] = useState(0);
    useEffect(() => {
        if (!email) return;
        startPblAttempt({ email, caseId });
        return () => clearActiveLearningAttempt(`pbl/${caseId}`);
    }, [email, caseId]);

    useEffect(() => {
        if (email && totalSteps > 0 && currentStep >= totalSteps) {
            completePblAttempt({ email, caseId });
        }
    }, [email, caseId, currentStep, totalSteps]);

    useEffect(() => {
        const retry = (event: Event) => {
            if ((event as CustomEvent<{ caseId: string }>).detail?.caseId === caseId) {
                setRetryCount(count => count + 1);
            }
        };
        window.addEventListener('retryPblCompletionLog', retry);
        return () => window.removeEventListener('retryPblCompletionLog', retry);
    }, [caseId]);

    return retryCount;
}
