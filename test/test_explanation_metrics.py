"""Unit test cho metric giải thích RQ3 và điểm nhóm. Chạy: npm run test:ml"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.ml.explanation_attributions import group_scores  # noqa: E402
from src.ml.explanation_metrics import (CHANCE, RANKED_GROUPS, bootstrap_ci, eligible_conditions,  # noqa: E402
                                        origin_discrimination, rank_metrics, reference_scores,
                                        repetition_stability, true_rank)


def scores(*rows):
    return pd.DataFrame(rows, columns=RANKED_GROUPS)


class ExplanationMetricsTest(unittest.TestCase):
    def test_rank_counts_ties_against_the_injected_group(self):
        s = scores([3, 1, 0, 0, 0], [0, 2, 2, 0, 0], [0, 0, 0, 0, 0])
        r = true_rank(s, pd.Series(["main_thread_js", "dom_layout", "third_party"]))
        self.assertEqual(r.tolist(), [1, 2, 5])

    def test_rank_metrics_and_chance_levels(self):
        m = rank_metrics(np.array([1, 2, 4, 1]))
        self.assertEqual((m["hit1"], m["hit3"]), (0.5, 0.75))
        self.assertAlmostEqual(m["mrr"], (1 + 0.5 + 0.25 + 1) / 4)
        self.assertAlmostEqual(CHANCE["mrr"], 0.4567, places=4)

    def test_bootstrap_ci_contains_point_estimate(self):
        rank = np.array([1, 1, 2, 1, 3, 1, 1, 5])
        ci = bootstrap_ci(rank, np.repeat([0, 1, 2, 3], 2), n_boot=200)
        self.assertLessEqual(ci["hit1"][0], rank_metrics(rank)["hit1"])
        self.assertGreaterEqual(ci["hit1"][1], rank_metrics(rank)["hit1"])

    def test_identical_repetitions_are_perfectly_stable(self):
        s = scores([3, 2, 1, 0, 0], [3, 2, 1, 0, 0], [0, 0, 1, 2, 3], [0, 0, 1, 2, 3])
        self.assertEqual(repetition_stability(s, pd.Series(["a", "a", "b", "b"])), 1.0)

    def test_origin_discrimination_needs_a_strictly_higher_score(self):
        s = scores([2, 0, 0, 0, 1], [1, 0, 0, 0, 1], [0, 0, 0, 0, 3])
        d = origin_discrimination(s, pd.Series(["main_thread_js", "main_thread_js", "third_party"]))
        self.assertAlmostEqual(d, 2 / 3)

    def test_eligibility_requires_a_shift_beyond_noise(self):
        bed = pd.DataFrame({"page_type": "home", "fault_id": ["none"] * 4 + ["a"] * 3 + ["b"] * 3,
                            "severity_level": [0] * 4 + [1] * 6,
                            "y": [100, 102, 98, 101, 300, 310, 305, 101, 99, 103]})
        self.assertEqual(eligible_conditions(bed, "y"), {("a", 1, "home")})

    def test_group_scores_sum_centred_attributions_per_group(self):
        phi = pd.DataFrame({"f1": [1.0], "f2": [0.5], "f3": [-2.0]})
        groups = {"f1": "main_thread_js", "f2": "main_thread_js", "f3": "lcp_resource"}
        s = group_scores(phi, pd.Series({"f1": 0.5, "f2": 0.0, "f3": 0.0}), groups)
        self.assertEqual((s.loc[0, "main_thread_js"], s.loc[0, "lcp_resource"], s.loc[0, "third_party"]), (1.0, -2.0, 0.0))
        self.assertEqual(group_scores(phi, pd.Series(0.0, index=phi.columns), groups, magnitude=True).loc[0, "lcp_resource"], 2.0)

    def test_reference_skips_constant_features_and_uses_training_sd(self):
        train = pd.DataFrame({"img": [10.0, 10, 10, 50], "js": [1.0, 1, 1, 1]})
        groups = {"img": "lcp_resource", "js": "main_thread_js"}
        r = reference_scores(pd.DataFrame({"img": [50.0], "js": [9.0]}), train, train.iloc[:3], groups)
        self.assertAlmostEqual(r.loc[0, "lcp_resource"], 40 / train["img"].std())
        self.assertEqual(r.loc[0, "main_thread_js"], 0.0)


if __name__ == "__main__":
    unittest.main()
