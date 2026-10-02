import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('all F2 PBL close buttons review incomplete learning before closing', () => {
  for (let number = 1; number <= 14; number++) {
    const caseNumber = String(number).padStart(2, '0');
    const source = fs.readFileSync(
      new URL(`../components/pbl/PblF2${caseNumber}Page.tsx`, import.meta.url),
      'utf8'
    );
    assert.match(
      source,
      /const handleInitialScreen = async \(\) => \{\s*if \(!\(await requestLearningExit\(\)\)\) return;\s*onClose\(\);/,
      `PBL_F2_${caseNumber} needs a guarded close handler`
    );
    assert.match(
      source,
      /onClick=\{handleInitialScreen\}[^>]*aria-label="닫기"/,
      `PBL_F2_${caseNumber} close X must use the guard`
    );
    assert.doesNotMatch(source, /onClick=\{onClose\}/);
  }
});
