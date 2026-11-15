// PRNG có seed + xáo trộn, dùng chung cho kế hoạch đo và asset tổng hợp của testbed (tái lập được từ `seed`).

/** PRNG tất định mulberry32: trả số nguyên 32-bit không dấu; cùng seed → cùng dãy số. */
export function seededUint32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** Cùng dãy như seededUint32 nhưng chia về [0, 1) — thay cho Math.random(). */
export function seededRandom(seed) {
  const next = seededUint32(seed);
  return () => next() / 4294967296;
}

/** Xáo trộn Fisher–Yates: rải đều độ trôi theo thời gian (máy nóng, tải nền) qua mọi điều kiện. */
export function shuffle(items, seed) {
  const random = seededRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
