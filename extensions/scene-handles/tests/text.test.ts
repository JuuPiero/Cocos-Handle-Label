import assert from 'assert';
import { test, results } from './harness';
import { anchorShift, cssColor, escapeHtml, richTextToHtml } from '../source/scene/text';

test('plain text is escaped', () => {
    assert.strictEqual(escapeHtml('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    assert.strictEqual(richTextToHtml('<script>alert(1)</script>', true), '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.strictEqual(richTextToHtml('<b>x</b>', false), '&lt;b&gt;x&lt;/b&gt;', 'rich text off');
});

test('Unity tags: b, i, color, size, nested', () => {
    assert.strictEqual(richTextToHtml('<b>HP</b> 10', true), '<b>HP</b> 10');
    assert.strictEqual(richTextToHtml('<i>a</i>', true), '<i>a</i>');
    assert.strictEqual(richTextToHtml('<color=#ff0000>red</color>', true), '<span style="color:#ff0000">red</span>');
    assert.strictEqual(richTextToHtml('<color=Yellow>y</color>', true), '<span style="color:yellow">y</span>');
    assert.strictEqual(richTextToHtml('<size=20>big</size>', true), '<span style="font-size:20px">big</span>');
    assert.strictEqual(richTextToHtml('<b><color=#0f0>a</color> b</b>', true), '<b><span style="color:#0f0">a</span> b</b>');
});

test('malformed tags stay as text', () => {
    assert.strictEqual(richTextToHtml('<b>open', true), '&lt;b&gt;open', 'unclosed');
    assert.strictEqual(richTextToHtml('close</b>', true), 'close&lt;/b&gt;', 'unopened');
    assert.strictEqual(richTextToHtml('<b><i>x</b></i>', true), '&lt;b&gt;<i>x&lt;/b&gt;</i>', 'crossed');
    assert.strictEqual(richTextToHtml('<color=red;x:1>a</color>', true), '&lt;color=red;x:1&gt;a&lt;/color&gt;', 'bad color');
    assert.strictEqual(richTextToHtml('<color="javascript:x">a</color>', true), '&lt;color=&quot;javascript:x&quot;&gt;a&lt;/color&gt;', 'no injection');
    assert.strictEqual(richTextToHtml('<size=abc>a</size>', true), '&lt;size=abc&gt;a&lt;/size&gt;', 'bad size');
    assert.strictEqual(richTextToHtml('a < b > c', true), 'a &lt; b &gt; c');
});

test('cssColor', () => {
    assert.strictEqual(cssColor({ r: 255, g: 128, b: 0, a: 255 }, 'x'), 'rgba(255,128,0,1)');
    assert.strictEqual(cssColor({ r: 0, g: 0, b: 0, a: 51 }, 'x'), 'rgba(0,0,0,0.2)');
    assert.strictEqual(cssColor('#123', 'x'), '#123');
    assert.strictEqual(cssColor(null, 'fallback'), 'fallback');
});

test('anchorShift follows TextAnchor (UpperLeft .. LowerRight)', () => {
    assert.deepStrictEqual(anchorShift(0), { x: 0, y: 0 });
    assert.deepStrictEqual(anchorShift(4), { x: -50, y: -50 });
    assert.deepStrictEqual(anchorShift(7), { x: -50, y: -100 });
    assert.deepStrictEqual(anchorShift(8), { x: -100, y: -100 });
    assert.deepStrictEqual(anchorShift(undefined), { x: 0, y: 0 });
    assert.deepStrictEqual(anchorShift(42), { x: 0, y: 0 });
});

console.log(`\n${results.passed} passed, ${results.failed} failed`);
if (results.failed) process.exitCode = 1;
