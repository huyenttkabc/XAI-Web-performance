"""Bốn mô hình RQ1–RQ2 và lưới tham số nhỏ, đăng ký trước (protocol §8.1).

Mọi bước tiền xử lý nằm TRONG sklearn Pipeline, nên imputation và chuẩn hóa chỉ được fit trên phần
train của từng fold (cả fold trong lẫn fold ngoài). Target được mô hình trên thang log1p bởi nơi gọi.
"""
import numpy as np
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler
from xgboost import XGBRegressor

SEED = 42
INNER_FOLDS = 4


def _impute():
    # Thiếu dữ liệu mang thông tin: third_party_main_thread_ms là NaN khi audit lỗi, và điều đó xảy ra ở trang
    # nặng → imputation median CỘNG cột chỉ báo thiếu 0/1 (protocol §10, 09/10/2026 (3)).
    return ("impute", SimpleImputer(strategy="median", add_indicator=True))


def model_specs(seed: int = SEED) -> dict:
    """tên -> (pipeline, lưới tham số). Lưới rỗng = không tuning (fit nguyên)."""
    return {
        # median target của fold train trên thang log1p; đổi ngược về ms chính là median theo ms
        # (đúng với n lẻ, là trung bình nhân của hai giá trị giữa khi n chẵn)
        "baseline": (DummyRegressor(strategy="median"), {}),
        "ridge": (
            Pipeline([
                _impute(),
                # feature bytes/ms đuôi dài và không âm → log1p trước khi chuẩn hóa (chỉ cho mô hình tuyến tính)
                ("log", FunctionTransformer(np.log1p, feature_names_out="one-to-one")),
                ("scale", StandardScaler()),
                ("model", Ridge()),
            ]),
            {"model__alpha": [0.1, 1, 10, 100, 1000]},
        ),
        "random_forest": (
            Pipeline([_impute(), ("model", RandomForestRegressor(n_estimators=500, random_state=seed, n_jobs=-1))]),
            {"model__min_samples_leaf": [2, 5, 10], "model__max_features": [0.33, 1.0]},
        ),
        "xgboost": (
            Pipeline([_impute(), ("model", XGBRegressor(
                n_estimators=300, subsample=0.8, colsample_bytree=0.8,
                random_state=seed, n_jobs=-1, verbosity=0))]),
            {"model__max_depth": [2, 4], "model__learning_rate": [0.03, 0.1]},
        ),
    }
