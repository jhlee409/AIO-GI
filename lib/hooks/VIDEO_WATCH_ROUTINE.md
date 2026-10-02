# 동영상 시청 기록

시청률 기반 강의는 재생 위치를 건너뛴 값이 아니라 실제 재생한 시간을 누적해 기록합니다. 완료 기준은 [`lib/report-watch-time.ts`](../report-watch-time.ts)의 `WATCH_TIME_COMPLETION_THRESHOLD_PERCENT = 80`입니다.

## 연결 지점

`components/viewers/CustomVideoPlayer.tsx`가 재생 UI와 추적 여부를 연결하고, `useVideoWatchTime`이 재생 시간을 계산합니다. `useSaveVideoWatchTime`은 `/api/video/watch-time`으로 저장합니다. 선택된 강의는 과정 화면에서 `completionMode="percentage"`를 전달합니다.

```tsx
<FullScreenVideoPlayer
  videoUrl={videoUrl}
  videoTitle="Lecture Title"
  category="Course Category"
  completionMode="percentage"
/>
```

`completionMode`가 `onPlay` 또는 `none`이면 이 시청률 루틴을 사용하지 않습니다. 모드를 명시하지 않은 일부 F1 강의는 제목과 카테고리 매칭으로 추적합니다. 새 강의가 어느 흐름에 속하는지 `shouldTrackVideoWatchRoutine`과 해당 과정 페이지에서 함께 확인하세요.

## 저장과 완료 로그

- 재생 중 약 30초 간격으로 `check` 기록을 갱신하고, 80%에 처음 도달할 때도 저장을 시도합니다. 항목 종료 시에는 `update`로 최종 세션을 저장합니다.
- Firestore `video_watch_times`에는 `watchedTime`(초), `duration`(초), `sessionType`(`checking` 또는 `final`) 등이 기록됩니다.
- PEG, NVUGIB 총론, EUS 등 `getWatchTimeCompletionLogItem`에 등록된 강의는 80% 이상으로 저장되면 Storage `log/`에 `-Completed` 로그를 만듭니다. 미달이면 완료 로그를 만들지 않습니다.
- 다른 시청률 기반 강의는 `/api/video/watch-time`의 일반 로그 규칙을 따릅니다. 강사 리포트는 저장된 시청 시간과 로그를 사용합니다.
- 완료 전에 항목을 닫거나 이동할 때의 경고는 [`lib/learning-session.ts`](../learning-session.ts), `components/LearningExitDialog.tsx` 및 과정 페이지의 이탈 처리에서 결정합니다.

강의 제목 별칭과 80% 판정 변경 시 `lib/report-watch-time.ts`, `app/api/video/watch-time/route.ts`, `app/api/instructor/generate-report/route.ts`를 함께 확인하세요.
