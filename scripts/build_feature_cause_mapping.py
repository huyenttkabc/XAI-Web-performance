"""Mapping feature → cause group cho RQ3, kiểm tra trên testbed.

Với mỗi lỗi và mỗi predictor: Spearman ρ giữa mức lỗi (0 = baseline, 1–3) và feature, trên các phép đo testbed
hợp lệ của lỗi đó cộng baseline (cả hai loại trang). Feature thuộc nhóm của lỗi làm nó thay đổi; ρ lớn dưới lỗi
của nhóm *khác* là chồng lấn đã biết mà RQ3 phải báo cáo.

Dùng: npm run ml:feature-mapping
Ghi docs/feature-cause-group-mapping.md. Chỉ dùng nhánh có kiểm soát (không dữ liệu site thật, không lockbox).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402
from scipy import stats  # noqa: E402

from src.ml.modeling_dataset import feature_metadata  # noqa: E402

FAULTS = {"js-long-task": "main_thread_js", "dom-bloat": "dom_layout", "lcp-heavy-image": "lcp_resource",
          "render-blocking-css": "render_blocking", "third-party-scripts": "third_party", "third-party-long-task": "third_party"}
SHORT = {"js-long-task": "JS", "dom-bloat": "DOM", "lcp-heavy-image": "Ảnh LCP", "render-blocking-css": "CSS",
         "third-party-scripts": "3P script", "third-party-long-task": "3P long task"}
STRONG = 0.8  # |ρ| từ ngưỡng này trở lên = feature "bị lỗi làm thay đổi"


def rho(frame: pd.DataFrame, feature: str) -> float:
    """Spearman ρ(mức lỗi, feature); NaN nếu feature là hằng số (không mang tín hiệu)."""
    x = frame[feature].astype(float)
    if x.nunique(dropna=True) < 2:
        return float("nan")
    return float(stats.spearmanr(frame["severity_level"].astype(int), x, nan_policy="omit").statistic)


def main():
    rows = pd.read_csv(ROOT / "data/processed/dataset-v1.0.csv", low_memory=False)
    bed = rows[(rows["site_type"] == "controlled_testbed") & (rows["status"] == "ok")]
    base = bed[bed["fault_id"] == "none"]
    meta = feature_metadata()["features"]
    L = ["# Mapping feature → cause group (chuẩn bị RQ3)", "",
         "> Sinh tự động bởi `scripts/build_feature_cause_mapping.py`. Không sửa tay. Chỉ dùng dữ liệu testbed (dataset v1.0, "
         f"{len(bed)} phép đo hợp lệ).",
         "> Ô = Spearman ρ giữa mức lỗi (0 = baseline, 1–3) và feature, trên phép đo của lỗi đó cộng baseline. "
         f"**In đậm** khi |ρ| ≥ {STRONG}. ✓ = lỗi thuộc chính nhóm của feature; ⚠ = lỗi của nhóm khác cũng làm feature thay đổi mạnh (chồng lấn).", "",
         "| feature | bộ | nhóm | dùng xếp hạng RQ3 | " + " | ".join(SHORT[f] for f in FAULTS) + " |",
         "|---|---|---|---|" + "---|" * len(FAULTS)]
    overlaps = []
    for f in meta:
        name, group = f["name"], f["group"]
        cells = []
        for fault, fgroup in FAULTS.items():
            r = rho(pd.concat([base, bed[bed["fault_id"] == fault]]), name)
            if r != r:  # NaN: hằng số trên testbed
                cells.append("–")
                continue
            strong = abs(r) >= STRONG
            mark = (" ✓" if fgroup == group else " ⚠") if strong else ""
            cells.append(f"**{r:.2f}**{mark}" if strong else f"{r:.2f}")
            if strong and fgroup != group and group not in ("mixed", "server"):
                overlaps.append(f"`{name}` ({group}) bị lỗi **{SHORT[fault]}** ({fgroup}) làm thay đổi mạnh (ρ = {r:.2f})")
        ranked = "không (mixed/server)" if group in ("mixed", "server") else "có"
        L.append(f"| `{name}` | {'S' if f['family'] == 'structural' else 'R'} | {group} | {ranked} | " + " | ".join(cells) + " |")
    L += ["", "## Chồng lấn giữa các nhóm (cần báo cáo riêng ở RQ3)", ""]
    L += [f"- {o}" for o in overlaps] or ["- Không có."]
    L += ["", "## Ghi chú", "",
          "- Nhóm `mixed` (tổng toàn trang) và `server` vẫn dùng cho RQ1–RQ2 nhưng không được tính điểm nhóm ở RQ3.",
          "- Feature có ô `–` là hằng số trên testbed (ví dụ server response time trên localhost), nên không thể mang tín hiệu nguyên nhân ở RQ3.",
          "- ρ ≥ 0,8 chỉ cho thấy lỗi *làm thay đổi* feature (manipulation check); không phải bằng chứng SHAP sẽ xếp đúng nhóm.", ""]
    (ROOT / "docs/feature-cause-group-mapping.md").write_text("\n".join(L), encoding="utf-8")
    print("wrote docs/feature-cause-group-mapping.md;", len(overlaps), "overlaps")


if __name__ == "__main__":
    main()
