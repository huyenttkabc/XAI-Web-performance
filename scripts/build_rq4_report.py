"""Hình / bảng RQ4 cho manuscript từ dữ liệu case study (không tính lại SHAP hay đo lại).

Dùng: npm run rq4:report
Đọc  data/processed/case-study/{baseline,after}.csv, before-after.json (scripts/build_rq4_before_after.py) và
     data/processed/model-runs/rq4-diagnosis-261111-{fullbg,after}/page-summary.json
Ghi  docs/figures/table-9-case-study-before-after.tex và docs/figures/figure-7-case-study.tex
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CS = ROOT / "data/processed/case-study"
RUNS = ROOT / "data/processed/model-runs"
FIG = ROOT / "docs/figures"
GROUPS = [("lcp_resource", "LCP resource"), ("main_thread_js", "Main-thread JS"), ("third_party", "Third party"),
          ("render_blocking", "Render-blocking"), ("dom_layout", "DOM / layout")]
PAGES = [("home", "Home"), ("product", "Product")]


def ms(v):
    return f"{v:,.0f}"


def signed(v):
    return f"$-${ms(-v)}" if v < 0 else f"$+${ms(v)}"


def table9(ba, before_diag, after_diag):
    lines = [r"\begin{tabular}{@{}llrrrc@{}}", r"\toprule",
             r"\textbf{Page} & \textbf{Metric} & \textbf{Before} & \textbf{After} & \textbf{Change} & \textbf{$\Delta$ median [95\% CI]} \\",
             r"\midrule"]
    for page, label in PAGES:
        for col, name in (("lh_lcp_ms", "LCP"), ("tbt_30s_ms", "TBT30"), ("lh_fcp_ms", "FCP")):
            r = ba["pages"][page]["outcomes"][col]
            lo, hi = r["diff_ci95"]
            lines.append(f"{label} & {name} & {ms(r['before_median'])} & {ms(r['after_median'])} & "
                         f"{'$-$' if r['pct_change'] < 0 else '$+$'}{abs(r['pct_change']):.1f}\\% & {signed(r['diff_median'])} [{signed(lo)}; {signed(hi)}] \\\\")
        if page == "home":
            lines.append(r"\midrule")
    lines += [r"\midrule", r"\multicolumn{6}{@{}l}{\textit{SHAP group scores for LCP of the product page (median of five runs, log scale)}} \\"]
    for g, name in GROUPS:
        b = before_diag["lh_lcp_ms|product"]["shap"]["group_score_median"][g]
        a = after_diag["lh_lcp_ms|product"]["shap"]["group_score_median"][g]
        fmt = lambda v: f"{'$-$' if v < 0 else '$+$'}{abs(v):.3f}"
        lines.append(f" & {name} & {fmt(b)} & {fmt(a)} & & \\\\")
    lines += [r"\bottomrule", r"\end{tabular}"]
    return "\n".join(lines) + "\n"


def runs(path, page, col):
    return [float(r[col]) / 1000 for r in csv.DictReader(open(path)) if r["status"] == "ok" and r["page_type"] == page]


def figure7():
    """Hai panel (LCP, TBT30): mỗi lần đo một chấm, trung vị là vạch; trước (chấm rỗng) và sau (chấm đặc)."""
    out = [r"\begin{tikzpicture}[x=1cm,y=1cm,font=\footnotesize]"]
    panels = [("lh_lcp_ms", "LCP (s)", 10, 2), ("tbt_30s_ms", "TBT30 (s)", 4, 1)]
    for p, (col, ylabel, ymax, step) in enumerate(panels):
        x0, h = p * 7.2, 4.5
        sy = h / ymax
        out.append(f"\\draw[->] ({x0},0) -- ({x0},{h + 0.3}) node[above] {{{ylabel}}};")
        out.append(f"\\draw ({x0},0) -- ({x0 + 6},0);")
        for t in range(0, ymax + 1, step):
            out.append(f"\\draw ({x0 - 0.08},{t * sy:.3f}) -- ({x0},{t * sy:.3f}) node[left] {{{t}}};")
            out.append(f"\\draw[gray!25] ({x0},{t * sy:.3f}) -- ({x0 + 6},{t * sy:.3f});")
        for k, (page, label) in enumerate(PAGES):
            for j, (src, style, name) in enumerate(((CS / "baseline.csv", "draw=black,fill=white", "before"),
                                                    (CS / "after.csv", "draw=black,fill=black", "after"))):
                xc = x0 + 1.0 + k * 3 + j * 1.2
                vals = sorted(runs(src, page, col))
                med = vals[len(vals) // 2]
                out.append(f"\\draw[very thick] ({xc - 0.35:.2f},{med * sy:.3f}) -- ({xc + 0.35:.2f},{med * sy:.3f});")
                for i, v in enumerate(vals):
                    out.append(f"\\filldraw[{style}] ({xc - 0.2 + 0.1 * i:.2f},{v * sy:.3f}) circle (1.6pt);")
                out.append(f"\\node[below] at ({xc:.2f},0) {{{name}}};")
            out.append(f"\\node[below] at ({x0 + 1.6 + k * 3:.2f},-0.4) {{\\textbf{{{label}}}}};")
    out.append(r"\end{tikzpicture}")
    return "\n".join(out) + "\n"


def main():
    ba = json.loads((CS / "before-after.json").read_text())
    before_diag = json.loads((RUNS / "rq4-diagnosis-261111-fullbg/page-summary.json").read_text())
    after_diag = json.loads((RUNS / "rq4-diagnosis-261111-after/page-summary.json").read_text())
    (FIG / "table-9-case-study-before-after.tex").write_text(table9(ba, before_diag, after_diag))
    (FIG / "figure-7-case-study.tex").write_text(figure7())
    print("wrote table-9 and figure-7")


if __name__ == "__main__":
    main()
