import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function loadTsModule(path) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      resolveJsonModule: true,
    },
  });
  const moduleStub = { exports: {} };
  const sandbox = {
    exports: moduleStub.exports,
    module: moduleStub,
    require,
  };
  vm.runInNewContext(compiled.outputText, sandbox);
  return sandbox.module.exports;
}

const { formatStructuredCpxScenario } = loadTsModule('../lib/cpx-structured-scenario.ts');
const hematemesisCase = JSON.parse(
  fs.readFileSync(new URL('../data/cpx/cpx_07_hematemesis.json', import.meta.url), 'utf8')
);

const scenario = formatStructuredCpxScenario(hematemesisCase);

assert.match(scenario, /CPX_07_hematemesis/);
assert.match(scenario, /오늘 아침 8시경에 피를 토해서 방문/);
assert.match(scenario, /빨간색으로 선지 같은 피/);
assert.match(scenario, /맥주 컵으로 2컵/);
assert.match(scenario, /3일 전부터 변 색깔이 까매져서/);
assert.match(scenario, /혈변은 본 적이 없습니다/);
assert.match(scenario, /어지러움/);
assert.match(scenario, /숨참/);
assert.match(scenario, /식은 땀/);
assert.match(scenario, /진통 소염제/);
assert.match(scenario, /아스피린/);
assert.match(scenario, /위염만 있다고 해서 2달간 약을 복용/);
assert.match(scenario, /소주 1병/);
assert.match(scenario, /일주일에 1-2회/);
assert.match(scenario, /epigastric_pain_pattern/);
assert.match(scenario, /ongoing_bleeding_status/);
assert.match(scenario, /melena_current_status/);
assert.match(scenario, /variceal_bleeding_risk/);
assert.match(scenario, /ulcer_risk_factors/);
assert.match(scenario, /helicobacter_and_prior_gastritis/);
assert.match(scenario, /추가로 피를 토한 적은 없습니다/);
assert.match(scenario, /간질환은 없고/);
assert.match(scenario, /흡연과 음주가 늘었습니다/);

assert.equal(/[<>]/.test(scenario), false);
assert.match(scenario, /묻지 않은 정보는 먼저 말하지 않습니다/);
assert.match(scenario, /자료에 없는 증상/);
assert.match(scenario, /건강한 사람|평범한 일상생활/);
assert.match(scenario, /의학적 사실/);
assert.match(scenario, /짧은 한국어 존댓말/);
assert.match(scenario, /대화 종료/);
