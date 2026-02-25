# Python Server Deployment Script for Cloud Run
# PowerShell version

# Configuration
$PROJECT_ID = "amcgi-bulletin"
$SERVICE_NAME = "emt-video-analysis"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing image to Google Container Registry..." -ForegroundColor Green
docker push $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to Cloud Run..." -ForegroundColor Green
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cloud Run deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "Service URL:" -ForegroundColor Cyan
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
