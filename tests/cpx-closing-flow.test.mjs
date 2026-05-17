import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/cpx-closing-flow.ts', import.meta.url), 'utf8');
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
const {
  CPX_FINAL_CLOSING_MESSAGE,
  CPX_CLOSING_NEXT_TEST_QUESTION,
  CPX_CLOSING_SERIOUSNESS_QUESTION,
  getCpxClosingFlowOverride,
  isInterviewClosingIntent,
  parseScenarioClosingQuestions,
} = sandbox.module.exports;

const cpx07Scenario = [
  '# CPX_07_hematemesis',
  '- 케이스 ID: cpx_07',
  '## 현병력',
  '- hematemesis_amount: 토한 피의 양은 맥주 컵으로 2컵 정도입니다. (관련 키워드: 양, 얼마나, 맥주 컵)',
  '- melena: 3일 전부터 변 색깔이 까매져서 지금까지 하루 두 세 차례 검은 변을 보고 있습니다. (관련 키워드: 흑변, 검은 변, 변 색, 대변)',
  '- hematochezia: 혈변은 본 적이 없습니다. (관련 키워드: 혈변, 붉은 변)',
  '## 약물력',
  '- ulcerogenic_medications: 진통 소염제, 아스피린, 독한 약은 복용하지 않았습니다. (관련 키워드: 진통 소염제, NSAID, 아스피린, 독한 약)',
  '## 사회력',
  '- alcohol: 평소 소주 1병을 일주일에 1-2회 정도 마셨습니다. (관련 키워드: 술, 음주, 소주)',
  '## 가족력 및 기타',
  '- family_history: 가족 중 질환을 가진 가족이 없어 가족들의 건강은 양호합니다. (관련 키워드: 가족력, 가족 건강)',
].join('\n');
const cpx01Scenario = '# CPX_01_dysphagia\n- 케이스 ID: cpx_01';
const structuredCpx01Scenario = [
  '# CPX_01_dysphagia',
  '- 케이스 ID: cpx_01',
  '## 현병력',
  '- dysphagia_chief_complaint: 음식을 삼키면 걸리는 증상이 있어서 방문했습니다. (관련 키워드: 음식, 삼키, 걸리는 증상, 방문)',
  '- dysphagia_progression: 처음에는 덩어리 음식만 걸리더니 요즘은 죽, 미음, 물도 잘 안 넘어갑니다. (관련 키워드: 덩어리 음식, 죽, 미음, 물, 진행)',
  '## 종료 후 환자 질문',
  '- 1. 선생님, 선생님은 어떤 질환을 의심하고 계시나요? 저에게 심각한 병이 생긴 건가요?',
  '- 2. 선생님. 앞으로 제가 받게 될 검사는 무엇인가요?',
].join('\n');

assert.equal(isInterviewClosingIntent('이제 문진을 마치겠습니다.'), true);
assert.equal(isInterviewClosingIntent('질문은 여기까지입니다.'), true);
assert.equal(isInterviewClosingIntent('어지럽지는 않으세요?'), false);

assert.equal(
  getCpxClosingFlowOverride({
    scenario: cpx01Scenario,
    messages: [{ role: 'user', content: '문진을 마치겠습니다.' }],
  }),
  null
);

assert.equal(JSON.stringify(parseScenarioClosingQuestions(structuredCpx01Scenario)), JSON.stringify([
  '선생님, 선생님은 어떤 질환을 의심하고 계시나요? 저에게 심각한 병이 생긴 건가요?',
  '선생님. 앞으로 제가 받게 될 검사는 무엇인가요?',
]));

const firstOverride = getCpxClosingFlowOverride({
  scenario: cpx07Scenario,
  messages: [{ role: 'user', content: '문진을 마치겠습니다.' }],
});

assert.equal(firstOverride?.message, CPX_CLOSING_SERIOUSNESS_QUESTION);
assert.equal(firstOverride?.isEnded, false);

const secondOverride = getCpxClosingFlowOverride({
  scenario: cpx07Scenario,
  messages: [
    { role: 'user', content: '문진을 마치겠습니다.' },
    { role: 'assistant', content: CPX_CLOSING_SERIOUSNESS_QUESTION },
    { role: 'user', content: '위궤양 출혈 가능성이 있어 입원 치료가 필요할 수 있습니다.' },
  ],
});

assert.equal(secondOverride?.message, CPX_CLOSING_NEXT_TEST_QUESTION);
assert.equal(secondOverride?.isEnded, false);

const finalOverride = getCpxClosingFlowOverride({
  scenario: cpx07Scenario,
  messages: [
    { role: 'user', content: '문진을 마치겠습니다.' },
    { role: 'assistant', content: CPX_CLOSING_SERIOUSNESS_QUESTION },
    { role: 'user', content: '위궤양 출혈 가능성이 있습니다.' },
    { role: 'assistant', content: CPX_CLOSING_NEXT_TEST_QUESTION },
    { role: 'user', content: '혈액검사와 위내시경 검사를 받게 됩니다.' },
    { role: 'assistant', content: '토한 피의 양은 맥주 컵으로 2컵 정도입니다.' },
    { role: 'user', content: '흑변이 있었나요?' },
  ],
});

assert.equal(finalOverride?.isEnded, true);
assert.equal(finalOverride?.message, CPX_FINAL_CLOSING_MESSAGE);
assert.doesNotMatch(finalOverride?.message || '', /대화 종료|누락된 병력 항목/);
assert.doesNotMatch(finalOverride?.message || '', /현병력|약물력|사회력|가족력 및 기타/);
assert.doesNotMatch(finalOverride?.message || '', /관련 키워드|category|keywords/);

const cpx01FirstOverride = getCpxClosingFlowOverride({
  scenario: structuredCpx01Scenario,
  messages: [{ role: 'user', content: '질문은 여기까지입니다.' }],
});

assert.equal(
  cpx01FirstOverride?.message,
  '선생님, 선생님은 어떤 질환을 의심하고 계시나요? 저에게 심각한 병이 생긴 건가요?'
);
assert.equal(cpx01FirstOverride?.isEnded, false);

const cpx01SecondOverride = getCpxClosingFlowOverride({
  scenario: structuredCpx01Scenario,
  messages: [
    { role: 'user', content: '질문은 여기까지입니다.' },
    { role: 'assistant', content: '선생님, 선생님은 어떤 질환을 의심하고 계시나요? 저에게 심각한 병이 생긴 건가요?' },
    { role: 'user', content: '식도암 가능성도 감별해야 합니다.' },
  ],
});

assert.equal(cpx01SecondOverride?.message, '선생님. 앞으로 제가 받게 될 검사는 무엇인가요?');
assert.equal(cpx01SecondOverride?.isEnded, false);

const cpx01FinalOverride = getCpxClosingFlowOverride({
  scenario: structuredCpx01Scenario,
  messages: [
    { role: 'user', content: '질문은 여기까지입니다.' },
    { role: 'assistant', content: '선생님, 선생님은 어떤 질환을 의심하고 계시나요? 저에게 심각한 병이 생긴 건가요?' },
    { role: 'user', content: '식도암 가능성도 감별해야 합니다.' },
    { role: 'assistant', content: '선생님. 앞으로 제가 받게 될 검사는 무엇인가요?' },
    { role: 'user', content: '위내시경 검사를 먼저 하겠습니다.' },
    { role: 'user', content: '음식을 삼키면 걸리는 증상으로 오셨나요?' },
  ],
});

assert.equal(cpx01FinalOverride?.isEnded, true);
assert.equal(cpx01FinalOverride?.message, CPX_FINAL_CLOSING_MESSAGE);
assert.doesNotMatch(cpx01FinalOverride?.message || '', /누락된 병력 항목|죽, 미음, 물도 잘 안 넘어갑니다/);
