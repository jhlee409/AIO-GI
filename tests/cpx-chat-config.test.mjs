import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-chat-config.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleStub = { exports: {} };
const sandbox = {
  exports: moduleStub.exports,
  module: moduleStub,
  process: { env: {} },
};
vm.runInNewContext(compiled.outputText, sandbox);

const { getCpxChatMaxTokens } = sandbox.module.exports;

assert.equal(getCpxChatMaxTokens({}), 250);
assert.equal(getCpxChatMaxTokens({ CPX_CHAT_MAX_TOKENS: '180' }), 180);
assert.equal(getCpxChatMaxTokens({ CPX_CHAT_MAX_TOKENS: '20' }), 250);
assert.equal(getCpxChatMaxTokens({ CPX_CHAT_MAX_TOKENS: 'fast' }), 250);
