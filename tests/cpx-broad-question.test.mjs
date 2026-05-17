import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-broad-question.ts', import.meta.url), 'utf8');
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

const { getCpxBroadQuestionOverride, isOverlyBroadCpxQuestion } = sandbox.module.exports;

assert.equal(isOverlyBroadCpxQuestion('그 때 상황을 다 설명해 주세요'), true);
assert.equal(isOverlyBroadCpxQuestion('그때 상황을 처음부터 끝까지 자세히 말해주세요'), true);
assert.equal(isOverlyBroadCpxQuestion('오늘 있었던 일을 전부 얘기해 주세요'), true);
assert.equal(isOverlyBroadCpxQuestion('증상에 대해서 전체적으로 알려주세요'), true);

assert.equal(isOverlyBroadCpxQuestion('어디가 불편해서 오셨습니까?'), false);
assert.equal(isOverlyBroadCpxQuestion('피를 얼마나 토했나요?'), false);
assert.equal(isOverlyBroadCpxQuestion('변 색깔은 어땠나요?'), false);

const override = getCpxBroadQuestionOverride([
  { role: 'assistant', content: '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.' },
  { role: 'user', content: '그 때 상황을 다 설명해 주세요' },
]);

assert.equal(override.message, '한 가지씩 물어봐 주세요.');
assert.equal(override.isEnded, false);
