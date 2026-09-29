import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../app/api/cpx/chat/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

async function runChat(choices) {
  const requests = [];
  const moduleStub = { exports: {} };
  const sandbox = {
    exports: moduleStub.exports,
    module: moduleStub,
    process: { env: { OPENAI_API_KEY: 'test-key' } },
    console,
    require(id) {
      if (id === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
      if (id === '@/lib/cpx-broad-question') return { getCpxBroadQuestionOverride: () => null };
      if (id === '@/lib/cpx-chat-config') return { getCpxChatMaxTokens: () => 2048 };
      if (id === '@/lib/cpx-chat-prompt') return { buildCpxChatSystemPrompt: () => 'scenario prompt' };
      if (id === '@/lib/cpx-closing-flow') return {
        CPX_FINAL_CLOSING_MESSAGE: 'end marker',
        getCpxClosingFlowOverride: () => null,
      };
      throw new Error(`Unexpected import: ${id}`);
    },
    async fetch(url, options) {
      requests.push({ url, body: JSON.parse(options.body) });
      const choice = choices[requests.length - 1];
      return { ok: true, json: async () => ({ choices: [choice] }) };
    },
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  const result = await moduleStub.exports.POST({
    json: async () => ({ scenario: 'scenario', messages: [{ role: 'user', content: 'question' }] }),
  });
  return { result, requests };
}

const retried = await runChat([
  { message: { content: 'partial' }, finish_reason: 'length' },
  { message: { content: 'complete answer' }, finish_reason: 'stop' },
]);
assert.equal(retried.result.body.message, 'complete answer');
assert.equal(retried.requests.length, 2);
assert.equal(retried.requests[0].body.model, 'gpt-6-luna');
assert.equal(retried.requests[0].body.reasoning_effort, 'low');
assert.equal(retried.requests[0].body.max_completion_tokens, 2048);
assert.equal(retried.requests[1].body.max_completion_tokens, 8192);
assert.equal('temperature' in retried.requests[0].body, false);
assert.equal('max_tokens' in retried.requests[0].body, false);

const empty = await runChat([
  { message: { content: '' }, finish_reason: 'length' },
  { message: { content: 'answer after retry' }, finish_reason: 'stop' },
]);
assert.equal(empty.result.body.message, 'answer after retry');

const failed = await runChat([
  { message: { content: '' }, finish_reason: 'length' },
  { message: { content: 'still partial' }, finish_reason: 'length' },
]);
assert.equal(failed.result.status, 502);
assert.equal(failed.result.body.message, undefined);
