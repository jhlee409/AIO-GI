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

const { isReportableLearningLog, logLectureTitleMatches } = sandbox.module.exports;

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
assert.equal(isReportableLearningLog('F2-홍길동-PBL_F2_01'), false);
assert.equal(isReportableLearningLog('F2홍길동PBL_F2_01.txt'), false);
assert.equal(isReportableLearningLog('F2-홍길동-PBL_F2_01-Completed'), true);
assert.equal(isReportableLearningLog('F2-홍길동-CPX_01'), true);
assert.equal(isReportableLearningLog('F1-홍길동-PEG'), false);
assert.equal(isReportableLearningLog('F1-홍길동-PEG-Completed'), true);
for (const item of ['NVUGIB_overview', 'NVUGIB_Mx_basics_for_residents', 'EUS_basic', 'EUS_SET', 'EUS_case']) {
  assert.equal(isReportableLearningLog(`F2-홍길동-${item}`), false, `${item} play logs cannot prove completion`);
  assert.equal(isReportableLearningLog(`F2-홍길동-${item}-Completed`), true);
  assert.equal(logLectureTitleMatches(`F2-홍길동-${item}-Completed`, item, undefined, '홍길동', 'F2'), true);
}
assert.equal(
  logLectureTitleMatches('F1-홍길동-NVUGIB_overview-Completed', 'NVUGIB 총론 강의', undefined, '홍길동', 'F1'),
  true
);
assert.equal(
  logLectureTitleMatches('F1-홍길동-NVUGIB_Mx_basics_for_residents-Completed', '내과전공의를 위한 NVUGIB Mx의 기초', undefined, '홍길동', 'F1'),
  true
);
assert.equal(
  logLectureTitleMatches('F1-홍길동-NVUGIB_Mx_basics_for_residents-Completed', 'Fundamentals_of_NVUGIB_Management', undefined, '홍길동', 'F1'),
  true
);
assert.equal(logLectureTitleMatches('F1-홍길동-PEG-Completed', 'PEG', undefined, '홍길동', 'F1'), true);
assert.equal(logLectureTitleMatches('F1-홍길동-PEG-Completed', '7. PEG', undefined, '홍길동', 'F1'), true);
assert.equal(
  logLectureTitleMatches('F2-홍길동-PBL_F2_01-Completed', 'PBL_F2_01', undefined, '홍길동', 'F2'),
  true
);
