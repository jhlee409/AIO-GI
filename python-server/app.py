"""
EMT Video Analysis Server
Flask server for analyzing EMT videos using OpenCV and scikit-learn
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from sklearn import svm
from sklearn.preprocessing import MinMaxScaler
import json
import os
import tempfile
from google.cloud import storage
import logging
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Initialize Google Cloud Storage client
storage_client = storage.Client()


def download_from_storage(bucket_name: str, source_path: str, destination_path: str):
    """Download file from Firebase Storage"""
    try:
        logging.info(f"Attempting to download gs://{bucket_name}/{source_path}")
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(source_path)
        
        # Check if file exists
        if not blob.exists():
            raise FileNotFoundError(f"File not found: gs://{bucket_name}/{source_path}")
        
        blob.download_to_filename(destination_path)
        logging.info(f"Downloaded {source_path} to {destination_path}")
        
        # Verify file was downloaded
        if not os.path.exists(destination_path):
            raise FileNotFoundError(f"Download failed: file not found at {destination_path}")
        
        file_size = os.path.getsize(destination_path)
        logging.info(f"File size: {file_size} bytes")
    except Exception as e:
        logging.error(f"Error downloading from storage: {e}", exc_info=True)
        raise


def upload_to_storage(bucket_name: str, destination_path: str, file_data: bytes, content_type: str = 'image/jpeg'):
    """Upload file to Firebase Storage"""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_path)
        blob.upload_from_string(file_data, content_type=content_type)
        
        # Make public and get URL
        blob.make_public()
        url = blob.public_url
        logging.info(f"Uploaded to gs://{bucket_name}/{destination_path}")
        return url
    except Exception as e:
        logging.error(f"Error uploading to storage: {e}", exc_info=True)
        raise


def analyze_video(video_path: str, x_train_path: str, is_admin: bool = False, version: str = 'EMT', create_visualization: bool = True, bucket_name: str = None, visualization_base_path: str = None):
    """Analyze video using OpenCV and scikit-learn"""
    # Open video
    camera = cv2.VideoCapture(video_path)
    if not camera.isOpened():
        raise ValueError("동영상 파일을 열 수 없습니다.")

    length = int(camera.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_rate = camera.get(cv2.CAP_PROP_FPS)
    duration = length / frame_rate
    width = int(camera.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(camera.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Validate duration (버전별 검증 기준 적용, 관리자는 검증 건너뛰기)
    # 버전 정보 정규화
    version_normalized = str(version).strip().upper() if version else 'EMT'
    min_duration = 190 if version_normalized == 'EMT-L' else 300  # EMT-L: 3분10초 ~ 3분30초 / EMT: 5분 ~ 5분30초
    max_duration = 210 if version_normalized == 'EMT-L' else 330  # EMT-L: 3분30초
    range_text = '3분10초에서 3분30초' if version_normalized == 'EMT-L' else '5분에서 5분30초'
    
    # 관리자 모드가 아니어도 항상 로그 출력
    logging.info(f"Video duration validation: version={version} (normalized={version_normalized}), duration={duration:.2f}s, min={min_duration}s, max={max_duration}s, isAdmin={is_admin}")
    
    if not is_admin:
        if not (min_duration <= duration <= max_duration):
            minutes = int(duration // 60)
            seconds = int(duration % 60)
            error_msg = f"동영상의 길이가 {range_text}를 벗어납니다. 현재: {minutes}분 {seconds}초"
            logging.warning(f"Duration validation failed: {error_msg} (version={version}, normalized={version_normalized}, duration={duration:.2f}s, expected range: {min_duration}-{max_duration}s)")
            raise ValueError(error_msg)
    else:
        # 관리자 모드에서는 검증은 건너뛰지만 로그는 출력
        if not (min_duration <= duration <= max_duration):
            minutes = int(duration // 60)
            seconds = int(duration % 60)
            logging.info(f"Admin mode: Duration validation would fail but skipped (version={version_normalized}, duration={duration:.2f}s ({minutes}분 {seconds}초), expected range: {min_duration}-{max_duration}s ({range_text}))")
        else:
            logging.info(f"Admin mode: Duration validation passed (version={version_normalized}, duration={duration:.2f}s, expected range: {min_duration}-{max_duration}s)")

    # Process frames
    pts = []
    frame_count = 0
    detected_frames = 0
    # 마커 검출 정보 저장: {frame_number: (center_x, center_y, radius)}
    marker_detections = {}

    while True:
        ret, frame = camera.read()
        if not ret:
            break

        frame_count += 1

        try:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

            green_lower = np.array([40, 40, 40], np.uint8)
            green_upper = np.array([80, 255, 255], np.uint8)
            green = cv2.inRange(hsv, green_lower, green_upper)

            # 노이즈 제거를 위한 모폴로지 연산
            kernel = np.ones((5, 5), np.uint8)
            green = cv2.morphologyEx(green, cv2.MORPH_OPEN, kernel)
            green = cv2.morphologyEx(green, cv2.MORPH_CLOSE, kernel)

            # 윤곽선 검출
            contours, hierarchy = cv2.findContours(green, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # 크기가 200-8000 픽셀 사이인 윤곽선만 필터링
            filtered_contours = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if 200 <= area <= 8000:
                    filtered_contours.append(contour)

            if len(filtered_contours) > 0:
                # 가장 큰 윤곽선 찾기
                c = max(filtered_contours, key=cv2.contourArea)

                u = c
                pts.extend([frame_count, 2])
                detected_frames += 1

                M = cv2.moments(u)
                if M["m00"] != 0:
                    px = abs(int(M["m10"] / M["m00"]))
                    py = abs(int(M["m01"] / M["m00"]))
                else:
                    px, py = 0, 0

                pts.extend([px, py])

                ((cx, cy), radius) = cv2.minEnclosingCircle(u)
                pts.append(int(radius))
                
                # 마커 검출 정보 저장 (시각화용)
                if create_visualization:
                    marker_detections[frame_count] = (int(cx), int(cy), int(radius))
            else:
                # 감지된 물체가 없는 경우
                pts.extend([frame_count, 3, 0, 0, 0])
        except Exception as e:
            logging.warning(f"Error processing frame {frame_count}: {e}")
            continue

    camera.release()

    # Process points
    k = list(pts)
    array_k = np.array(k)

    frame_no = array_k[0::5]
    timesteps = len(frame_no)
    frame_no2 = np.reshape(frame_no, (timesteps, 1))

    color = array_k[1::5]
    color2 = np.reshape(color, (timesteps, 1))

    x_value = array_k[2::5]
    x_value2 = np.reshape(x_value, (timesteps, 1))

    y_value = array_k[3::5]
    y_value2 = np.reshape(y_value, (timesteps, 1))

    radius2 = array_k[4::5]
    radius3 = np.reshape(radius2, (timesteps, 1))

    points = np.hstack([frame_no2, color2, x_value2, y_value2, radius3])

    # 프레임 레이트를 이용한 시간 간격 계산 (초 단위)
    time_interval = 1.0 / frame_rate

    # 초당 이동거리 계산을 위한 배열
    distance_g = np.array([])

    for i in range(timesteps - 1):
        if (points[i][1] != 3 and points[i + 1][1] != 3) and (points[i][1] == 2 and points[i + 1][1] == 2):
            a = points[i + 1][2] - points[i][2]
            b = points[i + 1][3] - points[i][3]
            rr = points[i][4]

            # 초당 이동거리로 계산
            delta_g = (np.sqrt((a * a) + (b * b))) / rr / time_interval

            distance_g = np.append(distance_g, delta_g)
        else:
            distance_g = np.append(distance_g, 0)

    # 초당 이동거리의 평균과 표준편차 계산
    threshold = 180

    mean_g = np.mean([ggg for ggg in distance_g if ggg < threshold])
    std_g = np.std([ggg for ggg in distance_g if ggg < threshold])
    x_test = np.array([[mean_g, std_g]])

    # Load training data
    x_train = np.loadtxt(x_train_path, delimiter=',')

    # Normalize
    np.random.seed(42)
    scaler = MinMaxScaler(feature_range=(0, 1))
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    # SVM model
    clf = svm.OneClassSVM(nu=0.1, kernel="rbf", gamma=0.1)
    clf.fit(x_train_scaled)

    y_pred_test = clf.predict(x_test_scaled)
    score = float(clf.decision_function(x_test_scaled)[0])
    # 점수(decision_function)가 0 이상이어야 합격
    # OneClassSVM에서 decision_function 값이 음수면 이상치로 판단됨
    passed = y_pred_test[0] == 1 and score >= 0

    # Generate detailed failure reason
    failure_reason = ""
    if not passed:
        reasons = []

        # Score-based reason
        if score < -0.5:
            reason1 = f"판단 점수가 매우 낮습니다 (점수: {score:.4f}, 기준: -0.5 이상). EGD 수행의 품질이 기준에 미치지 못합니다."
            reasons.append(reason1)
        elif score < 0:
            reason2 = f"판단 점수가 기준 미만입니다 (점수: {score:.4f}, 기준: 0 이상). EGD 수행이 모범 사례와 차이가 있습니다."
            reasons.append(reason2)

        # Mean G analysis
        if mean_g < 0.1:
            reason3 = f"평균 이동 거리(Mean G)가 너무 작습니다 ({mean_g:.4f}). 스코프 조작이 충분하지 않았습니다."
            reasons.append(reason3)
        elif mean_g > 3.0:
            reason4 = f"평균 이동 거리(Mean G)가 너무 큽니다 ({mean_g:.4f}). 스코프 조작이 과도하거나 불안정합니다."
            reasons.append(reason4)

        # Std G analysis
        if std_g < 0.1:
            reason5 = f"이동 거리 표준편차(Std G)가 너무 작습니다 ({std_g:.4f}). 스코프 조작의 일관성이 부족합니다."
            reasons.append(reason5)
        elif std_g > 2.0:
            reason6 = f"이동 거리 표준편차(Std G)가 너무 큽니다 ({std_g:.4f}). 스코프 조작이 불규칙하고 불안정합니다."
            reasons.append(reason6)

        # Detection rate analysis
        detection_rate = (detected_frames / frame_count) * 100 if frame_count > 0 else 0
        if detection_rate < 30:
            reason7 = f"녹색 마커 검출률이 낮습니다 ({detection_rate:.1f}%). 스코프 위치가 적절하지 않았거나 카메라 각도에 문제가 있을 수 있습니다."
            reasons.append(reason7)

        if len(reasons) == 0:
            failure_reason = f"판단 점수가 기준 미만입니다 (점수: {score:.4f})."
        else:
            failure_reason = "\n".join(reasons)

        detail_msg = f"\n\n상세 분석 결과:\n- 판단 점수: {score:.4f}\n- 평균 이동 거리(Mean G): {mean_g:.4f}\n- 이동 거리 표준편차(Std G): {std_g:.4f}\n- 검출된 프레임 수: {detected_frames}/{frame_count:.0f} ({detection_rate:.1f}%)"
        failure_reason += detail_msg

    if passed:
        message = "EGD 수행이 적절하게 진행되어 EMT 과정에서 합격하셨습니다. 수고하셨습니다."
    else:
        message = "EGD 수행이 적절하게 진행되지 못해 불합격입니다.\n\n불합격 사유:\n" + failure_reason

    result = {
        "passed": bool(passed),
        "score": float(score),
        "duration": float(duration),
        "meanG": float(mean_g),
        "stdG": float(std_g),
        "message": message,
        "failureReason": failure_reason if not passed else None,
        "detectedFrames": int(detected_frames),
        "totalFrames": int(frame_count),
        "visualizationUrls": []  # 기본값으로 빈 배열 설정
    }
    
    # 마커 검출 시각화 이미지 생성 (1초에 3프레임 샘플링)
    visualization_urls = []
    if create_visualization:
        if not bucket_name:
            logging.warning("Cannot create visualization: bucket_name is missing")
            result["visualizationUrls"] = []
        elif not visualization_base_path:
            logging.warning("Cannot create visualization: visualization_base_path is missing")
            result["visualizationUrls"] = []
        elif len(marker_detections) == 0:
            logging.warning("Cannot create visualization: no marker detections found")
            result["visualizationUrls"] = []
        else:
            try:
                # 1초에 3프레임 샘플링: frame_rate가 30fps라면 10프레임마다 1프레임
                sample_interval = max(1, int(frame_rate / 3))  # 1초에 3프레임
                logging.info(f"Creating visualization: sample_interval={sample_interval}, total_frames={frame_count}, detected_frames={len(marker_detections)}, bucket_name={bucket_name}, visualization_base_path={visualization_base_path}")
                
                # 동영상을 다시 읽어서 샘플링된 프레임에 마커 표시
                camera2 = cv2.VideoCapture(video_path)
                if not camera2.isOpened():
                    logging.error(f"Failed to open video for visualization: {video_path}")
                    result["visualizationUrls"] = []
                else:
                    frame_idx = 0
                    sample_count = 0
                    
                    while True:
                        ret, frame = camera2.read()
                        if not ret:
                            break
                        
                        frame_idx += 1
                        
                        # 샘플링: 1초에 3프레임
                        if frame_idx % sample_interval == 0:
                            # 마커가 검출된 프레임인지 확인
                            if frame_idx in marker_detections:
                                cx, cy, radius = marker_detections[frame_idx]
                                # 50픽셀 빨간색 원 그리기
                                cv2.circle(frame, (cx, cy), 50, (0, 0, 255), 2)  # BGR 형식: 빨간색
                                # 마커 중심점도 표시
                                cv2.circle(frame, (cx, cy), 3, (0, 0, 255), -1)
                            
                            # 프레임 번호와 시간 정보 추가
                            time_sec = frame_idx / frame_rate
                            minutes = int(time_sec // 60)
                            seconds = int(time_sec % 60)
                            time_text = f"Frame: {frame_idx} | Time: {minutes:02d}:{seconds:02d}"
                            cv2.putText(frame, time_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                            
                            # 마커 검출 여부 표시
                            if frame_idx in marker_detections:
                                cv2.putText(frame, "Marker Detected", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                            
                            # 이미지로 변환 (JPEG)
                            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                            image_data = buffer.tobytes()
                            
                            # Firebase Storage에 업로드
                            image_filename = f"{visualization_base_path}/frame_{frame_idx:06d}.jpg"
                            try:
                                image_url = upload_to_storage(bucket_name, image_filename, image_data, 'image/jpeg')
                                visualization_urls.append({
                                    "frame": frame_idx,
                                    "time": time_sec,
                                    "url": image_url,
                                    "hasMarker": frame_idx in marker_detections
                                })
                                sample_count += 1
                            except Exception as e:
                                logging.warning(f"Failed to upload visualization frame {frame_idx}: {e}", exc_info=True)
                    
                    camera2.release()
                    result["visualizationUrls"] = visualization_urls
                    logging.info(f"Created {len(visualization_urls)} visualization frames (uploaded {sample_count} frames)")
            except Exception as e:
                logging.error(f"Failed to create visualization: {e}", exc_info=True)
                result["visualizationUrls"] = []
    else:
        logging.info("Visualization creation is disabled")
        result["visualizationUrls"] = []

    return result


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route('/analyze-emtl', methods=['POST'])
def analyze_emtl():
    """
    EMT-L only: analyze video using x_train_EMT-L.csv (test path only).
    Independent from /analyze (EMT). Same Docker, separate endpoint.
    """
    try:
        data = request.json
        if not data:
            logging.error("[EMT-L] No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400

        bucket_name = data.get('bucketName')
        video_path = data.get('videoPath')
        x_train_path = data.get('xTrainPath', 'templates/x_train_EMT-L.csv')
        is_admin = data.get('isAdmin', False)
        roi = data.get('roi')  # optional [x1, y1, x2, y2]; default CV 290 in emt_l_analysis

        logging.info(f"[EMT-L] Request: bucketName={bucket_name}, videoPath={video_path}, xTrainPath={x_train_path}, roi={roi}")

        if not bucket_name or not video_path:
            return jsonify({"error": "Missing required fields: bucketName, videoPath"}), 400

        with tempfile.TemporaryDirectory() as temp_dir:
            local_video_path = os.path.join(temp_dir, os.path.basename(video_path))
            local_x_train_path = os.path.join(temp_dir, 'x_train_EMT-L.csv')

            try:
                download_from_storage(bucket_name, video_path, local_video_path)
            except Exception as e:
                logging.error(f"[EMT-L] Error downloading video: {e}", exc_info=True)
                return jsonify({"error": f"Failed to download video: {str(e)}"}), 500

            try:
                download_from_storage(bucket_name, x_train_path, local_x_train_path)
            except Exception as e:
                logging.error(f"[EMT-L] Error downloading x_train_EMT-L.csv: {e}", exc_info=True)
                return jsonify({"error": f"Failed to download x_train_EMT-L.csv: {str(e)}"}), 500

            try:
                from emt_l_analysis import run_emtl_test
                roi_tuple = tuple(roi) if (isinstance(roi, (list, tuple)) and len(roi) == 4) else None
                result = run_emtl_test(local_video_path, local_x_train_path, roi=roi_tuple)
            except Exception as e:
                logging.error(f"[EMT-L] Analysis error: {e}", exc_info=True)
                return jsonify({"error": f"EMT-L analysis failed: {str(e)}"}), 500

        # EMT-L duration validation: 3:10–3:30 (190–210s)
        duration = result["duration"]
        if not is_admin and (duration < 190 or duration > 210):
            minutes = int(duration // 60)
            seconds = int(duration % 60)
            error_msg = f"동영상의 길이가 3분10초에서 3분30초를 벗어납니다. 현재: {minutes}분 {seconds}초"
            return jsonify({"error": error_msg}), 400

        response = {
            "passed": result["passed"],
            "score": result["score"],
            "duration": result["duration"],
            "meanG": result["meanG"],
            "stdG": result["stdG"],
            "message": result["message"],
            "failureReason": result["failureReason"],
            "detectedFrames": result["detectedFrames"],
            "totalFrames": result["totalFrames"],
            "visualizationUrls": [],
        }
        logging.info(f"[EMT-L] Analysis complete: passed={result['passed']}, score={result['score']}")
        return jsonify(response), 200

    except ValueError as e:
        logging.error(f"[EMT-L] Validation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"[EMT-L] Unexpected error: {e}", exc_info=True)
        return jsonify({"error": f"EMT-L analysis failed: {str(e)}"}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze video from Firebase Storage paths"""
    try:
        data = request.json
        if not data:
            logging.error("No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400
        
        # 전체 요청 데이터 로깅 (디버깅용)
        logging.info(f"=== Received request data ===")
        logging.info(f"Full request data keys: {list(data.keys()) if data else 'None'}")
        logging.info(f"Full request data: {json.dumps(data, indent=2) if data else 'None'}")
            
        bucket_name = data.get('bucketName')
        video_path = data.get('videoPath')
        x_train_path = data.get('xTrainPath')
        is_admin = data.get('isAdmin', False)  # 관리자 모드 플래그
        version = data.get('version', 'EMT')  # EMT 버전 (EMT 또는 EMT-L)
        
        # 버전 정보 상세 로깅
        logging.info(f"=== Version extraction ===")
        logging.info(f"Raw version from data.get('version'): {version}")
        logging.info(f"Version type: {type(version)}")
        logging.info(f"Version in data: {'version' in data}")
        
        # 버전 정보 정규화 (대소문자, 공백 처리)
        if version:
            version = str(version).strip().upper()
            if version not in ['EMT', 'EMT-L']:
                logging.warning(f"Unknown version '{version}', defaulting to 'EMT'")
                version = 'EMT'
        else:
            logging.warning("Version is None or empty, defaulting to 'EMT'")
            version = 'EMT'
        create_visualization = data.get('createVisualization', True)  # 시각화 생성 여부

        logging.info(f"=== Final version value ===")
        logging.info(f"Final version: {version}")
        logging.info(f"Received request: bucketName={bucket_name}, videoPath={video_path}, xTrainPath={x_train_path}, isAdmin={is_admin}, version={version}, createVisualization={create_visualization}")

        if not bucket_name or not video_path or not x_train_path:
            error_msg = f"Missing required fields: bucketName={bucket_name}, videoPath={video_path}, xTrainPath={x_train_path}"
            logging.error(error_msg)
            return jsonify({"error": f"Missing required fields: bucketName, videoPath, xTrainPath"}), 400

        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download files from Firebase Storage
            local_video_path = os.path.join(temp_dir, os.path.basename(video_path))
            local_x_train_path = os.path.join(temp_dir, 'x_train.csv')

            logging.info(f"Downloading video from gs://{bucket_name}/{video_path}")
            try:
                download_from_storage(bucket_name, video_path, local_video_path)
                logging.info(f"Video downloaded successfully to {local_video_path}")
            except Exception as e:
                logging.error(f"Error downloading video: {e}", exc_info=True)
                return jsonify({"error": f"Failed to download video: {str(e)}"}), 500

            logging.info(f"Downloading x_train.csv from gs://{bucket_name}/{x_train_path}")
            try:
                download_from_storage(bucket_name, x_train_path, local_x_train_path)
                logging.info(f"x_train.csv downloaded successfully to {local_x_train_path}")
            except Exception as e:
                logging.error(f"Error downloading x_train.csv: {e}", exc_info=True)
                return jsonify({"error": f"Failed to download x_train.csv: {str(e)}"}), 500

            # 시각화 이미지 저장 경로 생성
            visualization_base_path = None
            if create_visualization:
                # video_path에서 파일명 추출 (확장자 제외)
                video_basename = os.path.splitext(os.path.basename(video_path))[0]
                visualization_base_path = f"Simulator_training/EMT/EMT_visualization/{video_basename}"
                logging.info(f"Visualization base path: {visualization_base_path}")

            # Analyze video
            logging.info(f"Starting video analysis (isAdmin={is_admin}, version={version}, createVisualization={create_visualization}, bucket_name={bucket_name}, visualization_base_path={visualization_base_path})")
            try:
                result = analyze_video(
                    local_video_path, 
                    local_x_train_path, 
                    is_admin=is_admin,
                    version=version,
                    create_visualization=create_visualization,
                    bucket_name=bucket_name,
                    visualization_base_path=visualization_base_path
                )
                visualization_count = len(result.get('visualizationUrls', []))
                logging.info(f"Analysis complete: passed={result['passed']}, score={result['score']}, visualization_frames={visualization_count}")
                if visualization_count == 0 and create_visualization:
                    logging.warning(f"Visualization was requested but no frames were created. Check logs above for details.")
                return jsonify(result), 200
            except Exception as e:
                logging.error(f"Error during video analysis: {e}", exc_info=True)
                return jsonify({"error": f"Video analysis failed: {str(e)}"}), 500

    except ValueError as e:
        logging.error(f"Validation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Unexpected error: {e}", exc_info=True)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
