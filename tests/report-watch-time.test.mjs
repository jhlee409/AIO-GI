import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/report-watch-time.ts', import.meta.url), 'utf8');
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

const {
  formatWatchTimeReportValue,
  isTrackedF1WatchTimeLecture,
  watchTimeTitlesMatch,
} = sandbox.module.exports;

assert.equal(isTrackedF1WatchTimeLecture('내과전공의를 위한 NVUGIB Mx의 기초'), true);
assert.equal(isTrackedF1WatchTimeLecture('Fundamentals_of_NVUGIB_Management'), true);
assert.equal(isTrackedF1WatchTimeLecture('NVUGIB 총론 강의'), false);

assert.equal(
  watchTimeTitlesMatch('내과전공의를 위한 NVUGIB Mx의 기초', 'Fundamentals_of_NVUGIB_Management'),
  true
);
assert.equal(
  watchTimeTitlesMatch('Advanced course for F1::Fundamentals_of_NVUGIB_Management', '내과전공의를 위한 NVUGIB Mx의 기초'),
  true
);

assert.equal(formatWatchTimeReportValue(0), '0%');
assert.equal(formatWatchTimeReportValue(79.4), '79%');
assert.equal(formatWatchTimeReportValue(79.6), '80%');
assert.equal(formatWatchTimeReportValue(80), 'yes');
assert.equal(formatWatchTimeReportValue(100), 'yes');
