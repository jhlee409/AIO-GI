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
const dysphagiaCase = JSON.parse(
  fs.readFileSync(new URL('../data/cpx/cpx_01_dysphagia.json', import.meta.url), 'utf8')
);

const scenario = formatStructuredCpxScenario(hematemesisCase);

assert.match(scenario, /CPX_07_hematemesis/);
assert.match(scenario, /오늘 아침 8시경에 피를 토해서 방문/);
assert.match(scenario, /첫 답변: 선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다/);
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
assert.match(scenario, /사용자가 명시적으로 물어본 항목에 대해서만 답합니다/);
assert.match(scenario, /관련된 사항까지 덧붙이지 않습니다/);
assert.match(scenario, /어디가 불편해서 왔는지/);
assert.match(scenario, /주호소만 답합니다/);
assert.match(scenario, /한 가지씩 물어봐 주세요/);
assert.match(scenario, /그 때 상황을 다 설명해 주세요/);
assert.match(scenario, /넓은 범위/);
assert.match(scenario, /자료에 없는 증상/);
assert.match(scenario, /건강한 사람|평범한 일상생활/);
assert.match(scenario, /의학적 사실/);
assert.match(scenario, /짧은 한국어 존댓말/);
assert.match(scenario, /종료 후 환자 질문/);
assert.match(scenario, /혹시 이게 심각한 병인가요/);
assert.match(scenario, /무슨 검사를 받게 되나요/);
assert.match(scenario, /알겠습니다\. 감사합니다\. 선생님\./);

const dysphagiaScenario = formatStructuredCpxScenario(dysphagiaCase);

assert.match(dysphagiaScenario, /CPX_01_dysphagia/);
assert.match(dysphagiaScenario, /음식을 삼키면 걸리는 증상/);
assert.match(dysphagiaScenario, /첫 답변: 선생님 처음 뵙겠습니다. 잘 부탁드리겠습니다/);
assert.match(dysphagiaScenario, /가슴 중간/);
assert.match(dysphagiaScenario, /3개월 전/);
assert.match(dysphagiaScenario, /죽, 미음, 물도 잘 안 넘어/);
assert.match(dysphagiaScenario, /3개월 사이 4kg/);
assert.match(dysphagiaScenario, /음식을 삼킬 때 간간히 가슴이 뻐근한 것 말고/);
assert.match(dysphagiaScenario, /운동할 때 생기는 흉통은 심하거나 자주 있지 않아 잘 모르겠습니다/);
assert.match(dysphagiaScenario, /호흡곤란, 기침, 발열은 없습니다/);
assert.match(dysphagiaScenario, /진통소염제나 아스피린/);
assert.match(dysphagiaScenario, /5년 전에 받았고/);
assert.match(dysphagiaScenario, /40년 동안 피웠습니다/);
assert.match(dysphagiaScenario, /어떤 질환을 의심/);
assert.match(dysphagiaScenario, /앞으로 제가 받게 될 검사는 무엇인가요/);
assert.equal(/[<>]/.test(dysphagiaScenario), false);
assert.match(dysphagiaCase.ttsProfile.instructions, /70대 한국 남성/);
assert.equal(dysphagiaCase.ttsProfile.voice, 'onyx');
assert.equal(dysphagiaCase.ttsProfile.speed, 1.3);
assert.match(hematemesisCase.ttsProfile.instructions, /50대 후반 한국 남성/);
assert.equal(hematemesisCase.ttsProfile.voice, 'cedar');
assert.equal(hematemesisCase.ttsProfile.speed, 1.3);
