# AIO-GI 프로젝트 구조 상세 문서

이 문서는 AIO-GI 프로젝트의 디렉토리 구조, 각 모듈의 역할, 데이터 흐름, API 엔드포인트를 상세히 설명합니다.

---

## 목차

- [디렉토리 전체 구조](#디렉토리-전체-구조)
- [app/ - Next.js App Router](#app---nextjs-app-router)
  - [페이지 라우트](#페이지-라우트)
  - [API 라우트](#api-라우트)
- [components/ - React 컴포넌트](#components---react-컴포넌트)
- [lib/ - 유틸리티 및 라이브러리](#lib---유틸리티-및-라이브러리)
- [types/ - TypeScript 타입 정의](#types---typescript-타입-정의)
- [python-server/ - EMT 비디오 분석 서버](#python-server---emt-비디오-분석-서버)
- [scripts/ - 배포 및 유틸리티 스크립트](#scripts---배포-및-유틸리티-스크립트)
- [설정 파일](#설정-파일)
- [데이터 흐름 다이어그램](#데이터-흐름-다이어그램)
- [Firestore 컬렉션 스키마](#firestore-컬렉션-스키마)
- [Firebase Storage 구조](#firebase-storage-구조)
- [인증 및 권한 흐름](#인증-및-권한-흐름)

---

## 디렉토리 전체 구조

```
AIO-GI/
│
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # 루트 레이아웃 (AuthProvider 래핑)
│   ├── globals.css                         # 전역 CSS 스타일
│   │
│   ├── login/                              # 로그인 페이지
│   │   └── page.tsx                        # 이메일/비밀번호 로그인 폼
│   │
│   ├── (admin)/                            # 관리자 라우트 그룹
│   │   ├── layout.tsx                      # 관리자 레이아웃 (권한 검증)
│   │   └── admin/
│   │       ├── page.tsx                    # 관리자 메인 페이지
│   │       ├── users/
│   │       │   └── page.tsx                # 사용자 관리 페이지
│   │       ├── contents/
│   │       │   ├── page.tsx                # 강의 목록 관리 페이지
│   │       │   └── upload/
│   │       │       └── page.tsx            # 강의 목록 업로드 페이지
│   │       └── instructor-login-history/
│   │           └── page.tsx                # 강사 로그인 이력 페이지
│   │
│   ├── (public)/                           # 일반 사용자 라우트 그룹
│   │   ├── layout.tsx                      # 공개 레이아웃
│   │   ├── page.tsx                        # 홈페이지 (카테고리 카드 목록)
│   │   ├── courses/
│   │   │   └── [category]/                 # 동적 카테고리 라우트
│   │   │       ├── page.tsx                # 카테고리별 강의 페이지
│   │   │       ├── egd-lesion-dx/
│   │   │       │   └── [imageName]/
│   │   │       │       └── page.tsx        # EGD Lesion Dx 상세 페이지
│   │   │       ├── pbl-f2-01/
│   │   │       │   └── page.tsx            # PBL F2 시나리오 01
│   │   │       ├── pbl-f2-02/ ~ pbl-f2-14/ # PBL F2 시나리오 02~14
│   │   │       │   └── page.tsx
│   │   │       └── ...
│   │   ├── cpx/
│   │   │   └── page.tsx                    # CPX 환자 병력청취 훈련 페이지
│   │   └── instructor/
│   │       └── page.tsx                    # 강사 패널 페이지
│   │
│   └── api/                                # API 라우트 (서버 사이드)
│       ├── admin/                          # 관리자 API (아래 상세)
│       ├── instructor/                     # 강사 API (아래 상세)
│       ├── user/                           # 사용자 API (아래 상세)
│       ├── video/                          # 비디오 API (아래 상세)
│       ├── log/                            # 로그 API (아래 상세)
│       ├── cpx/                            # CPX API (아래 상세)
│       └── ...                             # 기타 API (아래 상세)
│
├── components/                             # React 컴포넌트
│   ├── AuthProvider.tsx                    # 인증 컨텍스트 프로바이더
│   ├── MediaCard.tsx                       # 미디어 카드 컴포넌트
│   ├── admin/                              # 관리자 전용 컴포넌트
│   │   ├── AdminUserTable.tsx              # 사용자 테이블
│   │   ├── AdminLectureListTable.tsx       # 강의 목록 테이블
│   │   ├── AdminContentTable.tsx           # 콘텐츠 테이블
│   │   ├── ResultDialog.tsx                # 결과 다이얼로그
│   │   └── ConfirmDialog.tsx               # 확인 다이얼로그
│   ├── common/                             # 공통 컴포넌트
│   │   ├── LoadingSpinner.tsx              # 로딩 스피너
│   │   ├── CategoryCard.tsx                # 카테고리 카드
│   │   ├── FileUploadButton.tsx            # 파일 업로드 버튼
│   │   ├── SearchInput.tsx                 # 검색 입력
│   │   ├── ErrorMessage.tsx                # 에러 메시지
│   │   └── index.ts                        # 공통 컴포넌트 export
│   ├── pbl/                                # PBL 시나리오 컴포넌트
│   │   ├── PblF201Page.tsx                 # PBL F2 시나리오 01
│   │   ├── PblF202Page.tsx ~ PblF214Page.tsx  # 시나리오 02~14
│   │   └── ...
│   └── viewers/                            # 미디어 뷰어 컴포넌트
│       ├── CustomVideoPlayer.tsx           # 커스텀 비디오 플레이어
│       ├── DocumentViewer.tsx              # 문서 뷰어
│       ├── ImageViewer.tsx                 # 이미지 뷰어
│       └── templates/
│           ├── videoPlayerFormat.ts         # 비디오 플레이어 템플릿
│           └── VIDEO_PLAYER_FORMAT.md       # 템플릿 문서
│
├── lib/                                    # 유틸리티 및 라이브러리
│   ├── firebase-client.ts                  # Firebase Client SDK 초기화
│   ├── firebase-admin.ts                   # Firebase Admin SDK 초기화
│   ├── auth.ts                             # 클라이언트 인증 헬퍼
│   ├── auth-server.ts                      # 서버 인증 헬퍼
│   ├── instructor-utils.ts                 # 강사 유틸리티
│   ├── emt-processor.ts                    # EMT 비디오 처리 로직
│   ├── emt-analysis.ts                     # EMT 분석 결과 처리
│   ├── video-upload-utils.ts               # 비디오 업로드 유틸리티
│   ├── image-converter.ts                  # 이미지 변환 (BMP→JPG)
│   ├── error-handler.ts                    # 에러 처리 유틸리티
│   ├── log-utils.ts                        # 로깅 유틸리티
│   ├── ui-constants.ts                     # UI 스타일 상수
│   ├── fonts/
│   │   └── NotoSansKR-Regular-normal.js    # Base64 인코딩 폰트
│   └── hooks/                              # React 커스텀 훅
│       ├── useUserProfile.ts               # 사용자 프로필 관리
│       ├── useApi.ts                       # 범용 API 호출
│       ├── useLectureList.ts               # 강의 목록 관리
│       ├── useUsers.ts                     # 사용자 목록 관리
│       ├── useCpxChat.ts                   # CPX 채팅 관리
│       ├── useExcelFileProcessor.ts        # Excel 파일 처리
│       ├── useModal.ts                     # 모달 상태 관리
│       ├── useCategoryFilter.ts            # 직위 기반 카테고리 필터링
│       ├── useVideoUpload.ts               # 비디오 업로드 관리
│       ├── useVideoWatchTime.ts            # 비디오 시청 시간 추적
│       ├── useSaveVideoWatchTime.ts        # 시청 시간 저장
│       ├── useCalculateAccumulatedWatchTime.ts  # 누적 시청 시간 계산
│       ├── useAutoLogout.ts                # 자동 로그아웃
│       ├── useSessionActivity.ts           # 세션 활동 추적
│       ├── index.ts                        # 전체 hooks export
│       ├── README.md                       # Hooks 사용 가이드
│       └── VIDEO_UPLOAD_HOOK_GUIDE.md      # 비디오 업로드 가이드
│
├── types/                                  # TypeScript 타입 정의
│   └── index.ts                            # UserRole, MediaType, Category 등
│
├── python-server/                          # Python Flask 비디오 분석 서버
│   ├── app.py                              # Flask 메인 애플리케이션
│   ├── emt_l_analysis.py                   # EMT-L 전용 분석 모듈
│   ├── requirements.txt                    # Python 의존성
│   ├── Dockerfile                          # Docker 이미지 빌드 파일
│   ├── cloudbuild.yaml                     # Google Cloud Build 설정
│   ├── deploy.sh                           # 배포 스크립트 (Linux/Mac)
│   └── deploy.ps1                          # 배포 스크립트 (Windows)
│
├── scripts/                                # 유틸리티 스크립트
│   ├── setup-cloud-scheduler.sh            # Cloud Scheduler 설정 (Linux/Mac)
│   ├── setup-cloud-scheduler.ps1           # Cloud Scheduler 설정 (Windows)
│   ├── deploy-with-quota-project.ps1       # 쿼터 프로젝트 설정 배포
│   └── convert-font.js                     # 폰트 Base64 변환
│
├── secret/                                 # 비밀 파일 (gitignore 대상)
│   └── serviceAccountKey.json              # Firebase Admin SDK 키 (수동 배치)
│
├── public/                                 # 정적 에셋
│   ├── fonts/
│   │   ├── NotoSansKR-Bold.ttf
│   │   └── NotoSansKR-Regular.ttf
│   └── *.svg                               # 기본 아이콘 파일들
│
├── .env.example                            # 환경 변수 템플릿
├── .env.local                              # 로컬 환경 변수 (gitignore)
├── package.json                            # Node.js 의존성 및 스크립트
├── next.config.ts                          # Next.js 설정
├── tsconfig.json                           # TypeScript 설정
├── tailwind.config.js                      # Tailwind CSS 설정
├── postcss.config.js                       # PostCSS 설정
├── firebase.json                           # Firebase 배포 설정
├── .firebaserc                             # Firebase 프로젝트 연결
├── .gitignore                              # Git 무시 파일 목록
├── setup.sh                                # 초기 설정 스크립트 (Linux/Mac)
└── setup.ps1                               # 초기 설정 스크립트 (Windows)
```

---

## app/ - Next.js App Router

Next.js 16의 App Router를 사용합니다. 파일 시스템 기반 라우팅이며, `(admin)`과 `(public)` 라우트 그룹으로 권한에 따라 분리됩니다.

### 페이지 라우트

#### 루트 레이아웃: `app/layout.tsx`

모든 페이지를 `AuthProvider`로 감싸서 인증 상태를 전역으로 관리합니다.

#### 로그인 페이지: `app/login/page.tsx`

| 항목 | 설명 |
|------|------|
| 경로 | `/login` |
| 기능 | 이메일/비밀번호 입력, 사용자 검증, Firebase Auth 로그인 |
| 동작 흐름 | 입력 → `/api/user/verify` 호출 → Firebase Auth 로그인 → 세션 생성 → 홈으로 리다이렉트 |
| 배경 이미지 | `/api/login-background-url`에서 동적 로드 |

#### 관리자 페이지 그룹: `app/(admin)/`

`layout.tsx`에서 `role !== 'admin'`이면 `/login`으로 리다이렉트합니다.

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 관리자 메인 | `/admin` | 사용자 관리, Lecture List 관리 메뉴 |
| 사용자 관리 | `/admin/users` | Excel 업로드, 사용자 목록 표시/검색/삭제, Auth 동기화, 로그/비디오 삭제 |
| 강의 관리 | `/admin/contents` | 강의 목록 CRUD, Excel 업로드 |
| 강의 업로드 | `/admin/contents/upload` | 강의 목록 Excel 업로드 전용 페이지 |
| 로그인 이력 | `/admin/instructor-login-history` | 최근 1개월 강사 로그인 이력 조회 |

#### 일반 사용자 페이지 그룹: `app/(public)/`

모든 인증된 사용자가 접근 가능하며, 콘텐츠는 직위에 따라 필터링됩니다.

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 홈 | `/` | 접근 가능한 카테고리 카드 목록 표시 |
| 강의 | `/courses/[category]` | 카테고리별 강의 목록, 비디오 재생, 파일 다운로드, 비디오 업로드 (MT/SHT/EMT) |
| EGD Dx 상세 | `/courses/[category]/egd-lesion-dx/[imageName]` | EGD Lesion Dx 이미지 + 해설 상세 |
| PBL F2 01~14 | `/courses/[category]/pbl-f2-01` ~ `14` | PBL 대화형 학습 시나리오 |
| CPX | `/cpx` | AI 환자 병력청취 훈련 (ChatGPT 대화) |
| 강사 패널 | `/instructor` | 교육생 필터링, 리포트 생성/다운로드 |

### API 라우트

모든 API는 `app/api/` 하위에 있으며, Next.js Route Handlers를 사용합니다.

#### 관리자 API (`/api/admin/`)

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/admin/patients` | GET, POST, DELETE | 사용자 CRUD (Firestore `users` 컬렉션) | Firestore |
| `/api/admin/patients/batch-delete` | POST | 사용자 일괄 삭제 | Firestore |
| `/api/admin/delete-user` | POST | 단일 사용자 Firebase Auth 삭제 | Firebase Auth |
| `/api/admin/admins` | GET, POST, DELETE | 관리자 목록 관리 | Firestore |
| `/api/admin/lecture-list` | GET, POST, DELETE | 강의 목록 CRUD (중복 자동 제거) | Firestore |
| `/api/admin/lecture-list/batch-delete` | POST | 강의 일괄 삭제 | Firestore |
| `/api/admin/member-file` | GET, POST | 회원 Excel 파일 읽기/저장 | Firebase Storage |
| `/api/admin/auth-push` | POST | Firestore → Firebase Auth 일괄 등록 | Firebase Auth |
| `/api/admin/auth-deletion` | POST | Firebase Auth 사용자 일괄 삭제 | Firebase Auth, Realtime DB |
| `/api/admin/auth-restore` | GET, POST | 삭제된 사용자 복구 | Firebase Auth, Realtime DB |
| `/api/admin/delete-logs` | POST | 로그 파일 삭제 | Firebase Storage, Firestore |
| `/api/admin/delete-submitted-videos` | POST | 제출된 비디오 삭제 | Firebase Storage |
| `/api/admin/delete-content` | POST | 콘텐츠 삭제 | Firestore, Firebase Storage |
| `/api/admin/check-instructors` | GET | 병원별 강사 확인 | Firestore |
| `/api/admin/concurrent-logins` | GET, POST, DELETE | 동시 접속 관리 | Firestore |
| `/api/admin/notify-concurrent-login` | POST | 동시 접속 알림 이메일 | Firestore, Gmail SMTP |
| `/api/admin/send-log-deletion-email` | POST | 로그 삭제 기록 이메일 | Gmail |
| `/api/admin/instructor-login-history` | GET | 강사 로그인 이력 (최근 1개월) | Firestore |

#### 강사 API (`/api/instructor/`)

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/instructor/generate-report` | POST | Excel 리포트 생성 | Firebase Storage, Firestore, XLSX |
| `/api/instructor/categories` | GET | 강의 카테고리 목록 | Firestore |
| `/api/instructor/filtered-users` | POST | 교육생 필터링 (병원/직위/이름) | Firestore |
| `/api/instructor/filter-options` | GET | 필터 옵션 (병원/직위) | Firestore |
| `/api/instructor/log-files` | GET | 로그 파일 목록 | Firebase Storage |
| `/api/instructor/build-table` | POST | 테이블 데이터 생성 | Firestore, Firebase Storage |
| `/api/instructor/lectures-by-category` | POST | 카테고리별 강의 목록 | Firestore |

#### 사용자 API (`/api/user/`)

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/user/profile` | GET | 사용자 프로필 조회 | Firestore |
| `/api/user/verify` | POST | 로그인 자격 증명 검증 | Firestore |
| `/api/user/session` | POST | 세션 생성/업데이트/삭제, 동시 접속 감지 | Firestore |
| `/api/user/instructor-status` | GET | 강사 여부 확인 | Firestore |

#### 비디오 API (`/api/video/`)

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/video/watch-time` | POST | 시청 시간 추적 (80% 달성 시 로그 생성) | Firestore, Firebase Storage |
| `/api/video/watch-time/debug` | GET | 시청 시간 디버깅 조회 | Firestore |
| `/api/video/watch-time/save-on-logout` | POST | 로그아웃 시 시청 시간 저장 | Firestore |
| `/api/video-url` | GET | 비디오 다운로드 URL 생성 | Firebase Storage |

#### 비디오 업로드 API

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/emt-upload` | POST | EMT 분석 작업 생성 (비동기) | Firebase Storage, Firestore, Python 서버 |
| `/api/emt-job-status` | GET | EMT 작업 상태 조회 | Firestore |
| `/api/mt-video-upload` | POST | MT 비디오 업로드 메타데이터 처리 | Firebase Storage, Firestore |
| `/api/lht-video-upload` | POST | LHT 비디오 업로드 메타데이터 처리 | Firebase Storage, Firestore |
| `/api/sht-video-upload` | POST | SHT 비디오 업로드 메타데이터 처리 | Firebase Storage, Firestore |

#### 이메일 API

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/emt-send-email` | POST | EMT 업로드 알림 이메일 | Gmail SMTP |
| `/api/mt-send-email` | POST | MT 업로드 알림 이메일 | Gmail SMTP |
| `/api/lht-send-email` | POST | LHT 업로드 알림 이메일 | Gmail SMTP |
| `/api/sht-send-email` | POST | SHT 업로드 알림 이메일 | Gmail SMTP |

#### CPX API

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/cpx/chat` | POST | GPT 기반 환자 대화 처리 | OpenAI API (GPT-4o-mini) |
| `/api/cpx/docx-content` | GET | CPX 교육 자료 DOCX 내용 조회 | Firebase Storage, mammoth |

#### 콘텐츠 API

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/egd-dx-docx-content` | GET | EGD Dx DOCX 내용 조회 | Firebase Storage, mammoth |
| `/api/egd-dx-image-url` | GET | EGD Dx 이미지 URL 생성 | Firebase Storage |
| `/api/egd-dx-images` | GET | EGD Dx 이미지 목록 | Firebase Storage |
| `/api/pbl-image-url` | GET | PBL 이미지 URL 생성 | Firebase Storage |
| `/api/login-background-url` | GET | 로그인 배경 이미지 URL | Firebase Storage |
| `/api/file-download` | GET | 파일 다운로드 | Firebase Storage |

#### 로그 API (`/api/log/`)

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/log/create` | POST | 강의 수강 로그 생성 (`log/`) | Firebase Storage |
| `/api/log/egd-lesion-dx` | POST | EGD Lesion Dx 학습 로그 생성 (`log_EGD_Lesion_Dx/`) | Firebase Storage |

#### 유틸리티 API

| 엔드포인트 | 메서드 | 기능 | 주요 외부 서비스 |
|-----------|--------|------|-----------------|
| `/api/cleanup-emt-visualization` | GET, POST | 오래된 EMT 시각화 파일 삭제 (3시간 경과) | Firebase Storage |

---

## components/ - React 컴포넌트

### AuthProvider (`components/AuthProvider.tsx`)

앱 전체를 감싸는 인증 컨텍스트 프로바이더입니다.

**제공 기능**:
- `useAuth()` 훅: `user`, `role`, `loading`, `logout()` 제공
- Firebase Auth 상태 감시 (`onAuthStateChanged`)
- 관리자/강사 역할 자동 감지
- 자동 로그아웃 경고 (비활성 29분 → 30분 시 로그아웃)
- 세션 활동 추적 (마우스/키보드 이벤트)
- 로그아웃 시 진행 중인 시청 시간 자동 저장

### admin/ 컴포넌트

| 컴포넌트 | 용도 | 사용처 |
|---------|------|--------|
| `AdminUserTable` | 사용자 목록 테이블 (정렬, 선택, 삭제) | `/admin/users` |
| `AdminLectureListTable` | 강의 목록 테이블 | `/admin/contents` |
| `AdminContentTable` | 콘텐츠 테이블 | `/admin/contents` |
| `ResultDialog` | 작업 결과 모달 | 관리자 페이지 전반 |
| `ConfirmDialog` | 확인/취소 모달 | 관리자 페이지 전반 |

### common/ 컴포넌트

| 컴포넌트 | 용도 | 사용처 |
|---------|------|--------|
| `LoadingSpinner` | 로딩 스피너 (sm/md/lg 사이즈) | 전체 |
| `CategoryCard` | 카테고리 카드 (아이콘, 색상, 링크) | 홈페이지 |
| `FileUploadButton` | 파일 업로드 버튼 | 관리자, 강의 페이지 |
| `SearchInput` | 검색 입력 필드 | 관리자 페이지 |
| `ErrorMessage` | 에러 메시지 표시 | 전체 |

### pbl/ 컴포넌트

`PblF201Page.tsx` ~ `PblF214Page.tsx` (14개 파일)

각 PBL 시나리오의 대화형 학습 인터페이스를 구현합니다. `app/(public)/courses/[category]/pbl-f2-XX/page.tsx`에서 동적 import하여 사용합니다.

### viewers/ 컴포넌트

| 컴포넌트 | 용도 | 주요 기능 |
|---------|------|----------|
| `CustomVideoPlayer` | 비디오 플레이어 | 재생/일시정지/정지, 진행바, 시청 시간 추적, 80% 달성 시 로그 생성 |
| `DocumentViewer` | 문서 뷰어 | DOCX/PDF 문서 표시 |
| `ImageViewer` | 이미지 뷰어 | 이미지 표시 및 확대 |

---

## lib/ - 유틸리티 및 라이브러리

### Firebase 초기화

| 파일 | 용도 | 사용 환경 |
|------|------|----------|
| `firebase-client.ts` | Firebase Client SDK 초기화 (Auth, Storage, Firestore) | 클라이언트 (브라우저) |
| `firebase-admin.ts` | Firebase Admin SDK 초기화 (Singleton 패턴) | 서버 (API Routes) |

`firebase-admin.ts`의 초기화 우선순위:
1. 환경 변수 (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
2. `secret/` 디렉토리의 서비스 계정 키 파일
3. Application Default Credentials (gcloud CLI)

### 인증 모듈

| 파일 | 용도 | 주요 함수 |
|------|------|----------|
| `auth.ts` | 클라이언트 인증 헬퍼 | `isAdmin()`, `getUserRole()`, `isAuthenticated()`, `PRIMARY_ADMIN_EMAILS` |
| `auth-server.ts` | 서버 인증 헬퍼 | `isAdminEmail()`, Super Admin 보호 |

**Primary Admin**: `jhlee409@gmail.com`, `ghlee409@amc.seoul.kr` (코드에 하드코딩)
**Super Admin**: `jhlee409@gmail.com` (삭제 불가)

### EMT 처리 모듈

| 파일 | 용도 |
|------|------|
| `emt-processor.ts` | EMT 업로드 후 Python 서버 호출, Firestore 작업 상태 관리 |
| `emt-analysis.ts` | EMT 분석 결과 처리 및 포매팅 |

### 기타 유틸리티

| 파일 | 용도 |
|------|------|
| `instructor-utils.ts` | 강사 관련 유틸리티 함수 |
| `video-upload-utils.ts` | 비디오 업로드 공통 로직 (MT, SHT, LHT) |
| `image-converter.ts` | BMP → JPG 이미지 변환 |
| `error-handler.ts` | 에러 처리 및 로깅 유틸리티 |
| `log-utils.ts` | 로그 파일 생성 유틸리티 |
| `ui-constants.ts` | UI 스타일 상수 (버튼 색상, 크기 등) |

### React 커스텀 훅 (`lib/hooks/`)

| 훅 | 용도 | 주요 로직 |
|----|------|----------|
| `useUserProfile` | 사용자 프로필 로드/관리 | Firestore에서 프로필 조회, 캐싱 |
| `useApi` | 범용 API 호출 | 로딩/에러 상태 관리, 재시도 |
| `useLectureList` | 강의 목록 관리 | CRUD 작업, Excel 업로드 |
| `useUsers` | 사용자 목록 관리 | CRUD 작업, 검색, 필터링 |
| `useCpxChat` | CPX 채팅 관리 | 대화 히스토리, API 호출 |
| `useExcelFileProcessor` | Excel 파일 처리 | 파일 파싱, 데이터 검증 |
| `useModal` | 모달 상태 관리 | 열기/닫기, 데이터 전달 |
| `useCategoryFilter` | 직위 기반 카테고리 필터링 | R3/F1/F2별 접근 가능 카테고리 반환 |
| `useVideoUpload` | 비디오 업로드 관리 | 진행률, 에러 처리 |
| `useVideoWatchTime` | 비디오 시청 시간 추적 | 실시간 추적, 80% 달성 감지 |
| `useSaveVideoWatchTime` | 시청 시간 저장 | 서버 전송, 로그아웃 시 저장 |
| `useCalculateAccumulatedWatchTime` | 누적 시청 시간 계산 | 서버 유틸 (API Route에서 사용) |
| `useAutoLogout` | 자동 로그아웃 | 비활성 감지, 경고/로그아웃 |
| `useSessionActivity` | 세션 활동 추적 | 마우스/키보드 이벤트 감지, 세션 업데이트 |

---

## types/ - TypeScript 타입 정의

`types/index.ts`에 정의된 주요 타입:

| 타입 | 설명 | 값 |
|------|------|-----|
| `UserRole` | 사용자 역할 | `'user' \| 'admin'` |
| `MediaType` | 미디어 유형 | `'image' \| 'video' \| 'document'` |
| `Category` | 콘텐츠 카테고리 | `'anatomy' \| 'surgery' \| 'radiology' \| 'pathology' \| 'general'` |
| `MediaItem` | 미디어 아이템 | `{ id, title, type, url, thumbnail?, description? }` |
| `UserProfile` | 사용자 프로필 | `{ email, name, position, hospital, ... }` |
| `UploadProgress` | 업로드 진행 상태 | `{ progress, status, error? }` |

---

## python-server/ - EMT 비디오 분석 서버

Google Cloud Run에 배포되는 Flask 기반 Python 서버입니다.

### app.py - 메인 서버

#### Flask 라우트

| 엔드포인트 | 메서드 | 기능 |
|-----------|--------|------|
| `/health` | GET | 헬스 체크 |
| `/analyze` | POST | EMT 비디오 분석 (기본) |
| `/analyze-emtl` | POST | EMT-L 비디오 분석 |

#### `/analyze` 요청 파라미터

```json
{
  "bucketName": "Firebase Storage 버킷",
  "videoPath": "비디오 파일 경로",
  "xTrainPath": "학습 데이터 CSV 경로 (기본: templates/x_train_EMT.csv)",
  "isAdmin": false,
  "version": "EMT",
  "createVisualization": true
}
```

#### EMT 분석 알고리즘 (`analyze_video()`)

```
1. 비디오 열기 → 메타데이터 추출 (프레임 수, FPS, 길이, 해상도)
       ↓
2. 길이 검증 (EMT: 300~330초 / EMT-L: 190~210초)
       ↓ (관리자 모드는 건너뜀)
3. 프레임별 녹색 마커 검출
   ├─ BGR → HSV 변환
   ├─ 녹색 범위 필터링 (HSV)
   ├─ 모폴로지 연산 (노이즈 제거)
   └─ 윤곽선 검출 (면적 200~8000 픽셀, 가장 큰 윤곽선 선택)
       ↓
4. 이동 거리 계산
   ├─ 연속 프레임 간 유클리드 거리
   ├─ 반지름/시간으로 정규화: delta_g = sqrt(a² + b²) / radius / dt
   └─ 임계값 180 초과 제거
       ↓
5. 특징 추출
   ├─ meanG: 평균 이동 거리
   └─ stdG: 이동 거리 표준편차
       ↓
6. OneClassSVM 평가
   ├─ 전문가 학습 데이터 로드 (x_train_EMT.csv)
   ├─ MinMaxScaler 정규화
   ├─ OneClassSVM 학습 (nu=0.1, kernel='rbf', gamma=0.1)
   ├─ 테스트 데이터 예측
   └─ decision_function 점수 >= 0 → 합격
       ↓
7. 시각화 생성 (선택)
   ├─ 1초당 3프레임 샘플링
   ├─ 검출된 마커에 빨간 원 표시
   └─ Firebase Storage에 업로드
```

#### `/analyze` 응답 형식

```json
{
  "success": true,
  "result": "pass",
  "score": 0.123,
  "meanG": 5.678,
  "stdG": 2.345,
  "frameCount": 9000,
  "fps": 30,
  "duration": 310.5,
  "detectedFrames": 8500,
  "visualizationUrl": "https://storage.googleapis.com/...",
  "failReasons": []
}
```

### emt_l_analysis.py - EMT-L 전용 분석

EMT-L은 KLT(Kanade-Lucas-Tomasi) 특징점 추적 기반의 고급 분석 알고리즘입니다.

#### 분석 과정

```
1. 비디오 열기 → ROI(관심 영역) 설정
       ↓
2. Shi-Tomasi 코너 검출 (maxCorners=200, qualityLevel=0.01)
       ↓
3. Lucas-Kanade 광학 흐름으로 특징점 추적
       ↓
4. 10개 운동학적 특징 추출
   ├─ mean_velocity: 평균 속도
   ├─ velocity_CV: 속도 변동계수
   ├─ acc_std: 가속도 표준편차
   ├─ jerk_std: 저크(가속도 변화율) 표준편차
   ├─ jerk_outlier_ratio: 저크 이상치 비율
   ├─ micro_correction_rate: 미세 수정 빈도
   ├─ tremor_energy_ratio: 떨림 에너지 비율 (3-8Hz)
   ├─ blur_ratio: 모션 블러 비율
   ├─ stop_go_ratio: 정지-재시작 패턴
   └─ path_efficiency: 경로 효율성
       ↓
5. OneClassSVM 평가
   ├─ 전문가 데이터 로드 (x_train_EMT-L.csv)
   ├─ StandardScaler 정규화
   └─ OneClassSVM (nu=0.2, kernel='rbf', gamma='scale')
       ↓
6. 불합격 시 Z-score 기반 사유 분석
```

### 배포 설정

| 파일 | 내용 |
|------|------|
| `Dockerfile` | Python 3.11-slim, OpenCV 의존성, Gunicorn 실행 |
| `cloudbuild.yaml` | Docker 빌드 → GCR 푸시 → Cloud Run 배포 |
| `deploy.sh` / `deploy.ps1` | 배포 명령어 래퍼 스크립트 |

Cloud Run 사양:
- 프로젝트: `amcgi-bulletin`
- 서비스: `emt-video-analysis`
- 리전: `asia-northeast3`
- 메모리: 2Gi, CPU: 2
- 타임아웃: 300초, 최대 인스턴스: 10

---

## scripts/ - 배포 및 유틸리티 스크립트

| 스크립트 | 용도 |
|---------|------|
| `setup-cloud-scheduler.sh` / `.ps1` | Cloud Scheduler 작업 생성 (EMT 시각화 파일 매시간 정리) |
| `deploy-with-quota-project.ps1` | Firebase 배포 시 쿼터 프로젝트 설정 |
| `convert-font.js` | NotoSansKR-Regular.ttf → Base64 JS 파일 변환 |

---

## 설정 파일

### package.json

| 스크립트 | 명령어 | 설명 |
|---------|--------|------|
| `dev` | `node --max-old-space-size=4096 ./node_modules/.bin/next dev` | 개발 서버 (4GB 메모리) |
| `build` | `node --max-old-space-size=8192 ./node_modules/.bin/next build` | 프로덕션 빌드 (8GB 메모리) |
| `start` | `next start` | 프로덕션 서버 실행 |
| `lint` | `next lint` | ESLint 실행 |
| `deploy` | `firebase deploy --only hosting` | Firebase Hosting 배포 |
| `deploy:all` | `firebase deploy` | 전체 Firebase 배포 |

### next.config.ts

| 설정 | 값 | 설명 |
|------|-----|------|
| `typescript.ignoreBuildErrors` | `false` | TypeScript 에러 시 빌드 중단 |
| `experimental.serverActions.bodySizeLimit` | `'250mb'` | 비디오 업로드 크기 제한 |
| `experimental.webpackBuildWorker` | `true` | Webpack 빌드 워커 (메모리 최적화) |
| `resolve.symlinks` | `false` | Windows/OneDrive symlink 이슈 해결 |

### firebase.json

| 설정 | 값 |
|------|-----|
| 호스팅 사이트 | `amcgi-bulletin` |
| Functions 리전 | `asia-northeast3` |
| Functions 메모리 | `1024MiB` |
| Functions 타임아웃 | `540초` |
| 리라이트 | `/api/**` → SSR 함수, `**` → SSR 함수 |

### tsconfig.json

| 설정 | 값 |
|------|-----|
| 타겟 | ES2017 |
| 모듈 | ESNext |
| JSX | react-jsx |
| 경로 별칭 | `@/*` → `./*` |
| 엄격 모드 | 활성화 |

---

## 데이터 흐름 다이어그램

### 전체 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                        클라이언트 (브라우저)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  React 컴포넌트 │  │ React Hooks  │  │  AuthProvider    │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘    │
│         │                 │                    │              │
│         └─────────────────┼────────────────────┘              │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                 │
│         ▼                 ▼                 ▼                 │
│  Firebase Auth    Firebase Storage   Firestore (Client)      │
└──────────┬────────────────┬─────────────────┬────────────────┘
           │                │                 │
           ▼                ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                     Firebase 서비스                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Authentication│  │   Storage    │  │    Firestore     │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│                                         ┌──────────────────┐ │
│                                         │ Realtime Database │ │
│                                         └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
           ▲                ▲                 ▲
           │                │                 │
┌──────────┴────────────────┴─────────────────┴────────────────┐
│                    Next.js API Routes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Firebase Admin│  │   OpenAI     │  │   Nodemailer     │    │
│  │     SDK      │  │    API       │  │   (Gmail SMTP)   │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              Python Flask 서버 (Cloud Run)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   OpenCV     │  │ scikit-learn │  │  Cloud Storage   │    │
│  │ (비디오 분석) │  │ (SVM 평가)   │  │  (파일 다운/업)   │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### EMT 비디오 분석 흐름

```
사용자                  Next.js API              Firestore            Python 서버
  │                        │                        │                     │
  │── 비디오 업로드 ──────→│                        │                     │
  │  (Firebase Storage)    │                        │                     │
  │                        │── 작업 생성 ──────────→│                     │
  │                        │   (status: 'pending')  │                     │
  │                        │                        │                     │
  │                        │── 분석 요청 ──────────────────────────────→│
  │                        │   (비동기, 백그라운드)   │                     │
  │                        │                        │                     │
  │←── 작업 ID 반환 ──────│                        │                     │
  │                        │                        │                     │
  │                        │                        │   ← Storage에서     │
  │                        │                        │     비디오 다운로드   │
  │                        │                        │                     │
  │                        │                        │   ← 마커 추적       │
  │                        │                        │   ← SVM 평가        │
  │                        │                        │   ← 시각화 생성     │
  │                        │                        │                     │
  │                        │   상태 업데이트 ←──────────────────────────│
  │                        │   (status: 'completed') │                    │
  │                        │                        │                     │
  │── 상태 폴링 ─────────→│                        │                     │
  │  (emt-job-status)      │── 상태 조회 ─────────→│                     │
  │                        │←─ 결과 반환 ──────────│                     │
  │←── 결과 표시 ─────────│                        │                     │
```

### CPX 대화 흐름

```
사용자                  CPX 페이지             /api/cpx/chat          OpenAI API
  │                        │                        │                     │
  │── 시나리오 선택 ──────→│                        │                     │
  │                        │── DOCX 로드 ──────────→│                     │
  │                        │   (/api/cpx/docx-content)                    │
  │                        │←─ 환자 설정 반환 ─────│                     │
  │                        │                        │                     │
  │── 질문 입력 ─────────→│                        │                     │
  │  (텍스트 또는 음성)    │── 대화 전송 ──────────→│                     │
  │                        │                        │── GPT-4o-mini ────→│
  │                        │                        │←─ 환자 응답 ───────│
  │                        │←─ 응답 반환 ──────────│                     │
  │←── 환자 응답 표시 ────│                        │                     │
```

### 비디오 시청 추적 흐름

```
사용자                  CustomVideoPlayer     /api/video/watch-time    Firebase
  │                        │                        │                     │
  │── 비디오 재생 ────────→│                        │                     │
  │                        │── 주기적 시간 전송 ──→│                     │
  │                        │   (10초 간격)          │                     │
  │                        │                        │── Firestore 저장 ─→│
  │                        │                        │   (video_watch_times)│
  │                        │                        │                     │
  │                        │── 80% 달성 ──────────→│                     │
  │                        │                        │── 로그 파일 생성 ──→│
  │                        │                        │   (Storage: log/)   │
  │                        │                        │                     │
  │── 로그아웃 ───────────→│                        │                     │
  │                        │── 시청 시간 저장 ────→│                     │
  │                        │   (save-on-logout)     │── Firestore 저장 ─→│
```

---

## Firestore 컬렉션 스키마

### `users` 컬렉션

사용자 프로필을 저장합니다. (기존 `patients` 컬렉션과 하위 호환 유지)

| 필드 | 타입 | 설명 |
|------|------|------|
| `이메일` | string | 사용자 이메일 (문서 ID로도 사용) |
| `이름` | string | 사용자 이름 |
| `직위` | string | R3, F1, F2, F2C, F2D, FCD 등 |
| `소속` | string | 병원명 |
| `비밀번호` | string | 로그인 비밀번호 |
| `활성상태` | string | 'yes' 또는 'no' |
| `교육자` | string | 'yes' 또는 'no' (강사 여부) |

### `admins` 컬렉션

관리자 이메일 목록을 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 관리자 이메일 (문서 ID) |

### `emtJobs` 컬렉션

EMT 비디오 분석 작업 상태를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | string | 'pending', 'processing', 'completed', 'failed' |
| `videoPath` | string | Firebase Storage 비디오 경로 |
| `version` | string | 'EMT' 또는 'EMT-L' |
| `isAdmin` | boolean | 관리자 모드 여부 |
| `createdAt` | timestamp | 작업 생성 시간 |
| `completedAt` | timestamp | 작업 완료 시간 |
| `result` | string | 'pass' 또는 'fail' |
| `score` | number | SVM decision function 점수 |
| `meanG` | number | 평균 이동 거리 |
| `stdG` | number | 이동 거리 표준편차 |
| `failReasons` | array | 불합격 사유 목록 |
| `visualizationUrl` | string | 시각화 이미지 URL |
| `error` | string | 에러 메시지 (실패 시) |

### `user_sessions` 컬렉션

사용자 세션 정보를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 사용자 이메일 |
| `sessionId` | string | 세션 고유 ID |
| `loginTime` | timestamp | 로그인 시간 |
| `lastActivity` | timestamp | 마지막 활동 시간 |
| `ipAddress` | string | IP 주소 |
| `userAgent` | string | 브라우저 정보 |
| `hostname` | string | 호스트명 |
| `isActive` | boolean | 활성 여부 |

### `video_watch_times` 컬렉션

비디오 시청 시간을 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 사용자 이메일 |
| `videoId` | string | 비디오 식별자 |
| `watchedSeconds` | number | 시청한 시간 (초) |
| `totalDuration` | number | 비디오 전체 길이 (초) |
| `progress` | number | 시청 진행률 (0~1) |
| `lastUpdated` | timestamp | 마지막 업데이트 시간 |
| `completed` | boolean | 시청 완료 여부 (80% 이상) |

### `concurrent_logins` 컬렉션

동시 접속 기록을 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 사용자 이메일 |
| `detectedAt` | timestamp | 감지 시간 |
| `sessions` | array | 동시 활성 세션 목록 |

### 강의 관련 컬렉션

Firestore에 강의 메타데이터가 저장됩니다. 강의 목록은 관리자가 Excel로 일괄 업로드하거나 개별 관리합니다.

---

## Firebase Storage 구조

```
amcgi-bulletin.firebasestorage.app/
│
├── log/                           # 강의 수강 로그 파일
│   └── {이메일}_{강의명}_{날짜}.txt
│
├── log_EGD_Lesion_Dx/             # EGD Lesion Dx 학습 로그
│   └── {이메일}_{이미지명}_{날짜}.txt
│
├── emt_results/                   # EMT 분석 결과 비디오/로그
│   └── {이메일}/
│       └── {날짜}_{파일명}
│
├── mt_results/                    # MT 제출 비디오
│   └── {이메일}/
│       └── {날짜}_{파일명}
│
├── sht_results/                   # SHT 제출 비디오
│   └── {이메일}/
│       └── {날짜}_{파일명}
│
├── lht_results/                   # LHT 제출 비디오
│   └── {이메일}/
│       └── {날짜}_{파일명}
│
├── emt_visualizations/            # EMT 분석 시각화 이미지 (임시, 3시간 후 삭제)
│   └── {작업ID}/
│       └── frame_{번호}.jpg
│
├── templates/                     # EMT 학습 데이터
│   ├── x_train_EMT.csv           # EMT 전문가 학습 데이터
│   └── x_train_EMT-L.csv         # EMT-L 전문가 학습 데이터
│
├── CPX_01.docx ~ CPX_10.docx     # CPX 환자 시나리오 문서
│
├── EGD_Lesion_Dx/                 # EGD Lesion Dx 이미지 및 해설
│   ├── {이미지명}.jpg
│   └── {이미지명}.docx
│
├── PBL/                           # PBL 이미지 자료
│   └── {시나리오명}/
│       └── {이미지명}.jpg
│
├── members/                       # 회원 Excel 파일
│   └── members.xlsx
│
└── login_background/              # 로그인 배경 이미지
    └── background.jpg
```

---

## 인증 및 권한 흐름

### 권한 계층

```
Super Admin (jhlee409@gmail.com)
  │
  ├── 모든 관리 기능 사용 가능
  ├── Primary Admin 삭제 불가능 (자기 자신 보호)
  └── 유일하게 다른 Primary Admin을 삭제할 수 있음
  
Primary Admin (jhlee409@gmail.com, ghlee409@amc.seoul.kr)
  │
  ├── 관리자 추가/삭제
  ├── 콘텐츠 관리
  └── 시스템 관리
  
Admin (Firestore admins 컬렉션)
  │
  ├── 사용자 관리
  ├── 강의 목록 관리
  └── 로그/비디오 삭제
  
Instructor (users.교육자 === 'yes')
  │
  ├── 교육생 조회 (자신의 병원만)
  ├── 리포트 생성
  └── 강사 패널 접근
  
일반 사용자 (users 컬렉션 등록)
  │
  ├── 직위별 교육 과정 접근
  ├── 비디오 시청/업로드
  └── CPX 훈련
```

### 권한 확인 위치

| 레벨 | 확인 위치 | 방식 |
|------|----------|------|
| 페이지 접근 | `app/(admin)/layout.tsx` | `role !== 'admin'` → `/login` 리다이렉트 |
| 콘텐츠 필터링 | `useCategoryFilter` 훅 | 직위별 카테고리 필터링 |
| API 권한 | 각 API Route Handler | `isAdminEmail()` 또는 세션 확인 |
| 강사 확인 | `/api/user/instructor-status` | `users.교육자 === 'yes'` |
| Super Admin | `lib/auth-server.ts` | 하드코딩된 이메일 비교 |

### 코드에 하드코딩된 관리자 정보

변경 시 아래 파일들을 모두 수정해야 합니다:

| 파일 | 상수/변수 | 현재 값 |
|------|----------|---------|
| `lib/auth.ts` | `PRIMARY_ADMIN_EMAILS` | `['jhlee409@gmail.com', 'ghlee409@amc.seoul.kr']` |
| `lib/auth-server.ts` | Super Admin 이메일 | `'jhlee409@gmail.com'` |
| 일부 API Routes | Primary Admin 보호 로직 | `'jhlee409@gmail.com'` |

---

## 개발 시 참고사항

### 새로운 교육 과정 카테고리 추가 시

1. `lib/hooks/useCategoryFilter.ts`에 새 카테고리 접근 규칙 추가
2. `app/(public)/page.tsx`에 새 카테고리 카드 추가
3. Firebase Storage에 관련 콘텐츠 업로드
4. 필요 시 Firestore에 강의 메타데이터 등록

### 새로운 PBL 시나리오 추가 시

1. `components/pbl/`에 새 `PblF2XXPage.tsx` 컴포넌트 생성
2. `app/(public)/courses/[category]/pbl-f2-XX/page.tsx` 라우트 생성
3. `app/(public)/courses/[category]/page.tsx`에서 해당 시나리오 연결

### 새로운 비디오 업로드 유형 추가 시

1. `app/api/{type}-video-upload/route.ts` API 생성
2. `app/api/{type}-send-email/route.ts` 이메일 알림 API 생성
3. `lib/video-upload-utils.ts`에 업로드 로직 추가
4. 관련 페이지에서 `useVideoUpload` 훅 사용

### 환경 변수 추가 시

1. `.env.example`에 새 변수 추가 (문서화)
2. `.env.local`에 실제 값 설정
3. 서버 사이드 변수는 `NEXT_PUBLIC_` 접두사 없이 설정
4. 클라이언트 사이드 변수는 `NEXT_PUBLIC_` 접두사 필수

### Firebase 관련 변경 시

- **Firestore 규칙**: Firebase 콘솔에서 직접 관리
- **Storage 규칙**: Firebase 콘솔에서 직접 관리
- **인덱스**: Firestore 쿼리 시 자동 생성 제안 링크 활용
