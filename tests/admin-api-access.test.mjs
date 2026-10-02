import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadRoute(path, imports) {
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
    Date,
    Set,
  });
  return moduleStub.exports;
}

class NextResponse {
  static json(body, options) { return { body, status: options?.status || 200 }; }
}

test('admin deletion accepts only selected email addresses', async () => {
  const deleted = [];
  const route = loadRoute('../app/api/admin/auth-deletion/route.ts', {
    'next/server': { NextResponse },
    '@/lib/api-auth': { requireAdmin: async () => ({ email: 'admin@example.com' }) },
    '@/lib/auth-server': {
      isSuperAdminEmail: () => false,
      isPrimaryAdminEmail: () => false,
    },
    '@/lib/firebase-admin': {
      getAdminAuth: () => ({
        listUsers: async () => ({ users: [
          { uid: 'selected', email: 'selected@example.com' },
          { uid: 'other', email: 'other@example.com' },
        ] }),
        deleteUser: async uid => { deleted.push(uid); },
      }),
      getAdminRealtimeDb: () => ({ ref: () => ({ push: () => ({ key: 'record', set: async () => {} }) }) }),
    },
  });

  const response = await route.POST({ json: async () => ({ userEmails: ['Selected@example.com'] }) });
  assert.equal(response.status, 200);
  assert.deepEqual(deleted, ['selected']);
});

test('admin deletion rejects a request without selected users', async () => {
  const route = loadRoute('../app/api/admin/auth-deletion/route.ts', {
    'next/server': { NextResponse },
    '@/lib/api-auth': { requireAdmin: async () => ({ email: 'admin@example.com' }) },
    '@/lib/auth-server': { isSuperAdminEmail: () => false, isPrimaryAdminEmail: () => false },
    '@/lib/firebase-admin': { getAdminAuth: () => ({}) },
  });
  const response = await route.POST({ json: async () => ({ userEmails: [] }) });
  assert.equal(response.status, 400);
});

test('learner cannot submit a video completion file through the generic log API', async () => {
  const route = loadRoute('../app/api/log/create/route.ts', {
    'next/server': { NextResponse },
    '@/lib/api-auth': { requireUser: async () => ({ email: 'learner@example.com' }) },
    '@/lib/firebase-admin': { getAdminStorage: () => { throw new Error('Storage should not be used'); } },
  });
  const response = await route.POST({ json: async () => ({
    fileName: 'F1-Learner-PEG-Completed',
    content: 'Email: learner@example.com\nAction: Video 80% Completed',
  }) });
  assert.equal(response.status, 403);
});
