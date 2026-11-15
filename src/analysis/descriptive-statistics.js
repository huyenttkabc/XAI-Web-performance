// Các hàm thống kê mô tả nhỏ, dùng chung cho noise report, leakage check và luật V4.

/** Ô CSV → số; ô trống là THIẾU (NaN), không bao giờ là 0. */
export const toNumber = (cell) => (cell === '' || cell === null || cell === undefined ? NaN : Number(cell));
export const finite = (values) => values.filter(Number.isFinite);

/** Phân vị nội suy tuyến tính (giống mặc định của numpy) trên các giá trị hữu hạn. */
export function quantile(values, q) {
  const sorted = finite(values).sort((a, b) => a - b);
  if (sorted.length === 0) return NaN;
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

export const median = (values) => quantile(values, 0.5);
export const iqr = (values) => quantile(values, 0.75) - quantile(values, 0.25);

export function mean(values) {
  const xs = finite(values);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}

/** Hệ số biến thiên CV = độ lệch chuẩn mẫu / trung bình; NaN khi trung bình bằng 0. */
export function cv(values) {
  const xs = finite(values);
  const m = mean(xs);
  if (xs.length < 2 || m === 0) return NaN;
  const variance = xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance) / m;
}

/** Hạng trung bình (các giá trị bằng nhau chia đều hạng). */
function ranks(values) {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array(values.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].value === order[i].value) j += 1;
    for (let k = i; k <= j; k += 1) result[order[k].index] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return result;
}

/** Tương quan hạng Spearman trên các cặp đều hữu hạn; NaN nếu < 3 cặp hoặc một biến là hằng số. */
export function spearman(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return NaN;
  const rx = ranks(pairs.map(([x]) => x));
  const ry = ranks(pairs.map(([, y]) => y));
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0; let dx = 0; let dy = 0;
  for (let i = 0; i < rx.length; i += 1) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return dx === 0 || dy === 0 ? NaN : num / Math.sqrt(dx * dy);
}

/** key → danh sách phần tử, giữ thứ tự key xuất hiện đầu tiên. */
export const groupBy = (items, key) => items.reduce((map, item) => map.set(key(item), [...(map.get(key(item)) ?? []), item]), new Map());

export const fmt = (value, digits = 0) => (Number.isFinite(value) ? value.toFixed(digits) : '–');
