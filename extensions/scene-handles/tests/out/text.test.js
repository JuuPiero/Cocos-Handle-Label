"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/text.test.ts
var import_assert2 = __toESM(require("assert"));

// tests/harness.ts
var import_assert = __toESM(require("assert"));
var results = { passed: 0, failed: 0 };
function test(name, fn) {
  try {
    fn();
    results.passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    results.failed++;
    const err = e;
    const detail = err instanceof import_assert.default.AssertionError ? err.message : String((err == null ? void 0 : err.stack) || err).split("\n").slice(0, 5).join("\n");
    console.log(`  FAIL ${name}
       ${detail.split("\n").join("\n       ")}`);
  }
}

// source/scene/text.ts
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var TAG = /<(\/?)(b|i|color|size)(?:=([^<>]*))?>/g;
function colorValue(v) {
  const s = v.trim().replace(/^["']|["']$/g, "");
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;
  if (/^[a-zA-Z]{3,20}$/.test(s)) return s.toLowerCase();
  return null;
}
function sizeValue(v) {
  const n = Number(v.trim());
  return isFinite(n) && n >= 1 && n <= 200 ? n : null;
}
function richTextToHtml(text, rich) {
  if (!rich || text.indexOf("<") < 0) return escapeHtml(text);
  const tokens = [];
  TAG.lastIndex = 0;
  let m;
  while (m = TAG.exec(text)) {
    tokens.push({ start: m.index, end: m.index + m[0].length, close: m[1] === "/", name: m[2], value: m[3] === void 0 ? "" : m[3], valid: false });
  }
  const stack = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.close) {
      const needsValue = t.name === "color" || t.name === "size";
      const ok = needsValue ? t.name === "color" ? colorValue(t.value) !== null : sizeValue(t.value) !== null : t.value === "";
      if (ok) stack.push(t);
      continue;
    }
    if (t.value !== "") continue;
    const top = stack[stack.length - 1];
    if (top && top.name === t.name) {
      stack.pop();
      top.valid = true;
      t.valid = true;
    }
  }
  let out = "";
  let pos = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.valid) continue;
    out += escapeHtml(text.slice(pos, t.start));
    pos = t.end;
    if (t.close) {
      out += t.name === "b" ? "</b>" : t.name === "i" ? "</i>" : "</span>";
    } else if (t.name === "b") {
      out += "<b>";
    } else if (t.name === "i") {
      out += "<i>";
    } else if (t.name === "color") {
      out += '<span style="color:' + colorValue(t.value) + '">';
    } else {
      out += '<span style="font-size:' + sizeValue(t.value) + 'px">';
    }
  }
  return out + escapeHtml(text.slice(pos));
}
function cssColor(c, fallback) {
  if (typeof c === "string") return c;
  if (c && typeof c.r === "number") {
    const a = typeof c.a === "number" ? c.a / 255 : 1;
    return "rgba(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + "," + Math.round(a * 1e3) / 1e3 + ")";
  }
  return fallback;
}
function anchorShift(anchor) {
  const a = typeof anchor === "number" && anchor >= 0 && anchor <= 8 ? Math.floor(anchor) : 0;
  const col = a % 3;
  const row = Math.floor(a / 3);
  return { x: col === 0 ? 0 : col === 1 ? -50 : -100, y: row === 0 ? 0 : row === 1 ? -50 : -100 };
}

// tests/text.test.ts
test("plain text is escaped", () => {
  import_assert2.default.strictEqual(escapeHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  import_assert2.default.strictEqual(richTextToHtml("<script>alert(1)</script>", true), "&lt;script&gt;alert(1)&lt;/script&gt;");
  import_assert2.default.strictEqual(richTextToHtml("<b>x</b>", false), "&lt;b&gt;x&lt;/b&gt;", "rich text off");
});
test("Unity tags: b, i, color, size, nested", () => {
  import_assert2.default.strictEqual(richTextToHtml("<b>HP</b> 10", true), "<b>HP</b> 10");
  import_assert2.default.strictEqual(richTextToHtml("<i>a</i>", true), "<i>a</i>");
  import_assert2.default.strictEqual(richTextToHtml("<color=#ff0000>red</color>", true), '<span style="color:#ff0000">red</span>');
  import_assert2.default.strictEqual(richTextToHtml("<color=Yellow>y</color>", true), '<span style="color:yellow">y</span>');
  import_assert2.default.strictEqual(richTextToHtml("<size=20>big</size>", true), '<span style="font-size:20px">big</span>');
  import_assert2.default.strictEqual(richTextToHtml("<b><color=#0f0>a</color> b</b>", true), '<b><span style="color:#0f0">a</span> b</b>');
});
test("malformed tags stay as text", () => {
  import_assert2.default.strictEqual(richTextToHtml("<b>open", true), "&lt;b&gt;open", "unclosed");
  import_assert2.default.strictEqual(richTextToHtml("close</b>", true), "close&lt;/b&gt;", "unopened");
  import_assert2.default.strictEqual(richTextToHtml("<b><i>x</b></i>", true), "&lt;b&gt;<i>x&lt;/b&gt;</i>", "crossed");
  import_assert2.default.strictEqual(richTextToHtml("<color=red;x:1>a</color>", true), "&lt;color=red;x:1&gt;a&lt;/color&gt;", "bad color");
  import_assert2.default.strictEqual(richTextToHtml('<color="javascript:x">a</color>', true), "&lt;color=&quot;javascript:x&quot;&gt;a&lt;/color&gt;", "no injection");
  import_assert2.default.strictEqual(richTextToHtml("<size=abc>a</size>", true), "&lt;size=abc&gt;a&lt;/size&gt;", "bad size");
  import_assert2.default.strictEqual(richTextToHtml("a < b > c", true), "a &lt; b &gt; c");
});
test("cssColor", () => {
  import_assert2.default.strictEqual(cssColor({ r: 255, g: 128, b: 0, a: 255 }, "x"), "rgba(255,128,0,1)");
  import_assert2.default.strictEqual(cssColor({ r: 0, g: 0, b: 0, a: 51 }, "x"), "rgba(0,0,0,0.2)");
  import_assert2.default.strictEqual(cssColor("#123", "x"), "#123");
  import_assert2.default.strictEqual(cssColor(null, "fallback"), "fallback");
});
test("anchorShift follows TextAnchor (UpperLeft .. LowerRight)", () => {
  import_assert2.default.deepStrictEqual(anchorShift(0), { x: 0, y: 0 });
  import_assert2.default.deepStrictEqual(anchorShift(4), { x: -50, y: -50 });
  import_assert2.default.deepStrictEqual(anchorShift(7), { x: -50, y: -100 });
  import_assert2.default.deepStrictEqual(anchorShift(8), { x: -100, y: -100 });
  import_assert2.default.deepStrictEqual(anchorShift(void 0), { x: 0, y: 0 });
  import_assert2.default.deepStrictEqual(anchorShift(42), { x: 0, y: 0 });
});
console.log(`
${results.passed} passed, ${results.failed} failed`);
if (results.failed) process.exitCode = 1;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGV4dC50ZXN0LnRzIiwgIi4uL2hhcm5lc3MudHMiLCAiLi4vLi4vc291cmNlL3NjZW5lL3RleHQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7IHRlc3QsIHJlc3VsdHMgfSBmcm9tICcuL2hhcm5lc3MnO1xuaW1wb3J0IHsgYW5jaG9yU2hpZnQsIGNzc0NvbG9yLCBlc2NhcGVIdG1sLCByaWNoVGV4dFRvSHRtbCB9IGZyb20gJy4uL3NvdXJjZS9zY2VuZS90ZXh0JztcblxudGVzdCgncGxhaW4gdGV4dCBpcyBlc2NhcGVkJywgKCkgPT4ge1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChlc2NhcGVIdG1sKCc8YSBocmVmPVwieFwiPiZcXCcnKSwgJyZsdDthIGhyZWY9JnF1b3Q7eCZxdW90OyZndDsmYW1wOyYjMzk7Jyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+JywgdHJ1ZSksICcmbHQ7c2NyaXB0Jmd0O2FsZXJ0KDEpJmx0Oy9zY3JpcHQmZ3Q7Jyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8Yj54PC9iPicsIGZhbHNlKSwgJyZsdDtiJmd0O3gmbHQ7L2ImZ3Q7JywgJ3JpY2ggdGV4dCBvZmYnKTtcbn0pO1xuXG50ZXN0KCdVbml0eSB0YWdzOiBiLCBpLCBjb2xvciwgc2l6ZSwgbmVzdGVkJywgKCkgPT4ge1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChyaWNoVGV4dFRvSHRtbCgnPGI+SFA8L2I+IDEwJywgdHJ1ZSksICc8Yj5IUDwvYj4gMTAnKTtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocmljaFRleHRUb0h0bWwoJzxpPmE8L2k+JywgdHJ1ZSksICc8aT5hPC9pPicpO1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChyaWNoVGV4dFRvSHRtbCgnPGNvbG9yPSNmZjAwMDA+cmVkPC9jb2xvcj4nLCB0cnVlKSwgJzxzcGFuIHN0eWxlPVwiY29sb3I6I2ZmMDAwMFwiPnJlZDwvc3Bhbj4nKTtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocmljaFRleHRUb0h0bWwoJzxjb2xvcj1ZZWxsb3c+eTwvY29sb3I+JywgdHJ1ZSksICc8c3BhbiBzdHlsZT1cImNvbG9yOnllbGxvd1wiPnk8L3NwYW4+Jyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8c2l6ZT0yMD5iaWc8L3NpemU+JywgdHJ1ZSksICc8c3BhbiBzdHlsZT1cImZvbnQtc2l6ZToyMHB4XCI+YmlnPC9zcGFuPicpO1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChyaWNoVGV4dFRvSHRtbCgnPGI+PGNvbG9yPSMwZjA+YTwvY29sb3I+IGI8L2I+JywgdHJ1ZSksICc8Yj48c3BhbiBzdHlsZT1cImNvbG9yOiMwZjBcIj5hPC9zcGFuPiBiPC9iPicpO1xufSk7XG5cbnRlc3QoJ21hbGZvcm1lZCB0YWdzIHN0YXkgYXMgdGV4dCcsICgpID0+IHtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocmljaFRleHRUb0h0bWwoJzxiPm9wZW4nLCB0cnVlKSwgJyZsdDtiJmd0O29wZW4nLCAndW5jbG9zZWQnKTtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocmljaFRleHRUb0h0bWwoJ2Nsb3NlPC9iPicsIHRydWUpLCAnY2xvc2UmbHQ7L2ImZ3Q7JywgJ3Vub3BlbmVkJyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8Yj48aT54PC9iPjwvaT4nLCB0cnVlKSwgJyZsdDtiJmd0OzxpPngmbHQ7L2ImZ3Q7PC9pPicsICdjcm9zc2VkJyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8Y29sb3I9cmVkO3g6MT5hPC9jb2xvcj4nLCB0cnVlKSwgJyZsdDtjb2xvcj1yZWQ7eDoxJmd0O2EmbHQ7L2NvbG9yJmd0OycsICdiYWQgY29sb3InKTtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwocmljaFRleHRUb0h0bWwoJzxjb2xvcj1cImphdmFzY3JpcHQ6eFwiPmE8L2NvbG9yPicsIHRydWUpLCAnJmx0O2NvbG9yPSZxdW90O2phdmFzY3JpcHQ6eCZxdW90OyZndDthJmx0Oy9jb2xvciZndDsnLCAnbm8gaW5qZWN0aW9uJyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJpY2hUZXh0VG9IdG1sKCc8c2l6ZT1hYmM+YTwvc2l6ZT4nLCB0cnVlKSwgJyZsdDtzaXplPWFiYyZndDthJmx0Oy9zaXplJmd0OycsICdiYWQgc2l6ZScpO1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChyaWNoVGV4dFRvSHRtbCgnYSA8IGIgPiBjJywgdHJ1ZSksICdhICZsdDsgYiAmZ3Q7IGMnKTtcbn0pO1xuXG50ZXN0KCdjc3NDb2xvcicsICgpID0+IHtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwoY3NzQ29sb3IoeyByOiAyNTUsIGc6IDEyOCwgYjogMCwgYTogMjU1IH0sICd4JyksICdyZ2JhKDI1NSwxMjgsMCwxKScpO1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChjc3NDb2xvcih7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDUxIH0sICd4JyksICdyZ2JhKDAsMCwwLDAuMiknKTtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwoY3NzQ29sb3IoJyMxMjMnLCAneCcpLCAnIzEyMycpO1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChjc3NDb2xvcihudWxsLCAnZmFsbGJhY2snKSwgJ2ZhbGxiYWNrJyk7XG59KTtcblxudGVzdCgnYW5jaG9yU2hpZnQgZm9sbG93cyBUZXh0QW5jaG9yIChVcHBlckxlZnQgLi4gTG93ZXJSaWdodCknLCAoKSA9PiB7XG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChhbmNob3JTaGlmdCgwKSwgeyB4OiAwLCB5OiAwIH0pO1xuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoYW5jaG9yU2hpZnQoNCksIHsgeDogLTUwLCB5OiAtNTAgfSk7XG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChhbmNob3JTaGlmdCg3KSwgeyB4OiAtNTAsIHk6IC0xMDAgfSk7XG4gICAgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbChhbmNob3JTaGlmdCg4KSwgeyB4OiAtMTAwLCB5OiAtMTAwIH0pO1xuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoYW5jaG9yU2hpZnQodW5kZWZpbmVkKSwgeyB4OiAwLCB5OiAwIH0pO1xuICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwoYW5jaG9yU2hpZnQoNDIpLCB7IHg6IDAsIHk6IDAgfSk7XG59KTtcblxuY29uc29sZS5sb2coYFxcbiR7cmVzdWx0cy5wYXNzZWR9IHBhc3NlZCwgJHtyZXN1bHRzLmZhaWxlZH0gZmFpbGVkYCk7XG5pZiAocmVzdWx0cy5mYWlsZWQpIHByb2Nlc3MuZXhpdENvZGUgPSAxO1xuIiwgImltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGNvbnN0IHJlc3VsdHMgPSB7IHBhc3NlZDogMCwgZmFpbGVkOiAwIH07XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0KG5hbWU6IHN0cmluZywgZm46ICgpID0+IHZvaWQpIHtcbiAgICB0cnkge1xuICAgICAgICBmbigpO1xuICAgICAgICByZXN1bHRzLnBhc3NlZCsrO1xuICAgICAgICBjb25zb2xlLmxvZyhgICBvayAgICR7bmFtZX1gKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlc3VsdHMuZmFpbGVkKys7XG4gICAgICAgIGNvbnN0IGVyciA9IGUgYXMgRXJyb3I7XG4gICAgICAgIGNvbnN0IGRldGFpbCA9IGVyciBpbnN0YW5jZW9mIGFzc2VydC5Bc3NlcnRpb25FcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycj8uc3RhY2sgfHwgZXJyKS5zcGxpdCgnXFxuJykuc2xpY2UoMCwgNSkuam9pbignXFxuJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgIEZBSUwgJHtuYW1lfVxcbiAgICAgICAke2RldGFpbC5zcGxpdCgnXFxuJykuam9pbignXFxuICAgICAgICcpfWApO1xuICAgIH1cbn1cbiIsICIvKipcbiAqIFB1cmUgdGV4dCBoZWxwZXJzIG9mIHRoZSBsYWJlbCByZW5kZXJlciAodGVzdGVkIGluIHRlc3RzL3RleHQudGVzdC50cykuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUh0bWwoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpLnJlcGxhY2UoLycvZywgJyYjMzk7Jyk7XG59XG5cbmNvbnN0IFRBRyA9IC88KFxcLz8pKGJ8aXxjb2xvcnxzaXplKSg/Oj0oW148Pl0qKSk/Pi9nO1xuXG5pbnRlcmZhY2UgVG9rZW4ge1xuICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgZW5kOiBudW1iZXI7XG4gICAgY2xvc2U6IGJvb2xlYW47XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgb3Blbj86IHN0cmluZztcbiAgICB2YWxpZDogYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gY29sb3JWYWx1ZSh2OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBzID0gdi50cmltKCkucmVwbGFjZSgvXltcIiddfFtcIiddJC9nLCAnJyk7XG4gICAgaWYgKC9eIyhbMC05YS1mQS1GXXszfXxbMC05YS1mQS1GXXs0fXxbMC05YS1mQS1GXXs2fXxbMC05YS1mQS1GXXs4fSkkLy50ZXN0KHMpKSByZXR1cm4gcztcbiAgICBpZiAoL15bYS16QS1aXXszLDIwfSQvLnRlc3QocykpIHJldHVybiBzLnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNpemVWYWx1ZSh2OiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYudHJpbSgpKTtcbiAgICByZXR1cm4gaXNGaW5pdGUobikgJiYgbiA+PSAxICYmIG4gPD0gMjAwID8gbiA6IG51bGw7XG59XG5cbi8qKlxuICogVW5pdHkncyByaWNoIHRleHQgKDxiPiwgPGk+LCA8Y29sb3I9I3JyZ2diYnxuYW1lPiwgPHNpemU9bj4pIHRvIEhUTUwuXG4gKiBPbmx5IHdlbGwtZm9ybWVkLCBwcm9wZXJseSBuZXN0ZWQgdGFncyBjb3VudDsgYW55dGhpbmcgZWxzZSBzdGF5cyBhcyB0ZXh0LlxuICogQWxsIHRleHQgaXMgZXNjYXBlZCwgc28gYSBsYWJlbCBjYW4gbmV2ZXIgaW5qZWN0IG1hcmt1cC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0VG9IdG1sKHRleHQ6IHN0cmluZywgcmljaDogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgaWYgKCFyaWNoIHx8IHRleHQuaW5kZXhPZignPCcpIDwgMCkgcmV0dXJuIGVzY2FwZUh0bWwodGV4dCk7XG4gICAgY29uc3QgdG9rZW5zOiBUb2tlbltdID0gW107XG4gICAgVEFHLmxhc3RJbmRleCA9IDA7XG4gICAgbGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gICAgd2hpbGUgKChtID0gVEFHLmV4ZWModGV4dCkpKSB7XG4gICAgICAgIHRva2Vucy5wdXNoKHsgc3RhcnQ6IG0uaW5kZXgsIGVuZDogbS5pbmRleCArIG1bMF0ubGVuZ3RoLCBjbG9zZTogbVsxXSA9PT0gJy8nLCBuYW1lOiBtWzJdLCB2YWx1ZTogbVszXSA9PT0gdW5kZWZpbmVkID8gJycgOiBtWzNdLCB2YWxpZDogZmFsc2UgfSk7XG4gICAgfVxuICAgIC8vIHBhaXIgb3BlbmluZyBhbmQgY2xvc2luZyB0YWdzIHdpdGggYSBzdGFja1xuICAgIGNvbnN0IHN0YWNrOiBUb2tlbltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdCA9IHRva2Vuc1tpXTtcbiAgICAgICAgaWYgKCF0LmNsb3NlKSB7XG4gICAgICAgICAgICBjb25zdCBuZWVkc1ZhbHVlID0gdC5uYW1lID09PSAnY29sb3InIHx8IHQubmFtZSA9PT0gJ3NpemUnO1xuICAgICAgICAgICAgY29uc3Qgb2sgPSBuZWVkc1ZhbHVlID8gKHQubmFtZSA9PT0gJ2NvbG9yJyA/IGNvbG9yVmFsdWUodC52YWx1ZSkgIT09IG51bGwgOiBzaXplVmFsdWUodC52YWx1ZSkgIT09IG51bGwpIDogdC52YWx1ZSA9PT0gJyc7XG4gICAgICAgICAgICBpZiAob2spIHN0YWNrLnB1c2godCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodC52YWx1ZSAhPT0gJycpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCB0b3AgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKHRvcCAmJiB0b3AubmFtZSA9PT0gdC5uYW1lKSB7XG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIHRvcC52YWxpZCA9IHRydWU7XG4gICAgICAgICAgICB0LnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgb3V0ID0gJyc7XG4gICAgbGV0IHBvcyA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdCA9IHRva2Vuc1tpXTtcbiAgICAgICAgaWYgKCF0LnZhbGlkKSBjb250aW51ZTtcbiAgICAgICAgb3V0ICs9IGVzY2FwZUh0bWwodGV4dC5zbGljZShwb3MsIHQuc3RhcnQpKTtcbiAgICAgICAgcG9zID0gdC5lbmQ7XG4gICAgICAgIGlmICh0LmNsb3NlKSB7XG4gICAgICAgICAgICBvdXQgKz0gdC5uYW1lID09PSAnYicgPyAnPC9iPicgOiB0Lm5hbWUgPT09ICdpJyA/ICc8L2k+JyA6ICc8L3NwYW4+JztcbiAgICAgICAgfSBlbHNlIGlmICh0Lm5hbWUgPT09ICdiJykge1xuICAgICAgICAgICAgb3V0ICs9ICc8Yj4nO1xuICAgICAgICB9IGVsc2UgaWYgKHQubmFtZSA9PT0gJ2knKSB7XG4gICAgICAgICAgICBvdXQgKz0gJzxpPic7XG4gICAgICAgIH0gZWxzZSBpZiAodC5uYW1lID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICBvdXQgKz0gJzxzcGFuIHN0eWxlPVwiY29sb3I6JyArIGNvbG9yVmFsdWUodC52YWx1ZSkgKyAnXCI+JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dCArPSAnPHNwYW4gc3R5bGU9XCJmb250LXNpemU6JyArIHNpemVWYWx1ZSh0LnZhbHVlKSArICdweFwiPic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dCArIGVzY2FwZUh0bWwodGV4dC5zbGljZShwb3MpKTtcbn1cblxuLyoqIEEgY2MuQ29sb3ItbGlrZSBvYmplY3Qgb3IgYSBDU1Mgc3RyaW5nIGFzIGEgQ1NTIGNvbG9yOyBgZmFsbGJhY2tgIGZvciBhbnl0aGluZyBlbHNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNzc0NvbG9yKGM6IGFueSwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHR5cGVvZiBjID09PSAnc3RyaW5nJykgcmV0dXJuIGM7XG4gICAgaWYgKGMgJiYgdHlwZW9mIGMuciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgYSA9IHR5cGVvZiBjLmEgPT09ICdudW1iZXInID8gYy5hIC8gMjU1IDogMTtcbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGMucikgKyAnLCcgKyBNYXRoLnJvdW5kKGMuZykgKyAnLCcgKyBNYXRoLnJvdW5kKGMuYikgKyAnLCcgKyAoTWF0aC5yb3VuZChhICogMTAwMCkgLyAxMDAwKSArICcpJztcbiAgICB9XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xufVxuXG4vKiogQ1NTIHRyYW5zbGF0ZSAocGVyY2VudCBvZiB0aGUgbGFiZWwncyBzaXplKSB0aGF0IHB1dHMgdGhlIGFuY2hvciBjb3JuZXIgb24gdGhlIHBvaW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuY2hvclNoaWZ0KGFuY2hvcjogbnVtYmVyIHwgdW5kZWZpbmVkKTogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9IHtcbiAgICBjb25zdCBhID0gdHlwZW9mIGFuY2hvciA9PT0gJ251bWJlcicgJiYgYW5jaG9yID49IDAgJiYgYW5jaG9yIDw9IDggPyBNYXRoLmZsb29yKGFuY2hvcikgOiAwO1xuICAgIGNvbnN0IGNvbCA9IGEgJSAzO1xuICAgIGNvbnN0IHJvdyA9IE1hdGguZmxvb3IoYSAvIDMpO1xuICAgIHJldHVybiB7IHg6IGNvbCA9PT0gMCA/IDAgOiBjb2wgPT09IDEgPyAtNTAgOiAtMTAwLCB5OiByb3cgPT09IDAgPyAwIDogcm93ID09PSAxID8gLTUwIDogLTEwMCB9O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUFBLGlCQUFtQjs7O0FDQW5CLG9CQUFtQjtBQUVaLElBQU0sVUFBVSxFQUFFLFFBQVEsR0FBRyxRQUFRLEVBQUU7QUFFdkMsU0FBUyxLQUFLLE1BQWMsSUFBZ0I7QUFDL0MsTUFBSTtBQUNBLE9BQUc7QUFDSCxZQUFRO0FBQ1IsWUFBUSxJQUFJLFVBQVUsSUFBSSxFQUFFO0FBQUEsRUFDaEMsU0FBUyxHQUFHO0FBQ1IsWUFBUTtBQUNSLFVBQU0sTUFBTTtBQUNaLFVBQU0sU0FBUyxlQUFlLGNBQUFDLFFBQU8saUJBQWlCLElBQUksVUFBVSxRQUFPLDJCQUFLLFVBQVMsR0FBRyxFQUFFLE1BQU0sSUFBSSxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsS0FBSyxJQUFJO0FBQy9ILFlBQVEsSUFBSSxVQUFVLElBQUk7QUFBQSxTQUFZLE9BQU8sTUFBTSxJQUFJLEVBQUUsS0FBSyxXQUFXLENBQUMsRUFBRTtBQUFBLEVBQ2hGO0FBQ0o7OztBQ1hPLFNBQVMsV0FBVyxHQUFtQjtBQUMxQyxTQUFPLEVBQUUsUUFBUSxNQUFNLE9BQU8sRUFBRSxRQUFRLE1BQU0sTUFB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LEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNyRCxpQkFBQUEsUUFBTyxnQkFBZ0IsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDekQsaUJBQUFBLFFBQU8sZ0JBQWdCLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQzFELGlCQUFBQSxRQUFPLGdCQUFnQixZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUMzRCxpQkFBQUEsUUFBTyxnQkFBZ0IsWUFBWSxNQUFTLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDN0QsaUJBQUFBLFFBQU8sZ0JBQWdCLFlBQVksRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQzFELENBQUM7QUFFRCxRQUFRLElBQUk7QUFBQSxFQUFLLFFBQVEsTUFBTSxZQUFZLFFBQVEsTUFBTSxTQUFTO0FBQ2xFLElBQUksUUFBUSxPQUFRLFNBQVEsV0FBVzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2Fzc2VydCIsICJhc3NlcnQiLCAiYXNzZXJ0Il0KfQo=
