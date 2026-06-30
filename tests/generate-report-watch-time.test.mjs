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
  /formatWatchTimeReportValue\(totalPercentage\)/,
  'Generate report should convert tracked watch-time percentage to yes at the shared threshold'
);

assert.match(
  source,
  /isTrackedF1WatchTimeLecture\(lectureTitle\)/,
  'Generate report should classify tracked F1 watch-time lectures using the shared title list'
);
