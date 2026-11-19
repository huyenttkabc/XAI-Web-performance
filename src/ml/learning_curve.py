"""Learning curve cho RQ1–RQ2 (kiểm tra dữ liệu đã đủ chưa; chỉ store development, lockbox không bao giờ bị chạm).

Với mỗi fold ngoài (cố định bằng hash, protocol §8), store test GIỮ NGUYÊN; mô hình chỉ được huấn luyện trên
n store ngẫu nhiên của fold train, cùng pipeline và cùng inner GroupKFold tuning như run chính.
Một điểm = MAE out-of-fold gộp trên mọi dòng development, cho một lần bốc n store mỗi fold.
Nếu MAE vẫn giảm rõ ở n lớn nhất → thêm store còn giúp; cuối đường cong phẳng → đã bão hòa.
"""
import numpy as np
import pandas as pd

from src.ml.group_cross_validation import _fit
from src.ml.model_specs import SEED

ALL = "all"  # đánh dấu: học trên MỌI store train của fold (trùng với run chính)


def _draw_train_sites(train_sites: np.ndarray, n, rng) -> np.ndarray:
    if n == ALL or n >= len(train_sites):
        return train_sites
    return rng.choice(train_sites, size=n, replace=False)


def learning_curve_points(dev: pd.DataFrame, features: list[str], target: str, estimator, grid,
                          sizes: list, repeats: int, seed: int = SEED) -> list[dict]:
    """Trả một bản ghi cho mỗi (size, repeat): MAE out-of-fold gộp (ms) và số store train đã dùng."""
    X = dev[features].astype(float)
    y = dev[target].to_numpy(float)
    y_log = np.log1p(y)
    sites = dev["site"].to_numpy()
    folds = dev["fold"].to_numpy()
    points = []
    for n in sizes:
        n_repeats = 1 if n == ALL else repeats
        for r in range(n_repeats):
            # mỗi (size, repeat) một lần bốc độc lập, tái lập được; GIỐNG NHAU giữa các mô hình và bộ feature
            rng = np.random.default_rng([seed, 0 if n == ALL else int(n), r])
            pred = np.full(len(dev), np.nan)
            used = []
            for fold in np.unique(folds):
                test = folds == fold
                chosen = _draw_train_sites(np.unique(sites[~test]), n, rng)
                train = ~test & np.isin(sites, chosen)
                assert not set(sites[train]) & set(sites[test]), f"site leakage in fold {fold}"
                model, _ = _fit(estimator, grid, X[train], y_log[train], dev.loc[train, "site"])
                pred[test] = np.expm1(model.predict(X[test]))
                used.append(len(chosen))
            points.append({"size": n, "repeat": r, "train_sites_mean": float(np.mean(used)),
                           "mae": float(np.mean(np.abs(pred - y)))})
    return points


def summarise(points: list[dict]) -> list[dict]:
    """Trung bình và khoảng (min–max) của MAE qua các lần lặp, cho từng cỡ tập train."""
    frame = pd.DataFrame(points)
    out = []
    for size, g in frame.groupby("size", sort=False):
        out.append({"size": size, "train_sites": round(float(g["train_sites_mean"].mean()), 1),
                    "repeats": int(len(g)), "mae_mean": float(g["mae"].mean()),
                    "mae_min": float(g["mae"].min()), "mae_max": float(g["mae"].max())})
    return out
