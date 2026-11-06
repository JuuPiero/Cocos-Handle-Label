/// <reference path="../../node_modules/@cocos/creator-types/engine/cc.d.ts" />
/**
 * Scene-process half of scene-handles: draws the labels queued with
 * Handles.label() over the Scene view.
 *
 * 1. Installs the queue `globalThis.__sceneHandlesSink` the runtime pushes to.
 * 2. On Director.EVENT_BEFORE_COMMIT (each Scene-view frame) calls
 *    `onDrawHandles()` on every enabled component of the open scene and
 *    `onDrawHandlesSelected()` on those of selected nodes (or of their
 *    children). cocos-gizmos calls onDrawGizmos* at the same moment, so
 *    labels drawn from there land in the same frame.
 * 3. On Director.EVENT_AFTER_RENDER projects the queued labels with the
 *    Scene view camera and lays them out as DOM elements over the canvas,
 *    then clears the queue.
 *
 * The scene webview has its own document, positioned over the Scene view, so
 * the labels are plain absolutely-positioned elements (sharp text, CSS
 * styling). Nothing is hooked in the Play-in-Editor webview.
 */
import { join } from 'path';
import { anchorShift, cssColor, richTextToHtml } from './text';

module.paths.push(join(Editor.App.path, 'node_modules'));

type CC = typeof import('cc');
let ccModule: CC | null = null;
function cc(): CC {
    if (!ccModule) ccModule = require('cc') as CC;
    return ccModule;
}
const cce = (): any => (globalThis as any).cce || {};

const PKG = 'scene-handles';
const ROOT_ID = 'scene-handles-labels';
const MAX_LABELS = 3000;
const RESCAN_MS = 500;

interface LabelStyle {
    color?: any;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    background?: any;
    padding?: number;
    anchor?: number;
    offset?: { x: number; y: number };
    richText?: boolean;
    maxWidth?: number;
    outline?: boolean;
}

interface LabelCommand {
    x: number;
    y: number;
    z: number;
    text: string;
    style: LabelStyle | null;
}

const sink: { labels: LabelCommand[] } = { labels: [] };

const S = {
    enabled: true,
    hooked: false,
    errors: new Set<string>(),
    drawn: 0,
    callbacks: 0,
};

// ------------------------------------------------------------------ components

let cached: { at: number; list: any[] } = { at: 0, list: [] };

/** Components that implement onDrawHandles / onDrawHandlesSelected (refreshed twice a second). */
function handleComponents(): any[] {
    const now = Date.now();
    if (now - cached.at < RESCAN_MS) return cached.list;
    const list: any[] = [];
    const scene = cc().director.getScene();
    if (scene) {
        const walk = (node: any) => {
            if (!node.activeInHierarchy && node !== scene) return;
            const comps = node.components;
            for (let i = 0; i < comps.length; i++) {
                const c = comps[i];
                if (c && (typeof c.onDrawHandles === 'function' || typeof c.onDrawHandlesSelected === 'function')) list.push(c);
            }
            const children = node.children;
            for (let i = 0; i < children.length; i++) walk(children[i]);
        };
        walk(scene);
    }
    cached = { at: now, list };
    return list;
}

function selectedSet(): Set<string> {
    try {
        const sel = cce().Selection;
        const ids = sel && typeof sel.query === 'function' ? sel.query() : null;
        return new Set<string>(Array.isArray(ids) ? ids : []);
    } catch (e) {
        return new Set<string>();
    }
}

/** The node or one of its parents is selected (Unity's OnDrawGizmosSelected rule). */
function isSelected(node: any, selected: Set<string>): boolean {
    for (let n = node; n; n = n.parent) if (selected.has(n.uuid)) return true;
    return false;
}

function report(comp: any, method: string, e: any): void {
    const key = (comp && comp.uuid) + ':' + method;
    if (S.errors.has(key)) return;
    S.errors.add(key);
    console.error('[SceneHandles] ' + method + ' failed on ' + (comp && comp.node ? comp.node.name : '?') + ':', e);
}

function onBeforeCommit(): void {
    if (!S.enabled) return;
    const list = handleComponents();
    if (!list.length) return;
    const selected = selectedSet();
    for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (!c.isValid || !c.enabled || !c.node || !c.node.activeInHierarchy) continue;
        if (typeof c.onDrawHandles === 'function') {
            try {
                S.callbacks++;
                c.onDrawHandles();
            } catch (e) {
                report(c, 'onDrawHandles', e);
            }
        }
        if (typeof c.onDrawHandlesSelected === 'function' && selected.size && isSelected(c.node, selected)) {
            try {
                S.callbacks++;
                c.onDrawHandlesSelected();
            } catch (e) {
                report(c, 'onDrawHandlesSelected', e);
            }
        }
    }
}

// ------------------------------------------------------------------ camera

let lastCamera: any = null;

function sceneCamera(): any {
    try {
        const { director, renderer } = cc() as any;
        const root: any = director.root;
        if (!root) return null;
        if (lastCamera && lastCamera.enabled && lastCamera.window === root.mainWindow && root.cameraList.indexOf(lastCamera) >= 0) return lastCamera;
        const list = root.cameraList;
        for (let i = 0; i < list.length; i++) {
            const cam = list[i];
            if (cam.cameraUsage === renderer.scene.CameraUsage.SCENE_VIEW && cam.enabled && cam.window === root.mainWindow) {
                lastCamera = cam;
                return cam;
            }
        }
    } catch (e) {
        // engine not ready
    }
    return null;
}

function canvasElement(): HTMLCanvasElement | null {
    try {
        const c = (cc().game as any).canvas as HTMLCanvasElement | null;
        if (c && typeof (c as any).getBoundingClientRect === 'function') return c;
    } catch (e) {
        // fall through
    }
    return typeof document !== 'undefined' ? document.querySelector('canvas') : null;
}

// ------------------------------------------------------------------ DOM

interface Slot {
    el: HTMLDivElement;
    key: string;
}

let root: HTMLDivElement | null = null;
const pool: Slot[] = [];
let used = 0;

function ensureRoot(): HTMLDivElement | null {
    if (root && root.isConnected) return root;
    if (typeof document === 'undefined' || !document.body) return null;
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();
    root = document.createElement('div');
    root.id = ROOT_ID;
    // under other overlays (joints' Physics panel uses 2147483100), above the canvas; never takes the mouse
    root.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:2147483000;';
    document.body.appendChild(root);
    pool.length = 0;
    return root;
}

function slot(i: number): Slot {
    let s = pool[i];
    if (!s) {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;pointer-events:none;font-family:-apple-system,"Segoe UI",sans-serif;line-height:1.25;';
        root!.appendChild(el);
        s = { el, key: '' };
        pool[i] = s;
    }
    return s;
}

const OUTLINE = '0 0 2px rgba(0,0,0,0.95), 0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.6)';

function applyStyle(s: Slot, text: string, st: LabelStyle): void {
    const rich = st.richText !== false;
    const color = cssColor(st.color, 'rgb(228,228,228)');
    const bg = st.background ? cssColor(st.background, '') : '';
    const size = st.fontSize && st.fontSize > 0 ? st.fontSize : 11;
    const pad = st.padding && st.padding > 0 ? st.padding : 0;
    const maxW = st.maxWidth && st.maxWidth > 0 ? st.maxWidth : 0;
    const outline = st.outline !== false;
    const key = text + '\u0001' + rich + color + bg + size + (st.bold ? 'b' : '') + (st.italic ? 'i' : '') + pad + maxW + outline;
    if (s.key === key) return;
    s.key = key;
    const el = s.el;
    el.innerHTML = richTextToHtml(text, rich);
    el.style.color = color;
    el.style.fontSize = size + 'px';
    el.style.fontWeight = st.bold ? 'bold' : 'normal';
    el.style.fontStyle = st.italic ? 'italic' : 'normal';
    el.style.background = bg || 'transparent';
    el.style.padding = pad ? Math.round(pad * 0.6) + 'px ' + pad + 'px' : '0';
    el.style.borderRadius = bg ? '3px' : '0';
    el.style.textShadow = outline ? OUTLINE : 'none';
    el.style.whiteSpace = maxW ? 'pre-wrap' : 'pre';
    el.style.maxWidth = maxW ? maxW + 'px' : 'none';
}

const _w = { x: 0, y: 0, z: 0 } as any;
const _s = { x: 0, y: 0, z: 0 } as any;

function flush(): void {
    const labels = sink.labels;
    try {
        const r = ensureRoot();
        const cam = sceneCamera();
        const canvas = canvasElement();
        if (!r) return;
        used = 0;
        if (S.enabled && cam && canvas && labels.length) {
            const rect = canvas.getBoundingClientRect();
            r.style.left = rect.left + 'px';
            r.style.top = rect.top + 'px';
            r.style.width = rect.width + 'px';
            r.style.height = rect.height + 'px';
            const sx = rect.width / cam.width;
            const sy = rect.height / cam.height;
            const cp = cam.node.worldPosition;
            const f = cam.forward || cam.node.forward;
            const near = cam.nearClip || 0.01;
            const ortho = cam.projectionType === (cc() as any).renderer.scene.CameraProjection.ORTHO;
            const n = Math.min(labels.length, MAX_LABELS);
            for (let i = 0; i < n; i++) {
                const l = labels[i];
                if (!ortho && (l.x - cp.x) * f.x + (l.y - cp.y) * f.y + (l.z - cp.z) * f.z < near) continue; // behind the camera
                _w.x = l.x;
                _w.y = l.y;
                _w.z = l.z;
                cam.worldToScreen(_s, _w);
                const left = _s.x * sx;
                const top = rect.height - _s.y * sy;
                if (left < -2000 || left > rect.width + 2000 || top < -2000 || top > rect.height + 2000) continue;
                const st = l.style || {};
                const s = slot(used++);
                applyStyle(s, l.text, st);
                const a = anchorShift(st.anchor);
                const ox = st.offset ? st.offset.x : 0;
                const oy = st.offset ? st.offset.y : 0;
                s.el.style.transform = 'translate(' + Math.round(left + ox) + 'px,' + Math.round(top + oy) + 'px) translate(' + a.x + '%,' + a.y + '%)';
                s.el.style.display = 'block';
            }
        }
        for (let i = used; i < pool.length; i++) {
            if (pool[i].el.style.display !== 'none') pool[i].el.style.display = 'none';
        }
        S.drawn = used;
    } catch (e) {
        // never break the editor's frame
    } finally {
        labels.length = 0;
    }
}

// ------------------------------------------------------------------ lifecycle

let retry: ReturnType<typeof setInterval> | null = null;

function tryHook(): boolean {
    if (S.hooked) return true;
    try {
        const { director, Director } = cc() as any;
        if (!director || !Director) return false;
        director.on(Director.EVENT_BEFORE_COMMIT, onBeforeCommit);
        director.on(Director.EVENT_AFTER_RENDER, flush);
    } catch (e) {
        return false;
    }
    (globalThis as any).__sceneHandlesSink = sink;
    S.hooked = true;
    repaint();
    return true;
}

function unhook(): void {
    if (!S.hooked) return;
    try {
        const { director, Director } = cc() as any;
        director.off(Director.EVENT_BEFORE_COMMIT, onBeforeCommit);
        director.off(Director.EVENT_AFTER_RENDER, flush);
    } catch (e) {
        // shutting down
    }
    if ((globalThis as any).__sceneHandlesSink === sink) delete (globalThis as any).__sceneHandlesSink;
    S.hooked = false;
    if (root && root.isConnected) root.remove();
    root = null;
    pool.length = 0;
}

function repaint(): void {
    try {
        const engine = cce().Engine;
        if (engine && typeof engine.repaintInEditMode === 'function') engine.repaintInEditMode();
    } catch (e) {
        // shutting down
    }
}

async function loadSettings(): Promise<void> {
    try {
        const v = await Editor.Profile.getConfig(PKG, 'enabled');
        if (typeof v === 'boolean') S.enabled = v;
    } catch (e) {
        // default on
    }
    repaint();
}

export function load(): void {
    if ((globalThis as any).isPreviewProcess) return;
    loadSettings();
    if (!tryHook()) {
        let tries = 0;
        retry = setInterval(() => {
            tries++;
            if (tryHook() || tries > 120) {
                if (retry) clearInterval(retry);
                retry = null;
            }
        }, 500);
    }
}

export function unload(): void {
    if (retry) clearInterval(retry);
    retry = null;
    unhook();
}

export const methods: { [name: string]: (arg?: any) => any } = {
    /** Shows / hides every label (Extension > Scene Handles > Show / Hide Labels). */
    toggle(): boolean {
        S.enabled = !S.enabled;
        try {
            Editor.Profile.setConfig(PKG, 'enabled', S.enabled, 'global');
        } catch (e) {
            // not persisted
        }
        cached.at = 0;
        repaint();
        return S.enabled;
    },
    /** Forces a rescan of the components (after adding onDrawHandles to a script). */
    refresh(): void {
        cached.at = 0;
        repaint();
    },
    diagnostics: () => ({ hooked: S.hooked, enabled: S.enabled, drawn: S.drawn, callbacks: S.callbacks, components: cached.list.length, camera: !!sceneCamera() }),
};
