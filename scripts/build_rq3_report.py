"""Báo cáo RQ3, Table 8 và Figure 5–6 từ một run RQ3 (không fit lại).

Dùng: npm run ml:rq3-report  (= scripts/build_rq3_report.py --run=rq3-testbed-261108)
Ghi <run>/results.json; docs/rq3-explanation-validation.md; docs/figures/{table-8-explanation-validation.tex,
figure-5-group-attributions.tex, figure-6-local-explanations.tex} (để manuscript \\input).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from src.ml.explanation_metrics import CHANCE, RANKED_GROUPS  # noqa: E402
from src.ml.modeling_dataset import feature_metadata  # noqa: E402
from src.ml.rq3_summary import (eligible_scores, group_profile, local_cases, model_agreement,  # noqa: E402
                                validation_table)
from src.ml.rq3_figures import figure5_tikz, figure6_tikz, table8_tex  # noqa: E402

TARGETS = {"lh_lcp_ms": "LCP", "tbt_30s_ms": "TBT30"}
MODELS = {"random_forest": "Random Forest", "xgboost": "XGBoost", "ridge": "Ridge", "reference": "Tham chiếu không mô hình"}


def pick(table, split, target, model, variant):
    return next(r for r in table if (r["split"], r["target"], r["model"], r["variant"]) == (split, target, model, variant))


def markdown(table, agreement, profile, cases, run):
    f2 = lambda v: "–" if v is None or v != v else f"{v:.2f}".replace(".", ",")
    ci = lambda c: f"[{f2(c[0])}; {f2(c[1])}]"
    L = ["# RQ3 — Kiểm chứng giải thích trên testbed", "",
         f"> Sinh tự động bởi `scripts/build_rq3_report.py` từ run `{run}`. Không sửa tay. Chỉ dùng testbed; lockbox không liên quan.",
         f"> Mức ngẫu nhiên với 5 nhóm: Hit@1 = {f2(CHANCE['hit1'])}, Hit@3 = {f2(CHANCE['hit3'])}, MRR = {f2(CHANCE['mrr'])}.", "",
         "## 1. Kết quả chính (chia theo lần lặp, chỉ phép đo đủ hiệu ứng)", "",
         "| Target | Mô hình | Biến thể | n | Hit@1 [CI 95%] | Hit@3 | MRR [CI 95%] | Ổn định giữa lần lặp | Phân biệt nguồn |", "|---|---|---|---|---|---|---|---|---|"]
    for r in table:
        if r["split"] == "repetition":
            L.append(f"| {TARGETS[r['target']]} | {MODELS[r['model']]} | {r['variant']} | {r['n']} | {f2(r['hit1'])} {ci(r['ci95']['hit1'])} | "
                     f"{f2(r['hit3'])} | {f2(r['mrr'])} {ci(r['ci95']['mrr'])} | {f2(r['stability_repetitions'])} | {f2(r['origin_discrimination'])} |")
    L += ["", "## 2. Theo lỗi (Random Forest, interventional)", "",
          "| Target | Lỗi | n | Hit@1 | Hit@3 | MRR | ρ liều–đáp ứng | Nhóm xếp đầu (số phép đo) |", "|---|---|---|---|---|---|---|---|"]
    for t in TARGETS:
        for fault, m in pick(table, "repetition", t, "random_forest", "interventional")["per_fault"].items():
            L.append(f"| {TARGETS[t]} | {fault} | {m['n']} | {f2(m['hit1'])} | {f2(m['hit3'])} | {f2(m['mrr'])} | "
                     f"{f2(m['dose_response_rho'])} | {', '.join(f'{k} {v}' for k, v in m['top1'].items())} |")
    L += ["", "## 3. Độ bền: leave-one-severity-out (train mức 0, 1, 3 → giải thích mức 2)", "",
          "| Target | Mô hình | Biến thể | n | Hit@1 | Hit@3 | MRR |", "|---|---|---|---|---|---|---|"]
    for r in table:
        if r["split"] == "leave_one_severity_out":
            L.append(f"| {TARGETS[r['target']]} | {MODELS[r['model']]} | {r['variant']} | {r['n']} | {f2(r['hit1'])} | {f2(r['hit3'])} | {f2(r['mrr'])} |")
    L += ["", "## 4. Đồng thuận Random Forest – XGBoost (Jaccard top-3 trên cùng phép đo)", ""]
    L += [f"- {TARGETS[t]}: {f2(v)}" for t, v in agreement.items()]
    L += ["", "## 5. Tỷ lệ |φ| theo nhóm (Random Forest, gồm cả nhóm mixed và server không được xếp hạng)", "",
          "| Target | Lỗi | " + " | ".join(RANKED_GROUPS + ["mixed", "server"]) + " |", "|---|---|" + "---|" * 7]
    for t, faults in profile.items():
        for fault, p in faults.items():
            L.append(f"| {TARGETS[t]} | {fault} | " + " | ".join(f"{100 * p['abs_share'][g]:.0f}%" for g in RANKED_GROUPS + ["mixed", "server"]) + " |")
    L += ["", "## 6. Ca local (luật chọn cố định: mức S2, trang home, điểm nhóm đúng ở trung vị)", ""]
    for c in cases:
        top = ", ".join(f"`{x['name']}` {x['phi']:+.3f}" for x in c["features"][:4])
        L.append(f"- **{c['fault']} / {TARGETS[c['target']]}** (lần lặp {c['run']}): quan sát {c['obs_ms']:,.0f} ms, dự đoán "
                 f"{c['pred_ms']:,.0f} ms, mốc baseline {c['base_ms']:,.0f} ms; nhóm đúng xếp hạng {c['rank']}, nhóm đầu `{c['top_group']}`. φ lớn nhất: {top}.")
    return "\n".join(L + [""])


def main():
    run = next(a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--run="))
    run_dir = ROOT / "data/processed/model-runs" / run
    config = json.loads((run_dir / "config.json").read_text())
    rows = pd.read_csv(ROOT / config["dataset"]["path"], low_memory=False)
    bed = rows[(rows["site_type"] == "controlled_testbed") & (rows["status"] == "ok")]
    groups = {f["name"]: f["group"] for f in feature_metadata()["features"]}
    sc = eligible_scores(pd.read_csv(run_dir / "group-scores.csv"), bed)
    phi_all = pd.read_csv(run_dir / "phi-features.csv")
    phi = eligible_scores(phi_all[phi_all["split"] == "repetition"], bed)

    table, agreement = validation_table(sc), model_agreement(sc)
    profile, cases = group_profile(phi, groups), local_cases(phi_all, sc, groups)
    results = {"run": run, "chance": CHANCE, "validation": table, "rf_xgb_top3_jaccard": agreement,
               "group_profile": profile, "local_cases": cases}
    (run_dir / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False, default=float))
    (ROOT / "docs/rq3-explanation-validation.md").write_text(markdown(table, agreement, profile, cases, run), encoding="utf-8")
    figs = ROOT / "docs/figures"
    (figs / "table-8-explanation-validation.tex").write_text(table8_tex(table), encoding="utf-8")
    (figs / "figure-5-group-attributions.tex").write_text(figure5_tikz(profile), encoding="utf-8")
    (figs / "figure-6-local-explanations.tex").write_text(figure6_tikz(cases), encoding="utf-8")
    print("wrote results.json, docs/rq3-explanation-validation.md, Table 8, Figures 5–6")


if __name__ == "__main__":
    main()
