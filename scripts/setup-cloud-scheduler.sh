#!/bin/bash

# Cloud Scheduler 설정 스크립트
# EMT Visualization 파일 자동 삭제를 위한 Cloud Scheduler 작업 생성

set -e

# 프로젝트 설정
PROJECT_ID="amcgi-bulletin"
REGION="asia-northeast3"
JOB_NAME="cleanup-emt-visualization"
SCHEDULE="0 * * * *"  # 매 시간마다 실행
TIMEZONE="Asia/Seoul"

# API URL 설정 (Firebase Hosting 도메인)
# 기본값: Firebase Hosting 기본 도메인
# 실제 도메인으로 변경하거나 환경 변수로 설정 가능
API_URL="${CLEANUP_API_URL:-https://amcgi-bulletin.web.app/api/cleanup-emt-visualization}"

# 인증 토큰 (선택사항)
# 환경 변수 CLEANUP_SECRET_TOKEN이 설정되어 있으면 사용
AUTH_TOKEN="${CLEANUP_SECRET_TOKEN:-}"

echo "=========================================="
echo "Cloud Scheduler 작업 생성"
echo "=========================================="
echo "프로젝트 ID: $PROJECT_ID"
echo "지역: $REGION"
echo "작업 이름: $JOB_NAME"
echo "스케줄: $SCHEDULE (매 시간마다)"
echo "타임존: $TIMEZONE"
echo "API URL: $API_URL"
echo "인증 토큰: ${AUTH_TOKEN:+설정됨 (보안상 표시하지 않음)}"
echo "=========================================="
echo ""

# gcloud CLI 확인
if ! command -v gcloud &> /dev/null; then
    echo "❌ 오류: gcloud CLI가 설치되어 있지 않습니다."
    echo "다음 명령어로 설치하세요:"
    echo "  https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 프로젝트 설정
echo "📋 프로젝트 설정 중..."
gcloud config set project $PROJECT_ID

# 기존 작업 확인
echo "🔍 기존 작업 확인 중..."
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &> /dev/null; then
    echo "⚠️  작업 '$JOB_NAME'이 이미 존재합니다."
    read -p "기존 작업을 삭제하고 새로 만들까요? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  기존 작업 삭제 중..."
        gcloud scheduler jobs delete $JOB_NAME --location=$REGION --quiet
    else
        echo "❌ 작업이 취소되었습니다."
        exit 1
    fi
fi

# HTTP 헤더 설정
HEADERS="Content-Type=application/json"
if [ -n "$AUTH_TOKEN" ]; then
    HEADERS="$HEADERS,Authorization=Bearer $AUTH_TOKEN"
fi

# Cloud Scheduler 작업 생성
echo "🚀 Cloud Scheduler 작업 생성 중..."
if [ -n "$AUTH_TOKEN" ]; then
    # 인증 토큰이 있는 경우
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --schedule="$SCHEDULE" \
        --uri="$API_URL" \
        --http-method=GET \
        --headers="$HEADERS" \
        --time-zone="$TIMEZONE" \
        --description="EMT visualization files cleanup - deletes files older than 3 hours" \
        --attempt-deadline=300s
else
    # 인증 토큰이 없는 경우
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --schedule="$SCHEDULE" \
        --uri="$API_URL" \
        --http-method=GET \
        --headers="$HEADERS" \
        --time-zone="$TIMEZONE" \
        --description="EMT visualization files cleanup - deletes files older than 3 hours" \
        --attempt-deadline=300s \
        --no-require-oidc
fi

echo ""
echo "✅ Cloud Scheduler 작업이 성공적으로 생성되었습니다!"
echo ""
echo "작업 정보:"
gcloud scheduler jobs describe $JOB_NAME --location=$REGION --format="table(name,schedule,timeZone,state)"
echo ""
echo "다음 명령어로 작업을 관리할 수 있습니다:"
echo "  - 작업 실행: gcloud scheduler jobs run $JOB_NAME --location=$REGION"
echo "  - 작업 삭제: gcloud scheduler jobs delete $JOB_NAME --location=$REGION"
echo "  - 작업 일시정지: gcloud scheduler jobs pause $JOB_NAME --location=$REGION"
echo "  - 작업 재개: gcloud scheduler jobs resume $JOB_NAME --location=$REGION"
echo ""
