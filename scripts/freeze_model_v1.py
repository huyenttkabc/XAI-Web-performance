"""Model freeze v1.0: ghi chính xác run, dataset, code, lưới, fold và quyết định mà RQ1–RQ2 dựa vào.

Dùng: npm run ml:freeze  (= scripts/freeze_model_v1.py --run=dev-cv-261025-v1.0)
Ghi data/processed/model-runs/model-freeze-v1.0/{manifest.json, folds.csv}. Từ chối ghi đè bản đã đóng băng
(mô hình đóng băng chỉ đổi qua amendment có ngày, không bao giờ để số đẹp hơn).
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from src.ml.modeling_dataset import site_bucket  # noqa: E402

OUT = ROOT / "data/processed/model-runs/model-freeze-v1.0"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    run = next(a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--run="))
    run_dir = ROOT / "data/processed/model-runs" / run
    if (OUT / "manifest.json").exists():
        raise SystemExit(f"{OUT} already exists: a frozen model is not overwritten")
    config = json.loads((run_dir / "config.json").read_text())
    dataset = ROOT / "data/processed/dataset-v1.0.csv"
    # Chỉ đóng băng khi dữ liệu và code hiện tại đúng là thứ đã sinh ra run.
    if sha256(dataset) != config["dataset"]["dataset_sha256"]:
        raise SystemExit("dataset-v1.0.csv does not match the dataset of the run")
    for rel, digest in config["code"]["source_sha256"].items():
        if sha256(ROOT / rel) != digest:
            raise SystemExit(f"code changed since the run: {rel}")

    # Danh sách fold cho MỌI store kế hoạch (kể cả lockbox), để ai cũng tái tạo được cách chia.
    planned = pd.read_csv(ROOT / "config/main-study-sites.csv")[["site", "stratum"]].drop_duplicates()
    planned["lockbox"] = planned["site"].map(lambda s: site_bucket(s, "lockbox") == 0)
    planned["fold"] = planned.apply(lambda r: "lockbox" if r["lockbox"] else str(site_bucket(r["site"], "fold")), axis=1)
    OUT.mkdir(parents=True)
    planned[["site", "stratum", "fold"]].sort_values(["fold", "site"]).to_csv(OUT / "folds.csv", index=False)

    manifest = {
        "freeze": "model v1.0", "frozen_at": datetime.now(timezone.utc).isoformat(),
        "rule": "Changed only through a dated amendment for a methodological error (G6), never to improve numbers.",
        "run_id": run, "seed": config["seed"],
        "dataset": {"path": "data/processed/dataset-v1.0.csv", "sha256": config["dataset"]["dataset_sha256"],
                    "dev_sites": config["dataset"]["dev_sites"], "dev_rows": config["dataset"]["dev_rows"],
                    "lockbox_sites": len(config["dataset"]["lockbox_sites"]), "lockbox_opened": False},
        "code_sha256": config["code"]["source_sha256"], "versions": config["versions"],
        "grids": config["grids"], "feature_sets": config["feature_sets"],
        "artifacts_sha256": {f: sha256(run_dir / f) for f in ("config.json", "results.json", "oof-predictions.csv")},
        "folds_csv_sha256": sha256(OUT / "folds.csv"),
        "decisions": {
            "primary_explanation_model": "random_forest, feature set S+R (G5: tied with XGBoost, Wilcoxon p_Holm = 1.0)",
            "robustness_model": "xgboost, feature set S+R",
            "hyperparameter_search": "closed; grids of protocol §8.1 only",
        },
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)}/manifest.json and folds.csv")


if __name__ == "__main__":
    main()
