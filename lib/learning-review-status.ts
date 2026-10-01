import type { LearningAttempt } from './learning-session';

export interface VideoWatchRecord {
    videoUrl?: string;
    category?: string;
    attemptId?: string;
    sessionType?: string;
    duration?: number;
    watchedTime?: number;
}

/** Check this playback attempt, not a completion from an earlier viewing. */
export function evaluateVideoAttempt(
    attempt: LearningAttempt,
    records: VideoWatchRecord[],
): 'complete' | 'incomplete' | 'failed' {
    const percentages = records
        .filter(record => record.videoUrl === attempt.videoUrl &&
            (!attempt.category || record.category === attempt.category) &&
            (!attempt.attemptId || record.attemptId === attempt.attemptId) &&
            record.sessionType === 'final' && Number(record.duration) > 0)
        .map(record => Number(record.watchedTime) / Number(record.duration) * 100);
    const bestPercentage = Math.max(0, ...percentages);
    if (bestPercentage >= 80) return 'complete';
    return attempt.completedLocally ? 'failed' : 'incomplete';
}
