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
