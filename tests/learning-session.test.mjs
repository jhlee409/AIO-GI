import assert from 'node:assert/strict';
import test from 'node:test';
import {
    clearLearningAttempts,
    getLearningAttempts,
    recordVideoProgress,
    startVideoAttempt,
    getVideoAttemptId,
    getLearningExitIssue,
    getVerifiedLearningExitIssue,
    getActiveLearningAttempt,
    setActiveLearningAttempt,
    clearActiveLearningAttempt,
    trackedLearningFetch,
    recordLearningLogAttempt,
    startLearningLogAttempt,
    startPblAttempt,
    completePblAttempt,
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

test('PEG, NVUGIB and EUS exits remain incomplete before 80 percent of playback', () => {
    const email = 'learner@example.com';
    for (const [videoTitle, category] of [
        ['PEG', 'Advanced course for F1'],
        ['NVUGIB 총론 강의', 'Advanced course for F1'],
        ['EUS_basic', 'Advanced course for F2'],
        ['EUS_SET', 'Advanced course for F2'],
        ['EUS_case', 'Advanced course for F2'],
    ]) {
        const videoUrl = `video-${videoTitle}`;
        startVideoAttempt({ email, videoUrl, videoTitle, category });
        recordVideoProgress({ email, videoUrl, videoTitle, category, watchedTime: 79, duration: 100 });
        const attempt = getLearningAttempts(email).find(item => item.kind === 'video');
        assert.equal(getLearningExitIssue(attempt), 'incomplete', videoTitle);
        recordVideoProgress({ email, videoUrl, videoTitle, category, watchedTime: 80, duration: 100 });
        assert.equal(getLearningAttempts(email).find(item => item.kind === 'video').completedLocally, true, videoTitle);
        clearLearningAttempts(email);
    }
});

test('only the active unfinished item needs an exit warning', () => {
    assert.equal(getActiveLearningAttempt(), null);
    assert.equal(getLearningExitIssue(undefined), null);
    const email = 'learner@example.com';
    startVideoAttempt({ email, videoUrl: 'video-b', videoTitle: 'Lecture B' });
    const attempt = getLearningAttempts(email)[0];
    setActiveLearningAttempt({ kind: 'video', key: attempt.key, label: attempt.label, email });
    assert.equal(getLearningExitIssue(attempt), 'incomplete');
    assert.equal(getLearningExitIssue({ ...attempt, completedLocally: true, transmission: 'failed' }), 'failed');
    assert.equal(getLearningExitIssue({ ...attempt, completedLocally: true, transmission: 'ok' }), null);
    clearActiveLearningAttempt(attempt.key);
    assert.equal(getActiveLearningAttempt(), null);
    clearLearningAttempts(email);
});

test('a demo video restores its parent upload item when closed', () => {
    const email = 'learner@example.com';
    setActiveLearningAttempt({ kind: 'log', key: 'log/F1-Learner-MT', label: 'MT', email });
    setActiveLearningAttempt({ kind: 'video', key: 'basic::demo', label: 'Demo', email });
    assert.equal(getActiveLearningAttempt().label, 'Demo');
    clearActiveLearningAttempt('basic::demo');
    assert.equal(getActiveLearningAttempt().label, 'MT');
    clearLearningAttempts(email);
    assert.equal(getActiveLearningAttempt(), null);
});

test('server-created EMT log is checked before clearing the exit warning', async () => {
    const email = 'learner@example.com';
    const key = 'log/F1-Learner-EMT';
    recordLearningLogAttempt({ email, key, label: 'EMT', completedLocally: true });
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ results: [{ key, state: 'complete' }] }) });
    assert.equal(await getVerifiedLearningExitIssue(getLearningAttempts(email)[0], async () => 'token'), null);
    assert.equal(getLearningAttempts(email)[0].transmission, 'ok');
    clearLearningAttempts(email);
});

test('a successful upload response does not hide a missing instructor log', async () => {
    const email = 'learner@example.com';
    const key = 'log/F1-Learner-SHT';
    recordLearningLogAttempt({ email, key, label: 'SHT', completedLocally: true });
    const attempt = { ...getLearningAttempts(email)[0], transmission: 'ok' };
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ results: [{ key, state: 'failed' }] }) });
    assert.equal(await getVerifiedLearningExitIssue(attempt, async () => 'token'), 'failed');
    clearLearningAttempts(email);
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

test('opening a log-completion item warns until its completion request succeeds', async () => {
    const email = 'learner@example.com';
    const key = 'log/F1-Learner-PEG';
    recordLearningLogAttempt({ email, key, label: 'PEG', completedLocally: false });
    assert.equal(getLearningExitIssue(getLearningAttempts(email)[0]), 'incomplete');
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    await trackedLearningFetch('/api/log/create', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'F1-Learner-PEG', content: `Email: ${email}\nAction: Video Play` }),
    });
    assert.equal(getLearningExitIssue(getLearningAttempts(email)[0]), null);
    clearLearningAttempts(email);
});

test('F1 and F2 EGD lesion Dx questions require their own progress-button log', async () => {
    const email = 'learner@example.com';
    for (const version of ['F1', 'F2']) {
        const imageBase = version === 'F1' ? '10월_eso_02' : 'lesion_01';
        const fileName = `${version}-Learner-${version}_${imageBase}`;
        const key = `log_EGD_Lesion_Dx/${fileName}`;
        const label = `EGD lesion Dx ${version}: ${imageBase}`;
        startLearningLogAttempt({ email, key, label });
        setActiveLearningAttempt({ kind: 'log', email, key, label });
        const opened = getLearningAttempts(email).find(item => item.key === key);
        assert.equal(getLearningExitIssue(opened), 'incomplete');
        assert.equal(await getVerifiedLearningExitIssue(opened, async () => 'token'), 'incomplete');

        globalThis.fetch = async () => ({ ok: true, status: 200 });
        await trackedLearningFetch('/api/log/egd-lesion-dx', {
            method: 'POST',
            body: JSON.stringify({ fileName, content: `Email: ${email}\nAction: Progress Button Click` }),
        });
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ results: [{ key, state: 'complete' }] }),
        });
        const submitted = getLearningAttempts(email).find(item => item.key === key);
        assert.equal(await getVerifiedLearningExitIssue(submitted, async () => 'token'), null);

        startLearningLogAttempt({ email, key, label });
        const reopened = getLearningAttempts(email).find(item => item.key === key);
        assert.equal(getLearningExitIssue(reopened), 'incomplete');
        assert.equal(await getVerifiedLearningExitIssue(reopened, async () => 'token'), 'incomplete');
        clearLearningAttempts(email);
    }
});

test('PBL and CPX start logs alone do not activate an exit warning', async () => {
    const email = 'learner@example.com';
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    for (const [name, action] of [['PBL_F2_01', 'PBL Started'], ['CPX_01', 'CPX Chat Started']]) {
        await trackedLearningFetch('/api/log/create', {
            method: 'POST',
            body: JSON.stringify({ fileName: `F1-Learner-${name}`, content: `Email: ${email}\nAction: ${action}` }),
        });
    }
    assert.equal(getActiveLearningAttempt(), null);
    clearLearningAttempts(email);
});

test('PBL is incomplete before its final step and requires the completion log afterward', async () => {
    const email = 'learner@example.com';
    const caseId = 'PBL_F2_01';
    startPblAttempt({ email, caseId });
    const attempt = getLearningAttempts(email).find(item => item.kind === 'pbl');
    assert.equal(getActiveLearningAttempt()?.key, `pbl/${caseId}`);
    assert.equal(getLearningExitIssue(attempt), 'incomplete');

    assert.equal(await getVerifiedLearningExitIssue(attempt, async () => 'token'), 'incomplete');
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    await trackedLearningFetch('/api/log/create', {
        method: 'POST',
        body: JSON.stringify({ fileName: `F2-Learner-${caseId}`, content: `Email: ${email}\nAction: PBL Started` }),
    });
    completePblAttempt({ email, caseId });
    let completed = getLearningAttempts(email).find(item => item.kind === 'pbl');
    assert.equal(await getVerifiedLearningExitIssue(completed, async () => 'token'), 'failed');

    const logKey = `log/F2-Learner-${caseId}-Completed`;
    const requested = [];
    globalThis.fetch = async (url, init) => {
        requested.push(url);
        if (url === '/api/log/create') {
            assert.equal(JSON.parse(init.body).fileName, logKey.slice(4));
            return { ok: true, status: 200 };
        }
        return { ok: true, json: async () => ({ results: [{ key: logKey, state: 'complete' }] }) };
    };
    await trackedLearningFetch('/api/log/create', {
        method: 'POST',
        body: JSON.stringify({ fileName: logKey.slice(4), content: `Email: ${email}\nAction: PBL Completed` }),
    });
    completed = getLearningAttempts(email).find(item => item.kind === 'pbl');
    assert.equal(await getVerifiedLearningExitIssue(completed, async () => 'token'), null);
    assert.deepEqual(requested, ['/api/log/create', '/api/learning/logout-status']);

    startPblAttempt({ email, caseId });
    assert.equal(getLearningExitIssue(getLearningAttempts(email).find(item => item.kind === 'pbl')), 'incomplete');
    clearLearningAttempts(email);
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
