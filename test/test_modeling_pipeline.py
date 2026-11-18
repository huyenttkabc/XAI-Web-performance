"""Unit test của pipeline mô hình RQ1–RQ2. Chạy: npm run test:ml"""
import hashlib
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.ml.evaluation_metrics import point_metrics, site_bootstrap  # noqa: E402
from src.ml.group_cross_validation import out_of_fold_predictions  # noqa: E402
from src.ml.model_specs import model_specs  # noqa: E402
from src.ml.modeling_dataset import feature_metadata, feature_set, load_modeling_rows, site_bucket  # noqa: E402


def synthetic_rows(n_sites=15, runs=4, seed=0):
    """y phụ thuộc x1 theo site; x2 là nhiễu. Fold theo hash của protocol."""
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n_sites):
        site, x1 = f"store{i}.example", rng.uniform(1, 10)
        for _ in range(runs):
            rows.append({"site": site, "x1": x1, "x2": rng.uniform(0, 1), "y": 1000 * x1 * rng.uniform(0.95, 1.05)})
    frame = pd.DataFrame(rows)
    frame["fold"] = frame["site"].map(lambda s: site_bucket(s, "fold"))
    return frame


class ModelingPipelineTest(unittest.TestCase):
    def test_site_bucket_matches_protocol_formula(self):
        expected = int(hashlib.sha1(b"fold:bark.co").hexdigest()[:8], 16) % 5
        self.assertEqual(site_bucket("bark.co", "fold"), expected)
        self.assertNotEqual([site_bucket(f"s{i}", "fold") for i in range(20)],
                            [site_bucket(f"s{i}", "lockbox") for i in range(20)])  # independent salts

    def test_feature_sets_apply_leakage_exclusions(self):
        meta = feature_metadata()
        s, sr_tbt, sr_lcp = feature_set(meta, "S", "tbt_30s_ms"), feature_set(meta, "S+R", "tbt_30s_ms"), feature_set(meta, "S+R", "lh_lcp_ms")
        self.assertTrue(set(s) < set(sr_tbt))
        self.assertNotIn("trace_long_task_total_ms", sr_tbt)  # L5 for TBT targets
        self.assertIn("trace_long_task_total_ms", sr_lcp)
        self.assertNotIn("bootup_js_ms", s)  # runtime features never in S

    def test_out_of_fold_predicts_every_row_and_beats_baseline(self):
        frame = synthetic_rows()
        specs = model_specs()
        pred, folds = out_of_fold_predictions(frame, ["x1", "x2"], "y", *specs["ridge"])
        base, _ = out_of_fold_predictions(frame, ["x1", "x2"], "y", *specs["baseline"])
        self.assertFalse(np.isnan(pred).any())
        self.assertEqual(sum(f["test_rows"] for f in folds), len(frame))
        y = frame["y"].to_numpy()
        self.assertLess(point_metrics(y, pred)["mae"], 0.5 * point_metrics(y, base)["mae"])

    def test_shuffled_labels_destroy_the_signal(self):
        frame = synthetic_rows()
        specs = model_specs()
        real, _ = out_of_fold_predictions(frame, ["x1", "x2"], "y", *specs["ridge"])
        fake, _ = out_of_fold_predictions(frame, ["x1", "x2"], "y", *specs["ridge"], shuffle_labels=True)
        y = frame["y"].to_numpy()
        self.assertLess(point_metrics(y, real)["mae"], point_metrics(y, fake)["mae"])

    def test_modeling_rows_exclude_lockbox_and_thin_pages(self):
        dev, summary = load_modeling_rows()
        self.assertFalse(dev["site"].map(lambda s: site_bucket(s, "lockbox") == 0).any())
        self.assertFalse(set(dev["site"]) & set(summary["lockbox_sites"]))
        self.assertGreaterEqual(dev.groupby(["site", "page_type"])["run"].nunique().min(), 4)
        self.assertFalse(dev.duplicated(["site", "page_type", "run"]).any())
        self.assertTrue((dev["status"] == "ok").all())

    def test_site_bootstrap_delta_is_negative_when_model_is_better(self):
        y = np.array([10.0, 12, 20, 22, 30, 32])
        sites = np.array(["a", "a", "b", "b", "c", "c"])
        result = site_bootstrap(y, y + 1, np.full(6, 21.0), sites, n=200)
        self.assertLess(result["delta_mae_ci95"][1], 0)


if __name__ == "__main__":
    unittest.main()
