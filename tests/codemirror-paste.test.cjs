'use strict';
// Dependency-free regressions against the actual userscript helpers.
// Editor doubles model public API contracts; these are not course-page tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.SCRIPT_PATH || path.join(__dirname, '..', 'fuck-educoder-paste.user.js'), 'utf8');

function helpers() {
  const sandbox = { window: {}, dispatchBasicEvents() {}, state: { markInserted() {} } };
  vm.createContext(sandbox);
  for (const name of ['withTemporaryReadWrite', 'withMutedCodeMirrorBeforeChange', 'replaceInCodeMirror', 'insertIntoCodeMirror']) {
    const match = new RegExp(`^( +)function ${name}\\(`, 'm').exec(source);
    assert.ok(match, `Missing helper ${name}`);
    const end = source.indexOf(`\n${match[1]}}`, match.index);
    vm.runInContext(source.slice(match.index, end + match[1].length + 2), sandbox);
  }
  return sandbox;
}

function fixture({ value = 'hello world', from = 0, to = 5, reverse = false, fallback = false,
  transform = text => text, throwAfterWrite = false, cancel = false } = {}) {
  let content = value;
  let anchor = reverse ? to : from, head = reverse ? from : to;
  let edits = 0;
  const listeners = new Set();
  function index(pos) { return content.split('\n').slice(0, pos.line).reduce((n, line) => n + line.length + 1, 0) + pos.ch; }
  function pos(index) { const lines = content.slice(0, index).split('\n'); return { line: lines.length - 1, ch: lines.at(-1).length }; }
  const doc = {
    getValue: () => content,
    getCursor(which) { return pos(which === 'from' ? Math.min(anchor, head) : which === 'to' ? Math.max(anchor, head) : head); },
    setCursor(cursor) { anchor = head = index(cursor); },
    replaceRange(text, a, b) {
      edits++;
      if (cancel) return;
      const start = index(a), end = index(b), applied = transform(text);
      const beforeAnchor = anchor, beforeHead = head;
      content = content.slice(0, start) + applied + content.slice(end);
      // replaceRange maps existing selections; it does not explicitly collapse them.
      const map = offset => offset <= start ? offset : offset <= end ? start + applied.length : offset + applied.length - (end - start);
      anchor = map(beforeAnchor); head = map(beforeHead);
      for (const listener of listeners) listener(cm, { from: a, text: applied.split('\n') });
      if (throwAfterWrite) throw Error('site callback after write');
    }
  };
  const cm = {
    getDoc: () => doc,
    getOption: () => false,
    setOption() {},
    listSelections: () => [{ anchor: pos(anchor), head: pos(head) }],
    operation: fn => fn(), focus() {}, save() {}, refresh() {},
    on: (_name, listener) => listeners.add(listener),
    off: (_name, listener) => listeners.delete(listener)
  };
  if (!fallback) cm.replaceSelection = text => {
    const start = Math.min(anchor, head), end = Math.max(anchor, head);
    doc.replaceRange(text, pos(start), pos(end));
    if (!cancel) anchor = head = start + transform(text).length;
  };
  return { cm, doc, edits: () => edits, listeners: () => listeners.size };
}

test('same-text replacement is handled exactly once instead of retried', () => {
  const f = fixture();
  assert.equal(helpers().insertIntoCodeMirror(f.cm, 'hello'), true);
  assert.equal(f.doc.getValue(), 'hello world');
  assert.equal(f.edits(), 1);
  assert.deepEqual(f.doc.getCursor('from'), { line: 0, ch: 5 });
});

for (const reverse of [false, true]) {
  test(`replaceRange fallback replaces the entire ${reverse ? 'reverse' : 'forward'} selection`, () => {
    const f = fixture({ from: 1, to: 4, reverse, fallback: true });
    assert.equal(helpers().insertIntoCodeMirror(f.cm, 'X'), true);
    assert.equal(f.doc.getValue(), 'hXo world');
    assert.deepEqual(f.doc.getCursor('from'), { line: 0, ch: 2 });
    assert.deepEqual(f.doc.getCursor('to'), { line: 0, ch: 2 });
  });
}

test('fallback cursor follows the actual multiline change', () => {
  const f = fixture({ from: 1, to: 4, fallback: true });
  assert.equal(helpers().insertIntoCodeMirror(f.cm, 'X\nYZ'), true);
  assert.equal(f.doc.getValue(), 'hX\nYZo world');
  assert.deepEqual(f.doc.getCursor('from'), { line: 1, ch: 2 });
  assert.deepEqual(f.doc.getCursor('to'), { line: 1, ch: 2 });
});

test('fallback cursor uses text transformed by beforeChange', () => {
  const f = fixture({ from: 1, to: 4, fallback: true, transform: () => 'Z' });
  assert.equal(helpers().insertIntoCodeMirror(f.cm, 'long\nclipboard'), true);
  assert.equal(f.doc.getValue(), 'hZo world');
  assert.deepEqual(f.doc.getCursor('from'), { line: 0, ch: 2 });
});

test('a callback exception after a same-text write does not cause a retry', () => {
  const f = fixture({ throwAfterWrite: true });
  assert.equal(helpers().insertIntoCodeMirror(f.cm, 'hello'), true);
  assert.equal(f.doc.getValue(), 'hello world');
  assert.equal(f.edits(), 1);
  assert.equal(f.listeners(), 0);
});

test('a rejected edit does not report success or move the selection', () => {
  const f = fixture({ cancel: true, fallback: true });
  assert.equal(helpers().replaceInCodeMirror(f.cm, 'X'), false);
  assert.equal(f.doc.getValue(), 'hello world');
  assert.deepEqual(f.doc.getCursor('from'), { line: 0, ch: 0 });
  assert.deepEqual(f.doc.getCursor('to'), { line: 0, ch: 5 });
  assert.equal(f.listeners(), 0);
});

test('ordinary collapsed-cursor paste remains a single insertion', () => {
  const f = fixture({ from: 5, to: 5 });
  assert.equal(helpers().insertIntoCodeMirror(f.cm, '!'), true);
  assert.equal(f.doc.getValue(), 'hello! world');
  assert.equal(f.edits(), 1);
});
