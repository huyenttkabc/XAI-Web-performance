"""Unit test của kiểm định ghép cặp theo store. Chạy: npm run test:ml"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.ml.paired_store_tests import holm, per_store_mae, wilcoxon_pair  # noqa: E402


class PairedStoreTestsTest(unittest.TestCase):
    def test_holm_matches_hand_computation(self):
        # p đã sắp: 0.01*3=0.03, 0.02*2=0.04, 0.04*1=0.04 (đơn điệu), trả về đúng thứ tự đầu vào
        self.assertEqual([round(p, 6) for p in holm([0.04, 0.01, 0.02])], [0.04, 0.03, 0.04])
        self.assertEqual(holm([0.6, 0.9]), [1.0, 1.0])  # chặn trên ở 1

    def test_per_store_mae_gives_one_value_per_store(self):
        oof = pd.DataFrame({"site": ["a", "a", "b"], "y": [10.0, 20.0, 30.0], "p": [12.0, 16.0, 30.0]})
        out = per_store_mae(oof, "y", {"m": "p"})
        self.assertEqual(out.loc["a", "m"], 3.0)
        self.assertEqual(out.loc["b", "m"], 0.0)

    def test_wilcoxon_detects_a_consistently_better_model(self):
        rng = np.random.default_rng(0)
        base = rng.uniform(100, 200, 40)
        better = base - rng.uniform(5, 15, 40)
        res = wilcoxon_pair(better, base)
        self.assertLess(res["p_wilcoxon"], 0.001)
        self.assertEqual(res["share_a_better"], 1.0)
        self.assertLess(res["median_diff"], 0)


if __name__ == "__main__":
    unittest.main()
