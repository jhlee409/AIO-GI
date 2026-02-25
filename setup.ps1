# ============================================
# UGI Education Program - 자동 설정 스크립트 (Windows)
# ============================================
# 이 스크립트는 프로젝트를 처음 설정할 때 필요한 작업을 자동화합니다.

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "UGI Education Program - 프로젝트 설정 시작" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Node.js 버전 확인
Write-Host "[1/6] Node.js 버전 확인 중..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeMajorVersion -lt 18) {
        Write-Host "❌ Node.js 18.x 이상이 필요합니다. 현재 버전: $nodeVersion" -ForegroundColor Red
        Write-Host "Node.js를 설치해주세요: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Node.js 버전: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "Node.js 18.x 이상을 설치해주세요: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# npm 버전 확인
Write-Host "[2/6] npm 버전 확인 중..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm 버전: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm이 설치되어 있지 않습니다." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Node.js 의존성 설치
Write-Host "[3/6] Node.js 의존성 설치 중..." -ForegroundColor Yellow
Write-Host "이 작업은 몇 분이 걸릴 수 있습니다..." -ForegroundColor Gray
try {
    npm install
    Write-Host "✅ Node.js 의존성 설치 완료" -ForegroundColor Green
}
catch {
    Write-Host "❌ 의존성 설치 중 오류가 발생했습니다." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Python 확인 (선택사항)
Write-Host "[4/6] Python 확인 중 (선택사항)..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python 버전: $pythonVersion" -ForegroundColor Green
    
    $installPython = Read-Host "Python 의존성도 설치하시겠습니까? (EMT 분석 기능 사용 시 필요) [y/N]"
    if ($installPython -eq "y" -or $installPython -eq "Y") {
        if (Test-Path "python-server\requirements.txt") {
            Write-Host "Python 의존성 설치 중..." -ForegroundColor Yellow
            pip install -r python-server\requirements.txt
            Write-Host "✅ Python 의존성 설치 완료" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  python-server\requirements.txt 파일을 찾을 수 없습니다." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "⚠️  Python이 설치되어 있지 않습니다. (EMT 분석 기능 사용 시 필요)" -ForegroundColor Yellow
}
Write-Host ""

# .env.local 파일 확인 및 생성
Write-Host "[5/6] 환경 변수 파일 확인 중..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Write-Host ".env.local 파일이 없습니다. .env.example에서 생성합니다..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ .env.local 파일이 생성되었습니다." -ForegroundColor Green
        Write-Host "⚠️  중요: .env.local 파일을 열어서 실제 값으로 채워주세요!" -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ .env.example 파일을 찾을 수 없습니다." -ForegroundColor Red
    }
}
else {
    Write-Host "✅ .env.local 파일이 이미 존재합니다." -ForegroundColor Green
}
Write-Host ""

# secret 디렉토리 확인
Write-Host "[6/6] secret 디렉토리 확인 중..." -ForegroundColor Yellow
if (-not (Test-Path "secret")) {
    Write-Host "secret 디렉토리를 생성합니다..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "secret" | Out-Null
    Write-Host "✅ secret 디렉토리가 생성되었습니다." -ForegroundColor Green
    Write-Host "⚠️  중요: secret\ 디렉토리에 Firebase Admin SDK 키 파일을 배치해주세요!" -ForegroundColor Yellow
}
else {
    Write-Host "✅ secret 디렉토리가 이미 존재합니다." -ForegroundColor Green
}
Write-Host ""

# 완료 메시지
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ 프로젝트 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:"
Write-Host "1. .env.local 파일을 열어서 Firebase 및 기타 API 키를 설정하세요"
Write-Host "2. secret\ 디렉토리에 Firebase Admin SDK 키 파일을 배치하세요"
Write-Host "3. 개발 서버를 실행하세요: npm run dev"
Write-Host ""
Write-Host "자세한 설정 방법은 README.md를 참조하세요."
