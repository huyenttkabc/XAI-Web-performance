"""Đầu ra learning curve: mỗi target một biểu đồ đường SVG và một báo cáo Markdown sinh tự động."""
from pathlib import Path

COLORS = {"baseline": "#7f7f7f", "ridge": "#0072B2", "random_forest": "#D55E00", "xgboost": "#009E73"}
LABELS = {"baseline": "Baseline", "ridge": "Ridge", "random_forest": "Random Forest", "xgboost": "XGBoost"}
TARGET_LABELS = {"lh_lcp_ms": "LCP", "tbt_30s_ms": "TBT30"}


def _series_key(row):
    return (row["model"], row["feature_set"])


def learning_curve_svg(rows: list[dict], target: str, width=640, height=380) -> str:
    """rows: các bản ghi tóm tắt của một target, có khóa model, feature_set, train_sites, mae_mean/min/max."""
    left, right, top, bottom = 70, 170, 40, 50
    xs = [r["train_sites"] for r in rows]
    ys = [v for r in rows for v in (r["mae_min"], r["mae_max"])]
    x0, x1 = 0, max(xs) * 1.05
    y0, y1 = min(ys) * 0.9, max(ys) * 1.05
    sx = lambda x: left + (x - x0) / (x1 - x0) * (width - left - right)
    sy = lambda y: height - bottom - (y - y0) / (y1 - y0) * (height - top - bottom)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" font-family="Helvetica, Arial, sans-serif" font-size="12">',
           f'<rect width="{width}" height="{height}" fill="white"/>',
           f'<text x="{left}" y="22" font-size="14" font-weight="bold">Learning curve — {TARGET_LABELS[target]} (development stores)</text>',
           f'<line x1="{left}" y1="{height - bottom}" x2="{width - right}" y2="{height - bottom}" stroke="#333"/>',
           f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height - bottom}" stroke="#333"/>',
           f'<text x="{(left + width - right) / 2}" y="{height - 12}" text-anchor="middle">Training stores per fold</text>',
           f'<text transform="translate(16,{(top + height - bottom) / 2}) rotate(-90)" text-anchor="middle">Out-of-fold MAE (ms)</text>']
    for k in range(6):  # y ticks
        v = y0 + k * (y1 - y0) / 5
        out.append(f'<line x1="{left - 4}" y1="{sy(v):.1f}" x2="{width - right}" y2="{sy(v):.1f}" stroke="#eee"/>')
        out.append(f'<text x="{left - 8}" y="{sy(v) + 4:.1f}" text-anchor="end">{v:,.0f}</text>')
    for x in sorted(set(round(v) for v in xs)):  # x ticks at the measured sizes
        out.append(f'<text x="{sx(x):.1f}" y="{height - bottom + 18}" text-anchor="middle">{x}</text>')
    series = {}
    for r in rows:
        series.setdefault(_series_key(r), []).append(r)
    for i, ((model, fset), pts) in enumerate(sorted(series.items())):
        pts = sorted(pts, key=lambda p: p["train_sites"])
        dash = ' stroke-dasharray="5,4"' if fset == "S" else ""
        color = COLORS[model]
        path = " ".join(f"{'M' if j == 0 else 'L'}{sx(p['train_sites']):.1f},{sy(p['mae_mean']):.1f}" for j, p in enumerate(pts))
        out.append(f'<path d="{path}" fill="none" stroke="{color}" stroke-width="2"{dash}/>')
        for p in pts:  # khoảng qua các lần bốc ngẫu nhiên
            out.append(f'<line x1="{sx(p["train_sites"]):.1f}" y1="{sy(p["mae_min"]):.1f}" x2="{sx(p["train_sites"]):.1f}" '
                       f'y2="{sy(p["mae_max"]):.1f}" stroke="{color}" stroke-opacity="0.5"/>')
            out.append(f'<circle cx="{sx(p["train_sites"]):.1f}" cy="{sy(p["mae_mean"]):.1f}" r="3" fill="{color}"/>')
        ly = top + 10 + i * 18
        out.append(f'<line x1="{width - right + 12}" y1="{ly}" x2="{width - right + 36}" y2="{ly}" stroke="{color}" stroke-width="2"{dash}/>')
        out.append(f'<text x="{width - right + 42}" y="{ly + 4}">{LABELS[model]}{"" if model == "baseline" else " " + fset}</text>')
    out.append(f'<text x="{width - right + 12}" y="{height - bottom}" font-size="10" fill="#555">dots: mean; bars: min–max</text>')
    out.append("</svg>")
    return "\n".join(out)


def write_learning_curve_report(path: Path, config: dict, summary: list[dict], figures: dict[str, str]) -> None:
    """summary: bản ghi có target, model, feature_set, size, train_sites, repeats, mae_mean/min/max."""
    lines = ["# Learning curve — RQ1/RQ2 (development stores)", "",
             "> Sinh tự động bởi `scripts/build_learning_curve.py`. Không sửa tay.",
             f"> Run `{config['run_id']}` · dataset sha256 `{config['dataset']['dataset_sha256'][:16]}…` · seed {config['seed']} · "
             f"{config['dataset']['dev_sites']} store dev. **Lockbox không được dùng.**",
             f"> Mỗi điểm = MAE out-of-fold gộp trên toàn bộ {config['dataset']['dev_rows']} dòng dev; fold test giữ nguyên, "
             f"chỉ huấn luyện trên n store ngẫu nhiên của fold train; cùng pipeline và lưới tuning như run chính. "
             f"Mỗi mức n nhỏ lặp {config['repeats']} lần bốc ngẫu nhiên.", ""]
    for target, fig in figures.items():
        lines += [f"## {TARGET_LABELS[target]}", "", f"![learning curve {TARGET_LABELS[target]}]({fig})", "",
                  "| mô hình | bộ | " + " | ".join(f"n = {s['size']} (~{s['train_sites']:.0f} store)" for s in summary
                                                   if s["target"] == target and s["model"] == "baseline") + " | Δ% từ mức áp chót → toàn bộ |",
                  "|---|---|" + "---|" * (sum(1 for s in summary if s["target"] == target and s["model"] == "baseline") + 1)]
        keys = []
        for s in summary:
            if s["target"] == target and (s["model"], s["feature_set"]) not in keys:
                keys.append((s["model"], s["feature_set"]))
        for model, fset in keys:
            pts = [s for s in summary if s["target"] == target and s["model"] == model and s["feature_set"] == fset]
            cells = [f"{p['mae_mean']:,.0f} [{p['mae_min']:,.0f}–{p['mae_max']:,.0f}]" for p in pts]
            change = (pts[-1]["mae_mean"] - pts[-2]["mae_mean"]) / pts[-2]["mae_mean"] * 100
            lines.append(f"| {LABELS[model]} | {fset} | " + " | ".join(cells) + f" | {change:+.1f}% |")
        lines.append("")
    lines += ["## Cách đọc", "",
              "- Ô bảng: MAE trung bình (ms) qua các lần bốc [min–max].",
              "- Cột cuối: thay đổi MAE khi tăng từ mức n áp chót lên toàn bộ store train. Càng gần 0 thì đường cong càng phẳng (dữ liệu gần bão hòa); "
              "giảm rõ (ví dụ < −5%) nghĩa là thêm store có thể còn giúp.",
              "- Chỉ đo được tới khoảng 46–52 store train mỗi fold, nên không ngoại suy chính xác cho cỡ mẫu lớn hơn.", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
