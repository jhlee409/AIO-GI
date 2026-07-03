import assert from 'node:assert/strict';
import fs from 'node:fs';

const uploadRouteSource = fs.readFileSync(
  new URL('../app/api/emt-upload/route.ts', import.meta.url),
  'utf8'
);
const processorSource = fs.readFileSync(
  new URL('../lib/emt-processor.ts', import.meta.url),
  'utf8'
);
const coursePageSource = fs.readFileSync(
  new URL('../app/(public)/courses/[category]/page.tsx', import.meta.url),
  'utf8'
);

assert.match(
  uploadRouteSource,
  /result\.analysisPassed !== true[\s\S]*deleteUploadedEmtVideoIfSafe\(bucket,\s*cleanupVideoPath/,
  'EMT upload route should delete the uploaded video when a background job completes without a passing analysis result'
);

assert.match(
  uploadRouteSource,
  /catch\(async \(error\) => \{[\s\S]*deleteUploadedEmtVideoIfSafe\(bucket,\s*cleanupVideoPath/,
  'EMT upload route should delete the uploaded video when background processing rejects before a passing result'
);

assert.match(
  processorSource,
  /if \(!analysisPassed && videoPath\) \{[\s\S]*deleteUploadedEmtVideoIfSafe\(bucket,\s*jobId,\s*videoPath,\s*'analysis failed'\)/,
  'EMT processor should delete uploaded videos for failed analysis results'
);

assert.match(
  processorSource,
  /catch \(error: any\) \{[\s\S]*if \(!analysisPassed && videoPath\) \{[\s\S]*deleteUploadedEmtVideoIfSafe\(bucket,\s*jobId,\s*videoPath,\s*'processing error before pass result'\)/,
  'EMT processor should delete uploaded videos for processing errors before a passing result'
);

assert.match(
  coursePageSource,
  /if \(uploadedEmtVideoStoragePath && !emtAnalysisPassed\) \{[\s\S]*deleteObject\(ref\(storage,\s*uploadedEmtVideoStoragePath\)\)/,
  'EMT client should clean up uploaded videos after client-side failures unless a passing analysis result was received'
);
