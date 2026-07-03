# 동영상 시청 루틴

`동영상 시청 루틴`은 교육 동영상 시청률을 `%`로 저장하고, 리포트에서 80% 이상을 `yes`로 표시하는 표준 처리 방식이다. 교육자 메일 발송은 포함하지 않는다.

새 동영상을 이 루틴으로 처리할 때는 기존 플레이어를 재사용하고 `completionMode="percentage"`를 넘긴다.

```tsx
<FullScreenVideoPlayer
  videoUrl={videoUrl}
  videoTitle="Lecture Title"
  category="Category"
  completionMode="percentage"
  ...
/>
```

`app/(public)/courses/[category]/page.tsx`에서는 공통 helper를 사용할 수 있다.

```tsx
{...getVideoPlayerProps('Lecture Title', 'Category', 'percentage')}
```

이 루틴의 현재 코드 경로:

- `components/viewers/CustomVideoPlayer.tsx`: 시청 시간 추적 활성화
- `lib/hooks/useVideoWatchTime.ts`: 80% 도달 및 최종 시청 시간 저장
- `lib/hooks/useSaveVideoWatchTime.ts`: `/api/video/watch-time` 저장
- `app/api/instructor/generate-report/route.ts`: 리포트 `%`/`yes` 반영
- `lib/report-watch-time.ts`: 제목 매칭, 리포트 값 포맷, 루틴 판정 유틸
