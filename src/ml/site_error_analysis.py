"""Phân tích RQ2 theo store và phân tích sai số trên dự đoán out-of-fold (không fit lại, không chạm lockbox).

- phân bố MAE theo store và tỉ lệ store mà mô hình đoán tốt hơn baseline;
- MAE theo tầng và theo loại trang, kèm ΔMAE so với baseline và CI bootstrap theo store;
- sai số có dấu (bias) theo decile của giá trị quan sát, để thấy hiện tượng co về trung bình.
"""
import numpy as np
import pandas as pd

from src.ml.evaluation_metrics import site_bootstrap


def per_site_summary(oof: pd.DataFrame, target: str, pred_col: str, base_col: str) -> dict:
    """Mỗi store một MAE (trung bình |sai số| các dòng của store) → phân vị và % store thắng baseline."""
    err = (oof[pred_col] - oof[target]).abs()
    base = (oof[base_col] - oof[target]).abs()
    site = pd.DataFrame({"site": oof["site"], "m": err, "b": base}).groupby("site").mean()
    q = site["m"].quantile([0.25, 0.5, 0.75, 0.9])
    return {"n_sites": int(len(site)), "mae_p25": float(q[0.25]), "mae_median": float(q[0.5]),
            "mae_p75": float(q[0.75]), "mae_p90": float(q[0.9]),
            "share_better_than_baseline": float((site["m"] < site["b"]).mean())}


def by_group(oof: pd.DataFrame, target: str, pred_col: str, base_col: str, group: str) -> list[dict]:
    """MAE của mô hình và baseline trong từng mức của `group`, ΔMAE kèm CI bootstrap theo store."""
    out = []
    for level, g in oof.groupby(group):
        y = g[target].to_numpy(float)
        boot = site_bootstrap(y, g[pred_col].to_numpy(float), g[base_col].to_numpy(float), g["site"].to_numpy())
        out.append({"level": str(level), "n_sites": int(g["site"].nunique()), "n_rows": int(len(g)),
                    "mae": float(np.mean(np.abs(g[pred_col] - y))), "mae_baseline": float(np.mean(np.abs(g[base_col] - y))),
                    "delta_mae": boot["delta_mae_vs_baseline"], "delta_mae_ci95": boot["delta_mae_ci95"]})
    return out


def bias_by_decile(oof: pd.DataFrame, target: str, pred_col: str, n_bins: int = 10) -> list[dict]:
    """Trung vị sai số có dấu (dự đoán − thực tế) trong từng decile của target quan sát."""
    frame = pd.DataFrame({"y": oof[target], "err": oof[pred_col] - oof[target]})
    frame["bin"] = pd.qcut(frame["y"], n_bins, labels=False, duplicates="drop")
    rows = []
    for b, g in frame.groupby("bin"):
        rows.append({"decile": int(b) + 1, "y_median": float(g["y"].median()), "bias_median": float(g["err"].median()),
                     "abs_err_median": float(g["err"].abs().median()), "n": int(len(g))})
    return rows
