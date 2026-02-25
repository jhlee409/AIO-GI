#!/bin/bash

# ============================================
# UGI Education Program - 자동 설정 스크립트
# ============================================
# 이 스크립트는 프로젝트를 처음 설정할 때 필요한 작업을 자동화합니다.

set -e  # 오류 발생 시 스크립트 중단

echo "============================================"
echo "UGI Education Program - 프로젝트 설정 시작"
echo "============================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Node.js 버전 확인
echo -e "${YELLOW}[1/6] Node.js 버전 확인 중...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo "Node.js 18.x 이상을 설치해주세요: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18.x 이상이 필요합니다. 현재 버전: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 버전: $(node -v)${NC}"
echo ""

# npm 버전 확인
echo -e "${YELLOW}[2/6] npm 버전 확인 중...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm 버전: $(npm -v)${NC}"
echo ""

# Node.js 의존성 설치
echo -e "${YELLOW}[3/6] Node.js 의존성 설치 중...${NC}"
echo "이 작업은 몇 분이 걸릴 수 있습니다..."
npm install
echo -e "${GREEN}✅ Node.js 의존성 설치 완료${NC}"
echo ""

# Python 확인 (선택사항)
echo -e "${YELLOW}[4/6] Python 확인 중 (선택사항)...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    echo -e "${GREEN}✅ Python 버전: $PYTHON_VERSION${NC}"
    
    # Python 의존성 설치 여부 확인
    read -p "Python 의존성도 설치하시겠습니까? (EMT 분석 기능 사용 시 필요) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "python-server/requirements.txt" ]; then
            echo -e "${YELLOW}Python 의존성 설치 중...${NC}"
            pip3 install -r python-server/requirements.txt
            echo -e "${GREEN}✅ Python 의존성 설치 완료${NC}"
        else
            echo -e "${YELLOW}⚠️  python-server/requirements.txt 파일을 찾을 수 없습니다.${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Python이 설치되어 있지 않습니다. (EMT 분석 기능 사용 시 필요)${NC}"
fi
echo ""

# .env.local 파일 확인 및 생성
echo -e "${YELLOW}[5/6] 환경 변수 파일 확인 중...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}.env.local 파일이 없습니다. .env.example에서 생성합니다...${NC}"
        cp .env.example .env.local
        echo -e "${GREEN}✅ .env.local 파일이 생성되었습니다.${NC}"
        echo -e "${YELLOW}⚠️  중요: .env.local 파일을 열어서 실제 값으로 채워주세요!${NC}"
    else
        echo -e "${RED}❌ .env.example 파일을 찾을 수 없습니다.${NC}"
    fi
else
    echo -e "${GREEN}✅ .env.local 파일이 이미 존재합니다.${NC}"
fi
echo ""

# secret 디렉토리 확인
echo -e "${YELLOW}[6/6] secret 디렉토리 확인 중...${NC}"
if [ ! -d "secret" ]; then
    echo -e "${YELLOW}secret 디렉토리를 생성합니다...${NC}"
    mkdir -p secret
    echo -e "${GREEN}✅ secret 디렉토리가 생성되었습니다.${NC}"
    echo -e "${YELLOW}⚠️  중요: secret/ 디렉토리에 Firebase Admin SDK 키 파일을 배치해주세요!${NC}"
else
    echo -e "${GREEN}✅ secret 디렉토리가 이미 존재합니다.${NC}"
fi
echo ""

# 완료 메시지
echo "============================================"
echo -e "${GREEN}✅ 프로젝트 설정이 완료되었습니다!${NC}"
echo "============================================"
echo ""
echo "다음 단계:"
echo "1. .env.local 파일을 열어서 Firebase 및 기타 API 키를 설정하세요"
echo "2. secret/ 디렉토리에 Firebase Admin SDK 키 파일을 배치하세요"
echo "3. 개발 서버를 실행하세요: npm run dev"
echo ""
echo "자세한 설정 방법은 README.md를 참조하세요."
