/** Learning attempts in this browser, used to review exits from the current item. */
export interface LearningAttempt {
    kind: 'log' | 'video' | 'pbl';
    key: string;
    label: string;
    email: string;
    completedLocally: boolean;
    transmission: 'pending' | 'ok' | 'failed';
    watchedTime?: number;
    duration?: number;
    videoUrl?: string;
    category?: string;
    attemptId?: string;
}

const storageKey = (email: string) => `learning-attempts:${email.toLowerCase()}`;
const inFlight = new Set<Promise<unknown>>();
export type ActiveLearningAttempt = Pick<LearningAttempt, 'kind' | 'key' | 'label' | 'email'>;
const activeLearningAttempts: ActiveLearningAttempt[] = [];

export function setActiveLearningAttempt(attempt: ActiveLearningAttempt) {
    const index = activeLearningAttempts.findIndex(item => item.key === attempt.key && item.email === attempt.email);
    if (index >= 0) activeLearningAttempts.splice(index, 1);
    activeLearningAttempts.push(attempt);
}

export function getActiveLearningAttempt(): ActiveLearningAttempt | null {
    return activeLearningAttempts.at(-1) || null;
}

export function clearActiveLearningAttempt(key: string) {
    for (let index = activeLearningAttempts.length - 1; index >= 0; index--) {
        if (activeLearningAttempts[index].key === key) activeLearningAttempts.splice(index, 1);
    }
}

/** Ask the current course page to review the item being left. */
export function requestLearningExit(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(true);
    return new Promise(resolve => {
        const detail = { handled: false, resolve };
        window.dispatchEvent(new CustomEvent('requestLearningExit', { detail }));
        if (!detail.handled) resolve(true);
    });
}

export function getLearningExitIssue(attempt?: LearningAttempt): 'incomplete' | 'failed' | null {
    if (!attempt) return null;
    if (!attempt.completedLocally) return 'incomplete';
    return attempt.transmission === 'ok' ? null : 'failed';
}

/** Confirm the instructor-visible log exists, even when an upload API returned success. */
export async function getVerifiedLearningExitIssue(
    attempt: LearningAttempt | undefined,
    getIdToken: () => Promise<string>,
): Promise<'incomplete' | 'failed' | null> {
    if (!attempt) return 'failed';
    if (attempt.kind === 'pbl') {
        if (!attempt.completedLocally) return 'incomplete';
        const completionLog = getLearningAttempts(attempt.email).find(item =>
            item.kind === 'log' && item.key.endsWith(`-${attempt.label}-Completed`)
        );
        if (!completionLog) return 'failed';
        const issue = await getVerifiedLearningExitIssue(completionLog, getIdToken);
        saveAttempt({ ...attempt, transmission: issue ? 'failed' : 'ok' });
        return issue;
    }
    if (attempt.kind !== 'log' || !attempt.completedLocally) {
        return getLearningExitIssue(attempt);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const token = await getIdToken();
        const response = await fetch('/api/learning/logout-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ attempts: [attempt] }),
            signal: controller.signal,
        });
        if (!response.ok) return 'failed';
        const data = await response.json() as { results?: { key: string; state: string }[] };
        if (data.results?.[0]?.key === attempt.key && data.results[0].state === 'complete') {
            saveAttempt({ ...attempt, transmission: 'ok' });
            return null;
        }
        return 'failed';
    } catch (error) {
        console.error('Could not confirm learning record', error);
        return 'failed';
    } finally {
        clearTimeout(timer);
    }
}

export function getLearningAttempts(email: string): LearningAttempt[] {
    if (typeof window === 'undefined' || !email) return [];
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(email)) || '[]');
        return Array.isArray(parsed) ? parsed as LearningAttempt[] : [];
    } catch {
        return [];
    }
}

export function clearLearningAttempts(email: string) {
    if (typeof window === 'undefined' || !email) return;
    try {
        localStorage.removeItem(storageKey(email));
        for (let index = activeLearningAttempts.length - 1; index >= 0; index--) {
            if (activeLearningAttempts[index].email.toLowerCase() === email.toLowerCase()) activeLearningAttempts.splice(index, 1);
        }
    } catch (error) {
        console.error('Could not clear learning status on this device', error);
    }
}

function saveAttempt(attempt: LearningAttempt) {
    if (typeof window === 'undefined' || !attempt.email) return;
    try {
        const attempts = getLearningAttempts(attempt.email);
        const index = attempts.findIndex(item => item.kind === attempt.kind && item.key === attempt.key);
        if (index >= 0) attempts[index] = { ...attempts[index], ...attempt };
        else attempts.push(attempt);
        localStorage.setItem(storageKey(attempt.email), JSON.stringify(attempts));
    } catch (error) {
        console.error('Could not keep learning status on this device', error);
    }
}

export function recordLearningLogAttempt(input: {
    email?: string | null;
    key: string;
    label: string;
    completedLocally: boolean;
}) {
    if (!input.email) return;
    const previous = getLearningAttempts(input.email).find(item => item.kind === 'log' && item.key === input.key);
    saveAttempt({
        kind: 'log', email: input.email, key: input.key, label: input.label,
        completedLocally: input.completedLocally || previous?.completedLocally || false,
        transmission: previous?.transmission || 'pending',
    });
}

/** Each new visit to a completion-button item needs its own completion action. */
export function startLearningLogAttempt(input: { email?: string | null; key: string; label: string }) {
    if (!input.email) return;
    saveAttempt({
        kind: 'log', email: input.email, key: input.key, label: input.label,
        completedLocally: false, transmission: 'pending',
    });
}

/** Opening a PBL is local only; reaching its final screen permits a completion log. */
export function startPblAttempt(input: { email?: string | null; caseId: string }) {
    if (!input.email) return;
    const key = `pbl/${input.caseId}`;
    saveAttempt({
        kind: 'pbl', email: input.email, key, label: input.caseId,
        completedLocally: false, transmission: 'pending',
    });
    setActiveLearningAttempt({ kind: 'pbl', email: input.email, key, label: input.caseId });
}

export function completePblAttempt(input: { email?: string | null; caseId: string }) {
    if (!input.email) return;
    const key = `pbl/${input.caseId}`;
    const attempt = getLearningAttempts(input.email).find(item => item.kind === 'pbl' && item.key === key);
    if (attempt && !attempt.completedLocally) saveAttempt({ ...attempt, completedLocally: true });
}

export function recordVideoProgress(input: {
    email?: string | null;
    videoUrl: string;
    videoTitle?: string;
    category?: string;
    watchedTime: number;
    duration: number;
}) {
    const { email, videoUrl, videoTitle, category, watchedTime, duration } = input;
    if (!email || !videoUrl) return;
    const key = `${category || ''}::${videoUrl}`;
    const previous = getLearningAttempts(email).find(item => item.kind === 'video' && item.key === key);
    const resolvedDuration = Number.isFinite(duration) && duration > 0 ? duration : previous?.duration || 0;
    const resolvedTime = Number.isFinite(watchedTime) ? Math.max(0, watchedTime) : 0;
    // Avoid writing localStorage on every video timeupdate event.
    if (previous && Math.floor(previous.watchedTime || 0) === Math.floor(resolvedTime) && previous.duration === resolvedDuration) return;
    const bestTime = Math.max(previous?.watchedTime || 0, resolvedTime);
    saveAttempt({
        kind: 'video', key, videoUrl, category, label: videoTitle || '동영상 학습', email,
        completedLocally: Boolean(previous?.completedLocally || (resolvedDuration > 0 && bestTime >= resolvedDuration * 0.8)),
        transmission: previous?.transmission || 'pending',
        watchedTime: bestTime, duration: resolvedDuration, attemptId: previous?.attemptId,
    });
}

export function startVideoAttempt(input: { email?: string | null; videoUrl: string; videoTitle?: string; category?: string }) {
    if (!input.email || !input.videoUrl) return;
    const key = `${input.category || ''}::${input.videoUrl}`;
    saveAttempt({
        kind: 'video', key, videoUrl: input.videoUrl, category: input.category,
        label: input.videoTitle || '동영상 학습', email: input.email,
        completedLocally: false, transmission: 'pending', watchedTime: 0, duration: 0,
        attemptId: typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
}

export function getVideoAttemptId(email: string, videoUrl: string, category?: string): string | undefined {
    return getLearningAttempts(email).find(item => item.kind === 'video' && item.key === `${category || ''}::${videoUrl}`)?.attemptId;
}

export async function waitForLearningRequests(milliseconds = 10000) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            Promise.allSettled([...inFlight]),
            new Promise<void>(resolve => { timer = setTimeout(resolve, milliseconds); }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

/** Preserve fetch semantics while recording requests that feed the instructor report. */
let learningTokenProvider: (() => Promise<string | null>) | null = null;

export function setLearningTokenProvider(provider: () => Promise<string | null>) {
    learningTokenProvider = provider;
}

export function trackedLearningFetch(url: string, init: RequestInit): Promise<Response> {
    const request = (async () => {
        let attempt: LearningAttempt | undefined;
        try {
            const body = JSON.parse(String(init.body || '{}'));
            const email = (body.email || /(?:^|\n)Email:\s*([^\r\n]+)/i.exec(String(body.content || ''))?.[1] || '').trim();
            if (url === '/api/video/watch-time' && email && body.videoUrl) {
                recordVideoProgress({ email, videoUrl: body.videoUrl, videoTitle: body.videoTitle, category: body.category, watchedTime: body.watchedTime, duration: body.duration });
                attempt = getLearningAttempts(email).find(item => item.kind === 'video' && item.key === `${body.category || ''}::${body.videoUrl}`);
            } else if ((url === '/api/log/create' || url === '/api/log/egd-lesion-dx') && email && body.fileName) {
                const prefix = url === '/api/log/create' ? 'log/' : 'log_EGD_Lesion_Dx/';
                attempt = {
                    kind: 'log', key: `${prefix}${body.fileName}`, label: body.fileName,
                    email, completedLocally: true, transmission: 'pending',
                };
                saveAttempt(attempt);
            } else if (/^\/api\/(sht|lht|mt)-video-upload$/.test(url) && body.userEmail && body.position && body.name) {
                const type = /^\/api\/(sht|lht|mt)-video-upload$/.exec(url)![1].toUpperCase();
                const key = `log/${body.position}-${body.name}-${type}`;
                recordLearningLogAttempt({ email: body.userEmail, key, label: `${type} 동영상 업로드`, completedLocally: true });
                attempt = getLearningAttempts(body.userEmail).find(item => item.kind === 'log' && item.key === key);
            }
        } catch {
            // The original request still runs; malformed bodies are handled by the API.
        }

        try {
            const token = await learningTokenProvider?.();
            const headers = new Headers(init.headers);
            if (token) headers.set('Authorization', `Bearer ${token}`);
            const response = await fetch(url, { ...init, headers });
            if (attempt) saveAttempt({ ...attempt, transmission: response.ok ? 'ok' : 'failed' });
            return response;
        } catch (error) {
            if (attempt) saveAttempt({ ...attempt, transmission: 'failed' });
            throw error;
        }
    })();
    inFlight.add(request);
    void request.finally(() => inFlight.delete(request)).catch(() => undefined);
    return request;
}
