"""GroupKFold ngoài theo site (fold cố định bằng hash, protocol §8) + tuning bằng GroupKFold trong.

Trả dự đoán out-of-fold theo ms. Tuning chỉ bao giờ thấy các site train của fold ngoài.
`shuffle_labels=True` hoán vị target của phần train (sanity check: mô hình có tín hiệu thật phải thắng nó).
"""
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import GridSearchCV, GroupKFold

from src.ml.model_specs import INNER_FOLDS, SEED


def _fit(estimator, grid, X, y, groups):
    if not grid:
        return clone(estimator).fit(X, y), {}
    n_inner = min(INNER_FOLDS, groups.nunique())
    search = GridSearchCV(clone(estimator), grid, cv=GroupKFold(n_splits=n_inner),
                          scoring="neg_mean_absolute_error", n_jobs=1, refit=True)
    search.fit(X, y, groups=groups)
    return search.best_estimator_, search.best_params_


def out_of_fold_predictions(dev: pd.DataFrame, features: list[str], target: str, estimator, grid,
                            shuffle_labels: bool = False, seed: int = SEED) -> tuple[np.ndarray, list[dict]]:
    """Dự đoán mọi dòng development bằng mô hình CHƯA TỪNG thấy site của nó. Trả (pred_ms, thông tin từng fold)."""
    rng = np.random.default_rng(seed)
    X = dev[features].astype(float)
    y_log = np.log1p(dev[target].astype(float).to_numpy())
    pred = np.full(len(dev), np.nan)
    folds = []
    for fold in sorted(dev["fold"].unique()):
        test = (dev["fold"] == fold).to_numpy()
        train_sites, test_sites = set(dev.loc[~test, "site"]), set(dev.loc[test, "site"])
        assert not train_sites & test_sites, f"site leakage between train and test in fold {fold}"
        y_train = rng.permutation(y_log[~test]) if shuffle_labels else y_log[~test]
        model, params = _fit(estimator, grid, X[~test], y_train, dev.loc[~test, "site"])
        pred[test] = np.expm1(model.predict(X[test]))
        folds.append({"fold": int(fold), "train_sites": len(train_sites), "test_sites": len(test_sites),
                      "test_rows": int(test.sum()), "best_params": params})
    return pred, folds
