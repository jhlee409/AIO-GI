import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTsModule(path, extraSandbox = {}) {
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
    ...extraSandbox,
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  return sandbox.module.exports;
}

const {
  buildCpxTtsRequestBody,
  getCpxTtsModel,
  getCpxTtsInstructions,
  getCpxTtsSpeed,
  getCpxTtsVoice,
  isCpxTtsEnabledCase,
  isLikelyBrowserAutoplayBlock,
  sanitizeCpxTtsText,
  shouldAutoPlayCpxTts,
} = loadTsModule('../lib/cpx-tts.ts', { process: { env: {} } });

assert.equal(getCpxTtsModel({}), 'gpt-4o-mini-tts');
assert.equal(getCpxTtsModel({ CPX_TTS_MODEL: 'gpt-4o-mini-tts' }), 'gpt-4o-mini-tts');
assert.equal(getCpxTtsModel({ CPX_TTS_MODEL: 'tts-1' }), 'tts-1');

assert.equal(getCpxTtsVoice({}), 'cedar');
assert.equal(getCpxTtsVoice({ CPX_TTS_VOICE: 'verse' }), 'verse');
assert.equal(getCpxTtsVoice({ CPX_TTS_VOICE: 'verse' }, { voice: 'cedar' }), 'cedar');
assert.equal(getCpxTtsVoice({ CPX_TTS_VOICE: 'verse' }, { voice: 'onyx' }), 'onyx');
assert.equal(getCpxTtsVoice({}, { voice: 'cedar' }), 'cedar');

assert.match(getCpxTtsInstructions({}), /50대 후반 한국 남성/);
assert.match(getCpxTtsInstructions({}), /차분하고 자연스러운/);
assert.equal(getCpxTtsInstructions({ CPX_TTS_INSTRUCTIONS: '낮고 담담한 목소리' }), '낮고 담담한 목소리');
assert.match(
  getCpxTtsInstructions(
    { CPX_TTS_INSTRUCTIONS: '전역 설정 목소리' },
    { instructions: '70대 한국 남성 환자처럼 조금 느리고 낮은 목소리로 말합니다.' }
  ),
  /70대 한국 남성/
);

assert.equal(getCpxTtsSpeed({}), 1.3);
assert.equal(getCpxTtsSpeed({ CPX_TTS_SPEED: '1.3' }), 1.3);
assert.equal(getCpxTtsSpeed({ CPX_TTS_SPEED: '0.1' }), 1.3);
assert.equal(getCpxTtsSpeed({ CPX_TTS_SPEED: 'fast' }), 1.3);
assert.equal(getCpxTtsSpeed({ CPX_TTS_SPEED: '1.8' }, { speed: 1.3 }), 1.3);
assert.equal(getCpxTtsSpeed({}, { speed: 9 }), 1.3);

const defaultRequestBody = buildCpxTtsRequestBody('피를 토했습니다.', {});
assert.equal(defaultRequestBody.model, 'gpt-4o-mini-tts');
assert.equal(defaultRequestBody.voice, 'cedar');
assert.equal(defaultRequestBody.input, '피를 토했습니다.');
assert.equal(defaultRequestBody.response_format, 'mp3');
assert.equal(defaultRequestBody.speed, 1.3);
assert.equal(defaultRequestBody.instructions, getCpxTtsInstructions({}));

const dysphagiaRequestBody = buildCpxTtsRequestBody('잘 안 넘어갑니다.', {}, {
  voice: 'onyx',
  speed: 1.3,
  instructions: '70대 한국 남성 환자처럼 낮고 거친 듯한 노년 남성 톤으로 말합니다.',
});
assert.equal(dysphagiaRequestBody.voice, 'onyx');
assert.equal(dysphagiaRequestBody.speed, 1.3);
assert.match(dysphagiaRequestBody.instructions || '', /70대 한국 남성/);

const caseSpecificVoiceRequestBody = buildCpxTtsRequestBody('잘 안 넘어갑니다.', { CPX_TTS_VOICE: 'verse' }, {
  voice: 'onyx',
  speed: 1.3,
  instructions: '70대 한국 남성 환자처럼 말합니다.',
});
assert.equal(caseSpecificVoiceRequestBody.voice, 'onyx');
assert.equal(caseSpecificVoiceRequestBody.speed, 1.3);

const legacyRequestBody = buildCpxTtsRequestBody('피를 토했습니다.', { CPX_TTS_MODEL: 'tts-1' });
assert.equal(legacyRequestBody.model, 'tts-1');
assert.equal(legacyRequestBody.voice, 'cedar');
assert.equal(legacyRequestBody.input, '피를 토했습니다.');
assert.equal(legacyRequestBody.response_format, 'mp3');
assert.equal(legacyRequestBody.speed, 1.3);
assert.equal('instructions' in legacyRequestBody, false);

assert.equal(isCpxTtsEnabledCase('cpx_07'), true);
assert.equal(isCpxTtsEnabledCase('07'), true);
assert.equal(isCpxTtsEnabledCase('cpx_07_hematemesis'), true);
assert.equal(isCpxTtsEnabledCase('cpx_01'), true);
assert.equal(isCpxTtsEnabledCase('01'), true);
assert.equal(isCpxTtsEnabledCase('CPX_01_dysphagia'), true);
assert.equal(isCpxTtsEnabledCase('cpx_02'), true);
assert.equal(isCpxTtsEnabledCase('cpx_10'), true);
assert.equal(isCpxTtsEnabledCase('cpx_11'), false);

assert.equal(shouldAutoPlayCpxTts('cpx_07'), true);
assert.equal(shouldAutoPlayCpxTts('07'), true);
assert.equal(shouldAutoPlayCpxTts('cpx_07_hematemesis'), true);
assert.equal(shouldAutoPlayCpxTts('cpx_01'), true);
assert.equal(shouldAutoPlayCpxTts('CPX_01_dysphagia'), true);
assert.equal(shouldAutoPlayCpxTts('cpx_02'), true);
assert.equal(shouldAutoPlayCpxTts('cpx_10'), true);
assert.equal(shouldAutoPlayCpxTts('cpx_11'), false);

assert.equal(isLikelyBrowserAutoplayBlock({ name: 'NotAllowedError' }), true);
assert.equal(isLikelyBrowserAutoplayBlock({ name: 'AbortError' }), false);
assert.equal(isLikelyBrowserAutoplayBlock(new Error('network failed')), false);

assert.equal(sanitizeCpxTtsText('  피를 토했어요.\n\n어지럽지는 않았어요.  '), '피를 토했어요.\n어지럽지는 않았어요.');
assert.equal(sanitizeCpxTtsText(''), '');
