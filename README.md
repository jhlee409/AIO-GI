# AIO-GI (All-in-one-GI)

상부 소화기 내과 내시경 및 임상 진료 훈련 웹 플랫폼

---

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [기술 스택](#기술-스택)
- [사전 요구사항](#사전-요구사항)
- [설치 및 실행](#설치-및-실행)
- [환경 변수 설정](#환경-변수-설정)
- [배포](#배포)
- [사용자 역할 및 권한](#사용자-역할-및-권한)
- [주요 기능](#주요-기능)
- [프로젝트 구조 요약](#프로젝트-구조-요약)
- [문제 해결 가이드](#문제-해결-가이드)
- [참고사항](#참고사항)

---

## 프로젝트 개요

**AIO-GI**는 서울아산병원 소화기내과에서 사용하는 내시경 교육 통합 플랫폼입니다. 레지던트(R3)부터 펠로우(F1, F2)까지 직위별로 맞춤화된 교육 과정을 제공하며, 비디오 분석을 통한 내시경 조작 품질 평가, AI 기반 환자 병력청취 훈련(CPX), Problem-Based Learning(PBL) 등의 기능을 포함합니다.

### 대상 사용자

| 역할 | 설명 |
|------|------|
| 교육생 (R3, F1, F2) | 내시경 교육 과정을 수강하는 레지던트/펠로우 |
| 강사 (Instructor) | 교육생 성적 조회 및 리포트 생성 |
| 관리자 (Admin) | 사용자·콘텐츠 관리, 시스템 운영 |

---

## 기술 스택

### 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.0.11 | React 기반 풀스택 프레임워크 (App Router) |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | 5.9.3 | 정적 타입 시스템 |
| Tailwind CSS | 3.4.18 | 유틸리티 기반 스타일링 |
| Lucide React | - | 아이콘 라이브러리 |

### 백엔드 (Firebase)

| 기술 | 용도 |
|------|------|
| Firebase Authentication | 사용자 인증 (이메일/비밀번호) |
| Firebase Firestore | NoSQL 데이터베이스 (사용자, 강의, 세션, 로그 등) |
| Firebase Storage | 파일 저장 (비디오, 이미지, 문서, 로그) |
| Firebase Hosting | 웹 앱 배포 |
| Firebase Realtime Database | 인증 삭제/복원 기록 (선택적) |
| Firebase Functions | 서버리스 함수 (Next.js SSR 호스팅) |

### Python 비디오 분석 서버

| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11 | 런타임 |
| Flask | 3.0.0 | 웹 프레임워크 |
| OpenCV | 4.8.1.78 | 비디오 처리 및 마커 추적 |
| scikit-learn | 1.3.2 | OneClassSVM 기반 합격/불합격 판정 |
| Pandas | 2.0.3 | 데이터 처리 |
| Google Cloud Storage | 2.10.0 | Firebase Storage 연동 |
| Gunicorn | 21.2.0 | WSGI 서버 |

### 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `openai` | CPX 기능 (GPT-4o-mini 기반 환자 대화 시뮬레이션) |
| `xlsx` | Excel 파일 읽기/쓰기 (사용자 관리, 리포트) |
| `mammoth` | DOCX 파일 파싱 (교육 자료 표시) |
| `nodemailer` | 이메일 전송 (Gmail SMTP) |
| `ml-matrix` | 행렬 연산 |
| `jspdf` | PDF 생성 |

### 인프라

| 서비스 | 용도 |
|--------|------|
| Google Cloud Run | Python 비디오 분석 서버 호스팅 |
| Google Cloud Build | Python 서버 CI/CD |
| Google Cloud Scheduler | EMT 시각화 파일 주기적 정리 |

---

## 사전 요구사항

- **Node.js** 18.x 이상
- **npm** (Node.js와 함께 설치)
- **Python** 3.11 (EMT 분석 서버 로컬 실행 시)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Google Cloud SDK** (Python 서버 배포 시)
- Firebase 프로젝트 (Firestore, Storage, Authentication 활성화)

---

## 설치 및 실행

### 자동 설정 (권장)

```powershell
# Windows
.\setup.ps1
```

```bash
# Linux / Mac
./setup.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
1. Node.js 버전 확인
2. npm 의존성 설치
3. Python 의존성 설치 (선택)
4. `.env.local` 파일 생성 (없는 경우)
5. `secret/` 디렉토리 생성

### 수동 설정

```bash
# 1. Node.js 의존성 설치
npm install

# 2. 환경 변수 파일 생성
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값 입력

# 3. Firebase Admin SDK 서비스 계정 키 배치
# secret/ 디렉토리에 serviceAccountKey.json 파일 배치
# 또는 환경 변수(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)로 설정

# 4. 개발 서버 실행
npm run dev
```

### 개발 서버 실행

```bash
npm run dev
```

- 포트: `http://localhost:3000` (기본)
- Node.js 메모리: 4GB 할당 (`--max-old-space-size=4096`)

### 프로덕션 빌드

```bash
npm run build   # 빌드 (메모리 8GB 할당)
npm start       # 프로덕션 서버 실행
```

### Python 분석 서버 (로컬 실행)

```bash
cd python-server
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:8080 --workers 2 --timeout 600 app:app
```

---

## 환경 변수 설정

`.env.local` 파일에 아래 환경 변수를 설정합니다. `.env.example` 파일을 참고하세요.

### 필수 - Firebase Client SDK

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase 콘솔에서 확인>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<프로젝트>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<프로젝트 ID>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<프로젝트>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<Sender ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<App ID>
```

### 필수 - Firebase Admin SDK (서버 사이드)

```env
FIREBASE_PROJECT_ID=<프로젝트 ID>
FIREBASE_CLIENT_EMAIL=<서비스 계정 이메일>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> 또는 `secret/` 디렉토리에 `serviceAccountKey.json` 파일을 배치하면 환경 변수 대신 사용됩니다.

### 선택 - 기능별 환경 변수

| 변수 | 기능 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | CPX | OpenAI API 키 (GPT-4o-mini) |
| `PYTHON_CLOUD_RUN_URL` 또는 `EMT_ANALYSIS_SERVICE_URL` | EMT 분석 | Python Cloud Run 서비스 URL |
| `GMAIL_USER` | 이메일 | Gmail 주소 |
| `GMAIL_APP_PASSWORD` | 이메일 | Gmail 앱 비밀번호 |
| `FIREBASE_DATABASE_URL` | Auth 복원 | Realtime Database URL |
| `CLEANUP_AUTH_TOKEN` | 정리 작업 | EMT 시각화 정리 보안 토큰 |

---

## 배포

### Firebase Hosting 배포

```bash
# Hosting만 배포
npm run deploy

# 전체 Firebase 배포 (Hosting + Functions)
npm run deploy:all
```

- 배포 사이트: `amcgi-bulletin.web.app`
- 리전: `asia-northeast3` (서울)
- Functions 메모리: 1024MiB, 타임아웃: 540초

### Python 분석 서버 배포 (Cloud Run)

```powershell
# Windows
.\python-server\deploy.ps1
```

```bash
# Linux / Mac
./python-server/deploy.sh
```

또는 수동으로:

```bash
cd python-server
gcloud builds submit --config cloudbuild.yaml
```

Cloud Run 배포 사양:
- 서비스명: `emt-video-analysis`
- 리전: `asia-northeast3`
- 메모리: 2Gi, CPU: 2
- 타임아웃: 300초
- 최대 인스턴스: 10

### Cloud Scheduler 설정 (EMT 시각화 정리)

```powershell
# Windows
.\scripts\setup-cloud-scheduler.ps1
```

```bash
# Linux / Mac
./scripts/setup-cloud-scheduler.sh
```

- 스케줄: 매 시간마다 (`0 * * * *`)
- 3시간 이상 경과한 시각화 파일 자동 삭제

---

## 사용자 역할 및 권한

### 역할 체계

```
Super Admin (jhlee409@gmail.com)
  └── Primary Admin (jhlee409@gmail.com, ghlee409@amc.seoul.kr)
        └── Admin (Firestore admins 컬렉션에 등록된 사용자)
              └── Instructor (users 컬렉션에서 교육자='yes')
                    └── 일반 사용자 (users 컬렉션에 등록)
```

### 직위별 접근 가능 교육 과정

| 직위 | Basic Course | CPX | Advanced (F1) | Advanced (F2) |
|------|:---:|:---:|:---:|:---:|
| R3 | ✅ | ✅ | ❌ | ❌ |
| F1 | ✅ | ✅ | ✅ | ❌ |
| F2 / F2C / F2D / FCD | ✅ | ✅ | ✅ | ✅ |

### 인증 플로우

1. **로그인**: 이메일/비밀번호 입력 → Firestore에서 사용자 검증 → Firebase Auth 로그인
2. **세션 생성**: 세션 ID 생성 → Firestore `user_sessions`에 저장 → 동시 로그인 감지
3. **자동 로그아웃**: 29분 비활성 시 경고 → 30분 비활성 시 자동 로그아웃
4. **동시 접속 제어**: 동일 계정 동시 로그인 감지 → 관리자에게 이메일 알림

---

## 주요 기능

### 1. 교육 과정 관리

4개 카테고리의 교육 과정을 제공합니다:

- **Basic Course**: 기초 내시경 교육
  - Basic Orientation (비디오 강의)
  - Memory Training (MT) - 비디오 제출
  - Scope Handling Training (SHT) - 비디오 제출
  - EGD Method Training (EMT) - 비디오 분석
- **CPX**: AI 기반 환자 병력청취 훈련 (10개 시나리오)
- **Advanced Course for F1**: F1 상급과정 (진단 EUS, 치료 내시경, NVUGIB)
- **Advanced Course for F2**: F2 상급과정 (진단 EUS, EGD Lesion Dx, PBL)

### 2. EMT 비디오 분석

내시경 조작 비디오를 업로드하면 자동으로 품질을 평가합니다.

**EMT (기본)**:
- 녹색 마커 추적 → 이동 거리/표준편차 계산 → OneClassSVM으로 평가
- 합격 기준: 5분~5분30초 길이, SVM 점수 ≥ 0
- 결과: 합격/불합격, 점수, 평균 이동거리, 표준편차

**EMT-L (고급)**:
- KLT 특징점 추적 → 10개 운동학적 특징 추출 → OneClassSVM으로 평가
- 추출 특징: 평균속도, 속도변동계수, 가속도표준편차, 저크표준편차, 미세수정빈도, 떨림에너지비율 등
- Z-score 기반 불합격 사유 상세 분석

### 3. CPX (환자 병력청취 훈련)

- OpenAI GPT-4o-mini 기반 대화형 시뮬레이션
- 10개 환자 시나리오 (CPX_01 ~ CPX_10)
- 음성 입력 지원 (Web Speech API)
- 교육 자료는 Firebase Storage의 DOCX 파일로 관리

### 4. EGD Lesion Dx (병변 진단 훈련)

- 증례 사진 + 해설 형태의 훈련
- Firebase Storage에서 이미지/문서 로드
- 학습 후 로그 기록

### 5. PBL (Problem-Based Learning)

- 14개 시나리오 (PBL F2-01 ~ F2-14)
- 대화형 학습 인터페이스
- 단계별 진행

### 6. 강사 기능

- 병원/직위별 교육생 필터링
- 카테고리별 강의 선택
- Excel 형식 성적 리포트 생성 및 다운로드

### 7. 관리자 기능

- 사용자 관리 (Excel 일괄 등록, 개별 추가/삭제)
- 강의 목록 관리 (Excel 업로드)
- Firebase Auth ↔ Firestore 동기화
- 로그 파일/제출 비디오 일괄 삭제
- 강사 로그인 이력 조회
- 동시 접속 관리

### 8. 비디오 시청 추적

- 비디오 시청 시간 실시간 추적
- 80% 이상 시청 시 자동 로그 생성
- 로그아웃 시 진행 중인 시청 시간 저장

---

## 프로젝트 구조 요약

```
AIO-GI/
├── app/                    # Next.js App Router (페이지 + API)
│   ├── (admin)/            # 관리자 전용 페이지
│   ├── (public)/           # 일반 사용자 페이지
│   ├── api/                # API 엔드포인트 (50+ 라우트)
│   └── login/              # 로그인 페이지
├── components/             # React 컴포넌트 (30+)
│   ├── admin/              # 관리자 UI 컴포넌트
│   ├── common/             # 공통 UI 컴포넌트
│   ├── pbl/                # PBL 시나리오 컴포넌트 (14개)
│   └── viewers/            # 미디어 뷰어 컴포넌트
├── lib/                    # 유틸리티 및 라이브러리
│   └── hooks/              # React 커스텀 훅 (15+)
├── types/                  # TypeScript 타입 정의
├── python-server/          # Python Flask 비디오 분석 서버
├── scripts/                # 배포 및 유틸리티 스크립트
├── secret/                 # 비밀 파일 (gitignore 대상)
└── public/                 # 정적 에셋 (폰트, 아이콘)
```

> 상세 구조는 [Project_structure.md](./Project_structure.md)를 참고하세요.

---

## 문제 해결 가이드

### 빌드 시 메모리 부족

```bash
# 메모리 할당 늘리기 (기본 8GB)
node --max-old-space-size=12288 ./node_modules/.bin/next build
```

### Firebase Admin SDK 초기화 실패

1. `secret/` 디렉토리에 `serviceAccountKey.json` 파일이 있는지 확인
2. 또는 `.env.local`에 `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`가 올바르게 설정되어 있는지 확인
3. `FIREBASE_PRIVATE_KEY`의 `\n` 이스케이프가 올바른지 확인

### EMT 분석이 작동하지 않는 경우

1. `.env.local`에 `PYTHON_CLOUD_RUN_URL` 또는 `EMT_ANALYSIS_SERVICE_URL`이 설정되어 있는지 확인
2. Cloud Run 서비스가 정상 실행 중인지 확인: `curl <CLOUD_RUN_URL>/health`
3. Firebase Storage에 학습 데이터(`templates/x_train_EMT.csv`, `templates/x_train_EMT-L.csv`)가 업로드되어 있는지 확인

### CPX가 작동하지 않는 경우

1. `.env.local`에 `OPENAI_API_KEY`가 설정되어 있는지 확인
2. API 키에 GPT-4o-mini 접근 권한이 있는지 확인
3. Firebase Storage에 CPX DOCX 파일(`CPX_01.docx` ~ `CPX_10.docx`)이 업로드되어 있는지 확인

### Windows에서 symlink 관련 오류

`next.config.ts`에 이미 Windows/OneDrive symlink 이슈 해결 설정이 포함되어 있습니다. 문제가 지속되면 OneDrive 동기화 폴더 외부로 프로젝트를 이동하세요.

### 이메일 전송 실패

1. `.env.local`에 `GMAIL_USER`, `GMAIL_APP_PASSWORD`가 설정되어 있는지 확인
2. Gmail 계정에서 2단계 인증 활성화 후 앱 비밀번호를 생성하여 사용

---

## 참고사항

- **Firebase 프로젝트 ID**: `amcgi-bulletin`
- **호스팅 URL**: `amcgi-bulletin.web.app`
- **Cloud Run 리전**: `asia-northeast3` (서울)
- **Super Admin**: `jhlee409@gmail.com` (코드에 하드코딩, 변경 시 `lib/auth.ts`, `lib/auth-server.ts` 수정 필요)
- **파일 업로드 크기 제한**: 250MB (`next.config.ts`에서 설정)
- **비디오 분석 타임아웃**: 300초 (Cloud Run), 600초 (Gunicorn)
