import { Color, Enum, Vec3 } from 'cc';

/** Where the label sits relative to its point (Unity's TextAnchor). */
export enum TextAnchor {
    UpperLeft = 0,
    UpperCenter = 1,
    UpperRight = 2,
    MiddleLeft = 3,
    MiddleCenter = 4,
    MiddleRight = 5,
    LowerLeft = 6,
    LowerCenter = 7,
    LowerRight = 8,
}
Enum(TextAnchor);

/** How a label looks (a small GUIStyle). Every field is optional. */
export interface LabelStyle {
    /** Text color: a cc.Color or a CSS color. */
    color?: Readonly<Color> | string;
    /** Font size in pixels (default 11). */
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    /** Background box color (none by default). */
    background?: Readonly<Color> | string | null;
    /** Padding inside the background, in pixels. */
    padding?: number;
    /** Where the label sits relative to its point (default UpperLeft, like Unity). */
    anchor?: TextAnchor;
    /** Shift on screen in pixels (x right, y down). */
    offset?: { x: number; y: number };
    /** Interpret <b>, <i>, <color=...> and <size=...> tags (default true, like Unity's labels). */
    richText?: boolean;
    /** Wrap the text at this width in pixels (0 = no wrapping). */
    maxWidth?: number;
    /** A dark outline that keeps the text readable on any background (default true). */
    outline?: boolean;
}

/** @internal One queued label (what the scene script draws). */
export interface LabelCommand {
    x: number;
    y: number;
    z: number;
    text: string;
    style: LabelStyle | null;
}

/** @internal The queue the scene-handles scene script installs in the editor. */
interface Sink {
    labels: LabelCommand[];
}

function sink(): Sink | null {
    const s = (globalThis as any).__sceneHandlesSink;
    return s && Array.isArray(s.labels) ? (s as Sink) : null;
}

/**
 * Scene-view drawing in the style of Unity's Handles (editor only).
 *
 * Call it while the Scene view draws: from `onDrawHandles()` /
 * `onDrawHandlesSelected()` on any component (called by this extension), or
 * from cocos-gizmos' `onDrawGizmos()` / `onDrawGizmosSelected()`. Labels are
 * immediate: draw them again every frame.
 *
 * ```ts
 * onDrawHandlesSelected() {
 *     Handles.label(this.node.worldPosition, this.node.name);
 *     Handles.label(this.target, `<b>HP</b> ${this.hp}`, Handles.styles.box);
 * }
 * ```
 *
 * Outside the editor's Scene view (game, build, Play in Editor) every call
 * does nothing.
 */
export class Handles {
    /** Ready-made styles (Unity's EditorStyles). Copy one to change it: `{ ...Handles.styles.box, fontSize: 14 }`. */
    static readonly styles = {
        /** Plain light text. */
        label: {} as LabelStyle,
        /** Smaller grey text. */
        miniLabel: { fontSize: 9, color: 'rgba(210,210,210,0.85)' } as LabelStyle,
        /** Bold text. */
        boldLabel: { bold: true } as LabelStyle,
        /** Text in a dark box, centered above its point. */
        box: { background: 'rgba(25,25,25,0.82)', padding: 4, anchor: TextAnchor.LowerCenter, offset: { x: 0, y: -6 }, outline: false } as LabelStyle,
        /** Text in a dark box, centered on its point. */
        centered: { background: 'rgba(25,25,25,0.82)', padding: 3, anchor: TextAnchor.MiddleCenter, outline: false } as LabelStyle,
    };

    /** Style used when a label has none. */
    static defaultStyle: LabelStyle = {};

    /** True when calls draw something: in the editor's Scene view. */
    static get enabled(): boolean {
        return sink() !== null;
    }

    /** Draws `text` at a world position, facing the camera, at a constant size on screen (Unity's Handles.Label). */
    static label(position: Readonly<Vec3> | { x: number; y: number; z: number }, text: string | number, style?: LabelStyle | null): void {
        const s = sink();
        if (!s || !position || s.labels.length >= 10000) return;
        s.labels.push({
            x: position.x,
            y: position.y,
            z: position.z,
            text: String(text),
            style: style ? Object.assign({}, Handles.defaultStyle, style) : Handles.defaultStyle,
        });
    }
}
