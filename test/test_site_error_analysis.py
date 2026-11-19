"""Unit test cho phân tích RQ2 theo store / sai số. Chạy: npm run test:ml"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.ml.site_error_analysis import bias_by_decile, by_group, per_site_summary  # noqa: E402


def frame(n_sites=20, rows=5, seed=0):
    """20 store giả: mô hình "good" sát y (nhiễu 100 ms), baseline hằng 5.500 ms."""
    rng = np.random.default_rng(seed)
    out = []
    for i in range(n_sites):
        for _ in range(rows):
            y = rng.uniform(1000, 10000)
            out.append({"site": f"s{i}", "stratum": "heavy" if i % 2 else "light", "y": y,
                        "good": y + rng.normal(0, 100), "base": 5500.0})
    return pd.DataFrame(out)


class SiteErrorAnalysisTest(unittest.TestCase):
    def test_accurate_model_beats_baseline_on_every_store(self):
        s = per_site_summary(frame(), "y", "good", "base")
        self.assertEqual(s["n_sites"], 20)
        self.assertEqual(s["share_better_than_baseline"], 1.0)

    def test_by_group_reports_each_level_with_negative_delta(self):
        rows = by_group(frame(), "y", "good", "base", "stratum")
        self.assertEqual(sorted(r["level"] for r in rows), ["heavy", "light"])
        for r in rows:
            self.assertLess(r["delta_mae_ci95"][1], 0)

    def test_constant_baseline_overpredicts_low_and_underpredicts_high_deciles(self):
        d = bias_by_decile(frame(), "y", "base")
        self.assertEqual(len(d), 10)
        self.assertGreater(d[0]["bias_median"], 0)
        self.assertLess(d[-1]["bias_median"], 0)


if __name__ == "__main__":
    unittest.main()
