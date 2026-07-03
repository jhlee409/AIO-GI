import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../app/(public)/courses/[category]/page.tsx', import.meta.url),
  'utf8'
);

for (const lectureTitle of [
  'Hemoclip',
  'Injection',
  'APC',
  'NexPowder',
  'EVL',
]) {
  const expectedPropsCall = new RegExp(
    `getVideoPlayerProps\\('${lectureTitle}', 'Simulator Advanced Course', 'percentage'\\)`
  );
  assert.match(
    source,
    expectedPropsCall,
    `${lectureTitle} should save watch time under the Simulator Advanced Course report row`
  );
}

assert.match(
  source,
  /videoTitle="Stent_Eso_GEjunction"[\s\S]*category="Simulator Advanced Course"[\s\S]*completionMode="percentage"/,
  'Stent_Eso_GEjunction should use percentage watch-time tracking under Simulator Advanced Course'
);

const stentSectionStart = source.indexOf("selectedItem === 'stent-eso-ge-junction'");
const stentSectionEnd = source.indexOf("selectedItem === 'egd-variation'", stentSectionStart);
const stentSection = source.slice(stentSectionStart, stentSectionEnd);

assert.ok(stentSectionStart > -1, 'Stent section should exist');
assert.ok(stentSectionEnd > stentSectionStart, 'Stent section should have a bounded source section');
assert.doesNotMatch(
  stentSection,
  /\/api\/log\/create/,
  'Stent_Eso_GEjunction should not create a completion log on play after moving to watch-time routine'
);
