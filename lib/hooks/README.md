# 재사용 hook

이 폴더에는 화면에서 호출하는 React hook을 둡니다. 각 hook의 옵션과 반환값은 해당 TypeScript 파일의 타입 정의를 기준으로 확인하세요.

| hook | 역할 |
| --- | --- |
| [`useUserProfile`](useUserProfile.ts) | 로그인 사용자 프로필 조회 |
| [`useApi`](useApi.ts) | 공통 API 호출 상태와 오류 처리 |
| [`useLectureList`](useLectureList.ts) | 강의 목록 로드·저장 |
| [`useExcelFileProcessor`](useExcelFileProcessor.ts) | 업로드한 Excel 파일 처리 |
| [`useCategoryFilter`](useCategoryFilter.ts) | 사용자 조건에 따른 카테고리 필터 |
| [`useVideoUpload`](useVideoUpload.ts) | 시뮬레이터 영상 업로드와 후속 API 호출 |
| [`useVideoWatchTime`](useVideoWatchTime.ts) | 실제 재생 시간과 80% 도달 추적 |
| [`useSaveVideoWatchTime`](useSaveVideoWatchTime.ts) | 시청 시간을 서버 API에 저장 |
| [`useCalculateAccumulatedWatchTime`](useCalculateAccumulatedWatchTime.ts) | 저장된 시청률 집계 |
| [`useAutoLogout`](useAutoLogout.ts) | 비활동 경고와 자동 로그아웃 |
| [`useSessionActivity`](useSessionActivity.ts) | 사용자 세션 활동 추적 |
| [`useCpxCaseFlow`](useCpxCaseFlow.ts) | CPX 사례 진행 상태 |

동영상 관련 흐름은 [시청 기록](VIDEO_WATCH_ROUTINE.md)과 [업로드](VIDEO_UPLOAD_HOOK_GUIDE.md)를 참조하세요. 학습 항목 이탈 시 완료 확인은 [`lib/learning-session.ts`](../learning-session.ts)에서 처리합니다.
