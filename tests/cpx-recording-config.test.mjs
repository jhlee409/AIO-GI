import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/(public)/cpx/page.tsx', import.meta.url), 'utf8');

assert.match(source, /const SILENCE_AUTO_STOP_MS = 1800;/);
assert.match(source, /const MIN_RECORDING_BEFORE_AUTO_STOP_MS = 900;/);
