import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function loadTsModule(path) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      resolveJsonModule: true,
      esModuleInterop: true,
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
      if (request.startsWith('../data/cpx/')) {
        return require(request.replace('../data/cpx/', '../data/cpx/'));
      }
      throw new Error(`Unexpected require: ${request}`);
    },
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  return sandbox.module.exports;
}

const { getStructuredCpxScenario } = loadTsModule('../lib/cpx-scenario-registry.ts');

const expectedProfiles = {
  cpx_01: ['CPX_01_dysphagia', 'onyx', 1.3, /70대 한국 남성/],
  cpx_02: ['CPX_02_jaundice', 'echo', 1.3, /60대 한국 남성/],
  cpx_03: ['CPX_03_indigestion', 'shimmer', 1.3, /50대 한국 여성/],
  cpx_04: ['CPX_04_hematochezia', 'coral', 1.3, /40대 한국 여성/],
  cpx_05: ['CPX_05_abdominal_pain', 'sage', 1.3, /50대 한국 여성/],
  cpx_06: ['CPX_06_constipation', 'nova', 1.3, /20대 한국 여성/],
  cpx_07: ['CPX_07_hematemesis', 'cedar', 1.3, /50대 후반 한국 남성/],
  cpx_08: ['CPX_08_diarrhea', 'verse', 1.3, /30대 한국 여성/],
  cpx_09: ['CPX_09_vomiting', 'shimmer', 1.3, /50대 한국 여성/],
  cpx_10: ['CPX_10_epigastric_pain', 'onyx', 1.3, /70대 한국 남성/],
};

for (const [caseId, [title, voice, speed, instructionPattern]] of Object.entries(expectedProfiles)) {
  const scenario = getStructuredCpxScenario(caseId);
  assert.equal(scenario?.title, title);
  assert.equal(scenario?.ttsProfile?.voice, voice);
  assert.equal(scenario?.ttsProfile?.speed, speed);
  assert.match(scenario?.ttsProfile?.instructions || '', instructionPattern);
  assert.equal(scenario?.openingAnswer, '선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다.');
  assert.ok(scenario?.historyItems?.length, `${caseId} should have history items`);
  assert.ok(scenario?.responseRules?.some(rule => rule.includes('한 가지씩 물어봐 주세요')));
  assert.equal(scenario?.closingQuestions?.length, 2);
}

assert.equal(getStructuredCpxScenario('cpx_11'), null);
