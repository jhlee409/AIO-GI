/** Learning attempts in this browser, used only to review the current user's logout. */
export interface LearningAttempt {
    kind: 'log' | 'video';
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

export async function waitForLearningRequests() {
    await Promise.allSettled([...inFlight]);
}

/** Preserve fetch semantics while recording requests that feed the instructor report. */
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
            const response = await fetch(url, init);
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
