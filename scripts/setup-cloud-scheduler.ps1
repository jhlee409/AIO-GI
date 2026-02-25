# Cloud Scheduler 설정 스크립트 (PowerShell)
# EMT Visualization 파일 자동 삭제를 위한 Cloud Scheduler 작업 생성

$ErrorActionPreference = "Stop"

# 프로젝트 설정
$PROJECT_ID = "amcgi-bulletin"
$REGION = "asia-northeast3"
$JOB_NAME = "cleanup-emt-visualization"
$SCHEDULE = "0 * * * *"  # 매 시간마다 실행
$TIMEZONE = "Asia/Seoul"

# API URL 설정 (Firebase Hosting 도메인)
# 기본값: Firebase Hosting 기본 도메인
# 실제 도메인으로 변경하거나 환경 변수로 설정 가능
$API_URL = if ($env:CLEANUP_API_URL) { $env:CLEANUP_API_URL } else { "https://amcgi-bulletin.web.app/api/cleanup-emt-visualization" }

# 인증 토큰 (선택사항)
# 환경 변수 CLEANUP_SECRET_TOKEN이 설정되어 있으면 사용
$AUTH_TOKEN = $env:CLEANUP_SECRET_TOKEN

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cloud Scheduler 작업 생성" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "프로젝트 ID: $PROJECT_ID"
Write-Host "지역: $REGION"
Write-Host "작업 이름: $JOB_NAME"
Write-Host "스케줄: $SCHEDULE (매 시간마다)"
Write-Host "타임존: $TIMEZONE"
Write-Host "API URL: $API_URL"
if ($AUTH_TOKEN) {
    Write-Host "인증 토큰: 설정됨 (보안상 표시하지 않음)" -ForegroundColor Green
} else {
    Write-Host "인증 토큰: 설정되지 않음" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# gcloud CLI 확인
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ 오류: gcloud CLI가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "다음 명령어로 설치하세요:"
    Write-Host "  https://cloud.google.com/sdk/docs/install"
    exit 1
}

# 프로젝트 설정
Write-Host "📋 프로젝트 설정 중..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 기존 작업 확인
Write-Host "🔍 기존 작업 확인 중..." -ForegroundColor Yellow
$existingJob = gcloud scheduler jobs describe $JOB_NAME --location=$REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  작업 '$JOB_NAME'이 이미 존재합니다." -ForegroundColor Yellow
    $response = Read-Host "기존 작업을 삭제하고 새로 만들까요? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "🗑️  기존 작업 삭제 중..." -ForegroundColor Yellow
        gcloud scheduler jobs delete $JOB_NAME --location=$REGION --quiet
    } else {
        Write-Host "❌ 작업이 취소되었습니다." -ForegroundColor Red
        exit 1
    }
}

# HTTP 헤더 설정
$headers = "Content-Type=application/json"
if ($AUTH_TOKEN) {
    $headers = "$headers,Authorization=Bearer $AUTH_TOKEN"
}

# Cloud Scheduler 작업 생성
Write-Host "🚀 Cloud Scheduler 작업 생성 중..." -ForegroundColor Yellow
if ($AUTH_TOKEN) {
    # 인증 토큰이 있는 경우
    gcloud scheduler jobs create http $JOB_NAME `
        --location=$REGION `
        --schedule="$SCHEDULE" `
        --uri="$API_URL" `
        --http-method=GET `
        --headers="$headers" `
        --time-zone="$TIMEZONE" `
        --description="EMT visualization files cleanup - deletes files older than 3 hours" `
        --attempt-deadline=300s
} else {
    # 인증 토큰이 없는 경우
    gcloud scheduler jobs create http $JOB_NAME `
        --location=$REGION `
        --schedule="$SCHEDULE" `
        --uri="$API_URL" `
        --http-method=GET `
        --headers="$headers" `
        --time-zone="$TIMEZONE" `
        --description="EMT visualization files cleanup - deletes files older than 3 hours" `
        --attempt-deadline=300s `
        --no-require-oidc
}

Write-Host ""
Write-Host "✅ Cloud Scheduler 작업이 성공적으로 생성되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "작업 정보:"
gcloud scheduler jobs describe $JOB_NAME --location=$REGION --format="table(name,schedule,timeZone,state)"
Write-Host ""
Write-Host "다음 명령어로 작업을 관리할 수 있습니다:"
Write-Host "  - 작업 실행: gcloud scheduler jobs run $JOB_NAME --location=$REGION"
Write-Host "  - 작업 삭제: gcloud scheduler jobs delete $JOB_NAME --location=$REGION"
Write-Host "  - 작업 일시정지: gcloud scheduler jobs pause $JOB_NAME --location=$REGION"
Write-Host "  - 작업 재개: gcloud scheduler jobs resume $JOB_NAME --location=$REGION"
Write-Host ""
