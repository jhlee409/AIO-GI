# AIO-GI 프로젝트 구조

이 문서는 현재 저장소의 코드 경로와 데이터 흐름을 빠르게 찾기 위한 안내입니다. 실행 및 환경 설정은 [README](README.md), 환경 변수 이름은 [`.env.example`](.env.example)을 참조하세요.

## 최상위 구성

| 경로 | 역할 |
| --- | --- |
| `app/` | Next.js App Router 페이지, 레이아웃, 서버 API |
| `components/` | 공통 UI, 동영상 뷰어, PBL 화면, 관리자 UI |
| `lib/` | 인증, Firebase 연결, 학습 기록, 리포트, CPX·EMT 처리 |
| `types/` | 공통 TypeScript 타입 |
| `python-server/` | EMT/EMT-L 분석용 Flask 서비스와 Docker 배포 파일 |
| `scripts/` | Cloud Scheduler 및 배포 보조 스크립트 |
| `tests/` | 주요 학습·인증·리포트 흐름 회귀 검사 |
| `package.json`, `package-lock.json` | 프런트엔드 의존성과 명령 |
| `firebase.json`, `.firebaserc` | Firebase 배포 대상과 Hosting 설정 |
| `next.config.ts`, `tsconfig.json` | Next.js 및 TypeScript 설정 |

## 화면과 API

`app/(public)`와 `app/(admin)`은 URL 경로에 포함되지 않는 라우트 그룹입니다.

| 경로 | 주요 내용 |
| --- | --- |
| `app/login/page.tsx` | 로그인 |
| `app/(public)/page.tsx` | 교육생 홈 |
| `app/(public)/courses/[category]/page.tsx` | 과정별 학습 목록·뷰어·학습 이탈 확인 |
| `app/(public)/courses/[category]/pbl-f2-01/` ~ `pbl-f2-14/` | F2 PBL 사례별 페이지 |
| `app/(public)/courses/[category]/egd-lesion-dx/[imageName]/` | EGD Lesion Dx 상세 |
| `app/(public)/cpx/page.tsx` | CPX 연습 |
| `app/(public)/instructor/page.tsx` | 강사 화면 |
| `app/(admin)/admin/` | 관리자 홈, 사용자·콘텐츠·접속 기록 화면 |
| `app/api/user/` | 사용자 확인·프로필·세션 |
| `app/api/admin/` | 관리자 전용 사용자·강의 목록·로그 관리 |
| `app/api/instructor/` | 강사 조회, 모니터링, 리포트 생성 |
| `app/api/video/watch-time/` | 동영상 시청 시간 저장·정리 |
| `app/api/log/` | 일반 및 EGD Lesion Dx 로그 생성 |
| `app/api/learning/logout-status/` | 학습 완료·전송 상태 검증 |
| `app/api/cpx/` | 대화, 음성 인식·합성, 자료 읽기 |
| `app/api/emt-upload/`, `app/api/emt-job-status/` | EMT 제출과 분석 작업 상태 |
| `app/api/cleanup-emt-visualization/` | 오래된 EMT 시각화 파일 정리 |

API를 추가할 때는 해당 `route.ts`의 인증 범위도 확인합니다. 사용자, 강사, 관리자 검사는 `lib/api-auth.ts`의 `requireUser`, `requireInstructor`, `requireAdmin`을 사용합니다.

## 핵심 모듈

| 경로 | 역할 |
| --- | --- |
| `lib/firebase-client.ts`, `lib/firebase-admin.ts` | 브라우저 및 서버 Firebase 초기화 |
| `components/AuthProvider.tsx` | 로그인 사용자 상태 |
| `lib/learning-session.ts` | 현재 학습 항목의 시도·완료·전송 상태 및 이탈 확인 |
| `components/LearningExitDialog.tsx` | 미완료 또는 전송 실패 시 선택창 |
| `components/pbl/usePblCompletion.ts` | PBL 마지막 단계 도달 상태 |
| `components/viewers/CustomVideoPlayer.tsx` | 동영상 재생 UI |
| `lib/hooks/useVideoWatchTime.ts`, `lib/hooks/useSaveVideoWatchTime.ts` | 실제 재생 시간 측정과 서버 저장 |
| `lib/report-watch-time.ts`, `lib/report-log-match.ts` | 시청률 기준·제목 매칭·리포트 판정 |
| `lib/hooks/useVideoUpload.ts`, `lib/video-upload-utils.ts` | 시뮬레이터 동영상 제출 |
| `lib/emt-analysis.ts`, `lib/emt-processor.ts` | EMT 분석 요청과 결과 처리 |
| `lib/cpx-*.ts` | CPX 시나리오·대화·음성 설정 |

재사용 hook은 [hook 목록](lib/hooks/README.md)을 참조하세요.

## 학습 기록 흐름

1. 사용자가 항목을 열면 해당 항목의 학습 시도를 기록합니다. 항목별 시작 기록과 완료 기록은 구분합니다.
2. 시청률 기반 동영상은 실제 재생 시간을 추적하고 `/api/video/watch-time`에 저장합니다. 기준값은 `lib/report-watch-time.ts`의 80%입니다.
3. PEG, NVUGIB 총론, EUS 등 지정 강의는 저장된 시청률이 80%에 도달해야 `log/`에 `-Completed` 로그를 만듭니다.
4. PBL은 마지막 단계 전까지 완료 로그를 만들지 않습니다. EGD Lesion Dx는 항목별 오른쪽 진행 버튼으로 완료 로그를 전송합니다.
5. 미완료 상태로 항목을 닫거나 이동하면 `lib/learning-session.ts`와 과정 화면이 해당 항목의 이탈 여부를 확인하고 선택창을 표시합니다. 일반 둘러보기 후 로그아웃에는 학습 미완료 경고를 적용하지 않습니다.
6. 강사용 모니터링과 보고서는 Firestore 시청 기록 및 Storage 로그를 읽습니다. 서버의 학습 상태 검증은 `/api/learning/logout-status`에서 수행합니다.

시청률 추적 세부 사항은 [동영상 시청 기록 안내](lib/hooks/VIDEO_WATCH_ROUTINE.md)에 있습니다.

## 데이터 저장 위치

| 저장소 | 경로 또는 컬렉션 | 내용 |
| --- | --- | --- |
| Firestore | `users`, 일부 이전 자료의 `patients` | 사용자 및 강사 정보 |
| Firestore | `lecture_list`, `contents` | 강의 목록과 콘텐츠 |
| Firestore | `video_watch_times` | 동영상별 시청 세션 |
| Firestore | `user_sessions`, `emtJobs`, `admins` | 접속, EMT 작업, 관리자 정보 |
| Storage | `log/` | 일반 학습·동영상 완료 로그 |
| Storage | `log_EGD_Lesion_Dx/` | EGD Lesion Dx 완료 로그 |
| Storage | `Simulator_training/{MT,EMT,LHT,SHT}/...` | 시뮬레이터 제출 영상과 결과 |
| Storage | `Simulator_training/EMT/EMT_visualization/` | 일정 시간 뒤 정리 가능한 EMT 시각화 |

`video_watch_times`의 실제 필드에는 `email`, `position`, `name`, `hospital`, `videoUrl`, `videoTitle`, `category`, `duration`, `watchedTime`, `trackingMethod`, `attemptId`, `lastUpdated`, `logCreated`, `sessionType`이 있습니다. `sessionType`은 진행 중 확인인 `checking` 또는 종료 시 저장한 `final`입니다. `completed` 또는 `progress`라는 필드를 기준으로 완료를 읽는 구조는 아닙니다.

로그 파일명은 항목 및 학습자 정보를 조합하며, 고정된 이메일·날짜 형식이 아닙니다. 파일명과 내용의 최신 규칙은 `app/api/video/watch-time/route.ts`, `app/api/log/create/route.ts`, `app/api/log/egd-lesion-dx/route.ts`를 확인하세요.

## Python 분석 서비스

`python-server/app.py`는 `GET /health`, `POST /analyze`(EMT), `POST /analyze-emtl`(EMT-L)을 제공합니다. `Dockerfile`은 Python 3.11과 Gunicorn을 사용합니다. 자세한 요청 값과 로컬 실행은 [Python 서버 안내](python-server/README.md)에 있습니다. Next.js는 `EMT_ANALYSIS_SERVICE_URL`을 기본 URL로 사용합니다.

## 변경 시 함께 확인할 곳

| 변경 내용 | 같이 확인할 코드·문서 |
| --- | --- |
| 새 학습 완료 기준 | `lib/learning-session.ts`, `lib/report-watch-time.ts`, 해당 과정 페이지, [시청 기록 안내](lib/hooks/VIDEO_WATCH_ROUTINE.md) |
| 새 동영상 제출 유형 | `lib/video-upload-utils.ts`, `lib/hooks/useVideoUpload.ts`, 해당 API, [업로드 안내](lib/hooks/VIDEO_UPLOAD_HOOK_GUIDE.md) |
| 환경 변수 또는 배포 설정 | [`.env.example`](.env.example), [README](README.md), `firebase.json` |
| 강사 리포트 열·집계 | `app/api/instructor/generate-report/route.ts`, `lib/report-log-match.ts` |
