import assert from 'node:assert/strict';
import test from 'node:test';
import {
    clearLearningAttempts,
    getLearningAttempts,
    recordVideoProgress,
    startVideoAttempt,
    getVideoAttemptId,
    trackedLearningFetch,
} from '../lib/learning-session.ts';

const values = new Map();
globalThis.window = {};
globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
};

test('video completion follows the report 80 percent rule', () => {
    startVideoAttempt({ email: 'learner@example.com', videoUrl: 'video-a', videoTitle: 'Lecture A' });
    const firstAttemptId = getVideoAttemptId('learner@example.com', 'video-a');
    assert.ok(firstAttemptId);
    recordVideoProgress({ email: 'learner@example.com', videoUrl: 'video-a', videoTitle: 'Lecture A', watchedTime: 79, duration: 100 });
    assert.equal(getLearningAttempts('learner@example.com')[0].completedLocally, false);
    recordVideoProgress({ email: 'learner@example.com', videoUrl: 'video-a', videoTitle: 'Lecture A', watchedTime: 80, duration: 100 });
    assert.equal(getLearningAttempts('learner@example.com')[0].completedLocally, true);
    startVideoAttempt({ email: 'learner@example.com', videoUrl: 'video-a', videoTitle: 'Lecture A' });
    assert.notEqual(getVideoAttemptId('learner@example.com', 'video-a'), firstAttemptId);
    assert.equal(getLearningAttempts('learner@example.com')[0].completedLocally, false);
    clearLearningAttempts('learner@example.com');
});

test('learning log records a failed transfer', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await trackedLearningFetch('/api/log/create', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'F1-Learner-CPX_01', content: 'Email: learner@example.com\nAction: CPX Chat Started' }),
    });
    const [attempt] = getLearningAttempts('learner@example.com');
    assert.equal(attempt.key, 'log/F1-Learner-CPX_01');
    assert.equal(attempt.completedLocally, true);
    assert.equal(attempt.transmission, 'failed');
    clearLearningAttempts('learner@example.com');
});

test('upload metadata success is still marked for server readback', async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    await trackedLearningFetch('/api/sht-video-upload', {
        method: 'POST',
        body: JSON.stringify({ userEmail: 'learner@example.com', position: 'F1', name: 'Learner' }),
    });
    const [attempt] = getLearningAttempts('learner@example.com');
    assert.equal(attempt.key, 'log/F1-Learner-SHT');
    assert.equal(attempt.transmission, 'ok');
    clearLearningAttempts('learner@example.com');
});
