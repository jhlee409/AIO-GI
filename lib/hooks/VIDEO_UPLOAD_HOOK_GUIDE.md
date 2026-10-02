# 시뮬레이터 동영상 업로드 hook

`useVideoUpload`은 제출 영상을 Firebase Storage에 직접 업로드한 다음, 해당 API에 메타데이터를 전송합니다. 현재 과정 화면은 이 hook을 MT, LHT, SHT에 사용합니다. 경로는 [`lib/video-upload-utils.ts`](../video-upload-utils.ts)의 `VIDEO_UPLOAD_PATHS`가 정합니다.

## 사용

```tsx
import { useVideoUpload } from '@/lib/hooks/useVideoUpload';

const { uploadVideo, uploading, progress, error } = useVideoUpload({
  videoType: 'SHT',
  user: { email: currentUser.email },
  userProfile: { position, name, hospital },
  apiEndpoint: '/api/sht-video-upload',
  onSuccess: result => console.log(result.logPath),
});

// 파일을 선택한 뒤:
await uploadVideo(file);
```

`videoType` 타입에는 `MT`, `EMT`, `LHT`, `SHT`가 정의되어 있습니다. 이 hook의 `apiEndpoint`는 현재 `/api/mt-video-upload`, `/api/lht-video-upload`, `/api/sht-video-upload`에 연결합니다. EMT는 과정 화면에서 별도 업로드 흐름을 사용하며 `/api/emt-upload`에 `videoPath` 등 분석 작업 값을 전송합니다.

| 옵션·반환값 | 설명 |
| --- | --- |
| `user`, `userProfile` | 로그인 이메일과 직위·이름·병원 |
| `maxFileSize` | 허용 크기. 기본 200 MiB |
| `onProgress`, `progress` | 업로드 진행률 0~100 |
| `onSuccess`, `onError` | 업로드 및 API 호출 결과 처리 |
| `uploading`, `error` | 진행 상태와 마지막 오류 |
| `uploadVideo(file)` | 업로드 후 API 응답 `VideoUploadResult` 반환 |

허용 확장자는 `.avi`, `.mp4`, `.mpeg4`, `.m4v`입니다. 업로드 완료만으로 제출 처리가 끝난 것으로 보지 않습니다. hook은 Storage URL을 얻은 뒤 해당 `apiEndpoint`가 성공해야 결과를 반환합니다. 제출 로그의 전송 상태는 [`lib/learning-session.ts`](../learning-session.ts)에서 추적합니다.
