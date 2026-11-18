"""Dataset cho mô hình RQ1–RQ2 (protocol §8, §8.1).

Đọc dataset đã reparse, giữ dòng Shopify hợp lệ của các trang có >= MIN_VALID_RUNS lần đo hợp lệ,
gán fold và lockbox theo site bằng hash ĐÚNG như protocol định nghĩa, và đọc bộ feature từ
src/parser/feature-definitions.js (nguồn sự thật duy nhất) thông qua Node.
"""
import hashlib
import json
import subprocess
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATASET_CSV = ROOT / "data/processed/pilot-dataset.csv"
SITES_CSV = ROOT / "config/main-study-sites.csv"
MIN_VALID_RUNS = 4          # protocol §8.1: trang chỉ vào mô hình khi có >= 4 lần đo hợp lệ
N_FOLDS = 5
LCP_NEAR_WINDOW_MS = 55_000  # LCP sát cửa sổ tải 60 s: giữ lại, gắn cờ để phân tích độ nhạy


def site_bucket(site: str, salt: str, k: int = N_FOLDS) -> int:
    """int(sha1(salt + ':' + site)[:8], 16) mod k — luật fold / lockbox của protocol (giống hệt bản JS)."""
    return int(hashlib.sha1(f"{salt}:{site}".encode()).hexdigest()[:8], 16) % k


def feature_metadata() -> dict:
    out = subprocess.run(["node", str(ROOT / "scripts/export-feature-metadata.js")],
                         check=True, capture_output=True, text=True, cwd=ROOT)
    return json.loads(out.stdout)


def feature_set(metadata: dict, set_name: str, target: str) -> list[str]:
    """S = feature cấu trúc; S+R = cấu trúc + runtime. Áp loại trừ leakage theo target (L5)."""
    families = {"S": {"structural"}, "S+R": {"structural", "runtime"}}[set_name]
    return [f["name"] for f in metadata["features"]
            if f["family"] in families and target not in f["excludeFor"]]


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_modeling_rows(dataset_csv: Path = DATASET_CSV) -> tuple[pd.DataFrame, dict]:
    """Trả (các dòng development kèm cột fold, tóm tắt những gì đã bị lọc)."""
    rows = pd.read_csv(dataset_csv, low_memory=False)
    planned = pd.read_csv(SITES_CSV)[["site", "page_type", "stratum"]]
    real = rows[rows["site_type"] == "shopify_storefront"].merge(planned, on=["site", "page_type"], how="inner")
    ok = real[real["status"] == "ok"].copy()
    # một dòng cho mỗi (trang, run): run được đo bù giữ phép đo hợp lệ mới nhất (cùng luật với báo cáo QC)
    ok = ok.sort_values("collected_at").drop_duplicates(["site", "page_type", "run"], keep="last")

    valid_runs = ok.groupby(["site", "page_type"])["run"].transform("nunique")
    kept = ok[valid_runs >= MIN_VALID_RUNS].copy()
    kept["lockbox"] = kept["site"].map(lambda s: site_bucket(s, "lockbox") == 0)
    kept["fold"] = kept["site"].map(lambda s: site_bucket(s, "fold"))
    kept["lcp_near_window_end"] = kept["lh_lcp_ms"] >= LCP_NEAR_WINDOW_MS
    dev = kept[~kept["lockbox"]].reset_index(drop=True)  # lockbox bị loại TRƯỚC mọi bước

    page_key = ["site", "page_type"]
    summary = {
        "dataset_csv": str(dataset_csv.relative_to(ROOT)),
        "dataset_sha256": file_sha256(dataset_csv),
        "valid_rows": int(len(ok)),
        "pages_valid": int(ok[page_key].drop_duplicates().shape[0]),
        "pages_dropped_lt_min_runs": int(ok[valid_runs < MIN_VALID_RUNS][page_key].drop_duplicates().shape[0]),
        "lockbox_sites": sorted(kept.loc[kept["lockbox"], "site"].unique().tolist()),
        "dev_rows": int(len(dev)),
        "dev_pages": int(dev[page_key].drop_duplicates().shape[0]),
        "dev_sites": int(dev["site"].nunique()),
        "dev_sites_per_fold": {int(k): int(v) for k, v in dev.groupby("fold")["site"].nunique().items()},
        "dev_sites_per_stratum": {k: int(v) for k, v in dev.groupby("stratum")["site"].nunique().items()},
        "lcp_near_window_rows": int(dev["lcp_near_window_end"].sum()),
    }
    return dev, summary
