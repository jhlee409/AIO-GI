import assert from 'node:assert/strict';
import fs from 'node:fs';

const fullScreenSource = fs.readFileSync(
  new URL('../app/(public)/courses/[category]/components/FullScreenVideoPlayer.tsx', import.meta.url),
  'utf8'
);
const customPlayerSource = fs.readFileSync(
  new URL('../components/viewers/CustomVideoPlayer.tsx', import.meta.url),
  'utf8'
);

assert.match(
  fullScreenSource,
  /const handleClose = async \(\) =>/,
  'FullScreenVideoPlayer should await watch-time save before closing'
);

assert.match(
  fullScreenSource,
  /await videoPlayerRef\.current\?\.saveWatchTime\(\);/,
  'FullScreenVideoPlayer close handler should await saveWatchTime'
);

const stopSaveIndex = customPlayerSource.indexOf('await saveCurrentWatchTimeBeforeReset();');
const resetIndex = customPlayerSource.indexOf('video.currentTime = 0;', customPlayerSource.indexOf('const handleStop'));

assert.ok(stopSaveIndex > -1, 'Stop button should save current watch time before reset');
assert.ok(resetIndex > -1, 'Stop button should reset currentTime');
assert.ok(stopSaveIndex < resetIndex, 'Stop button should save before setting currentTime to 0');

assert.match(
  customPlayerSource,
  /const handleEnded = async \(\) =>/,
  'Natural video ending should wait for final watch-time save'
);

assert.match(
  customPlayerSource,
  /await saveFinalWatchTimeRef\.current\(finalTime, finalDuration\);/,
  'Natural video ending should await final watch-time save before closing'
);
