'use strict';
// Optional real-library check: preinstall Playwright, then provide
// CODEMIRROR_PATH (CodeMirror 5 lib/codemirror.js) and CHROMIUM_PATH.
// No package installation or external page requests occur in this script.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const source = fs.readFileSync(process.env.SCRIPT_PATH || path.join(__dirname, '..', 'fuck-educoder-paste.user.js'), 'utf8');
if (!process.env.CODEMIRROR_PATH) throw Error('Set CODEMIRROR_PATH to CodeMirror 5 lib/codemirror.js');
const helpers = ['dispatchBasicEvents', 'withTemporaryReadWrite', 'withMutedCodeMirrorBeforeChange', 'replaceInCodeMirror', 'insertIntoCodeMirror'].map(name => {
  const match = new RegExp(`^( +)function ${name}\\(`, 'm').exec(source);
  assert.ok(match, `Missing helper ${name}`);
  const end = source.indexOf(`\n${match[1]}}`, match.index);
  return source.slice(match.index, end + match[1].length + 2);
}).join('\n');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent('<!doctype html><body>');
    await page.addScriptTag({ path: process.env.CODEMIRROR_PATH });
    await page.addScriptTag({ content: 'window.state = { markInserted() {} };\n' + helpers });
    const results = await page.evaluate(() => {
      function run({ fallback = false, reverse = false, text = 'X', same = false, transformed = false, cancel = false } = {}) {
        const host = document.createElement('div'); document.body.append(host);
        const cm = CodeMirror(host, { value: 'hello world' });
        const doc = cm.getDoc();
        cm.setSelection({ line: 0, ch: same ? 0 : reverse ? 4 : 1 }, { line: 0, ch: same ? 5 : reverse ? 1 : 4 });
        if (fallback) { cm.replaceSelection = undefined; doc.replaceSelection = undefined; }
        if (transformed) cm.on('beforeChange', (_cm, change) => {
          if (typeof change.update === 'function') change.update(change.from, change.to, ['Z']);
        });
        if (cancel) cm.on('beforeChange', (_cm, change) => change.cancel());
        let changes = 0; cm.on('change', () => { changes++; });
        const handled = cancel ? replaceInCodeMirror(cm, text) : insertIntoCodeMirror(cm, same ? 'hello' : text);
        const point = side => { const { line, ch } = doc.getCursor(side); return { line, ch }; };
        const result = { handled, value: doc.getValue(), from: point('from'), to: point('to'), changes };
        doc.undo(); result.undo = doc.getValue();
        host.remove(); return result;
      }
      return { version: CodeMirror.version, same: run({ same: true }), forward: run({ fallback: true }),
        reverse: run({ fallback: true, reverse: true }), multiline: run({ fallback: true, text: 'X\nYZ' }),
        transformed: run({ fallback: true, transformed: true }), cancelled: run({ fallback: true, cancel: true }) };
    });
    assert.equal(results.same.value, 'hello world'); assert.equal(results.same.handled, true); assert.equal(results.same.changes, 1);
    for (const name of ['forward', 'reverse']) {
      assert.equal(results[name].value, 'hXo world');
      assert.deepEqual(results[name].from, { line: 0, ch: 2 });
      assert.deepEqual(results[name].to, { line: 0, ch: 2 });
    }
    assert.equal(results.multiline.value, 'hX\nYZo world');
    assert.deepEqual(results.multiline.to, { line: 1, ch: 2 });
    assert.equal(results.transformed.value, 'hZo world');
    assert.deepEqual(results.transformed.to, { line: 0, ch: 2 });
    assert.equal(results.cancelled.handled, false); assert.equal(results.cancelled.value, 'hello world');
    assert.deepEqual(results.cancelled.from, { line: 0, ch: 1 });
    assert.deepEqual(results.cancelled.to, { line: 0, ch: 4 });
    for (const name of ['same', 'forward', 'reverse', 'multiline', 'transformed']) assert.equal(results[name].undo, 'hello world');
    console.log(`6 CodeMirror ${results.version} browser scenarios passed, including native editor undo.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
