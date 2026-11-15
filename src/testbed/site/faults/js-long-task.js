// Fault F1 "js-long-task" (cause group: main_thread_js).
// Sau sự kiện `load`, chạy `count` task liên tiếp, mỗi task "bận chờ" (busy-wait) `dose` ms.
// Vì chạy SAU load ⇒ cũng sau FCP/LCP, nên chỉ TBT bị ảnh hưởng; LCP gần như không đổi.
// dose = 0 là baseline: script vẫn được tải (cùng chi phí mạng) nhưng không làm gì.
// Kỳ vọng: TBT ≈ count × (dose − 50) ms.
(function () {
  const script = document.currentScript;
  const dose = Number(script.dataset.dose);
  const count = Number(script.dataset.count);

  function blockMainThread() {
    const end = performance.now() + dose;
    while (performance.now() < end) { /* busy-wait: mô phỏng JS nặng */ }
  }

  let done = 0;
  function nextTask() {
    if (done >= count) return;
    done += 1;
    blockMainThread();
    setTimeout(nextTask, 0); // nhường main thread để mỗi lần block là MỘT long task riêng
  }

  if (dose <= 0) return;
  window.addEventListener('load', () => setTimeout(nextTask, 0));
})();
