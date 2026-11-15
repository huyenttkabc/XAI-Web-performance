// Luật hợp lệ V4 (host_contention): phép đo diễn ra khi MÁY ĐO đang bận là không hợp lệ.
// Lighthouse chấm tốc độ CPU của máy ngay trước mỗi lần đo (benchmark_index); giá trị dưới
// HOST_CONTENTION_RATIO × median của cả batch nghĩa là có việc khác tranh CPU và thời gian bị thổi phồng.
// So với median của chính batch (không dùng ngưỡng tuyệt đối) nên tự thích nghi với từng máy.
import { median } from '../analysis/descriptive-statistics.js';

export const HOST_CONTENTION_RATIO = 0.6;

/** benchmark_index dưới dạng số dương, hoặc null khi thiếu (Number(null) sẽ cho 0 — sai). */
const benchmarkScore = (row) => {
  const value = Number(row.benchmark_index);
  return row.benchmark_index != null && row.benchmark_index !== '' && value > 0 ? value : null;
};

/** Đánh dấu invalid các dòng có benchmark_index < ratio × median của batch (sửa trực tiếp rows). */
export function markHostContention(rows, ratio = HOST_CONTENTION_RATIO) {
  const byBatch = new Map();
  for (const row of rows) byBatch.set(row.batch_id, [...(byBatch.get(row.batch_id) ?? []), row]);
  for (const batch of byBatch.values()) {
    // median chỉ tính trên phép đo đã qua V1–V3, để dòng lỗi/invalid không kéo ngưỡng xuống
    const scores = batch.filter((r) => r.status === 'ok').map(benchmarkScore).filter((v) => v !== null);
    if (!scores.length) continue;
    const floor = ratio * median(scores);
    for (const row of batch) {
      const score = benchmarkScore(row);
      if (row.status !== 'ok' || score === null || score >= floor) continue;
      row.status = 'invalid';
      row.quality_flags = ['host_contention', row.quality_flags].filter(Boolean).join(';');
    }
  }
  return rows;
}
