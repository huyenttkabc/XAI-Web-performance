"""Unit test của learning curve. Chạy: npm run test:ml"""
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.ml.evaluation_metrics import point_metrics  # noqa: E402
from src.ml.group_cross_validation import out_of_fold_predictions  # noqa: E402
from src.ml.learning_curve import ALL, learning_curve_points, summarise  # noqa: E402
from src.ml.model_specs import model_specs  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_modeling_pipeline import synthetic_rows  # noqa: E402


class LearningCurveTest(unittest.TestCase):
    def test_full_size_equals_main_out_of_fold_run(self):
        frame = synthetic_rows(n_sites=20)
        spec = model_specs()["ridge"]
        points = learning_curve_points(frame, ["x1", "x2"], "y", *spec, [ALL], repeats=3)
        pred, _ = out_of_fold_predictions(frame, ["x1", "x2"], "y", *spec)
        self.assertEqual(len(points), 1)  # cỡ "toàn bộ" là tất định: chỉ một lần bốc
        self.assertAlmostEqual(points[0]["mae"], point_metrics(frame["y"].to_numpy(), pred)["mae"], places=6)

    def test_subsample_uses_requested_store_count_and_is_reproducible(self):
        frame = synthetic_rows(n_sites=20)
        spec = model_specs()["ridge"]
        a = learning_curve_points(frame, ["x1", "x2"], "y", *spec, [6], repeats=2)
        b = learning_curve_points(frame, ["x1", "x2"], "y", *spec, [6], repeats=2)
        self.assertEqual([p["train_sites_mean"] for p in a], [6.0, 6.0])
        self.assertEqual([p["mae"] for p in a], [p["mae"] for p in b])
        self.assertNotEqual(a[0]["mae"], a[1]["mae"])  # các lần lặp là các lần bốc ngẫu nhiên khác nhau

    def test_summary_reports_mean_and_range(self):
        points = [{"size": 6, "repeat": r, "train_sites_mean": 6.0, "mae": m} for r, m in enumerate([10.0, 20.0])]
        (s,) = summarise(points)
        self.assertEqual((s["mae_mean"], s["mae_min"], s["mae_max"], s["repeats"]), (15.0, 10.0, 20.0, 2))
        self.assertTrue(np.isfinite(s["train_sites"]))


if __name__ == "__main__":
    unittest.main()
