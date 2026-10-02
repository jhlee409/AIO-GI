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
  /getVideoPlayerProps\(selectedNvugibOverviewLecture\?\.title \|\| 'NVUGIB 총론 강의', 'Advanced course for F1', 'percentage'\)/,
  'NVUGIB overview player should require 80% viewing'
);

const diagnosticEusPlayer = source.slice(source.indexOf("selectedItem === 'diagnostic-eus-lecture'"));
assert.match(diagnosticEusPlayer, /completionMode="percentage"/);
for (const title of ['EUS_basic', 'EUS_SET', 'EUS_case']) {
  assert.match(diagnosticEusPlayer, new RegExp(`const lectureName = '${title}'`));
}
assert.doesNotMatch(diagnosticEusPlayer.slice(0, diagnosticEusPlayer.indexOf('onClose=')), /onPlay=|completionLogKey=/);
