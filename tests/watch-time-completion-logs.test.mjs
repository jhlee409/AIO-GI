import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadTypeScript(path, imports = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const moduleStub = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    exports: moduleStub.exports,
    module: moduleStub,
    require: name => imports[name],
    console: { log() {}, error() {} },
    Buffer,
    Date,
  });
  return moduleStub.exports;
}

const watchTime = loadTypeScript('../lib/report-watch-time.ts');

test('NVUGIB and EUS logs are created only after 80% viewing', async () => {
  const savedLogs = new Map();
  const savedSessions = [];
  class NextResponse {
    static json(body, options) { return { body, status: options?.status || 200 }; }
  }
  const route = loadTypeScript('../app/api/video/watch-time/route.ts', {
    'next/server': { NextResponse },
    '@/lib/api-auth': { requireUser: async () => ({ email: 'learner@example.com' }) },
    '@/lib/report-watch-time': watchTime,
    '@/lib/firebase-admin': {
      getAdminDb: () => ({
        collection: () => ({
          add: async data => {
            savedSessions.push(data);
            return {
              id: `session-${savedSessions.length}`,
              get: async () => ({ data: () => data }),
              update: async changes => Object.assign(data, changes),
            };
          },
        }),
      }),
      getAdminStorage: () => ({ bucket: () => ({
        file: key => ({
          exists: async () => [savedLogs.has(key)],
          save: async content => { savedLogs.set(key, content.toString('utf8')); },
        }),
      }) }),
    },
  });

  for (const [title, item] of [
    ['NVUGIB 총론 강의', 'NVUGIB_overview'],
    ['내과전공의를 위한 NVUGIB Mx의 기초', 'NVUGIB_Mx_basics_for_residents'],
    ['EUS_basic', 'EUS_basic'],
    ['EUS_SET', 'EUS_SET'],
    ['EUS_case', 'EUS_case'],
  ]) {
    const payload = watchedTime => ({
      json: async () => ({
        email: 'learner@example.com', position: 'F2', name: 'Learner',
        videoUrl: `https://example.test/${item}.mp4`, videoTitle: title,
        category: 'Advanced course for F2', duration: 100, watchedTime, action: 'update',
      }),
    });
    const below = await route.POST(payload(79.99));
    assert.equal(below.body.thresholdReached, false);
    assert.equal(savedLogs.has(`log/F2-Learner-${item}-Completed`), false);

    const completed = await route.POST(payload(80));
    assert.equal(completed.body.thresholdReached, true);
    assert.match(savedLogs.get(`log/F2-Learner-${item}-Completed`), /Action: Video 80% Completed/);
  }
  assert.equal(savedSessions.length, 10);
  assert.equal(savedLogs.size, 5);
});

test('ordinary video creates its item log at 80 percent and marks it saved afterward', async () => {
  const savedLogs = new Map();
  const sessions = [];
  class NextResponse {
    static json(body, options) { return { body, status: options?.status || 200 }; }
  }
  const route = loadTypeScript('../app/api/video/watch-time/route.ts', {
    'next/server': { NextResponse },
    '@/lib/api-auth': { requireUser: async () => ({ email: 'learner@example.com' }) },
    '@/lib/report-watch-time': watchTime,
    '@/lib/firebase-admin': {
      getAdminDb: () => ({ collection: () => ({
        add: async data => {
          sessions.push(data);
          return {
            get: async () => ({ data: () => data }),
            update: async changes => Object.assign(data, changes),
          };
        },
      }) }),
      getAdminStorage: () => ({ bucket: () => ({ file: key => ({
        exists: async () => [savedLogs.has(key)],
        save: async content => { savedLogs.set(key, content.toString('utf8')); },
      }) }) }),
    },
  });

  const response = await route.POST({ json: async () => ({
    email: 'learner@example.com', position: 'F1', name: 'Learner',
    videoUrl: 'https://example.test/ordinary.mp4', videoTitle: 'Ordinary lesson',
    category: 'Course A', duration: 100, watchedTime: 80, action: 'update',
  }) });
  assert.equal(response.status, 200);
  assert.match(savedLogs.get('log/F1-Learner-Ordinary lesson'), /Watched Time: 80 seconds/);
  assert.equal(sessions[0].logCreated, true);
});
