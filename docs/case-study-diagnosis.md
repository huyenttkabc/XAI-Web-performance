# RQ4 — Chẩn đoán store case study (baseline 11/11/2026)

- **Baseline:** `data/processed/case-study/baseline.csv`, 2 trang × 5 lần, 10/10 hợp lệ. Trang sản phẩm có cờ `load_timeout` ở cả 5 lần: trang chưa đạt sự kiện load sau 60 s vì script bên thứ ba còn tải. Đây là cờ thông tin, không làm lần đo bị loại.
- **Chẩn đoán:** run `rq4-diagnosis-261111-fullbg`. Mô hình Random Forest S+R v1.0 fit trên 157 store phát triển (lockbox đóng); interventional TreeSHAP với background là toàn bộ phép đo phát triển cùng loại trang.
  - Run `rq4-diagnosis-261111` dùng background bị thư viện SHAP tự rút còn 100 dòng, trái protocol, nên chỉ giữ làm hồ sơ. Kết quả xếp hạng của hai run như nhau.

## 1. Kết quả đo baseline (trung vị 5 lần)

| Trang | LCP | TBT30 | Trung vị store phát triển (LCP / TBT30) |
|---|---|---|---|
| Trang chủ | 4.287 ms | 2.183 ms | 11.367 / 5.121 ms |
| Trang sản phẩm | 8.320 ms | 2.281 ms | 7.653 / 5.351 ms |

Store **nhanh hơn store điển hình** ở trang chủ và ở TBT30. Chỉ có **LCP trang sản phẩm** chậm hơn trung vị.

## 2. Điểm nhóm SHAP (trung vị 5 lần, thang log; dương = làm chậm hơn store điển hình)

| Target / trang | Nhóm dương, giảm dần | Feature φ dương lớn nhất trong nhóm đầu |
|---|---|---|
| LCP / sản phẩm | lcp_resource 0,101; main_thread_js 0,046; third_party 0,021; render_blocking 0,007 | `lcp_resource_bytes` (57 KB; store điển hình 40 KB) |
| LCP / trang chủ | dom_layout 0,012; main_thread_js 0,007 | gần 0, không đáng kể |
| TBT30 / trang chủ | lcp_resource 0,018; render_blocking 0,008 | `image_bytes`; giá trị của store *thấp hơn* store điển hình nên không phải điểm nghẽn thật |
| TBT30 / sản phẩm | lcp_resource 0,024; render_blocking 0,004 | `image_bytes`, cũng thấp hơn store điển hình |

Xếp hạng tham chiếu không dùng mô hình cũng đặt **lcp_resource** đầu tiên ở trang sản phẩm.

## 3. Kiểm tra trong trace (quy tắc ii): trang sản phẩm, lần đo có LCP trung vị

- Phần tử LCP là ảnh đầu tiên của gallery sản phẩm (WebP 56 KB, rộng 832 px). Ảnh đã có `fetchpriority=high`, không lazy-load, được phát hiện ngay trong HTML.
- Các giai đoạn LCP: TTFB 0,66 s, chờ tải 0,57 s, **tải ảnh 6,97 s (84%)**, render 0,12 s.
- Nguyên nhân ảnh tải lâu: trên mạng slow-4G, ảnh LCP phải chia băng thông với khoảng 1 MB tải cùng lúc:
  - **5 ảnh gallery còn lại** tải ngay khi mở trang, dù đang nằm ngoài màn hình: khoảng 310 KB.
  - **Mã tracking trong `<head>`**: gtag 156 KB, Meta 114 KB, TikTok 113 KB, GTM 90 KB, tổng khoảng 470 KB.
- Biến `bytes_before_lcp_request` (nhóm mixed) cao gấp đôi store điển hình (894 KB so với 457 KB) cũng cho thấy điều này.

## 4. Điểm sửa đề xuất (theo luật amendment 11/11)

| # | Nhóm SHAP (điểm) | Cách sửa | Feature kỳ vọng thay đổi |
|---|---|---|---|
| 1 | lcp_resource (0,101, LCP sản phẩm) | Chỉ tải ngay ảnh đầu của gallery; các ảnh 2–6 chuyển sang `loading="lazy"` | ít byte cạnh tranh với ảnh LCP, `image_bytes` giảm |
| 2 | main_thread_js (0,046) + third_party (0,021), LCP sản phẩm | Trì hoãn 4 mã tracking (GTM, gtag, Meta, TikTok) đến sau sự kiện load của trang | `script_requests`, `bytes_before_lcp_request`, dung lượng bên thứ ba trước LCP giảm |

- Trang chủ không có nhóm nào đáng kể, nên không có điểm sửa riêng. Điểm sửa 2 vẫn áp dụng cho cả trang chủ, vì mã tracking nằm trong layout chung.
- Hai nhóm dương ở TBT30 (`image_bytes`) có giá trị thấp hơn store điển hình, nên không được chọn làm điểm sửa riêng. Ghi lại như một ví dụ SHAP dương nhưng không phải điểm nghẽn.

## 5. Thực hiện sửa (11/11/2026, sau khi chủ store đồng ý)

| # | File theme (Horizon 4.5.0) | Thay đổi |
|---|---|---|
| 1 | `snippets/product-media-gallery-content.liquid` | Ở 2 vòng lặp slide của gallery, gán `media_loading = 'eager'` cho ảnh đầu tiên và `'lazy'` cho các ảnh còn lại, rồi truyền `loading: media_loading` vào 4 lệnh `render 'product-media'`. Kiểm tra: ảnh đầu `loading="eager" fetchpriority="high"`, 5 ảnh sau `loading="lazy"` |
| 2 | `snippets/marketing-tags-case-study.liquid` | Hàng đợi lệnh (`dataLayer`, `gtag`, `fbq`, `ttq`) vẫn khai báo ngay trong `<head>`; 4 thư viện (GTM, gtag, fbevents, TikTok events) chỉ được chèn sau sự kiện `load` của trang (~15–19 s ở baseline, trong cửa sổ 30 s của TBT30) |

Bản theme trước khi sửa được lưu ngoài repo để khôi phục. Không thay đổi gì khác trên store. Đo sau sửa: cùng profile, 2 trang × 5 lần.

## 6. Kết quả trước / sau (`scripts/build_rq4_before_after.py` → `data/processed/case-study/before-after.json`)

Mỗi trang 5 lần trước, 5 lần sau, 20/20 lần hợp lệ. Bảng ghi trung vị [IQR], phần trăm thay đổi, và chênh lệch trung vị kèm CI 95% bootstrap (1.000 lần, seed 42).

| Trang | Chỉ số | Trước | Sau | Thay đổi | Chênh lệch [CI 95%] |
|---|---|---|---|---|---|
| Sản phẩm | LCP | 8.320 [8.257–8.581] | 5.767 [5.530–5.882] | **−30,7%** | −2.553 [−3.072; −2.373] ms |
| Sản phẩm | TBT30 | 2.281 [2.270–2.382] | 1.935 [1.874–2.020] | **−15,2%** | −346 [−508; −62] ms |
| Sản phẩm | FCP | 1.106 | 1.323 | +19,6% | +217 [−327; +332] ms (không rõ) |
| Trang chủ | LCP | 4.287 [4.186–4.297] | 4.002 [3.982–4.010] | **−6,6%** | −285 [−496; −50] ms |
| Trang chủ | TBT30 | 2.183 [2.102–2.465] | 1.978 [1.972–1.993] | −9,4% | −205 [−1.177; +128] ms (không rõ) |

Các feature thay đổi đúng như kỳ vọng:
- Trang sản phẩm: dung lượng ảnh 432 KB → 77 KB; byte tải trước request LCP 894 KB → 529 KB.
- Trang chủ: byte tải trước request LCP 832 KB → 468 KB.
- Số script và dung lượng bên thứ ba không đổi, vì các script vẫn tải, chỉ tải muộn hơn.

**SHAP sau khi sửa (run `rq4-diagnosis-261111-after`):**
- Điểm nhóm lcp_resource ở LCP trang sản phẩm giảm từ 0,101 xuống 0,034. Dự đoán LCP của mô hình giảm từ 9,2 s xuống 7,4 s.
- Điểm main_thread_js và third_party **không giảm** (0,046 → 0,058; 0,021 → 0,025). Lý do: các feature của hai nhóm này là tổng của cả trang (số script, dung lượng bên thứ ba). Chúng không phản ánh *thời điểm* script được tải, nên không thấy được tác dụng của việc trì hoãn.

**Giới hạn:**
- Hai điểm sửa được áp dụng cùng lúc, nên không tách được phần cải thiện của từng điểm.
- Đây là kết quả trên một store, và hai đợt đo cách nhau khoảng 20 phút.
