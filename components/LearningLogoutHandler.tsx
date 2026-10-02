'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { clearActiveLearningAttempt, clearLearningAttempts, getActiveLearningAttempt, getLearningAttempts, getVerifiedLearningExitIssue, waitForLearningRequests, type LearningAttempt } from '@/lib/learning-session';
import { LearningExitDialog } from '@/components/LearningExitDialog';
import { authenticatedFetch } from '@/lib/client-authenticated-fetch';

async function settleWithin(requests: Promise<unknown>[], milliseconds: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            Promise.allSettled(requests),
            new Promise<void>(resolve => { timer = setTimeout(resolve, milliseconds); }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export function LearningLogoutHandler({ user }: { user: User | null }) {
    const router = useRouter();
    const loggingOut = useRef(false);
    const [pendingExit, setPendingExit] = useState<{
        label: string;
        kind: LearningAttempt['kind'];
        reason: 'incomplete' | 'failed';
        decide: (leave: boolean) => void;
    } | null>(null);

    useEffect(() => {
        const listener = () => {
            if (!auth || !user?.email || loggingOut.current) return;
            const email = user.email;
            loggingOut.current = true;
            void (async () => {
                try {
                    const active = getActiveLearningAttempt();
                    if (active?.email.toLowerCase() === email.toLowerCase()) {
                        window.dispatchEvent(new CustomEvent('pauseLearningVideo', { detail: { key: active.key } }));
                    }
                    const pendingSaves: Promise<unknown>[] = [];
                    window.dispatchEvent(new CustomEvent('saveVideoWatchTime', { detail: { promises: pendingSaves } }));
                    await settleWithin(pendingSaves, 10000);
                    await settleWithin([
                        authenticatedFetch('/api/video/watch-time/save-on-logout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                        }),
                        waitForLearningRequests(),
                    ], 10000);
                    if (active?.email.toLowerCase() === email.toLowerCase()) {
                        const attempt = getLearningAttempts(email).find(item => item.kind === active.kind && item.key === active.key);
                        const reason = await getVerifiedLearningExitIssue(attempt, () => user.getIdToken());
                        if (reason) {
                            const leave = await new Promise<boolean>(resolve => {
                                setPendingExit({ label: active.label, kind: active.kind, reason, decide: resolve });
                            });
                            if (!leave) {
                                if (active.kind === 'video') {
                                    window.dispatchEvent(new CustomEvent('allowAnotherVideoSave', { detail: { key: active.key } }));
                                }
                                return;
                            }
                        }
                        clearActiveLearningAttempt(active.key);
                    }
                    await signOut(auth);
                    clearLearningAttempts(email);
                    router.push('/login');
                } catch (error) {
                    console.error('Could not log out', error);
                } finally {
                    loggingOut.current = false;
                }
            })();
        };
        window.addEventListener('requestVerifiedLogout', listener);
        return () => window.removeEventListener('requestVerifiedLogout', listener);
    }, [router, user]);

    return pendingExit ? (
        <LearningExitDialog
            label={pendingExit.label}
            kind={pendingExit.kind}
            reason={pendingExit.reason}
            onStay={() => { pendingExit.decide(false); setPendingExit(null); }}
            onLeave={() => { pendingExit.decide(true); setPendingExit(null); }}
        />
    ) : null;
}
