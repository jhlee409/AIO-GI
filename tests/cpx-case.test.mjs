import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-case.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleStub = { exports: {} };
const sandbox = {
  exports: moduleStub.exports,
  module: moduleStub,
};
vm.runInNewContext(compiled.outputText, sandbox);

const { isCpx07CaseId, isStructuredCpxCaseId, normalizeCpxCaseId } = sandbox.module.exports;

assert.equal(isCpx07CaseId('cpx_07'), true);
assert.equal(isCpx07CaseId('07'), true);
assert.equal(isCpx07CaseId('cpx_07_hematemesis'), true);
assert.equal(isCpx07CaseId('CPX_07_hematemesis'), true);
assert.equal(isCpx07CaseId('cpx_01'), false);
assert.equal(isCpx07CaseId(null), false);

assert.equal(normalizeCpxCaseId('01'), 'cpx_01');
assert.equal(normalizeCpxCaseId('cpx_01'), 'cpx_01');
assert.equal(normalizeCpxCaseId('CPX_01_dysphagia'), 'cpx_01');
assert.equal(normalizeCpxCaseId('cpx_07_hematemesis'), 'cpx_07');
assert.equal(normalizeCpxCaseId(null), null);

assert.equal(isStructuredCpxCaseId('01'), true);
assert.equal(isStructuredCpxCaseId('cpx_01'), true);
assert.equal(isStructuredCpxCaseId('CPX_01_dysphagia'), true);
assert.equal(isStructuredCpxCaseId('02'), true);
assert.equal(isStructuredCpxCaseId('cpx_03'), true);
assert.equal(isStructuredCpxCaseId('CPX_04_hematochezia'), true);
assert.equal(isStructuredCpxCaseId('05'), true);
assert.equal(isStructuredCpxCaseId('cpx_06'), true);
assert.equal(isStructuredCpxCaseId('07'), true);
assert.equal(isStructuredCpxCaseId('cpx_07'), true);
assert.equal(isStructuredCpxCaseId('08'), true);
assert.equal(isStructuredCpxCaseId('cpx_09'), true);
assert.equal(isStructuredCpxCaseId('CPX_10_epigastric_pain'), true);
assert.equal(isStructuredCpxCaseId('cpx_11'), false);
assert.equal(isStructuredCpxCaseId(null), false);
