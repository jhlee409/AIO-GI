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
      if (request === './cpx-initial-flow') {
        return loadTsModule('../lib/cpx-initial-flow.ts');
      }
      if (request === './cpx-patient-output-mode') {
        return loadTsModule('../lib/cpx-patient-output-mode.ts');
      }
      if (request === './cpx-case') {
        return loadTsModule('../lib/cpx-case.ts');
      }
      throw new Error(`Unexpected require: ${request}`);
    },
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  return sandbox.module.exports;
}

const { getCpxCaseFlowConfig } = loadTsModule('../lib/cpx-case-flow.ts');

assert.equal(JSON.stringify(getCpxCaseFlowConfig('cpx_01')), JSON.stringify({
  initialAssistantMessage: '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.',
  shouldAutoSendFirstQuestion: false,
  canUsePatientOutputToggle: true,
  initialPatientOutputMode: 'text',
}));

assert.equal(JSON.stringify(getCpxCaseFlowConfig('cpx_07')), JSON.stringify({
  initialAssistantMessage: '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.',
  shouldAutoSendFirstQuestion: false,
  canUsePatientOutputToggle: true,
  initialPatientOutputMode: 'text',
}));

assert.equal(JSON.stringify(getCpxCaseFlowConfig('cpx_02')), JSON.stringify({
  initialAssistantMessage: '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.',
  shouldAutoSendFirstQuestion: false,
  canUsePatientOutputToggle: true,
  initialPatientOutputMode: 'text',
}));

assert.equal(JSON.stringify(getCpxCaseFlowConfig('cpx_10')), JSON.stringify({
  initialAssistantMessage: '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.',
  shouldAutoSendFirstQuestion: false,
  canUsePatientOutputToggle: true,
  initialPatientOutputMode: 'text',
}));

assert.equal(JSON.stringify(getCpxCaseFlowConfig('cpx_11')), JSON.stringify({
  initialAssistantMessage: null,
  shouldAutoSendFirstQuestion: true,
  canUsePatientOutputToggle: false,
  initialPatientOutputMode: 'text',
}));
