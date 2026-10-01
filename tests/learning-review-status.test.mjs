import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateVideoAttempt } from '../lib/learning-review-status.ts';

const attempt = {
    kind: 'video', key: 'Advanced course for F1::case-url', videoUrl: 'case-url',
    category: 'Advanced course for F1', attemptId: 'current-playback',
    label: 'angiodysplasia_01', email: 'learner@example.com',
    completedLocally: false, transmission: 'ok',
};

test('a short hemostasis case viewing stays incomplete despite an older completion', () => {
    const records = [
        { videoUrl: 'case-url', category: 'Advanced course for F1', attemptId: 'older-playback', sessionType: 'final', watchedTime: 100, duration: 100 },
        { videoUrl: 'case-url', category: 'Advanced course for F1', attemptId: 'current-playback', sessionType: 'final', watchedTime: 2, duration: 100 },
    ];
    assert.equal(evaluateVideoAttempt(attempt, records), 'incomplete');
});

test('a saved 80 percent viewing is complete; an unsaved one reports failure', () => {
    const complete = { ...attempt, completedLocally: true };
    assert.equal(evaluateVideoAttempt(complete, []), 'failed');
    assert.equal(evaluateVideoAttempt(complete, [
        { videoUrl: 'case-url', category: 'Advanced course for F1', attemptId: 'current-playback', sessionType: 'final', watchedTime: 80, duration: 100 },
    ]), 'complete');
});
