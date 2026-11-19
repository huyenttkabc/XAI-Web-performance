"""Metric kiểm chứng giải thích RQ3 trên testbed (protocol §8, manuscript §3.9; amendment 08/11/2026).

Hàm thuần trên bảng điểm nhóm: mỗi dòng một phép đo được giải thích, mỗi cột một nhóm được xếp hạng.
Nhóm bị cấy lỗi là đáp án; hòa điểm được xử lý bảo thủ (lấy hạng tệ nhất trong các nhóm hòa).
"""
import numpy as np
import pandas as pd
from scipy import stats

RANKED_GROUPS = ["main_thread_js", "dom_layout", "lcp_resource", "render_blocking", "third_party"]
CHANCE = {"hit1": 1 / 5, "hit3": 3 / 5, "mrr": float(np.mean([1 / r for r in range(1, 6)]))}


def eligible_conditions(bed: pd.DataFrame, target: str) -> set:
    """Các (lỗi, mức, loại trang) có trung vị lệch khỏi baseline cùng trang > 2 × IQR_base và > 5% median_base."""
    out = set()
    for page, rows in bed.groupby("page_type"):
        base = rows.loc[rows["fault_id"] == "none", target].astype(float)
        med, iqr = base.median(), base.quantile(0.75) - base.quantile(0.25)
        for (fault, sev), cond in rows[rows["fault_id"] != "none"].groupby(["fault_id", "severity_level"]):
            shift = cond[target].astype(float).median() - med
            if shift > 2 * iqr and shift > 0.05 * med:
                out.add((fault, int(sev), page))
    return out


def true_rank(scores: pd.DataFrame, truth: pd.Series) -> np.ndarray:
    """Hạng (từ 1) của nhóm bị cấy lỗi; hòa thì tính bất lợi cho nó (hạng = số nhóm có điểm >= nó)."""
    s = scores[RANKED_GROUPS].to_numpy(float)
    idx = truth.map(RANKED_GROUPS.index).to_numpy()
    own = s[np.arange(len(s)), idx][:, None]
    return (s >= own).sum(axis=1)


def top_k(scores: pd.DataFrame, k: int = 3) -> list[frozenset]:
    order = np.argsort(-scores[RANKED_GROUPS].to_numpy(float), axis=1, kind="stable")[:, :k]
    return [frozenset(RANKED_GROUPS[j] for j in row) for row in order]


def jaccard(a: frozenset, b: frozenset) -> float:
    return len(a & b) / len(a | b)


def rank_metrics(rank: np.ndarray) -> dict:
    return {"n": int(len(rank)), "hit1": float(np.mean(rank == 1)), "hit3": float(np.mean(rank <= 3)),
            "mrr": float(np.mean(1 / rank))}


def bootstrap_ci(rank: np.ndarray, cluster: np.ndarray, n_boot: int = 1000, seed: int = 42) -> dict:
    """CI 95% (percentile) của Hit@1, Hit@3, MRR; bốc lại nguyên điều kiện (các lần lặp không độc lập)."""
    rng = np.random.default_rng(seed)
    ids = np.unique(cluster)
    members = {c: np.flatnonzero(cluster == c) for c in ids}
    draws = {m: [] for m in ("hit1", "hit3", "mrr")}
    for _ in range(n_boot):
        pick = np.concatenate([members[c] for c in rng.choice(ids, size=len(ids), replace=True)])
        for m, v in rank_metrics(rank[pick]).items():
            if m in draws:
                draws[m].append(v)
    return {m: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] for m, v in draws.items()}


def repetition_stability(scores: pd.DataFrame, condition: pd.Series) -> float:
    """Jaccard top-3 trung bình giữa từng cặp lần lặp của cùng điều kiện."""
    tops = pd.Series(top_k(scores), index=scores.index)
    vals = []
    for _, idx in condition.groupby(condition).groups.items():
        t = tops.loc[idx].tolist()
        vals += [jaccard(t[i], t[j]) for i in range(len(t)) for j in range(i + 1, len(t))]
    return float(np.mean(vals)) if vals else float("nan")


def dose_response(severity: pd.Series, own_score: pd.Series) -> float:
    """Spearman ρ giữa mức lỗi và điểm của nhóm bị cấy (NaN nếu < 2 mức)."""
    if severity.nunique() < 2 or own_score.nunique() < 2:
        return float("nan")
    return float(stats.spearmanr(severity, own_score).statistic)


def origin_discrimination(scores: pd.DataFrame, truth: pd.Series) -> float:
    """Chỉ cặp ghép (JS trang vs long task bên thứ ba): tỉ lệ nhóm đúng có điểm lớn hơn hẳn nhóm kia."""
    other = truth.map({"main_thread_js": "third_party", "third_party": "main_thread_js"})
    own_s = scores.to_numpy()[np.arange(len(scores)), scores.columns.get_indexer(truth)]
    other_s = scores.to_numpy()[np.arange(len(scores)), scores.columns.get_indexer(other)]
    return float(np.mean(own_s.astype(float) > other_s.astype(float)))


def reference_scores(X_test: pd.DataFrame, X_train: pd.DataFrame, base_train: pd.DataFrame, groups: dict) -> pd.DataFrame:
    """Xếp hạng không dùng mô hình: r_g = Σ_f∈g (x_f − median_base) / SD_f trên mọi dòng train cùng loại trang (amendment 08/11)."""
    sd = X_train.std(ddof=1)
    keep = sd.index[sd > 0]
    z = (X_test[keep] - base_train[keep].median()) / sd[keep]
    return pd.DataFrame({g: z[[f for f in keep if groups.get(f) == g]].sum(axis=1) for g in RANKED_GROUPS}, index=X_test.index)
