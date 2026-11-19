"""Tóm tắt một run RQ3 (group-scores.csv, phi-features.csv) cho báo cáo, Table 8 và Figure 5–6.

Chỉ chấm các phép đo đủ hiệu ứng (lỗi thật sự làm xấu target, xét theo từng điều kiện).
"""
import numpy as np
import pandas as pd

from src.ml.explanation_metrics import (RANKED_GROUPS, bootstrap_ci, dose_response, eligible_conditions, jaccard,
                                        origin_discrimination, rank_metrics, repetition_stability, top_k)

PRIMARY = ("random_forest", "interventional")
MATCHED_PAIR = ["js-long-task", "third-party-long-task"]
# mỗi nhóm nguyên nhân một ca: (lỗi, target mà lỗi được thiết kế để làm xấu); bên thứ ba dùng lỗi của cặp ghép
CASES = [("lcp-heavy-image", "lh_lcp_ms"), ("render-blocking-css", "lh_lcp_ms"), ("dom-bloat", "lh_lcp_ms"),
         ("js-long-task", "tbt_30s_ms"), ("third-party-long-task", "tbt_30s_ms")]


def _condition(d: pd.DataFrame) -> pd.Series:
    return d["fault_id"] + "|" + d["severity_level"].astype(str) + "|" + d["page_type"]


def eligible_scores(scores: pd.DataFrame, bed: pd.DataFrame) -> pd.DataFrame:
    keep = []
    for target, d in scores.groupby("target"):
        el = eligible_conditions(bed, target)
        keep.append(d[[(f, int(s), p) in el for f, s, p in zip(d["fault_id"], d["severity_level"], d["page_type"])]])
    return pd.concat(keep)


def validation_table(sc: pd.DataFrame) -> list[dict]:
    """Theo (cách chia, target, mô hình, biến thể): metric gộp kèm CI bootstrap theo điều kiện, và theo từng lỗi."""
    out = []
    for (split, target, model, variant), d in sc.groupby(["split", "target", "model", "variant"]):
        rank = d["rank"].to_numpy()
        row = {"split": split, "target": target, "model": model, "variant": variant, **rank_metrics(rank),
               "ci95": bootstrap_ci(rank, _condition(d).to_numpy()),
               "stability_repetitions": repetition_stability(d[RANKED_GROUPS], _condition(d)),
               "per_fault": {f: {**rank_metrics(g["rank"].to_numpy()),
                                 "dose_response_rho": dose_response(g["severity_level"], g.apply(lambda r: r[r["cause_group"]], axis=1)),
                                 "top1": g[RANKED_GROUPS].idxmax(axis=1).value_counts().to_dict()}
                             for f, g in d.groupby("fault_id")}}
        pair = d[d["fault_id"].isin(MATCHED_PAIR)]
        row["origin_discrimination"] = origin_discrimination(pair[RANKED_GROUPS], pair["cause_group"]) if len(pair) else None
        out.append(row)
    return out


def model_agreement(sc: pd.DataFrame) -> dict:
    """Jaccard top-3 trung bình giữa Random Forest và XGBoost trên cùng phép đo (interventional, cách chia chính)."""
    out = {}
    for target, d in sc[(sc["split"] == "repetition") & (sc["variant"] == "interventional")].groupby("target"):
        a = d[d["model"] == "random_forest"].set_index("measurement_id")[RANKED_GROUPS]
        b = d[d["model"] == "xgboost"].set_index("measurement_id").loc[a.index, RANKED_GROUPS]
        out[target] = float(np.mean([jaccard(x, y) for x, y in zip(top_k(a), top_k(b))]))
    return out


def group_profile(phi: pd.DataFrame, groups: dict) -> dict:
    """Điểm nhóm có dấu trung bình và tỉ lệ |φ| theo nhóm (cả mixed, server), theo target và lỗi — mô hình chính."""
    feats = [c for c in phi.columns if c in groups]
    all_groups = RANKED_GROUPS + ["mixed", "server"]
    out = {}
    for (target, fault), d in phi.groupby(["target", "fault_id"]):
        g_sum = {g: d[[f for f in feats if groups[f] == g]].sum(axis=1) for g in all_groups}
        g_abs = {g: d[[f for f in feats if groups[f] == g]].abs().sum(axis=1).mean() for g in all_groups}
        total = sum(g_abs.values()) or 1.0
        out.setdefault(target, {})[fault] = {"n": int(len(d)), "mean_score": {g: float(v.mean()) for g, v in g_sum.items()},
                                             "abs_share": {g: float(v / total) for g, v in g_abs.items()}}
    return out


def local_cases(phi: pd.DataFrame, sc: pd.DataFrame, groups: dict, top: int = 6) -> list[dict]:
    """Ca local theo luật định trước: mức S2, trang home, phép đo có điểm nhóm đúng ở trung vị."""
    feats = [c for c in phi.columns if c in groups]
    prim = sc[(sc["split"] == "repetition") & (sc["model"] == PRIMARY[0]) & (sc["variant"] == PRIMARY[1])]
    cases = []
    for fault, target in CASES:
        d = prim[(prim["target"] == target) & (prim["fault_id"] == fault) & (prim["severity_level"] == 2) & (prim["page_type"] == "home")]
        if d.empty:
            continue
        own = d[d["cause_group"].iloc[0]].sort_values()
        mid = d.loc[own.index[(len(own) - 1) // 2]]
        p = phi[(phi["target"] == target) & (phi["measurement_id"] == mid["measurement_id"]) & (phi["split"] == "repetition")].iloc[0]
        contrib = p[feats].astype(float)
        order = contrib.abs().sort_values(ascending=False).index
        cases.append({"fault": fault, "target": target, "measurement_id": mid["measurement_id"], "run": int(mid["run"]),
                      "rank": int(mid["rank"]), "top_group": d.loc[mid.name, RANKED_GROUPS].astype(float).idxmax(),
                      "base_ms": float(np.expm1(p["base_value"])), "pred_ms": float(np.expm1(p["pred_log"])),
                      "obs_ms": float(np.expm1(p["obs_log"])),
                      "features": [{"name": f, "group": groups[f], "phi": float(contrib[f])} for f in order[:top]],
                      "rest_phi": float(contrib[order[top:]].sum())})
    return cases
