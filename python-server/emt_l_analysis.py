"""
EMT-L video analysis (test-only pipeline).
Uses x_train_EMT-L.csv as expert data and analyzes one test video.
Ported from secret/EMT-L_analysis.py - test path only (no expert video analysis).
"""
import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler

# ==================================================
# Parameters (의학 영상 안정성 위주: KLT + Shi–Tomasi)
# ==================================================
feature_params = dict(
    maxCorners=200,
    qualityLevel=0.01,
    minDistance=10,
    blockSize=7
)

lk_params = dict(
    winSize=(21, 21),
    maxLevel=3,
    criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01)
)

MIN_TRACK_POINTS = 10
FEATURE_ROI = (171, 36, 581, 446)  # (x1, y1, x2, y2)

FEATURE_COLS = [
    "mean_velocity",
    "velocity_CV",
    "acc_std",
    "jerk_std",
    "jerk_outlier_ratio",
    "micro_correction_rate",
    "tremor_energy_ratio",
    "blur_ratio",
    "stop_go_ratio",
    "path_efficiency"
]

OCSVM_NU = 0.2
REASON_Z_THRESHOLD = 2.0


def get_feature_mask(frame, roi=FEATURE_ROI, erode_px=3):
    if roi is None:
        return None
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    x1, y1, x2, y2 = roi
    x1 = max(0, min(w, x1))
    x2 = max(0, min(w, x2))
    y1 = max(0, min(h, y1))
    y2 = max(0, min(h, y2))
    if x2 <= x1 or y2 <= y1:
        return None
    mask = np.zeros_like(gray, dtype=np.uint8)
    mask[y1:y2, x1:x2] = 255
    if erode_px > 0:
        k = 2 * erode_px + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        mask = cv2.erode(mask, kernel, iterations=1)
    return mask


def extract_features(video_path, roi=None):
    """Extract motion stability features from a single video. video_path: str or Path. roi: (x1,y1,x2,y2) or None for FEATURE_ROI."""
    video_path = Path(video_path)
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    use_roi = tuple(roi) if roi is not None else FEATURE_ROI

    ret, old_frame = cap.read()
    if not ret:
        cap.release()
        raise RuntimeError(f"{video_path.name}: 비디오를 읽을 수 없습니다.")

    old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
    feature_mask = get_feature_mask(old_frame, roi=use_roi)
    p0 = cv2.goodFeaturesToTrack(old_gray, mask=feature_mask, **feature_params)

    positions = []
    feature_counts = []
    feature_spreads = []
    blur_scores = []
    total_frames = 0
    detected_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        total_frames += 1

        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur_scores.append(float(cv2.Laplacian(frame_gray, cv2.CV_64F).var()))
        feature_mask = get_feature_mask(frame, roi=use_roi)

        if p0 is None or len(p0) < MIN_TRACK_POINTS:
            p0 = cv2.goodFeaturesToTrack(frame_gray, mask=feature_mask, **feature_params)
            old_gray = frame_gray
            continue

        p1, st, _ = cv2.calcOpticalFlowPyrLK(
            old_gray, frame_gray, p0, None, **lk_params
        )

        if p1 is None:
            p0 = None
            old_gray = frame_gray
            continue

        good_new = p1[st == 1]
        if feature_mask is not None and good_new.size > 0:
            h, w = feature_mask.shape
            coords = good_new.reshape(-1, 2).astype(int)
            in_bounds = (
                (coords[:, 0] >= 0) & (coords[:, 0] < w) &
                (coords[:, 1] >= 0) & (coords[:, 1] < h)
            )
            coords = coords[in_bounds]
            if coords.size == 0:
                p0 = None
                old_gray = frame_gray
                continue
            inside_mask = feature_mask[coords[:, 1], coords[:, 0]] > 0
            if not np.any(inside_mask):
                p0 = None
                old_gray = frame_gray
                continue
            good_new = coords[inside_mask].astype(np.float32)
        if len(good_new) < MIN_TRACK_POINTS:
            p0 = None
            old_gray = frame_gray
            continue

        feature_counts.append(len(good_new))
        centroid = np.mean(good_new, axis=0)
        positions.append(centroid)
        detected_frames += 1

        dists = np.linalg.norm(good_new - centroid, axis=1)
        feature_spreads.append(float(np.mean(dists)))

        old_gray = frame_gray
        p0 = good_new.reshape(-1, 1, 2)

    cap.release()

    if detected_frames < 10:
        raise RuntimeError(f"{video_path.name}: insufficient valid frames")
    detection_rate = (detected_frames / total_frames * 100.0) if total_frames > 0 else 0.0

    positions = np.array(positions)
    delta = np.linalg.norm(np.diff(positions, axis=0), axis=1)
    velocity = delta * fps
    acceleration = np.diff(velocity)
    jerk = np.diff(acceleration)

    mean_velocity = float(np.mean(velocity)) if velocity.size > 0 else 0.0
    velocity_cv = float(np.std(velocity) / mean_velocity) if mean_velocity > 0 else 0.0
    acc_std = float(np.std(acceleration)) if acceleration.size > 0 else 0.0
    jerk_std = float(np.std(jerk)) if jerk.size > 0 else 0.0

    if jerk.size > 0:
        abs_jerk = np.abs(jerk)
        jerk_thresh = float(np.mean(abs_jerk) + 2.0 * np.std(abs_jerk))
        jerk_outlier_ratio = float(np.mean(abs_jerk > jerk_thresh)) if jerk_thresh > 0 else 0.0
    else:
        jerk_outlier_ratio = 0.0

    disp = np.diff(positions, axis=0)
    if disp.shape[0] >= 2:
        v1 = disp[:-1]
        v2 = disp[1:]
        dot = np.sum(v1 * v2, axis=1)
        norm = np.linalg.norm(v1, axis=1) * np.linalg.norm(v2, axis=1)
        valid = norm > 0
        reversals = np.sum((dot < 0) & valid)
        micro_correction_rate = float(reversals / np.sum(valid)) if np.sum(valid) > 0 else 0.0
    else:
        micro_correction_rate = 0.0

    if velocity.size >= 4 and fps > 0:
        v = velocity - np.mean(velocity)
        spectrum = np.fft.rfft(v)
        freqs = np.fft.rfftfreq(len(v), d=1.0 / fps)
        power = np.abs(spectrum) ** 2
        band = (freqs >= 3.0) & (freqs <= 8.0)
        total_power = float(np.mean(power[freqs > 0])) if np.any(freqs > 0) else 0.0
        band_power = float(np.mean(power[band])) if np.any(band) else 0.0
        tremor_energy_ratio = (band_power / total_power) if total_power > 0 else 0.0
    else:
        tremor_energy_ratio = 0.0

    eps = 0.05 * mean_velocity if mean_velocity > 0 else 0.0
    stop_go_ratio = float(np.mean(velocity < eps)) if velocity.size > 0 else 0.0

    net_disp = np.linalg.norm(positions[-1] - positions[0])
    total_path = np.sum(delta)
    path_efficiency = net_disp / total_path if total_path > 0 else 0.0

    if feature_counts:
        feat_avg = float(np.mean(feature_counts))
        feat_median = float(np.median(feature_counts))
        feat_min = int(np.min(feature_counts))
        feat_max = int(np.max(feature_counts))
    else:
        feat_avg = 0.0
        feat_median = 0.0
        feat_min = 0
        feat_max = 0

    if feature_spreads:
        spread_mean = float(np.mean(feature_spreads))
        spread_std = float(np.std(feature_spreads))
    else:
        spread_mean = 0.0
        spread_std = 0.0

    spread_cv = (spread_std / spread_mean) if spread_mean > 0 else 0.0
    if spread_cv <= 0.3:
        spread_interp = "안정(프레임 간 분포 변화가 작음)"
    elif spread_cv <= 0.6:
        spread_interp = "보통(분포 변화가 일부 존재)"
    else:
        spread_interp = "불안정(분포 변화가 큼)"

    if blur_scores:
        median_blur = float(np.median(blur_scores))
        blur_thresh = 0.5 * median_blur
        blur_ratio = float(np.mean(np.array(blur_scores) < blur_thresh)) if median_blur > 0 else 0.0
    else:
        blur_ratio = 0.0

    return {
        "total_frames": total_frames,
        "detected_frames": detected_frames,
        "detection_rate_pct": round(detection_rate, 2),
        "feature_count_avg": feat_avg,
        "feature_count_median": feat_median,
        "feature_count_min": feat_min,
        "feature_count_max": feat_max,
        "feature_spread_mean": spread_mean,
        "feature_spread_std": spread_std,
        "feature_spread_cv": round(float(spread_cv), 3),
        "feature_spread_interp": spread_interp,
        "mean_velocity": mean_velocity,
        "velocity_CV": velocity_cv,
        "acc_std": acc_std,
        "jerk_std": jerk_std,
        "jerk_outlier_ratio": jerk_outlier_ratio,
        "micro_correction_rate": micro_correction_rate,
        "tremor_energy_ratio": tremor_energy_ratio,
        "blur_ratio": blur_ratio,
        "stop_go_ratio": stop_go_ratio,
        "path_efficiency": path_efficiency
    }


def build_fail_reasons(test_feat, df_expert):
    metric_info = {
        "mean_velocity": ("전진/후진 속도", "평균 이동 속도가 너무 빠르거나 너무 느림"),
        "velocity_CV": ("속도 일관성", "빠른 구간과 느린 구간이 섞여 속도가 들쭉날쭉함"),
        "acc_std": ("가감속 안정성", "가속·감속이 갑자기 바뀌어 움직임이 거칠어짐"),
        "jerk_std": ("미세 조작의 부드러움", "미세 조작이 끊기듯 급해 화면이 흔들림"),
        "jerk_outlier_ratio": ("급격한 흔들림 빈도", "갑작스러운 큰 움직임이 자주 발생함"),
        "micro_correction_rate": ("미세 수정 빈도", "역방향 조정이 잦아 조작이 불안정함"),
        "tremor_energy_ratio": ("미세 떨림 에너지", "3–8Hz 대역의 미세 떨림이 큼"),
        "blur_ratio": ("모션 블러 비율", "빠른 움직임으로 흐림 프레임이 많음"),
        "stop_go_ratio": ("정지-재시작 패턴", "멈추는 비율이 많거나 적어 리듬이 불균형함"),
        "path_efficiency": ("삽입 경로 효율", "한 점에서 다른 점으로 이동할 때 직선으로 가지 않고 지그재그 경로로 감")
    }

    means = df_expert[FEATURE_COLS].mean()
    stds = df_expert[FEATURE_COLS].std(ddof=0)

    reasons = []
    for col in FEATURE_COLS:
        std = stds[col]
        if std == 0 or np.isnan(std):
            continue
        z = (test_feat[col] - means[col]) / std
        if abs(z) >= REASON_Z_THRESHOLD:
            direction = "높음" if z > 0 else "낮음"
            label, explain = metric_info.get(col, (col, "동작 특성 편차"))
            reasons.append(f"{label}: {z:+.2f}σ ({direction}) - {explain}")

    if reasons:
        return "\n".join([f"{i+1}. {r}" for i, r in enumerate(reasons)])
    return "1. 개별 지표는 전문가 범위 내이나 SVM 종합 점수 기준으로 이상치 판단"


def run_emtl_test(video_path: str, x_train_csv_path: str, roi=None):
    """
    Load expert from x_train_EMT-L.csv, analyze one test video, return verdict and log text.
    roi: (x1, y1, x2, y2) or None for default FEATURE_ROI (CV 290).
    Returns dict: passed, score, duration, message (log text with appended pass/fail sentence),
    failureReason, detectedFrames, totalFrames, logLines (list of log lines for storage).
    """
    video_path = Path(video_path)
    df_expert = pd.read_csv(x_train_csv_path, encoding="utf-8-sig")
    missing = [c for c in FEATURE_COLS if c not in df_expert.columns]
    if missing:
        raise ValueError(f"x_train_EMT-L.csv에 필요한 컬럼이 없습니다: {missing}")

    log_lines = []
    log_lines.append("Training one-class SVM...")
    scaler = StandardScaler()
    X_exp = scaler.fit_transform(df_expert[FEATURE_COLS])
    ocsvm = OneClassSVM(nu=OCSVM_NU, kernel="rbf", gamma="scale")
    ocsvm.fit(X_exp)

    log_lines.append("Analyzing test video...")
    use_roi = tuple(roi) if roi is not None else FEATURE_ROI
    test_feat = extract_features(str(video_path), roi=use_roi)
    test_name = video_path.name
    log_lines.append(f"  [특징점 추적] {test_name}: {test_feat['detected_frames']}/{test_feat['total_frames']} 프레임 ({test_feat['detection_rate_pct']}%)")
    log_lines.append(f"    특징점 수(평균/중앙값/최소/최대): {test_feat['feature_count_avg']:.1f} / {test_feat['feature_count_median']:.1f} / {test_feat['feature_count_min']} / {test_feat['feature_count_max']}")
    log_lines.append(f"    분포 안정성(CV): {test_feat['feature_spread_cv']:.3f} ({test_feat['feature_spread_interp']})")

    x_test = scaler.transform(pd.DataFrame([test_feat])[FEATURE_COLS])
    score = float(ocsvm.decision_function(x_test)[0])
    pred = int(ocsvm.predict(x_test)[0])
    verdict = "PASS" if pred == 1 else ("PASS" if score > -0.1 else "FAIL")
    fail_reasons = "정상 범위"
    if verdict != "PASS":
        fail_reasons = build_fail_reasons(test_feat, df_expert)

    log_lines.append(f"SVM score: {score:.6f}")
    log_lines.append(f"Fail reasons: {fail_reasons}")
    log_lines.append(f"Verdict for '{test_name}': {verdict}")

    # Duration from video (fps * total_frames or open again)
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()
    duration = test_feat["total_frames"] / fps if fps > 0 else 0.0

    # Message: log text + appended sentence (B 방식)
    log_text = "\n".join(log_lines)
    if verdict == "PASS":
        message = log_text + "\n\n합격입니다. 수고하셨습니다."
    else:
        message = log_text + "\n\n불합격입니다. 다시 시도해 주세요."

    return {
        "passed": verdict == "PASS",
        "score": score,
        "duration": duration,
        "meanG": 0.0,   # EMT-L does not use meanG
        "stdG": 0.0,    # EMT-L does not use stdG
        "message": message,
        "failureReason": fail_reasons if verdict != "PASS" else None,
        "detectedFrames": test_feat["detected_frames"],
        "totalFrames": test_feat["total_frames"],
        "logLines": log_lines,
        "verdict": verdict,
    }
