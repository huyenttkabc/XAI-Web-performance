"""Báo cáo Markdown của một lần chạy mô hình (docs/model-preliminary-report.md). Sinh tự động — không sửa tay."""
from pathlib import Path

TARGET_LABEL = {"lh_lcp_ms": "LCP", "tbt_30s_ms": "TBT30"}


def _ms(v):
    return f"{v:,.0f}".replace(",", ".")


def _ci(pair):
    return f"[{_ms(pair[0])}; {_ms(pair[1])}]"


def _table(header, rows):
    return [f"| {' | '.join(header)} |", f"|{'|'.join('---' for _ in header)}|", *[f"| {' | '.join(map(str, r))} |" for r in rows]]


def _verdict(row):
    lo, hi = row["delta_mae_ci95"]
    return "✅ thắng" if hi < 0 else ("❌ thua" if lo > 0 else "≈ không phân biệt")


def write_report(path: Path, config: dict, results: list[dict], rq2: list[dict], run_dir: Path):
    d = config["dataset"]
    lines = [
        "# Kết quả mô hình preliminary — RQ1/RQ2", "",
        "> Sinh tự động bởi `scripts/train_preliminary_models.py`. Không sửa tay.",
        f"> Run `{config['run_id']}` · dataset `{d['dataset_csv']}` sha256 `{d['dataset_sha256'][:16]}…` · seed {config['seed']} · "
        f"artifacts `{run_dir}`.",
        "> **Kết quả trên tập development (protocol §8.1):** cross-validation theo site, chưa phải đánh giá xác nhận. "
        "Không đổi feature, lưới hay target dựa trên các số này. Lockbox chưa mở.", "",
        "## 1. Dữ liệu", "",
        *_table(["mục", "giá trị"], [
            ["dòng hợp lệ (site thật)", d["valid_rows"]], ["trang hợp lệ", d["pages_valid"]],
            ["trang bị loại (< 4 lần hợp lệ)", d["pages_dropped_lt_min_runs"]],
            ["site lockbox (giữ lại)", len(d["lockbox_sites"])],
            ["**dev:** site / trang / dòng", f"{d['dev_sites']} / {d['dev_pages']} / {d['dev_rows']}"],
            ["site theo fold", d["dev_sites_per_fold"]], ["site theo tầng", d["dev_sites_per_stratum"]],
            ["dòng LCP ≥ 55 s (sát cửa sổ)", d["lcp_near_window_rows"]]]), "",
    ]
    for target, label in TARGET_LABEL.items():
        rows = [r for r in results if r["target"] == target]
        shuffled = {(r["feature_set"], r["model"]): r for r in rows if r["shuffled"]}
        real = [r for r in rows if not r["shuffled"]]
        lines += [f"## {2 + list(TARGET_LABEL).index(target)}. {label} (`{target}`)", "",
                  "ΔMAE = MAE(mô hình) − MAE(baseline), âm là tốt hơn. CI 95% bootstrap theo site.", "",
                  *_table(["bộ", "mô hình", "MAE (ms)", "MAE CI95", "RMSE", "R²", "MdAPE", "ΔMAE", "ΔMAE CI95", "so với baseline",
                           "MAE shuffled"],
                          [[r["feature_set"], r["model"], _ms(r["pooled"]["mae"]), _ci(r["mae_ci95"]), _ms(r["pooled"]["rmse"]),
                            f"{r['pooled']['r2']:.3f}", f"{100 * r['pooled']['mdape']:.0f}%", _ms(r["delta_mae_vs_baseline"]), _ci(r["delta_mae_ci95"]),
                            "–" if r["model"] == "baseline" else _verdict(r),
                            _ms(shuffled[(r["feature_set"], r["model"])]["pooled"]["mae"]) if (r["feature_set"], r["model"]) in shuffled else "–"]
                           for r in real]), "",
                  "**MAE theo fold (ms)**", "",
                  *_table(["bộ", "mô hình", *[f"fold {f['fold']} ({f['test_sites']} site)" for f in real[0]["folds"]]],
                          [[r["feature_set"], r["model"], *[_ms(f["mae"]) for f in r["per_fold"]]] for r in real]), ""]
        if any("pooled_without_near_window" in r for r in real):
            lines += ["**Độ nhạy:** MAE khi bỏ các dòng LCP ≥ 55 s khỏi đánh giá", "",
                      *_table(["bộ", "mô hình", "MAE đầy đủ", "MAE bỏ dòng sát cửa sổ"],
                              [[r["feature_set"], r["model"], _ms(r["pooled"]["mae"]), _ms(r["pooled_without_near_window"]["mae"])]
                               for r in real]), ""]
        best = min((r for r in real if r["model"] != "baseline"), key=lambda r: r["pooled"]["mae"])
        lines += [f"**Site có lỗi lớn nhất — {best['model']} / {best['feature_set']}** (bias > 0: dự đoán cao hơn thực tế)", "",
                  *_table(["site", "tầng", "dòng", f"{label} median", "MAE", "bias"],
                          [[s["site"], s["stratum"], s["rows"], _ms(s["y_median"]), _ms(s["mae"]), _ms(s["bias"])]
                           for s in best["worst_sites"]]), ""]
    lines += ["## 4. RQ2 — runtime features thêm được bao nhiêu (S+R so với S)", "",
              "ΔMAE = MAE(S+R) − MAE(S), cùng mô hình, cùng fold, bootstrap ghép cặp theo site. Âm là R giúp ích. "
              "S+R chứa đại lượng đo cùng lần với target, nên đây là *cận trên*, không phải claim dự đoán trước khi chạy trang.", "",
              *_table(["target", "mô hình", "ΔMAE (ms)", "CI95", "kết luận"],
                      [[TARGET_LABEL[r["target"]], r["model"], _ms(r["delta_mae_vs_baseline"]), _ci(r["delta_mae_ci95"]),
                        _verdict(r).replace("thắng", "R giúp").replace("thua", "R làm tệ hơn")] for r in rq2]), "",
              "## 5. Sanity checks", "",
              "- Không site nào nằm ở cả train và test (assert trong mọi fold ngoài; tuning dùng GroupKFold theo site trên fold train).",
              "- Imputation (median + cột chỉ báo thiếu), log1p và chuẩn hóa nằm trong Pipeline, nên được fit trong fold.",
              "- Site lockbox bị loại trước mọi bước, kể cả EDA và leakage checklist.",
              "- Shuffled-label (1 hoán vị, không có CI): mô hình thật phải có MAE thấp hơn rõ so với cột *MAE shuffled*.",
              "- Độ nhạy LCP sát cửa sổ: *chấm lại* trên cùng dự đoán, không fit lại.", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
