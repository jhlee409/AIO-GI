import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadTypeScript(file, dependencies = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    URL,
    require: id => {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return module.exports;
}

test('course downloads accept lecture media but reject submissions and unrelated objects', () => {
  const { isCourseVideoPath, COURSE_DOWNLOAD_PATHS } = loadTypeScript('../lib/course-storage-access.ts');
  assert.equal(isCourseVideoPath('Lectures/lesson.mp4'), true);
  assert.equal(isCourseVideoPath('EGD_Hemostasis_training/cases/case.mp4'), true);
  assert.equal(isCourseVideoPath('Simulator_training/EMT/EMT_result/person-EMT-123.mp4'), false);
  assert.equal(isCourseVideoPath('Simulator_training/EMT/EMT_visualization/frame.mp4'), false);
  assert.equal(isCourseVideoPath('Lectures/../secret/file.mp4'), false);
  assert.equal(isCourseVideoPath('secret/user-record.mp4'), false);
  assert.equal(COURSE_DOWNLOAD_PATHS.has('secret/user-record.xlsx'), false);
});

test('upload metadata verifies both file ownership and its Firebase URL', async () => {
  let existenceChecks = 0;
  const { isVerifiedUploadedVideo } = loadTypeScript('../lib/verified-upload.ts', {
    '@/lib/firebase-admin': {
      getAdminStorage: () => ({ bucket: () => ({
        name: 'training.appspot.com',
        file: () => ({ exists: async () => { existenceChecks++; return [true]; } }),
      }) }),
    },
    '@/lib/video-upload-utils': { VIDEO_UPLOAD_PATHS: { MT: 'Simulator_training/MT/MT_result' } },
  });
  const file = 'Doctor-Kim-MT-123.mp4';
  const path = `Simulator_training/MT/MT_result/${file}`;
  const url = `https://firebasestorage.googleapis.com/v0/b/training.appspot.com/o/${encodeURIComponent(path)}?alt=media`;
  assert.equal(await isVerifiedUploadedVideo('MT', 'Doctor', 'Kim', file, url), true);
  assert.equal(await isVerifiedUploadedVideo('MT', 'Doctor', 'Lee', file, url), false);
  assert.equal(await isVerifiedUploadedVideo('MT', 'Doctor', 'Kim', file, url.replace('training.appspot.com', 'other.appspot.com')), false);
  assert.equal(await isVerifiedUploadedVideo('MT', 'Doctor', 'Kim', file, url.replace('MT_result', 'SHT_result')), false);
  assert.equal(existenceChecks, 1);
});

test('video URL route checks identity before Storage and keeps course files private', async () => {
  class NextResponse {
    constructor(body, status = 200) { this.body = body; this.status = status; }
    static json(body, options = {}) { return new NextResponse(body, options.status); }
  }
  const policy = loadTypeScript('../lib/course-storage-access.ts');
  let storageCalls = 0;
  let publicCalls = 0;
  const dependencies = {
    'next/server': { NextResponse },
    '@/lib/firebase-admin': {
      getAdminStorage: () => {
        storageCalls++;
        return { bucket: () => ({ file: () => ({
          exists: async () => [true],
          getSignedUrl: async () => ['https://signed.example/video'],
          makePublic: async () => { publicCalls++; },
        }) }) };
      },
    },
    '@/lib/course-storage-access': policy,
  };
  const request = path => ({ nextUrl: { searchParams: new URLSearchParams({ path }) } });

  dependencies['@/lib/api-auth'] = {
    requireUser: async () => NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  };
  let route = loadTypeScript('../app/api/video-url/route.ts', dependencies);
  assert.equal((await route.GET(request('Lectures/lesson.mp4'))).status, 401);
  assert.equal(storageCalls, 0);

  dependencies['@/lib/api-auth'] = { requireUser: async () => ({ email: 'student@example.com' }) };
  route = loadTypeScript('../app/api/video-url/route.ts', dependencies);
  assert.equal((await route.GET(request('secret/user.mp4'))).status, 403);
  assert.equal(storageCalls, 0);
  assert.equal((await route.GET(request('Lectures/lesson.mp4'))).body.url, 'https://signed.example/video');
  assert.equal(publicCalls, 0);
});
