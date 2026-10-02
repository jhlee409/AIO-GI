import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const source = fs.readFileSync(new URL('../components/LearningExitDialog.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const moduleStub = { exports: {} };
vm.runInNewContext(compiled.outputText, {
  exports: moduleStub.exports,
  module: moduleStub,
  require,
});

test('unfinished F1 and F2 EGD lesion Dx questions show the progress-button warning', () => {
  for (const version of ['F1', 'F2']) {
    const html = renderToStaticMarkup(React.createElement(moduleStub.exports.LearningExitDialog, {
      label: `EGD lesion Dx ${version}: lesion_01`,
      kind: 'log',
      reason: 'incomplete',
      onStay() {},
      onLeave() {},
    }));
    assert.match(html, /진행 버튼을 눌러 이 문항의 완료 기록을 전송하지 않았습니다/);
    assert.match(html, /학습 계속하기/);
    assert.match(html, /그래도 나가기/);
  }
});
