"""So sánh mô hình ghép cặp, phi tham số, trên các store development (bổ sung cho CI bootstrap theo site).

Đơn vị = store: mỗi store đóng góp MỘT MAE cho mỗi mô hình (trung bình |sai số| các dòng out-of-fold của nó),
nên kiểm định tôn trọng việc các trang và lần lặp của cùng store không độc lập. Friedman so sánh mọi mô hình
trong một khối (target, bộ feature); Wilcoxon signed-rank so sánh các cặp định trước; Holm kiểm soát sai số
family-wise trong từng họ phép thử. Wilcoxon giả định chênh lệch ghép cặp đối xứng quanh trung vị, nên báo cáo
kèm độ lệch (skewness) của chênh lệch và sign test làm phép kiểm không cần giả định.
"""
import numpy as np
import pandas as pd
from scipy import stats

MODELS = ["baseline", "ridge", "random_forest", "xgboost"]


def pred_column(target: str, feature_set: str, model: str) -> str:
    return f"pred__{target}__baseline" if model == "baseline" else f"pred__{target}__{feature_set}__{model}"


def per_store_mae(oof: pd.DataFrame, target: str, columns: dict[str, str]) -> pd.DataFrame:
    """Mỗi store một dòng, mỗi nhãn một cột: sai số tuyệt đối trung bình các dòng out-of-fold của store."""
    frame = pd.DataFrame({label: (oof[col] - oof[target]).abs() for label, col in columns.items()})
    frame["site"] = oof["site"].to_numpy()
    return frame.groupby("site").mean()


def wilcoxon_pair(a: np.ndarray, b: np.ndarray) -> dict:
    """So sánh ghép cặp hai phía MAE theo store a vs b (chênh lệch a − b; âm = a tốt hơn)."""
    diff = a - b
    nonzero = diff[diff != 0]
    w = stats.wilcoxon(a, b, zero_method="wilcox", alternative="two-sided")
    sign = stats.binomtest(int((nonzero < 0).sum()), n=len(nonzero), p=0.5)
    return {"n_stores": int(len(diff)), "median_diff": float(np.median(diff)), "mean_diff": float(np.mean(diff)),
            "share_a_better": float((diff < 0).mean()), "skewness": float(stats.skew(diff)),
            "p_wilcoxon": float(w.pvalue), "p_sign": float(sign.pvalue)}


def friedman_block(store_mae: pd.DataFrame) -> dict:
    """Friedman trên mọi mô hình (cột), khối = store; hạng trung bình mỗi mô hình (1 = tốt nhất)."""
    stat = stats.friedmanchisquare(*[store_mae[c].to_numpy() for c in store_mae.columns])
    ranks = store_mae.rank(axis=1).mean()
    return {"chi2": float(stat.statistic), "df": int(store_mae.shape[1] - 1), "p": float(stat.pvalue),
            "mean_rank": {c: float(ranks[c]) for c in store_mae.columns}}


def holm(pvalues: list[float]) -> list[float]:
    """p-value hiệu chỉnh Holm–Bonferroni (step-down, đơn điệu, chặn trên ở 1)."""
    order = np.argsort(pvalues)
    m, adjusted, running = len(pvalues), [0.0] * len(pvalues), 0.0
    for rank, i in enumerate(order):
        running = max(running, (m - rank) * pvalues[i])
        adjusted[i] = min(1.0, running)
    return adjusted


def run_all(oof: pd.DataFrame, targets: list[str], feature_sets: list[str]) -> dict:
    friedman, vs_baseline, runtime, tree_pair = [], [], [], []
    for target in targets:
        for fset in feature_sets:
            cols = {m: pred_column(target, fset, m) for m in MODELS}
            block = per_store_mae(oof, target, cols)
            friedman.append({"target": target, "feature_set": fset, **friedman_block(block)})
            for m in MODELS[1:]:
                vs_baseline.append({"target": target, "feature_set": fset, "model": m,
                                    **wilcoxon_pair(block[m].to_numpy(), block["baseline"].to_numpy())})
        for m in MODELS[1:]:
            pair = per_store_mae(oof, target, {"S+R": pred_column(target, "S+R", m), "S": pred_column(target, "S", m)})
            runtime.append({"target": target, "model": m, **wilcoxon_pair(pair["S+R"].to_numpy(), pair["S"].to_numpy())})
        pair = per_store_mae(oof, target, {"rf": pred_column(target, "S+R", "random_forest"),
                                           "xgb": pred_column(target, "S+R", "xgboost")})
        tree_pair.append({"target": target, "feature_set": "S+R",
                          **wilcoxon_pair(pair["rf"].to_numpy(), pair["xgb"].to_numpy())})
    for family in (vs_baseline, runtime, tree_pair):
        for row, p in zip(family, holm([r["p_wilcoxon"] for r in family])):
            row["p_holm"] = p
    for row, p in zip(friedman, holm([r["p"] for r in friedman])):
        row["p_holm"] = p
    return {"friedman": friedman, "vs_baseline": vs_baseline, "runtime_sr_vs_s": runtime, "rf_vs_xgb": tree_pair}
