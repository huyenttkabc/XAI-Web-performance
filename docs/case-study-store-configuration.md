# RQ4 — Cấu hình store case study (trước khi đo baseline)

- **Store:** https://rspknd-fe.myshopify.com/ (gói Basic, đã tắt password)
- **Theme:** Horizon 4.5.0 (theme mặc định của Shopify), 20 sản phẩm mẫu
- **Trang đo:** trang chủ `/` và trang sản phẩm `/products/stylish-summer-neclace` (sản phẩm đầu tiên trong danh sách của store, chọn theo luật cố định)
- **Nguyên tắc:** cấu hình store theo các thành phần **phổ biến** trong mẫu, không cố tình tạo lỗi. Chỉ so sánh **thành phần trang** (số request, dung lượng, DOM) với mẫu, không xem LCP/TBT trong lúc cấu hình.
- **Nguồn số liệu:** `scripts/profile_development_store_composition.py` trên dataset v1.0, chỉ dùng 158 store phát triển (lockbox bị loại).

## 1. Thành phần phổ biến trong mẫu (tỷ lệ store có)

| Dịch vụ bên thứ ba | Tỷ lệ store | App Shopify tương ứng |
|---|---|---|
| Google Tag Manager / Analytics / Ads | 74–86% | Google & YouTube |
| Facebook (Meta pixel) | 72% | Facebook & Instagram |
| Google Fonts | 64% | (font chèn qua theme) |
| Bing Ads | 39% | Microsoft Channel |
| Microsoft Clarity | 35% | Microsoft Clarity |
| TikTok | 34% | TikTok |
| Klaviyo (email, popup) | 32% | Klaviyo |
| Judge.me (đánh giá sản phẩm) | 25% | Judge.me Product Reviews |
| Pinterest | 19% | Pinterest |
| Instafeed (nfcube) | 18% | Instafeed |

## 2. Thành phần trang trong mẫu (trung vị, khoảng tứ phân vị)

| Chỉ số | Trang chủ | Trang sản phẩm |
|---|---|---|
| Request bên thứ ba | 164 (111–221) | 190 (130–256) |
| Dung lượng bên thứ ba | 2,7 MB (1,6–3,9) | 2,8 MB (1,7–3,7) |
| Số request tổng | 318 (236–398) | 341 (266–429) |
| Tổng dung lượng | 5,9 MB (4,1–9,3) | 4,9 MB (3,6–6,0) |
| Dung lượng ảnh | 1,3 MB (0,8–2,6) | 0,6 MB (0,3–1,6) |
| Số phần tử DOM | 2.783 (1.793–4.607) | 2.213 (1.439–3.261) |
| LCP là ảnh | 87% | 88% |

## 3. Nhật ký cấu hình store

Mỗi thay đổi ghi một dòng. Ghi đủ ngày, việc đã làm, cài đặt chính.

| Ngày | Thay đổi | Cài đặt / ghi chú |
|---|---|---|
| 11/11/2026 | Tạo store, gói Basic, tắt password | Horizon 4.5.0, 20 sản phẩm mẫu, chưa có app |
| 11/11/2026 | Cài Klaviyo, Judge.me, Microsoft Clarity; trang chủ có slideshow và danh sách sản phẩm | Kiểm tra 15:55: Klaviyo tải trên cả 2 trang; Judge.me có widget trên trang sản phẩm; Clarity có app embed nhưng **chưa tải script** (chưa kết nối project?) |
| | | |

**Kiểm tra lần 1 (11/11, 1 lần đo mỗi trang, chỉ xem thành phần trang):**

| Chỉ số | Trang chủ | Trang sản phẩm | Khoảng tứ phân vị của mẫu (chủ / sản phẩm) |
|---|---|---|---|
| Request bên thứ ba | 128 | 251 | 111–221 / 130–256 |
| Dung lượng bên thứ ba | 0,45 MB | 0,87 MB | 1,6–3,9 / 1,7–3,7 MB |
| Tổng dung lượng | 1,8 MB | 2,5 MB | 4,1–9,3 / 3,6–6,0 MB |
| Dung lượng ảnh | 0,27 MB | 0,15 MB | 0,8–2,6 / 0,3–1,6 MB |
| Số phần tử DOM | 980 | 1.054 | 1.793–4.607 / 1.439–3.261 |

Dịch vụ bên thứ ba tải được: Klaviyo, Judge.me, shop.app. Chưa có: Google, Meta, TikTok, Clarity.

| Ngày | Thay đổi | Cài đặt / ghi chú |
|---|---|---|
| 11/11/2026 | Trang chủ: thêm 3 section mặc định của Horizon (qua Shopify CLI, chỉ sửa `templates/index.json`; bản sao lưu theme gốc giữ ngoài repo) | (1) "Editorial" (ảnh + chữ, ảnh có sẵn trong Files); (2) danh sách sản phẩm thứ hai dạng carousel, 12 sản phẩm; (3) "Featured product": Pretty Gold Necklace. Thứ tự: hero → lưới 8 sản phẩm → editorial → carousel → featured product |

**Kiểm tra lần 2 (11/11, trang chủ):** 262 request (bên thứ ba 128), tổng 1,96 MB (bên thứ ba 0,45 MB), ảnh 0,36 MB, DOM 1.863. DOM đã vào khoảng của mẫu; phần dung lượng còn thiếu chủ yếu là dung lượng bên thứ ba, sẽ do các app Google, Meta, TikTok bổ sung. Không thêm nội dung theme nữa.

| Ngày | Thay đổi | Cài đặt / ghi chú |
|---|---|---|
| 11/11/2026 | Không kết nối được app Google & YouTube, Facebook & Instagram, TikTok (store không chạy quảng cáo thật, không có tài khoản quảng cáo) → chèn **mã chuẩn của nhà cung cấp** vào theme | File `snippets/marketing-tags-case-study.liquid`, gọi trong `<head>` của `layout/theme.liquid` ngay trước `content_for_header`. Gồm: Google Tag Manager, Google tag (GA4 + Google Ads), Meta pixel, TikTok pixel. **ID là ID mẫu** (không có tài khoản thật); trình duyệt vẫn tải đúng các thư viện của nhà cung cấp |
| 11/11/2026 | Microsoft Clarity bắt đầu tải script | |

**Kiểm tra lần 3 (11/11, 1 lần đo mỗi trang):**

| Chỉ số | Trang chủ | Trang sản phẩm | Khoảng tứ phân vị của mẫu (chủ / sản phẩm) |
|---|---|---|---|
| Request bên thứ ba | 164 ✅ | 286 (cao hơn) | 111–221 / 130–256 |
| Dung lượng bên thứ ba | 1,28 MB (thấp hơn) | 1,76 MB ✅ | 1,6–3,9 / 1,7–3,7 MB |
| Tổng dung lượng | 2,84 MB (thấp hơn) | 3,34 MB (thấp hơn) | 4,1–9,3 / 3,6–6,0 MB |
| Dung lượng ảnh | 0,37 MB (thấp hơn) | 0,15 MB (thấp hơn) | 0,8–2,6 / 0,3–1,6 MB |
| Số phần tử DOM | 1.863 ✅ | 1.054 (thấp hơn) | 1.793–4.607 / 1.439–3.261 |

Dịch vụ bên thứ ba tải được: Google Tag Manager, Google Ads/Analytics, Meta, TikTok, Microsoft Clarity (kèm Bing), Klaviyo, Judge.me, shop.app. Danh sách này khớp với các dịch vụ phổ biến nhất trong mẫu.

| Ngày | Thay đổi | Cài đặt / ghi chú |
|---|---|---|
| 11/11/2026 | Thanh thông báo: thay "Welcome to our store" bằng 3 thông báo xoay vòng | "Free shipping on orders over $50", "30-day free returns", "Handmade in small batches" (`sections/header-group.json`). Footer đã có sẵn khối đăng ký email |
| 11/11/2026 | Sản phẩm đo (*Stylish Summer Necklace*): thêm 5 ảnh, viết lại mô tả (qua Admin API, app `rq4-case-study`, quyền `write_products`) | Ảnh Pexels (giấy phép miễn phí), id 13292666, 6154083, 15856321, 13325931, 8483965, bản rộng 2000 px. Mô tả: chất liệu, kích thước, bảo quản, giao hàng và đổi trả. Sản phẩm có 6 ảnh |
| 11/11/2026 | Tạo 3 bộ sưu tập tự động theo loại sản phẩm: Necklaces, Earrings, Bracelets | Ảnh đại diện lấy từ ảnh sản phẩm có sẵn. Cần bật hiển thị trên Online Store (thao tác trong admin) |
| 11/11/2026 | Trang chủ: thêm section "Shop by collection" (lưới 3 cột) ngay sau hero | `templates/index.json`, section `collection_list_cs04` |

| 11/11/2026 | Chủ store bật hiển thị 3 bộ sưu tập trên Online Store | Necklaces 11, Earrings 4, Bracelets 5 sản phẩm |

**Kiểm tra lần cuối (11/11, 1 lần đo mỗi trang):**

| Chỉ số | Trang chủ | Trang sản phẩm | Khoảng tứ phân vị của mẫu (chủ / sản phẩm) |
|---|---|---|---|
| Request bên thứ ba | 164 ✅ | 279 (cao hơn) | 111–221 / 130–256 |
| Dung lượng bên thứ ba | 1,28 MB (thấp hơn) | 1,76 MB ✅ | 1,6–3,9 / 1,7–3,7 MB |
| Tổng dung lượng | 2,77 MB (thấp hơn) | 3,53 MB (sát cận dưới) | 4,1–9,3 / 3,6–6,0 MB |
| Dung lượng ảnh | 0,33 MB (thấp hơn) | 0,43 MB ✅ | 0,8–2,6 / 0,3–1,6 MB |
| Số phần tử DOM | 1.923 ✅ | 958 (thấp hơn) | 1.793–4.607 / 1.439–3.261 |

**Cấu hình được khóa sau lần kiểm tra này.** Từ đây không thay đổi store cho đến khi đo xong baseline; mọi thay đổi sau baseline là "sửa" của RQ4 và được ghi riêng.

**Ghi chú cho luận văn:**
1. Store nhẹ hơn store trung vị về ảnh và tổng dung lượng, vì Horizon là theme mới và sản phẩm mẫu có ít ảnh. Không thêm nội dung để ép các chỉ số này.
2. Pixel được cài bằng mã trong theme thay vì qua app (app Shopify chạy pixel trong sandbox); cách cài này phổ biến ở store thật nhưng có thể làm tải trên luồng chính cao hơn.

## 4. Kiểm tra trước khi đo baseline

Đo thử một lần. Store được coi là "điển hình" nếu số request bên thứ ba, tổng dung lượng và số phần tử DOM nằm trong khoảng tứ phân vị ở mục 2. Nếu nằm ngoài khoảng, ghi lại lý do; không cài thêm hay gỡ bớt để ép LCP/TBT.
