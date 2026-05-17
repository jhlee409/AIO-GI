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
  canUsePatientOutputToggle,
  getInitialPatientOutputMode,
  getNextPatientOutputMode,
  getNextPatientOutputModeLabel,
  isPatientTtsMode,
  shouldSpeakPatientMessage,
  shouldShowPatientText,
} = loadTsModule('../lib/cpx-patient-output-mode.ts');

assert.equal(canUsePatientOutputToggle('cpx_07'), true);
assert.equal(canUsePatientOutputToggle('07'), true);
assert.equal(canUsePatientOutputToggle('cpx_07_hematemesis'), true);
assert.equal(canUsePatientOutputToggle('cpx_01'), true);
assert.equal(canUsePatientOutputToggle('01'), true);
assert.equal(canUsePatientOutputToggle('CPX_01_dysphagia'), true);
assert.equal(canUsePatientOutputToggle('cpx_02'), true);
assert.equal(canUsePatientOutputToggle('cpx_10'), true);
assert.equal(canUsePatientOutputToggle('cpx_11'), false);
assert.equal(canUsePatientOutputToggle(null), false);
assert.equal(getInitialPatientOutputMode('cpx_07'), 'text');
assert.equal(getInitialPatientOutputMode('cpx_01'), 'text');
assert.equal(getNextPatientOutputMode('text'), 'voice');
assert.equal(getNextPatientOutputMode('voice'), 'text');
assert.equal(getNextPatientOutputModeLabel('text'), '음성 모드로 전환');
assert.equal(getNextPatientOutputModeLabel('voice'), '텍스트 모드로 전환');
assert.equal(shouldShowPatientText('text'), true);
assert.equal(shouldShowPatientText('voice'), false);
assert.equal(shouldShowPatientText('voice', '알겠습니다. 감사합니다. 선생님.'), false);
assert.equal(isPatientTtsMode('text'), false);
assert.equal(isPatientTtsMode('voice'), true);
assert.equal(shouldSpeakPatientMessage('voice', '오늘 아침 피를 토해서 왔습니다.'), true);
assert.equal(shouldSpeakPatientMessage('voice', '알겠습니다. 감사합니다. 선생님.'), true);
assert.equal(shouldSpeakPatientMessage('text', '오늘 아침 피를 토해서 왔습니다.'), false);
