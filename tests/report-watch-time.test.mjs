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
  findWatchTimeReportMatch,
  formatWatchTimeReportValue,
  isTrackedF1WatchTimeLecture,
  shouldTrackVideoWatchRoutine,
  watchTimeTitlesMatch,
} = sandbox.module.exports;

assert.equal(isTrackedF1WatchTimeLecture('내과전공의를 위한 NVUGIB Mx의 기초'), true);
assert.equal(isTrackedF1WatchTimeLecture('Fundamentals_of_NVUGIB_Management'), true);
assert.equal(isTrackedF1WatchTimeLecture('NVUGIB 총론 강의'), false);
assert.equal(isTrackedF1WatchTimeLecture('Complication'), false);
assert.equal(isTrackedF1WatchTimeLecture('AP'), false);

for (const simulatorLectureTitle of [
  'Hemoclip',
  'Injection',
  'APC',
  'NexPowder',
  'EVL',
  'Stent_Eso_GEjunction',
]) {
  assert.equal(
    isTrackedF1WatchTimeLecture(simulatorLectureTitle),
    true,
    `${simulatorLectureTitle} should be a tracked watch-time lecture`
  );
  assert.equal(
    shouldTrackVideoWatchRoutine(simulatorLectureTitle, 'Simulator Advanced Course'),
    true,
    `${simulatorLectureTitle} should use the watch-time routine by title in Simulator Advanced Course`
  );
}

assert.equal(
  watchTimeTitlesMatch('내과전공의를 위한 NVUGIB Mx의 기초', 'Fundamentals_of_NVUGIB_Management'),
  true
);
assert.equal(
  watchTimeTitlesMatch('Advanced course for F1::Fundamentals_of_NVUGIB_Management', '내과전공의를 위한 NVUGIB Mx의 기초'),
  false
);
assert.equal(
  watchTimeTitlesMatch('Complication_Sedation', 'Complication'),
  false
);
assert.equal(
  watchTimeTitlesMatch('APC', 'AP'),
  false
);

assert.equal(formatWatchTimeReportValue(0), '0%');
assert.equal(formatWatchTimeReportValue(79.4), '79%');
assert.equal(formatWatchTimeReportValue(79.6), '80%');
assert.equal(formatWatchTimeReportValue(80), 'yes');
assert.equal(formatWatchTimeReportValue(100), 'yes');

assert.equal(shouldTrackVideoWatchRoutine('Future Lecture', 'Any category', { completionMode: 'percentage' }), true);
assert.equal(shouldTrackVideoWatchRoutine('Complication_Sedation', 'Advanced course for F1'), true);
assert.equal(shouldTrackVideoWatchRoutine('Complication_Sedation', 'Advanced course for F1', { completionMode: 'none' }), false);

const watchTimeMap = new Map([
  ['Future category::Future Lecture', {
    totalPercentage: 81,
    duration: 100,
    category: 'Future category',
  }],
]);
const match = findWatchTimeReportMatch(watchTimeMap, 'Future Lecture', 'Future category');
assert.equal(match.key, 'Future category::Future Lecture');
assert.equal(match.watchTime.totalPercentage, 81);

const simulatorWatchTimeMap = new Map([
  ['Simulator Advanced Course::Hemoclip', {
    totalPercentage: 64,
    duration: 100,
    category: 'Simulator Advanced Course',
  }],
]);
const simulatorMatch = findWatchTimeReportMatch(
  simulatorWatchTimeMap,
  'Hemoclip',
  'Simulator Advanced Course'
);
assert.equal(simulatorMatch.key, 'Simulator Advanced Course::Hemoclip');
assert.equal(formatWatchTimeReportValue(simulatorMatch.watchTime.totalPercentage), '64%');

const signedUrlWatchTimeMap = new Map([
  ['https://storage.googleapis.com/example/Complication_Sedation.mp4?token=a1-signed-token', {
    totalPercentage: 42,
    duration: 100,
    category: 'advanced-f1',
  }],
]);
assert.equal(
  findWatchTimeReportMatch(signedUrlWatchTimeMap, 'A1', 'EGD variation'),
  null,
  'EGD variation codes should not match unrelated signed URL tokens'
);

const exactEgdVariationWatchTimeMap = new Map([
  ['EGD variation::A1', {
    totalPercentage: 42,
    duration: 100,
    category: 'EGD variation',
  }],
]);
const exactEgdVariationMatch = findWatchTimeReportMatch(
  exactEgdVariationWatchTimeMap,
  'A1',
  'EGD variation'
);
assert.equal(exactEgdVariationMatch.key, 'EGD variation::A1');
