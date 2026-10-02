'use client';

import type { LearningAttempt } from '@/lib/learning-session';

export function LearningExitDialog({
    label,
    kind,
    reason,
    onStay,
    onLeave,
}: {
    label: string;
    kind: LearningAttempt['kind'];
    reason: 'incomplete' | 'failed';
    onStay: () => void;
    onLeave: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="learning-exit-title">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 id="learning-exit-title" className="text-xl font-semibold text-gray-900">학습 완료를 확인해 주세요</h2>
                <p className="mt-4 break-words text-gray-800"><strong>{label}</strong></p>
                <p className="mt-2 text-sm text-gray-700">
                    {reason === 'incomplete'
                        ? kind === 'pbl'
                            ? '이 PBL의 마지막 단계까지 진행하지 않았습니다. 지금 나가시겠습니까?'
                            : kind === 'video'
                                ? '이 동영상을 80% 이상 시청하지 않았습니다. 지금 나가시겠습니까?'
                            : kind === 'log' && /^EGD lesion Dx F[12]:/.test(label)
                                ? '오른쪽 진행 버튼을 눌러 이 문항의 완료 기록을 전송하지 않았습니다. 지금 나가시겠습니까?'
                            : '이 항목의 학습 완료 조건을 아직 채우지 않았습니다. 지금 나가시겠습니까?'
                        : '학습 완료 결과가 서버에 저장되었는지 확인되지 않았습니다. 다시 시도하거나 나갈 수 있습니다.'}
                </p>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={() => {
                        if (kind === 'pbl' && reason === 'failed') {
                            window.dispatchEvent(new CustomEvent('retryPblCompletionLog', { detail: { caseId: label } }));
                        }
                        onStay();
                    }} className="rounded bg-blue-600 px-4 py-2 text-white">학습 계속하기</button>
                    <button type="button" onClick={onLeave} className="rounded border px-4 py-2 text-gray-900">그래도 나가기</button>
                </div>
            </div>
        </div>
    );
}
