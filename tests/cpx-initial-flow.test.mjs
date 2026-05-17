import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTsModule(path) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
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
    require: (request) => {
      if (request === './cpx-case') {
        return loadTsModule('../lib/cpx-case.ts');
      }
      throw new Error(`Unexpected require: ${request}`);
    },
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  return sandbox.module.exports;
}

const {
  CPX_07_INITIAL_GREETING,
  STRUCTURED_CPX_INITIAL_GREETING,
  getCpxInitialAssistantMessage,
  shouldAutoSendFirstCpxQuestion,
} = loadTsModule('../lib/cpx-initial-flow.ts');

assert.equal(CPX_07_INITIAL_GREETING, '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.');
assert.equal(STRUCTURED_CPX_INITIAL_GREETING, CPX_07_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('cpx_07'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('07'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('cpx_07_hematemesis'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('cpx_01'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('CPX_01_dysphagia'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('cpx_02'), STRUCTURED_CPX_INITIAL_GREETING);
assert.equal(getCpxInitialAssistantMessage('cpx_10'), STRUCTURED_CPX_INITIAL_GREETING);

assert.equal(shouldAutoSendFirstCpxQuestion('cpx_07'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('07'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('cpx_07_hematemesis'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('cpx_01'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('CPX_01_dysphagia'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('cpx_02'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('cpx_10'), false);
assert.equal(shouldAutoSendFirstCpxQuestion('cpx_11'), true);
assert.equal(shouldAutoSendFirstCpxQuestion(null), true);
