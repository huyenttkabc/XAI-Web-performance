"""Attribution SHAP cho RQ3 (manuscript §3.9): interventional với background là baseline; path-dependent để kiểm tra độ nhạy.

Tính trên bước `model` của pipeline (sau imputer/log/chuẩn hóa), trên thang log1p của target. Cột chỉ báo thiếu
do imputer thêm vào được gộp về feature gốc, nên mỗi φ thuộc đúng một predictor.
"""
import numpy as np
import pandas as pd
import shap

from src.ml.explanation_metrics import RANKED_GROUPS


def _transformed(pipeline, X: pd.DataFrame) -> pd.DataFrame:
    pre = pipeline[:-1]
    names = [n.removeprefix("missingindicator_") for n in pre.get_feature_names_out(X.columns)]
    return pd.DataFrame(pre.transform(X), columns=names, index=X.index)


def shap_values(pipeline, X_explain: pd.DataFrame, X_background: pd.DataFrame, variant: str) -> tuple[pd.DataFrame, float]:
    """Trả (φ theo feature gốc cho mọi dòng X_explain, base value E[f]). variant: interventional | path_dependent."""
    model = pipeline.named_steps["model"]
    Xe, Xb = _transformed(pipeline, X_explain), _transformed(pipeline, X_background)
    if hasattr(model, "coef_"):
        if variant != "interventional":
            raise ValueError("a linear model has only the interventional explanation")
        explainer = shap.LinearExplainer(model, shap.maskers.Independent(Xb.to_numpy(), max_samples=len(Xb)))
    elif variant == "interventional":
        # masker tường minh: nếu không, TreeExplainer tự lấy mẫu con khi background > 100 dòng;
        # với background baseline của RQ3 (< 100 dòng) kết quả như nhau
        masker = shap.maskers.Independent(Xb.to_numpy(), max_samples=len(Xb))
        explainer = shap.TreeExplainer(model, data=masker, feature_perturbation="interventional")
    else:
        explainer = shap.TreeExplainer(model, feature_perturbation="tree_path_dependent")
    phi = pd.DataFrame(explainer.shap_values(Xe.to_numpy()), columns=Xe.columns, index=Xe.index)
    phi = phi.T.groupby(level=0, sort=False).sum().T  # cột chỉ báo thiếu + feature gốc -> một φ
    base = float(np.ravel(explainer.expected_value)[0])
    return phi[list(X_explain.columns)], base


def group_scores(phi: pd.DataFrame, phi_base_mean: pd.Series, groups: dict, magnitude: bool = False) -> pd.DataFrame:
    """s_g = Σ_f∈g (φ_f − φ̄_f^base), có dấu; magnitude=True cộng |·| (phân tích độ nhạy)."""
    d = phi - phi_base_mean[phi.columns]
    if magnitude:
        d = d.abs()
    return pd.DataFrame({g: d[[f for f in phi.columns if groups.get(f) == g]].sum(axis=1) for g in RANKED_GROUPS},
                        index=phi.index)
