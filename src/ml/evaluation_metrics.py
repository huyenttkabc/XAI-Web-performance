"""Metric theo ms (protocol §8): MAE, RMSE, R², MdAPE theo fold và gộp out-of-fold; CI bootstrap theo site."""
import numpy as np
import pandas as pd

from src.ml.model_specs import SEED

N_BOOTSTRAP = 1000


def point_metrics(y: np.ndarray, pred: np.ndarray) -> dict:
    err = pred - y
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    # MdAPE: median |sai số| / y — sai số tương đối không bị vài trang 20–60 s chi phối (y chặn dưới 50 ms)
    return {"mae": float(np.mean(np.abs(err))), "rmse": float(np.sqrt(np.mean(err ** 2))),
            "mdape": float(np.median(np.abs(err) / np.maximum(y, 50))),
            "r2": float(1 - np.sum(err ** 2) / ss_tot) if ss_tot > 0 else float("nan")}


def per_fold_metrics(y: np.ndarray, pred: np.ndarray, folds: np.ndarray) -> list[dict]:
    return [{"fold": int(f), **point_metrics(y[folds == f], pred[folds == f])} for f in np.unique(folds)]


def site_bootstrap(y: np.ndarray, pred: np.ndarray, baseline_pred: np.ndarray, sites: np.ndarray,
                   n: int = N_BOOTSTRAP, seed: int = SEED) -> dict:
    """Lấy mẫu lại SITE có hoàn lại; CI của MAE mô hình và của ΔMAE = MAE(mô hình) − MAE(baseline).
    ΔMAE âm = mô hình tốt hơn. CI tôn trọng việc các dòng của cùng một site không độc lập."""
    rng = np.random.default_rng(seed)
    abs_model, abs_base = np.abs(pred - y), np.abs(baseline_pred - y)
    index_by_site = [np.flatnonzero(sites == s) for s in np.unique(sites)]
    mae, delta = np.empty(n), np.empty(n)
    for b in range(n):
        rows = np.concatenate([index_by_site[i] for i in rng.integers(0, len(index_by_site), len(index_by_site))])
        mae[b] = abs_model[rows].mean()
        delta[b] = mae[b] - abs_base[rows].mean()
    ci = lambda v: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))]
    return {"mae_ci95": ci(mae), "delta_mae_vs_baseline": float(abs_model.mean() - abs_base.mean()),
            "delta_mae_ci95": ci(delta)}


def site_residuals(dev: pd.DataFrame, target: str, pred: np.ndarray, top: int = 8) -> list[dict]:
    """Các site có sai số tuyệt đối trung bình lớn nhất — nơi mô hình tổng quát hóa kém nhất."""
    frame = pd.DataFrame({"site": dev["site"], "stratum": dev["stratum"], "y": dev[target], "pred": pred})
    frame["abs_err"] = (frame["pred"] - frame["y"]).abs()
    frame["signed_err"] = frame["pred"] - frame["y"]
    table = frame.groupby(["site", "stratum"]).agg(rows=("y", "size"), y_median=("y", "median"),
                                                   mae=("abs_err", "mean"), bias=("signed_err", "mean"))
    return table.sort_values("mae", ascending=False).head(top).reset_index().round(1).to_dict("records")
