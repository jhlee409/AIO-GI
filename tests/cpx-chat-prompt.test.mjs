import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-chat-prompt.ts', import.meta.url), 'utf8');
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
};
vm.runInNewContext(compiled.outputText, sandbox);

const { buildCpxChatSystemPrompt } = sandbox.module.exports;

const prompt = buildCpxChatSystemPrompt('시나리오 본문');

assert.match(prompt, /사용자가 명시적으로 물어본 항목에 대해서만 답하세요/);
assert.match(prompt, /관련된 사항까지 덧붙이지 마세요/);
assert.match(prompt, /한 가지씩 물어봐 주세요/);
assert.match(prompt, /그 때 상황을 다 설명해 주세요/);
assert.match(prompt, /처음부터 끝까지/);
assert.match(prompt, /넓은 병력 요청/);
assert.match(prompt, /시나리오 본문/);
assert.match(prompt, /알겠습니다\. 감사합니다\. 선생님\./);
assert.doesNotMatch(prompt, /"대화 종료"라고 명시/);
