import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMainThreadMetrics } from '../src/parser/trace-main-thread-extractor.js';

const PID = 1;
const TID = 10;
const ms = (value) => value * 1000; // trace timestamps are in microseconds
const task = (startMs, durMs, tid = TID) => ({ name: 'RunTask', ph: 'X', pid: PID, tid, ts: ms(startMs), dur: ms(durMs) });
const lhr = { mainDocumentUrl: 'https://a.test/' };

function trace(tasks) {
  return { traceEvents: [
    { name: 'navigationStart', pid: PID, tid: TID, ts: ms(0), args: { frame: 'MAIN', data: { isLoadingMainFrame: true, documentLoaderURL: 'https://a.test/' } } },
    { name: 'firstContentfulPaint', pid: PID, tid: TID, ts: ms(1000), args: { frame: 'MAIN' } },
    { name: 'firstContentfulPaint', pid: PID, tid: TID, ts: ms(400), args: { frame: 'IFRAME' } }, // same-process iframe
    ...tasks,
  ] };
}

test('blocking time follows the TBT formula and clips tasks to [FCP, navStart + 30 s]', () => {
  const metrics = extractMainThreadMetrics(trace([
    task(200, 300),     // before FCP → no blocking
    task(950, 150),     // spans FCP → 100 ms after FCP → 50 ms blocking
    task(2000, 250),    // 200 ms blocking
    task(2100, 120),    // nested inside the previous task → ignored
    task(2400, 40),     // short task → 0
    task(29_960, 200),  // clipped at 30 s → 40 ms → 0 blocking
    task(31_000, 500),  // outside window
    task(5000, 900, 99), // other thread → ignored
  ]), lhr);
  assert.equal(metrics.tbt_30s_ms, 250);
  assert.equal(metrics.trace_long_task_count, 3); // 300, 150, 250 (clipped 40 ms task is not long)
  assert.equal(metrics.trace_long_task_total_ms, 700);
  assert.equal(metrics.trace_long_task_max_ms, 300);
  assert.equal(metrics.trace_window_end_ms, 30_000);
});

test('window ends at trace end when the trace is shorter than 30 s', () => {
  const metrics = extractMainThreadMetrics(trace([task(2000, 250)]), lhr);
  assert.equal(metrics.trace_window_end_ms, 2250);
  assert.equal(metrics.tbt_30s_ms, 200);
});

test('falls back to Lighthouse FCP and returns nulls without a usable trace', () => {
  const noFcpEvent = { traceEvents: trace([task(1500, 100)]).traceEvents.filter((e) => e.name !== 'firstContentfulPaint') };
  const withFcp = { ...lhr, audits: { 'first-contentful-paint': { numericValue: 1000 } } };
  assert.equal(extractMainThreadMetrics(noFcpEvent, withFcp).tbt_30s_ms, 50);
  assert.equal(extractMainThreadMetrics(null, lhr).tbt_30s_ms, null);
});

test('server redirect + late out-of-process iframe: the page load navigation is used, not the last one', () => {
  const nav = (tsMs, pid, tid, url) => ({ name: 'navigationStart', pid, tid, ts: ms(tsMs), args: { frame: 'X', data: { isLoadingMainFrame: true, documentLoaderURL: url } } });
  const events = trace([task(2000, 250)]).traceEvents.slice(1); // drop the default navigation
  const redirected = { traceEvents: [
    { ...nav(0, PID, TID, 'https://a.test/'), args: { frame: 'MAIN', data: { isLoadingMainFrame: true, documentLoaderURL: 'https://a.test/' } } },
    nav(7000, PID, TID, ''),           // same-document event: no URL → ignored
    nav(20_000, 77, 700, ''),          // chat-widget iframe in another process → ignored
    ...events,
  ] };
  const metrics = extractMainThreadMetrics(redirected, { mainDocumentUrl: 'https://a.test/it-it' }); // no exact match
  assert.equal(metrics.tbt_30s_ms, 200);
  assert.equal(metrics.trace_window_end_ms, 20_000); // window measured from the page load, ends at trace end
});
