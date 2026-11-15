import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFault, injectFault } from '../src/testbed/testbed-server.js';

const params = (query) => new URLSearchParams(query);

test('không có fault khi thiếu hoặc sai fault id', () => {
  assert.equal(parseFault(params('')), null);
  assert.equal(parseFault(params('fault=unknown&dose=200')), null);
});

test('giữ dose 0 để baseline tải cùng script với các lần có fault', () => {
  assert.deepEqual(parseFault(params('fault=js-long-task&dose=0&count=4')), { id: 'js-long-task', dose: 0, count: 4 });
});

test('đọc và giới hạn tham số fault', () => {
  assert.deepEqual(parseFault(params('fault=js-long-task&dose=250&count=4')), { id: 'js-long-task', dose: 250, count: 4 });
  assert.deepEqual(parseFault(params('fault=js-long-task&dose=99999&count=999')), { id: 'js-long-task', dose: 5000, count: 50 });
  assert.deepEqual(parseFault(params('fault=js-long-task&dose=abc')), { id: 'js-long-task', dose: 0, count: 1 });
});

test('chèn đúng một script trước </body>, không chèn gì khi không có fault', () => {
  const html = '<html><body><p>x</p></body></html>';
  assert.equal(injectFault(html, null), html);
  const out = injectFault(html, { id: 'js-long-task', dose: 100, count: 2 });
  assert.match(out, /<script src="\/faults\/js-long-task.js" data-dose="100" data-count="2"><\/script>\n<\/body>/);
  assert.equal(out.match(/<script/g).length, 1);
});
