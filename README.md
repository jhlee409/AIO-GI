# AIO-GI

소화기 내시경 교육을 위한 웹 애플리케이션입니다. 교육생 과정(R3, F1, F2), 동영상 학습, PBL, EGD Lesion Dx, CPX, 시뮬레이터 동영상 제출과 강사용 모니터링을 제공합니다.

## 시작하기

### 준비물

- Node.js와 npm (설치 스크립트는 Node.js 18 이상을 확인합니다.)
- Firebase 프로젝트의 Authentication, Firestore, Storage
- CPX를 사용할 경우 OpenAI API 키
- EMT 동영상 분석을 사용할 경우 별도의 Python 분석 서비스

```powershell
# Windows
./setup.ps1
```

```bash
# macOS / Linux
./setup.sh
```

설치 스크립트는 npm 패키지를 설치하고 `.env.local`이 없으면 `.env.example`을 복사합니다. 수동으로 설치하려면 다음 명령을 사용합니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows에서 수동으로 복사할 때는 `Copy-Item .env.example .env.local`을 사용합니다. `.env.local`의 예시 값을 실제 프로젝트 값으로 바꾼 뒤 `http://localhost:3000`에서 접속합니다.

### Firebase 서버 인증

브라우저용 `NEXT_PUBLIC_FIREBASE_*` 값은 Firebase 프로젝트 설정에서 가져옵니다. 서버의 Firebase Admin SDK는 다음 중 하나로 인증합니다.

1. `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`를 함께 설정
2. 실행 환경의 Application Default Credentials(ADC) 사용

`secret/serviceAccountKey.json`을 놓는 것만으로는 서버가 파일을 읽지 않습니다. 서비스 계정 키와 `.env.local`은 Git에 올리지 마세요. Storage 버킷 이름은 프로젝트에 실제로 설정된 값을 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`에 입력합니다.
ADC를 사용하는 경우 `.env.local`에 복사된 서버 인증 변수 3개의 예시 값은 제거하거나 주석 처리합니다.

### 주요 환경 변수

전체 예시는 [`.env.example`](.env.example)에 있습니다.

| 변수 | 쓰임 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 앱 설정 |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | 서버 인증에 서비스 계정 값을 사용할 때 |
| `FIREBASE_DATABASE_URL` | Realtime Database가 필요한 기능을 사용할 때 |
| `OPENAI_API_KEY` | CPX 대화, 음성 인식·합성 |
| `CPX_CHAT_MAX_TOKENS` | CPX 대화의 출력 토큰 예산 (기본 2048) |
| `CPX_STT_MODEL`, `CPX_TTS_MODEL`, `CPX_TTS_VOICE` | CPX 음성 옵션 |
| `EMT_ANALYSIS_SERVICE_URL` | EMT/EMT-L Python 분석 서비스 기본 URL |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_EMAIL` | 이메일 전송 및 삭제 알림 수신 주소 |
| `CLEANUP_SECRET_TOKEN` | EMT 시각화 정리 API의 Bearer 토큰 |

CPX 채팅 모델은 현재 `app/api/cpx/chat/route.ts`에서 `gpt-6-luna`로 지정합니다. `EMT_ANALYSIS_SERVICE_URL`을 설정하지 않으면 `lib/emt-analysis.ts`의 기본 서비스 URL을 사용합니다.

## 실행과 배포

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Next.js 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `node --test` | `tests/`의 Node 회귀 검사 실행 |
| `npm run deploy` | Firebase Hosting 배포 |
| `npm run deploy:all` | Firebase 전체 배포 |

`package.json` 기준으로 Next.js 15.0.8, React 19.2.3, TypeScript 5.9.3을 사용합니다. 배포 대상은 `firebase.json`의 Hosting 사이트 `amcgi-bulletin`입니다. Next.js 서버 기능은 `asia-northeast3`의 Firebase frameworks backend로 연결되며 현재 메모리 2GiB, 시간 제한 540초로 설정되어 있습니다. 배포 전 `npm run build`로 빌드 결과를 확인하세요.

EMT/EMT-L 동영상 분석 서버는 별도 배포합니다. 로컬 실행, 요청 형식, 배포 스크립트는 [Python 서버 안내](python-server/README.md)를 참조하세요. 분석 결과의 시각화 파일은 `/api/cleanup-emt-visualization`에서 생성 후 3시간이 지난 파일을 정리할 수 있습니다. [Scheduler 설정 스크립트](scripts/setup-cloud-scheduler.ps1)는 이 API를 매시간 호출하는 작업을 만듭니다.

## 학습 기록과 완료 기준

완료 확인 대상인 학습 항목을 열고 완료하지 않은 상태에서 다른 항목으로 이동하거나 해당 항목을 닫으면, 그 항목의 완료 상태를 확인하는 선택창을 표시합니다. 단순히 로그인 후 둘러보다 로그아웃하는 경우에는 학습 미완료 경고를 띄우지 않습니다. 전송 실패도 별도로 확인합니다.

| 항목 | 완료 판정 |
| --- | --- |
| 시청률 기반 동영상 | 실제 재생 시간이 전체 길이의 80% 이상이고 시청 기록이 저장된 경우 |
| PEG, NVUGIB 총론, EUS 강의 등 지정된 동영상 | 80% 이상 시청 후 강사용 완료 로그 생성 |
| EGD Lesion Dx | 각 항목의 오른쪽 진행 버튼으로 완료 로그 전송 |
| PBL | 마지막 단계에 도달한 뒤 완료 로그 전송. 그 전에는 완료 로그를 보내지 않음 |
| CPX 및 시작 기록만 필요한 항목 | 항목 시작 기록을 사용하며 80% 동영상 기준을 적용하지 않음 |

시청률 판정과 지정 동영상 목록은 `lib/report-watch-time.ts`, 항목 이탈 확인은 `lib/learning-session.ts` 및 `components/LearningExitDialog.tsx`가 담당합니다. 자세한 동영상 기록 흐름은 [시청 기록 안내](lib/hooks/VIDEO_WATCH_ROUTINE.md)에 있습니다.

## 구성과 기술

- **웹:** Next.js App Router, React, TypeScript, Tailwind CSS
- **인증·데이터·파일:** Firebase Authentication, Firestore, Storage; 일부 기능에서 Realtime Database
- **CPX:** OpenAI API를 통한 대화 및 음성 처리
- **분석 서버:** Python 3.11, Flask, OpenCV, scikit-learn; Cloud Run 배포용 Docker 구성
- **이메일:** Nodemailer와 Gmail SMTP

주요 폴더와 API, 데이터 흐름은 [프로젝트 구조](Project_structure.md)에 정리했습니다. 재사용 hook은 [hook 안내](lib/hooks/README.md), 동영상 업로드는 [업로드 hook 안내](lib/hooks/VIDEO_UPLOAD_HOOK_GUIDE.md)를 참조하세요.

## 운영 시 확인할 파일

| 파일 | 용도 |
| --- | --- |
| [`firebase.json`](firebase.json) | Hosting, 서버 리전 및 빌드 설정 |
| [`next.config.ts`](next.config.ts) | Next.js 설정 |
| [`.env.example`](.env.example) | 환경 변수 이름과 예시 |

로그인 및 강사·관리자 API는 Firebase ID 토큰과 서버의 권한 검사를 사용합니다. 권한 구현은 `lib/api-auth.ts`와 `lib/auth-server.ts`에서 확인할 수 있습니다.
