import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('simultaneous profile readers share a request without keeping stale responses', async () => {
  const source = fs.readFileSync(new URL('../lib/client-user-info.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const moduleStub = { exports: {} };
  let calls = 0;
  const fetch = async () => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 2));
    return new Response(JSON.stringify({ version: calls }), { headers: { 'Content-Type': 'application/json' } });
  };
  vm.runInNewContext(compiled.outputText, {
    exports: moduleStub.exports,
    module: moduleStub,
    require(id) {
      if (id === '@/lib/client-authenticated-fetch') return { authenticatedFetch: fetch };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  const { fetchSharedUserInfo } = moduleStub.exports;

  const [first, second] = await Promise.all([
    fetchSharedUserInfo('/api/user/profile?email=a'),
    fetchSharedUserInfo('/api/user/profile?email=a'),
  ]);
  assert.equal(calls, 1);
  assert.equal((await first.json()).version, 1);
  assert.equal((await second.json()).version, 1);

  const refreshed = await fetchSharedUserInfo('/api/user/profile?email=a');
  assert.equal(calls, 2);
  assert.equal((await refreshed.json()).version, 2);
});
