# EMT/EMT-L 분석 서버

`app.py`는 Firebase Storage의 제출 영상을 내려받아 분석하는 Flask 서비스입니다. 웹 애플리케이션은 `EMT_ANALYSIS_SERVICE_URL`을 기준 URL로 사용합니다.

## 실행

Python 3.11 환경에서 이 디렉터리의 `requirements.txt`를 설치합니다.

```bash
cd python-server
python -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python app.py
```

Windows에서는 위 마지막 두 명령의 `./.venv/bin/python`을 `.\.venv\Scripts\python.exe`로 바꿉니다. 기본 포트는 8080이며 `PORT` 환경 변수로 바꿀 수 있습니다. Storage 접근에 필요한 Google Cloud 자격 증명은 실행 환경에 별도로 제공해야 합니다.

```bash
curl http://localhost:8080/health
```

## API

| 메서드·경로 | 요청 |
| --- | --- |
| `GET /health` | 서비스 상태 확인 |
| `POST /analyze` | EMT 분석. JSON의 `bucketName`, `videoPath`, `xTrainPath` 필수 |
| `POST /analyze-emtl` | EMT-L 분석. JSON의 `bucketName`, `videoPath` 필수. `xTrainPath` 기본값은 `templates/x_train_EMT-L.csv` |

두 POST 경로는 Firebase Storage 객체 이름을 받습니다. `/analyze`에는 선택적으로 `isAdmin`, `version`, `createVisualization`을, `/analyze-emtl`에는 `isAdmin`, `preprocessMode`, `normalizeViewport`, `roi`를 보낼 수 있습니다. 실제 요청 구성과 응답 처리는 [`lib/emt-analysis.ts`](../lib/emt-analysis.ts)와 [`lib/emt-processor.ts`](../lib/emt-processor.ts)를 참조하세요.

## 컨테이너와 배포

`Dockerfile`은 Python 3.11 이미지를 사용하고 Gunicorn을 `0.0.0.0:8080`에서 실행합니다. 이 폴더에서 컨테이너를 빌드합니다.

```bash
docker build -t aio-gi-emt .
docker run --rm -p 8080:8080 aio-gi-emt
```

배포용 [`deploy.ps1`](deploy.ps1), [`deploy.sh`](deploy.sh), [`cloudbuild.yaml`](cloudbuild.yaml)에는 프로젝트 ID, 리전, 서비스 이름이 지정되어 있습니다. 다른 Firebase/Google Cloud 프로젝트에 배포할 때 이 값을 먼저 확인하세요. 배포한 서비스의 URL은 웹 서버의 `EMT_ANALYSIS_SERVICE_URL`에 설정합니다.
