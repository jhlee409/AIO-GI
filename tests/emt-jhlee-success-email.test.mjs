import assert from 'node:assert/strict';
import fs from 'node:fs';

const processorSource = fs.readFileSync(
  new URL('../lib/emt-processor.ts', import.meta.url),
  'utf8'
);

const coursePageSource = fs.readFileSync(
  new URL('../app/(public)/courses/[category]/page.tsx', import.meta.url),
  'utf8'
);

assert.match(
  processorSource,
  /const instructorsToReturn = isJhlee409\s*\?\s*\[\s*\{\s*email:\s*'jhlee409@gmail\.com'/,
  'EMT processor should return jhlee409@gmail.com as the only email recipient for jhlee409 successful jobs'
);

assert.doesNotMatch(
  coursePageSource,
  /const isSpecialUser = user\?\.email === 'jhlee409@gmail\.com';[\s\S]*?fetch\('\/api\/emt-send-email'/,
  'EMT client should not bypass /api/emt-send-email for jhlee409@gmail.com after a passing result'
);
