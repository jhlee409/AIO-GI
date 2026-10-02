import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/hooks/useCalculateAccumulatedWatchTime.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const moduleStub = { exports: {} };
vm.runInNewContext(compiled.outputText, { exports: moduleStub.exports, module: moduleStub, console });
const { calculateAccumulatedWatchTime } = moduleStub.exports;

test('report watch-time reads are bounded and preserve final-session percentages', async () => {
  let active = 0;
  let peak = 0;
  let reads = 0;
  const emails = Array.from({ length: 17 }, (_, index) => ({ email: `learner${index}@example.org`, userName: `Learner ${index}` }));
  const adminDb = {
    collection() {
      return {
        where(_field, _operator, email) {
          return {
            async get() {
              reads++;
              active++;
              peak = Math.max(peak, active);
              await new Promise(resolve => setTimeout(resolve, 2));
              active--;
              const docs = email === emails[0].email
                ? [
                    { data: () => ({ videoTitle: 'PEG', watchedTime: 80, duration: 100, sessionType: 'final' }) },
                    { data: () => ({ videoTitle: 'PEG', watchedTime: 100, duration: 100, sessionType: 'checking' }) },
                  ]
                : [];
              return { docs };
            },
          };
        },
        limit() {
          throw new Error('Diagnostic collection scans must not run');
        },
      };
    },
  };

  const result = await calculateAccumulatedWatchTime(emails, adminDb);
  assert.equal(reads, emails.length);
  assert.ok(peak > 1 && peak <= 8, `Expected bounded parallelism, observed ${peak}`);
  assert.equal(result.get(emails[0].email).get('PEG').totalPercentage, 80);
  assert.equal(result.get(emails[1].email).size, 0);
  assert.deepEqual([...result.keys()], emails.map(item => item.email));
});
