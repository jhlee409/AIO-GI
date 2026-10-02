import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

class NextResponse {
  static json(body, options) { return Object.assign(new NextResponse(), { body, status: options?.status || 200 }); }
}

function loadApiAuth() {
  const source = fs.readFileSync(new URL('../lib/api-auth.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const moduleStub = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    exports: moduleStub.exports,
    module: moduleStub,
    require: name => ({
      'next/server': { NextResponse },
      '@/lib/auth-server': { isAdminEmail: async email => email === 'admin@example.com' },
      '@/lib/firebase-admin': {
        getAdminAuth: () => ({ verifyIdToken: async token => {
          if (token === 'bad') throw new Error('Invalid token');
          return { uid: 'verified', email: token === 'admin' ? 'admin@example.com' : 'learner@example.com' };
        } }),
        getAdminDb: () => ({ collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({
          empty: false,
          docs: [{ data: () => ({ 교육자: 'yes', 병원: 'Hospital A' }) }],
        }) }) }) }) }),
      },
    })[name],
  });
  return moduleStub.exports;
}

const request = token => ({ headers: { get: () => token ? `Bearer ${token}` : null } });

test('admin API requires a verified administrator token', async () => {
  const { requireAdmin } = loadApiAuth();
  assert.equal((await requireAdmin(request(null))).status, 401);
  assert.equal((await requireAdmin(request('bad'))).status, 401);
  assert.equal((await requireAdmin(request('learner'))).status, 403);
  assert.equal((await requireAdmin(request('admin'))).email, 'admin@example.com');
});

test('instructor API derives hospital access from a verified identity', async () => {
  const { requireInstructor } = loadApiAuth();
  const access = await requireInstructor(request('learner'));
  assert.equal(access.email, 'learner@example.com');
  assert.equal(access.hospital, 'Hospital A');
  assert.equal(access.isAdmin, false);
});
