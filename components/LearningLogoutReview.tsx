'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { clearLearningAttempts, getLearningAttempts, waitForLearningRequests } from '@/lib/learning-session';

type Result = { key: string; label: string; state: 'complete' | 'incomplete' | 'failed' | 'unknown' };

async function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            operation,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error('Learning status request timed out')), milliseconds);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export function LearningLogoutReview({ user }: { user: User | null }) {
    const router = useRouter();
    const [checking, setChecking] = useState(false);
    const checkingRef = useRef(false);
    const [results, setResults] = useState<Result[] | null>(null);

    const finishLogout = useCallback(async () => {
        if (!auth || !user?.email) return;
        await signOut(auth);
        clearLearningAttempts(user.email);
        setResults(null);
        router.push('/login');
    }, [router, user]);

    const reviewLogout = useCallback(async () => {
        if (checkingRef.current || !user?.email) return;
        checkingRef.current = true;
        setChecking(true);
        setResults(null);
        try {
            const pendingSaves: Promise<unknown>[] = [];
            window.dispatchEvent(new CustomEvent('saveVideoWatchTime', { detail: { promises: pendingSaves } }));
            const videoSavesSettled = await withTimeout(Promise.allSettled(pendingSaves), 10000).then(() => true, () => false);
            const saveResponse = await withTimeout(fetch('/api/video/watch-time/save-on-logout', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            }), 10000).catch(() => null);
            const requestsSettled = await withTimeout(waitForLearningRequests(), 10000).then(() => true, () => false);
            const attempts = getLearningAttempts(user.email);
            if (attempts.length === 0) {
                if (pendingSaves.length > 0) {
                    setResults([{ key: 'untracked-video', label: '현재 동영상 학습', state: 'unknown' }]);
                    return;
                }
                await finishLogout();
                return;
            }
            if (!saveResponse?.ok) console.error('Final watch-time save failed or timed out', saveResponse?.status);
            const token = await withTimeout(user.getIdToken(), 10000);
            const response = await withTimeout(fetch('/api/learning/logout-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ attempts }),
            }), 20000);
            if (!response.ok) throw new Error('Learning record check failed');
            const data = await response.json() as { results: Result[] };
            if (!Array.isArray(data.results) || data.results.length !== attempts.length) throw new Error('Incomplete review');
            const issues = data.results.filter(item => item.state !== 'complete').map(item => {
                const attempt = attempts.find(candidate => candidate.key === item.key);
                if (item.state === 'failed' && attempt?.kind === 'video' && (!videoSavesSettled || !saveResponse?.ok)) {
                    return { ...item, state: 'unknown' as const };
                }
                if (item.state === 'failed' && attempt?.transmission === 'pending' && !requestsSettled) {
                    return { ...item, state: 'unknown' as const };
                }
                return item;
            });
            if (issues.length === 0) await finishLogout();
            else setResults(issues);
        } catch (error) {
            console.error('Could not check learning records before logout', error);
            setResults([{ key: 'review-error', label: '학습 기록', state: 'unknown' }]);
        } finally {
            checkingRef.current = false;
            setChecking(false);
        }
    }, [finishLogout, user]);

    useEffect(() => {
        const listener = () => { void reviewLogout(); };
        window.addEventListener('requestVerifiedLogout', listener);
        return () => window.removeEventListener('requestVerifiedLogout', listener);
    }, [reviewLogout]);

    return (
        <>
            {user && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-900" role="note">
                    학습 기록 확인을 위해 로그아웃 버튼을 눌러 종료해 주세요.
                    {checking && <span className="ml-2">학습 기록 확인 중...</span>}
                </div>
            )}
            {results && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="logout-review-title">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h2 id="logout-review-title" className="text-xl font-semibold text-gray-900">학습 기록을 확인해 주세요</h2>
                        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto text-sm">
                            {results.map(item => (
                                <li key={`${item.key}-${item.state}`} className="rounded border border-amber-200 bg-amber-50 p-3">
                                    <strong className="block break-all">{item.label}</strong>
                                    <span>{item.state === 'incomplete' ? '미완료입니다.' : item.state === 'failed' ? '학습을 완료했으나 완료 결과의 전송이 실패했습니다.' : '학습 기록을 확인할 수 없습니다.'}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={() => setResults(null)} className="rounded bg-blue-600 px-4 py-2 text-white">학습으로 돌아가기</button>
                            <button type="button" onClick={() => { void reviewLogout(); }} disabled={checking} className="rounded border px-4 py-2 disabled:opacity-50">다시 확인</button>
                            <button type="button" onClick={() => { void finishLogout(); }} className="rounded border px-4 py-2">그래도 로그아웃</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
