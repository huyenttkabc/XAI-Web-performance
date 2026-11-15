// Biểu đồ SVG không cần thư viện cho báo cáo EDA (histogram, heatmap tương quan). Đầu ra là SVG tĩnh,
// in được: nền trắng, font Helvetica/Arial, thang màu phân kỳ an toàn cho người mù màu (cam ↔ xanh).
const FONT = 'font-family="Helvetica, Arial, sans-serif"';
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svgOpen = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n<rect width="${w}" height="${h}" fill="#fff"/>`;
/** Phần tử text; `attrs` ghi đè mặc định (cỡ 12, xám đậm) để không thuộc tính nào bị lặp (SVG lỗi XML). */
const label = (x, y, text, attrs = {}) => {
  const all = { 'font-size': 12, fill: '#222', ...attrs };
  return `<text x="${x}" y="${y}" ${FONT} ${Object.entries(all).map(([k, v]) => `${k}="${v}"`).join(' ')}>${esc(text)}</text>`;
};
const tickText = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v)));

/** Histogram các giá trị dương; `log` chia bin theo thang log10 (cho thời gian lệch phải). */
export function histogramSvg({ values, title, xLabel, bins = 12, log = false, width = 520, height = 300 }) {
  const xs = values.filter((v) => Number.isFinite(v) && (!log || v > 0));
  if (!xs.length) return `${svgOpen(width, 60)}\n${label(12, 34, `${title}: no data`)}\n</svg>\n`;
  const t = log ? Math.log10 : (v) => v;
  const lo = Math.min(...xs.map(t));
  const hi = Math.max(...xs.map(t)) + 1e-9;
  const counts = Array(bins).fill(0);
  for (const v of xs) counts[Math.min(bins - 1, Math.floor(((t(v) - lo) / (hi - lo)) * bins))] += 1;
  const m = { left: 48, right: 16, top: 36, bottom: 48 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const maxCount = Math.max(...counts, 1);
  const barW = plotW / bins;
  const parts = [svgOpen(width, height), label(m.left, 20, `${title} (n = ${xs.length})`, { 'font-weight': 'bold' })];
  counts.forEach((c, i) => {
    const h = (c / maxCount) * plotH;
    parts.push(`<rect x="${(m.left + i * barW + 1).toFixed(1)}" y="${(m.top + plotH - h).toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="#0072B2"/>`);
  });
  parts.push(`<line x1="${m.left}" y1="${m.top + plotH}" x2="${m.left + plotW}" y2="${m.top + plotH}" stroke="#444"/>`);
  for (let i = 0; i <= 4; i += 1) {
    const raw = lo + ((hi - lo) * i) / 4;
    const x = m.left + (plotW * i) / 4;
    parts.push(label(x, m.top + plotH + 16, tickText(log ? 10 ** raw : raw), { 'text-anchor': 'middle' }));
  }
  parts.push(label(m.left - 8, m.top + 4, String(maxCount), { 'text-anchor': 'end' }), label(m.left - 8, m.top + plotH, '0', { 'text-anchor': 'end' }));
  parts.push(label(m.left + plotW / 2, height - 10, `${xLabel}${log ? ' (log scale)' : ''}`, { 'text-anchor': 'middle' }));
  return `${parts.join('\n')}\n</svg>\n`;
}

/** Màu phân kỳ cho r ∈ [−1, 1]: cam (−) → trắng (0) → xanh (+). */
function divergingColour(r) {
  if (!Number.isFinite(r)) return '#ddd';
  const end = r >= 0 ? [0, 114, 178] : [230, 159, 0];
  const a = Math.min(1, Math.abs(r));
  return `rgb(${end.map((c) => Math.round(255 + (c - 255) * a)).join(',')})`;
}

/** Heatmap tương quan vuông, in giá trị trong từng ô. */
export function heatmapSvg({ matrix, labels, title, cell = 26 }) {
  const left = 190;
  const top = 190;
  const size = labels.length * cell;
  const width = left + size + 20;
  const height = top + size + 40;
  const parts = [svgOpen(width, height), label(12, 22, title, { 'font-weight': 'bold' })];
  labels.forEach((name, i) => {
    parts.push(label(left - 6, top + i * cell + cell * 0.65, name, { 'text-anchor': 'end', 'font-size': 11 }));
    const x = left + i * cell + cell * 0.65;
    parts.push(label(x, top - 6, name, { 'font-size': 11, transform: `rotate(-60 ${x} ${top - 6})` }));
  });
  matrix.forEach((row, i) => row.forEach((r, j) => {
    parts.push(`<rect x="${left + j * cell}" y="${top + i * cell}" width="${cell}" height="${cell}" fill="${divergingColour(r)}" stroke="#fff"/>`);
    if (Number.isFinite(r)) parts.push(label(left + j * cell + cell / 2, top + i * cell + cell * 0.65, (Math.abs(r) < 0.05 ? '0' : r.toFixed(1).replace('0.', '.')), { 'text-anchor': 'middle', 'font-size': 9, fill: Math.abs(r) > 0.6 ? '#fff' : '#222' }));
  }));
  parts.push(label(left, top + size + 26, 'Spearman ρ: orange = negative, white = 0, blue = positive; grey = undefined', { 'font-size': 11 }));
  return `${parts.join('\n')}\n</svg>\n`;
}
