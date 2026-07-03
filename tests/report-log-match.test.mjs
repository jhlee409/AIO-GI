import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/report-log-match.ts', import.meta.url), 'utf8');
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

const { logLectureTitleMatches } = sandbox.module.exports;

assert.equal(
  logLectureTitleMatches('F1-홍길동-APC', 'APC', undefined, '홍길동', 'F1'),
  true
);
assert.equal(
  logLectureTitleMatches('F1-홍길동-APC', 'AP', undefined, '홍길동', 'F1'),
  false
);
assert.equal(
  logLectureTitleMatches('F1-홍길동-EMT', 'MT', undefined, '홍길동', 'F1'),
  false
);
assert.equal(
  logLectureTitleMatches('F1-홍길동-Complication_Sedation', 'Complication', undefined, '홍길동', 'F1'),
  false
);
assert.equal(
  logLectureTitleMatches('F1홍길동B1', 'B1', undefined, '홍길동', 'F1'),
  true
);
assert.equal(
  logLectureTitleMatches(
    'F1-홍길동-NVUGIB_overview',
    'NVUGIB 총론 강의',
    'Item: NVUGIB 총론 강의',
    '홍길동',
    'F1'
  ),
  true
);
assert.equal(
  logLectureTitleMatches(
    'F2-홍길동-PBL_F2_01',
    'PBL_F2',
    'Case: PBL_F2_01 - stage IV AGC 환자의 검사와 치료',
    '홍길동',
    'F2'
  ),
  false
);
assert.equal(
  logLectureTitleMatches(
    'F2-홍길동-PBL_F2_01',
    'PBL_F2_01',
    'Case: PBL_F2_01 - stage IV AGC 환자의 검사와 치료',
    '홍길동',
    'F2'
  ),
  true
);
