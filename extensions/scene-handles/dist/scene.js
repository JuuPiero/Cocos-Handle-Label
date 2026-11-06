"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// source/scene/index.ts
var scene_exports = {};
__export(scene_exports, {
  load: () => load,
  methods: () => methods,
  unload: () => unload
});
module.exports = __toCommonJS(scene_exports);
var import_path = require("path");

// source/scene/text.ts
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var TAG = /<(\/?)(b|i|color|size)(?:=([^<>]*))?>/g;
function colorValue(v) {
  let s = v.trim().replace(/^["']|["']$/g, "");
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) ? s : /^[a-zA-Z]{3,20}$/.test(s) ? s.toLowerCase() : null;
}
function sizeValue(v) {
  let n = Number(v.trim());
  return isFinite(n) && n >= 1 && n <= 200 ? n : null;
}
function richTextToHtml(text, rich) {
  if (!rich || text.indexOf("<") < 0) return escapeHtml(text);
  let tokens = [];
  TAG.lastIndex = 0;
  let m;
  for (; m = TAG.exec(text); )
    tokens.push({ start: m.index, end: m.index + m[0].length, close: m[1] === "/", name: m[2], value: m[3] === void 0 ? "" : m[3], valid: !1 });
  let stack = [];
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    if (!t.close) {
      (t.name === "color" || t.name === "size" ? t.name === "color" ? colorValue(t.value) !== null : sizeValue(t.value) !== null : t.value === "") && stack.push(t);
      continue;
    }
    if (t.value !== "") continue;
    let top = stack[stack.length - 1];
    top && top.name === t.name && (stack.pop(), top.valid = !0, t.valid = !0);
  }
  let out = "", pos = 0;
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    t.valid && (out += escapeHtml(text.slice(pos, t.start)), pos = t.end, t.close ? out += t.name === "b" ? "</b>" : t.name === "i" ? "</i>" : "</span>" : t.name === "b" ? out += "<b>" : t.name === "i" ? out += "<i>" : t.name === "color" ? out += '<span style="color:' + colorValue(t.value) + '">' : out += '<span style="font-size:' + sizeValue(t.value) + 'px">');
  }
  return out + escapeHtml(text.slice(pos));
}
function cssColor(c, fallback) {
  if (typeof c == "string") return c;
  if (c && typeof c.r == "number") {
    let a = typeof c.a == "number" ? c.a / 255 : 1;
    return "rgba(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + "," + Math.round(a * 1e3) / 1e3 + ")";
  }
  return fallback;
}
function anchorShift(anchor) {
  let a = typeof anchor == "number" && anchor >= 0 && anchor <= 8 ? Math.floor(anchor) : 0, col = a % 3, row = Math.floor(a / 3);
  return { x: col === 0 ? 0 : col === 1 ? -50 : -100, y: row === 0 ? 0 : row === 1 ? -50 : -100 };
}

// source/scene/index.ts
module.paths.push((0, import_path.join)(Editor.App.path, "node_modules"));
var ccModule = null;
function cc() {
  return ccModule || (ccModule = require("cc")), ccModule;
}
var cce = () => globalThis.cce || {}, PKG = "scene-handles", ROOT_ID = "scene-handles-labels", MAX_LABELS = 3e3, RESCAN_MS = 500, sink = { labels: [] }, S = {
  enabled: !0,
  hooked: !1,
  errors: /* @__PURE__ */ new Set(),
  drawn: 0,
  callbacks: 0
}, cached = { at: 0, list: [] };
function handleComponents() {
  let now = Date.now();
  if (now - cached.at < RESCAN_MS) return cached.list;
  let list = [], scene = cc().director.getScene();
  if (scene) {
    let walk = (node) => {
      if (!node.activeInHierarchy && node !== scene) return;
      let comps = node.components;
      for (let i = 0; i < comps.length; i++) {
        let c = comps[i];
        c && (typeof c.onDrawHandles == "function" || typeof c.onDrawHandlesSelected == "function") && list.push(c);
      }
      let children = node.children;
      for (let i = 0; i < children.length; i++) walk(children[i]);
    };
    walk(scene);
  }
  return cached = { at: now, list }, list;
}
function selectedSet() {
  try {
    let sel = cce().Selection, ids = sel && typeof sel.query == "function" ? sel.query() : null;
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function isSelected(node, selected) {
  for (let n = node; n; n = n.parent) if (selected.has(n.uuid)) return !0;
  return !1;
}
function report(comp, method, e) {
  let key = (comp && comp.uuid) + ":" + method;
  S.errors.has(key) || (S.errors.add(key), console.error("[SceneHandles] " + method + " failed on " + (comp && comp.node ? comp.node.name : "?") + ":", e));
}
function onBeforeCommit() {
  if (!S.enabled) return;
  let list = handleComponents();
  if (!list.length) return;
  let selected = selectedSet();
  for (let i = 0; i < list.length; i++) {
    let c = list[i];
    if (!(!c.isValid || !c.enabled || !c.node || !c.node.activeInHierarchy)) {
      if (typeof c.onDrawHandles == "function")
        try {
          S.callbacks++, c.onDrawHandles();
        } catch (e) {
          report(c, "onDrawHandles", e);
        }
      if (typeof c.onDrawHandlesSelected == "function" && selected.size && isSelected(c.node, selected))
        try {
          S.callbacks++, c.onDrawHandlesSelected();
        } catch (e) {
          report(c, "onDrawHandlesSelected", e);
        }
    }
  }
}
var lastCamera = null;
function sceneCamera() {
  try {
    let { director, renderer } = cc(), root2 = director.root;
    if (!root2) return null;
    if (lastCamera && lastCamera.enabled && lastCamera.window === root2.mainWindow && root2.cameraList.indexOf(lastCamera) >= 0) return lastCamera;
    let list = root2.cameraList;
    for (let i = 0; i < list.length; i++) {
      let cam = list[i];
      if (cam.cameraUsage === renderer.scene.CameraUsage.SCENE_VIEW && cam.enabled && cam.window === root2.mainWindow)
        return lastCamera = cam, cam;
    }
  } catch {
  }
  return null;
}
function canvasElement() {
  try {
    let c = cc().game.canvas;
    if (c && typeof c.getBoundingClientRect == "function") return c;
  } catch {
  }
  return typeof document < "u" ? document.querySelector("canvas") : null;
}
var root = null, pool = [], used = 0;
function ensureRoot() {
  if (root && root.isConnected) return root;
  if (typeof document > "u" || !document.body) return null;
  let old = document.getElementById(ROOT_ID);
  return old && old.remove(), root = document.createElement("div"), root.id = ROOT_ID, root.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:2147483000;", document.body.appendChild(root), pool.length = 0, root;
}
function slot(i) {
  let s = pool[i];
  if (!s) {
    let el = document.createElement("div");
    el.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;pointer-events:none;font-family:-apple-system,"Segoe UI",sans-serif;line-height:1.25;', root.appendChild(el), s = { el, key: "" }, pool[i] = s;
  }
  return s;
}
var OUTLINE = "0 0 2px rgba(0,0,0,0.95), 0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.6)";
function applyStyle(s, text, st) {
  let rich = st.richText !== !1, color = cssColor(st.color, "rgb(228,228,228)"), bg = st.background ? cssColor(st.background, "") : "", size = st.fontSize && st.fontSize > 0 ? st.fontSize : 11, pad = st.padding && st.padding > 0 ? st.padding : 0, maxW = st.maxWidth && st.maxWidth > 0 ? st.maxWidth : 0, outline = st.outline !== !1, key = text + "" + rich + color + bg + size + (st.bold ? "b" : "") + (st.italic ? "i" : "") + pad + maxW + outline;
  if (s.key === key) return;
  s.key = key;
  let el = s.el;
  el.innerHTML = richTextToHtml(text, rich), el.style.color = color, el.style.fontSize = size + "px", el.style.fontWeight = st.bold ? "bold" : "normal", el.style.fontStyle = st.italic ? "italic" : "normal", el.style.background = bg || "transparent", el.style.padding = pad ? Math.round(pad * 0.6) + "px " + pad + "px" : "0", el.style.borderRadius = bg ? "3px" : "0", el.style.textShadow = outline ? OUTLINE : "none", el.style.whiteSpace = maxW ? "pre-wrap" : "pre", el.style.maxWidth = maxW ? maxW + "px" : "none";
}
var _w = { x: 0, y: 0, z: 0 }, _s = { x: 0, y: 0, z: 0 };
function flush() {
  let labels = sink.labels;
  try {
    let r = ensureRoot(), cam = sceneCamera(), canvas = canvasElement();
    if (!r) return;
    if (used = 0, S.enabled && cam && canvas && labels.length) {
      let rect = canvas.getBoundingClientRect();
      r.style.left = rect.left + "px", r.style.top = rect.top + "px", r.style.width = rect.width + "px", r.style.height = rect.height + "px";
      let sx = rect.width / cam.width, sy = rect.height / cam.height, cp = cam.node.worldPosition, f = cam.forward || cam.node.forward, near = cam.nearClip || 0.01, ortho = cam.projectionType === cc().renderer.scene.CameraProjection.ORTHO, n = Math.min(labels.length, MAX_LABELS);
      for (let i = 0; i < n; i++) {
        let l = labels[i];
        if (!ortho && (l.x - cp.x) * f.x + (l.y - cp.y) * f.y + (l.z - cp.z) * f.z < near) continue;
        _w.x = l.x, _w.y = l.y, _w.z = l.z, cam.worldToScreen(_s, _w);
        let left = _s.x * sx, top = rect.height - _s.y * sy;
        if (left < -2e3 || left > rect.width + 2e3 || top < -2e3 || top > rect.height + 2e3) continue;
        let st = l.style || {}, s = slot(used++);
        applyStyle(s, l.text, st);
        let a = anchorShift(st.anchor), ox = st.offset ? st.offset.x : 0, oy = st.offset ? st.offset.y : 0;
        s.el.style.transform = "translate(" + Math.round(left + ox) + "px," + Math.round(top + oy) + "px) translate(" + a.x + "%," + a.y + "%)", s.el.style.display = "block";
      }
    }
    for (let i = used; i < pool.length; i++)
      pool[i].el.style.display !== "none" && (pool[i].el.style.display = "none");
    S.drawn = used;
  } catch {
  } finally {
    labels.length = 0;
  }
}
var retry = null;
function tryHook() {
  if (S.hooked) return !0;
  try {
    let { director, Director } = cc();
    if (!director || !Director) return !1;
    director.on(Director.EVENT_BEFORE_COMMIT, onBeforeCommit), director.on(Director.EVENT_AFTER_RENDER, flush);
  } catch {
    return !1;
  }
  return globalThis.__sceneHandlesSink = sink, S.hooked = !0, repaint(), !0;
}
function unhook() {
  if (S.hooked) {
    try {
      let { director, Director } = cc();
      director.off(Director.EVENT_BEFORE_COMMIT, onBeforeCommit), director.off(Director.EVENT_AFTER_RENDER, flush);
    } catch {
    }
    globalThis.__sceneHandlesSink === sink && delete globalThis.__sceneHandlesSink, S.hooked = !1, root && root.isConnected && root.remove(), root = null, pool.length = 0;
  }
}
function repaint() {
  try {
    let engine = cce().Engine;
    engine && typeof engine.repaintInEditMode == "function" && engine.repaintInEditMode();
  } catch {
  }
}
async function loadSettings() {
  try {
    let v = await Editor.Profile.getConfig(PKG, "enabled");
    typeof v == "boolean" && (S.enabled = v);
  } catch {
  }
  repaint();
}
function load() {
  if (!globalThis.isPreviewProcess && (loadSettings(), !tryHook())) {
    let tries = 0;
    retry = setInterval(() => {
      tries++, (tryHook() || tries > 120) && (retry && clearInterval(retry), retry = null);
    }, 500);
  }
}
function unload() {
  retry && clearInterval(retry), retry = null, unhook();
}
var methods = {
  /** Shows / hides every label (Extension > Scene Handles > Show / Hide Labels). */
  toggle() {
    S.enabled = !S.enabled;
    try {
      Editor.Profile.setConfig(PKG, "enabled", S.enabled, "global");
    } catch {
    }
    return cached.at = 0, repaint(), S.enabled;
  },
  /** Forces a rescan of the components (after adding onDrawHandles to a script). */
  refresh() {
    cached.at = 0, repaint();
  },
  diagnostics: () => ({ hooked: S.hooked, enabled: S.enabled, drawn: S.drawn, callbacks: S.callbacks, components: cached.list.length, camera: !!sceneCamera() })
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  load,
  methods,
  unload
});
//# sourceMappingURL=scene.js.map
