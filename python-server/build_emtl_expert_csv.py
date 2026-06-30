"""
Build x_train_EMT-L.csv from expert EMT-L videos.

The generated CSV uses the same automatic viewport detection and 640x480
normalization that production EMT-L analysis uses. Upload the result to
Firebase Storage at templates/x_train_EMT-L.csv before enabling the new model.
"""
import argparse
import glob
from pathlib import Path

import pandas as pd

from emt_l_analysis import FEATURE_COLS, NORMALIZED_FRAME_SIZE, extract_features


VIDEO_EXTENSIONS = {".avi", ".mp4", ".mov", ".m4v", ".mkv", ".wmv"}


def collect_video_paths(inputs):
    paths = []
    for item in inputs:
        matches = glob.glob(item)
        if not matches:
            matches = [item]

        for match in matches:
            path = Path(match)
            if path.is_dir():
                for child in sorted(path.rglob("*")):
                    if child.is_file() and child.suffix.lower() in VIDEO_EXTENSIONS:
                        paths.append(child)
            elif path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
                paths.append(path)

    seen = set()
    unique = []
    for path in paths:
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique.append(path)
    return unique


def build_expert_csv(video_paths, output_path, keep_going=False):
    rows = []
    errors = []

    for video_path in video_paths:
        print(f"[EMT-L expert] analyzing {video_path}")
        try:
            features = extract_features(
                video_path,
                roi=None,
                normalize_viewport=True,
                normalized_size=NORMALIZED_FRAME_SIZE,
            )
            row = {
                "video_name": video_path.name,
                "source_path": str(video_path),
                "preprocess_mode": "viewport_normalized",
                "normalized_width": NORMALIZED_FRAME_SIZE[0],
                "normalized_height": NORMALIZED_FRAME_SIZE[1],
                "viewport_confidence": features.get("viewport_confidence"),
                "viewport_area_ratio": features.get("viewport_area_ratio"),
                "viewport_source": features.get("viewport_source"),
                "detected_frames": features.get("detected_frames"),
                "total_frames": features.get("total_frames"),
                "detection_rate_pct": features.get("detection_rate_pct"),
            }
            for col in FEATURE_COLS:
                row[col] = features[col]
            rows.append(row)
        except Exception as exc:
            message = f"{video_path}: {exc}"
            errors.append(message)
            print(f"[EMT-L expert] ERROR {message}")
            if not keep_going:
                raise

    if not rows:
        raise RuntimeError("No expert videos were successfully analyzed.")

    metadata_cols = [
        "video_name",
        "source_path",
        "preprocess_mode",
        "normalized_width",
        "normalized_height",
        "viewport_confidence",
        "viewport_area_ratio",
        "viewport_source",
        "detected_frames",
        "total_frames",
        "detection_rate_pct",
    ]
    df = pd.DataFrame(rows)
    df = df[metadata_cols + FEATURE_COLS]

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print(f"[EMT-L expert] wrote {len(df)} rows to {output_path}")
    if errors:
        print(f"[EMT-L expert] skipped {len(errors)} failed video(s)")
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Regenerate x_train_EMT-L.csv using viewport-normalized EMT-L expert videos."
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="Expert video file(s), directory path(s), or glob pattern(s).",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="x_train_EMT-L.csv",
        help="Output CSV path. Default: x_train_EMT-L.csv",
    )
    parser.add_argument(
        "--keep-going",
        action="store_true",
        help="Skip videos that fail feature extraction instead of stopping.",
    )
    args = parser.parse_args()

    video_paths = collect_video_paths(args.inputs)
    if not video_paths:
        raise SystemExit("No video files found.")

    build_expert_csv(video_paths, args.output, keep_going=args.keep_going)


if __name__ == "__main__":
    main()
