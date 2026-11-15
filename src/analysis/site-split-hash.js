// Luật chia theo site của protocol §8, dùng chung cho các báo cáo JS (mô hình Python dùng đúng công thức này):
//   bucket = int(sha1(salt + ':' + site)[:8], 16) mod 5;  lockbox = bucket('lockbox') == 0;  fold = bucket('fold')
// Băm cố định ⇒ không ai chọn lại được fold/lockbox sau khi đã thấy kết quả.
import { createHash } from 'node:crypto';

export const siteBucket = (site, salt, k = 5) => parseInt(createHash('sha1').update(`${salt}:${site}`).digest('hex').slice(0, 8), 16) % k;

/** Site thuộc lockbox bị giữ khỏi MỌI phân tích có thể ảnh hưởng quyết định mô hình (EDA, leakage screen). */
export const isLockboxSite = (site) => siteBucket(site, 'lockbox') === 0;
