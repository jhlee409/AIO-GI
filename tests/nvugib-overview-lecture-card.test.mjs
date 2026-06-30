import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../app/(public)/courses/[category]/page.tsx', import.meta.url),
  'utf8'
);

assert.match(
  source,
  /내과전공의를 위한 NVUGIB Mx의 기초/,
  'NVUGIB overview page should include the new resident basics lecture card'
);

assert.match(
  source,
  /EGD_Hemostasis_training\/lecture\/Fundamentals_of_NVUGIB_Management\.mp4/,
  'New resident basics lecture should load from the confirmed Firebase Storage path'
);

assert.match(
  source,
  /getVideoPlayerProps\(selectedNvugibOverviewLecture\?\.title \|\| 'NVUGIB 총론 강의', 'Advanced course for F1'\)/,
  'NVUGIB overview player should pass video title and Advanced F1 category for watch-time tracking'
);
