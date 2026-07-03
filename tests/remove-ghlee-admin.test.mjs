import assert from 'node:assert/strict';
import fs from 'node:fs';

const filesThatShouldNotReferenceRemovedAdmin = [
  'lib/auth.ts',
  'lib/auth-server.ts',
  'app/(admin)/admin/users/page.tsx',
  'lib/emt-processor.ts',
  'app/(public)/courses/[category]/page.tsx',
];

for (const filePath of filesThatShouldNotReferenceRemovedAdmin) {
  const source = fs.readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');
  assert.doesNotMatch(
    source,
    /ghlee409@amc\.seoul\.kr/i,
    `${filePath} should not reference the removed admin account`
  );
}

for (const filePath of ['lib/auth.ts', 'lib/auth-server.ts']) {
  const source = fs.readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');
  assert.match(
    source,
    /PRIMARY_ADMIN_EMAILS\s*=\s*\['jhlee409@gmail\.com'\]/,
    `${filePath} should keep only jhlee409@gmail.com as a primary admin`
  );
}
