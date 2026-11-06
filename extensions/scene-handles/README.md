# scene-handles

Unity-style **Handles** for the Cocos Creator 3.8 Scene view. First: `Handles.label()`, text at a world position that faces the camera and keeps its size on screen, like Unity's `Handles.Label`.

```ts
import { Handles, TextAnchor } from 'db://scene-handles/index';

@ccclass('Enemy')
export class Enemy extends Component {
    hp = 100;

    // every Scene-view frame (Unity: OnDrawGizmos)
    onDrawHandles() {
        Handles.label(this.node.worldPosition, this.node.name);
    }

    // only while this node, or a parent, is selected (Unity: OnDrawGizmosSelected)
    onDrawHandlesSelected() {
        Handles.label(this.node.worldPosition, `<b>HP</b> <color=#ff5050>${this.hp}</color>`, Handles.styles.box);
    }
}
```

Labels are immediate mode: draw them again every frame. Calls from cocos-gizmos' `onDrawGizmos()` / `onDrawGizmosSelected()` work too. Outside the editor's Scene view (the game, a build, Play in Editor), every call does nothing, so the code can stay in game scripts.

## API

`Handles.label(position, text, style?)`
- `position`: a world position (`Vec3` or `{ x, y, z }`).
- `text`: a string or a number. Line breaks are kept.
- `style`: a `LabelStyle` (all fields optional), or one of `Handles.styles`.

| LabelStyle | Default | |
|---|---|---|
| `color` | light grey | `cc.Color` or CSS color |
| `fontSize` | 11 | pixels |
| `bold`, `italic` | false | |
| `background` | none | `cc.Color` or CSS color: draws a box |
| `padding` | 0 | pixels, inside the box |
| `anchor` | `TextAnchor.UpperLeft` | where the label sits relative to its point (Unity's default) |
| `offset` | 0, 0 | screen pixels, x right, y down |
| `richText` | true | `<b>`, `<i>`, `<color=#hex or name>`, `<size=n>`, like Unity. Malformed tags show as text, and the text is always escaped |
| `maxWidth` | 0 | wraps the text at this width in pixels (0 = no wrapping) |
| `outline` | true | a dark outline that keeps the text readable on any background |

`Handles.styles` (Unity's `EditorStyles`):
- `label`, `miniLabel`, `boldLabel`;
- `box`: a dark box centered above its point;
- `centered`: a dark box centered on its point.

To change one, copy it: `{ ...Handles.styles.box, fontSize: 14 }`. `Handles.defaultStyle` applies to labels drawn without a style. `Handles.enabled` is true in the Scene view.

Labels behind the camera are hidden. Labels draw over the scene and are not hidden by geometry, like Unity's. They never take the mouse.

## Scene Label component

**Add Component > Editor > Scene Label** shows a label on its node in the Scene view: a name tag, a note, a value.

| Property | |
|---|---|
| Text | Empty shows the node's name. Rich text works |
| Only When Selected | Show it only while the node (or a parent) is selected |
| Offset | World-space offset from the node |
| Anchor, Color, Font Size, Bold | Look and placement |
| Box, Box Color | Draw the text in a box |

Nothing is drawn in the game.

## Menu

- **Extension > Scene Handles > Show / Hide Labels** hides or shows every label (saved per user).
- **Extension > Scene Handles > Open README**.

## How it works

- The runtime (`assets/`, mounted as `db://scene-handles`) pushes labels into a queue that the scene script installs (`globalThis.__sceneHandlesSink`). Without that queue, nothing happens.
- On each Scene-view frame (`Director.EVENT_BEFORE_COMMIT`), the scene script calls `onDrawHandles()` on every enabled component of the scene, and `onDrawHandlesSelected()` on those of selected nodes. It rescans the components twice a second.
- After the frame renders (`EVENT_AFTER_RENDER`), the queued labels are projected with the Scene view camera. They are laid out as DOM elements over the canvas, in the scene webview's own document, which gives sharp text and CSS styling. Elements are pooled and only re-rendered when their text or style changes.

## Layout

- `assets/Handles.ts`: `Handles`, `TextAnchor`, `LabelStyle`.
- `assets/SceneLabel.ts`: the component.
- `source/scene/index.ts`: the scene script (callbacks, projection, DOM).
- `source/scene/text.ts`: rich text to safe HTML, colors, anchors.
- `source/main.ts`: menu.
- `tests/`: `npm test`.

## Development

```bash
npm install
npm run build      # type-check + bundle to dist/
npm test
```

After a build, reload `scene-handles` in **Extension > Extension Manager**.
