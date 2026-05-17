import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-stt.ts', import.meta.url), 'utf8');
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
const {
  buildCpxSttPrompt,
  collectCpxSttKeywords,
  getCpxSttModel,
  getSafeAudioFileName,
  isSupportedAudioMimeType,
} = sandbox.module.exports;

assert.equal(getCpxSttModel({}), 'gpt-4o-mini-transcribe');
assert.equal(getCpxSttModel({ CPX_STT_MODEL: 'gpt-4o-mini-transcribe' }), 'gpt-4o-mini-transcribe');
assert.equal(getCpxSttModel({ CPX_STT_MODEL: 'whisper-1' }), 'whisper-1');

assert.equal(isSupportedAudioMimeType('audio/webm;codecs=opus'), true);
assert.equal(isSupportedAudioMimeType('audio/wav'), true);
assert.equal(isSupportedAudioMimeType('text/plain'), false);

assert.equal(getSafeAudioFileName('audio/webm;codecs=opus'), 'cpx-recording.webm');
assert.equal(getSafeAudioFileName('audio/mp4'), 'cpx-recording.mp4');

const prompt = buildCpxSttPrompt();
assert.match(prompt, /한국어/);
assert.match(prompt, /혈변/);
assert.match(prompt, /연하곤란/);

const scenario = {
  title: 'CPX_05_abdominal_pain',
  chiefComplaint: '배가 너무 아파 병원을 방문하게 되었습니다.',
  historyItems: [
    { keywords: ['오른쪽 윗배', '삼겹살', '통증'] },
    { keywords: ['삼겹살', '우측 어깨'] },
  ],
  negativeFindings: [
    { keywords: ['황달', '흑변'] },
  ],
};

assert.equal(
  JSON.stringify(collectCpxSttKeywords(scenario).slice(0, 7)),
  JSON.stringify(['CPX_05_abdominal_pain', '배가 너무 아파 병원을 방문하게 되었습니다.', '오른쪽 윗배', '삼겹살', '통증', '우측 어깨', '황달'])
);

const scenarioPrompt = buildCpxSttPrompt(scenario);
assert.match(scenarioPrompt, /현재 선택된 증례 관련 표현/);
assert.match(scenarioPrompt, /CPX_05_abdominal_pain/);
assert.match(scenarioPrompt, /오른쪽 윗배/);
assert.match(scenarioPrompt, /삼겹살/);
