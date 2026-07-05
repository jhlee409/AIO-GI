import assert from 'node:assert/strict';
import fs from 'node:fs';

const hookSource = fs.readFileSync(
  new URL('../lib/hooks/useVideoWatchTime.ts', import.meta.url),
  'utf8'
);
const playerSource = fs.readFileSync(
  new URL('../components/viewers/CustomVideoPlayer.tsx', import.meta.url),
  'utf8'
);
const saveSource = fs.readFileSync(
  new URL('../lib/hooks/useSaveVideoWatchTime.ts', import.meta.url),
  'utf8'
);
const apiSource = fs.readFileSync(
  new URL('../app/api/video/watch-time/route.ts', import.meta.url),
  'utf8'
);
const logoutSource = fs.readFileSync(
  new URL('../app/api/video/watch-time/save-on-logout/route.ts', import.meta.url),
  'utf8'
);

assert.doesNotMatch(
  hookSource,
  /setMaxWatchedTime\(currentTime\)/,
  'percentage watch-time should not treat seeking to currentTime as watched seconds'
);
assert.doesNotMatch(
  hookSource,
  /Math\.max\(currentTime,\s*maxWatchedTime\)/,
  'final percentage watch-time should be based on elapsed playback, not furthest currentTime'
);

assert.match(
  hookSource,
  /elapsedPlaybackSecondsRef/,
  'watch-time hook should store elapsed playback seconds separately from currentTime'
);
assert.match(
  playerSource,
  /markPlaybackStartedRef\.current\(\)/,
  'player should start elapsed tracking only when playback actually starts'
);
assert.match(
  playerSource,
  /markPlaybackStoppedRef\.current\(\)/,
  'player should stop elapsed tracking when playback stops, waits, seeks, or ends'
);

for (const source of [saveSource, apiSource, logoutSource]) {
  assert.match(
    source,
    /trackingMethod/,
    'new watch-time records should preserve which tracking method produced watchedTime'
  );
}
