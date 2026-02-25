# deploy-debug.txt 분석 결과 USER_PROJECT_DENIED 오류 해결용 스크립트
# "Project 'projects/projects/amcgi-bulletin' not found" 오류는
# 쿼터 프로젝트가 설정되지 않아 발생합니다.

$ErrorActionPreference = "Stop"
$ProjectId = "amcgi-bulletin"

Write-Host "1. gcloud 프로젝트 설정: $ProjectId" -ForegroundColor Cyan
gcloud config set project $ProjectId

Write-Host "2. Application Default Credentials 쿼터 프로젝트 설정..." -ForegroundColor Cyan
gcloud auth application-default set-quota-project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   (이미 설정됐거나, 먼저 'gcloud auth application-default login' 실행 필요)" -ForegroundColor Yellow
}

Write-Host "3. GOOGLE_CLOUD_QUOTA_PROJECT 환경 변수 설정 후 firebase deploy 실행" -ForegroundColor Cyan
$env:GOOGLE_CLOUD_QUOTA_PROJECT = $ProjectId
firebase deploy
