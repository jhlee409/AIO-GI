import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../app/api/instructor/generate-report/route.ts', import.meta.url),
  'utf8'
);

assert.match(
  source,
  /const nvugibMxBasicsTitle = '내과전공의를 위한 NVUGIB Mx의 기초';/,
  'Generate report should add the NVUGIB Mx basics lecture when Advanced F1 is selected'
);

assert.match(
  source,
  /categoryLower\.includes\('emergency egd'\)|categoryNormalized\.includes\('emergency egd'\)/,
  'Generate report should treat Emergency EGD tracked lectures as watch-time percentage rows'
);

assert.match(
  source,
  /formatWatchTimeReportValue\(totalPercentage\)/,
  'Generate report should convert tracked watch-time percentage to yes at the shared threshold'
);

assert.match(
  source,
  /isTrackedF1WatchTimeLecture\(lectureTitle\)/,
  'Generate report should classify tracked F1 watch-time lectures using the shared title list'
);

assert.doesNotMatch(
  source,
  /const watchTimeMatch = !isEGDVariationRow/,
  'Generate report should not disable watch-time matching for an entire category'
);

const regularYesNoBranch = source.slice(
  source.indexOf('const matchingFilesForYes = logFileNames.filter'),
  source.indexOf('const hasCompletion = matchingFilesForYes.length > 0')
);

assert.doesNotMatch(
  regularYesNoBranch,
  /fileNameLower\.includes\(lectureLower\)/,
  'Generate report log matching should require exact lecture title matching, not substring matching'
);
