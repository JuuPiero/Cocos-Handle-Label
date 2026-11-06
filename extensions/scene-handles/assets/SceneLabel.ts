import { _decorator, CCInteger, Color, Component, Vec3 } from 'cc';
import { Handles, LabelStyle, TextAnchor } from './Handles';

const { ccclass, property, menu } = _decorator;

const _p = new Vec3();

/**
 * Shows a text label on its node in the Scene view (editor only): a name tag,
 * a note, a value. Nothing is drawn in the game.
 */
@ccclass('SceneLabel')
@menu('Editor/Scene Label')
export class SceneLabel extends Component {
    @property({ multiline: true, tooltip: 'Text to show. Empty: the node\'s name. Supports <b>, <i>, <color=#hex> and <size=n>.' })
    text = '';

    @property({ tooltip: 'Only while the node (or a parent) is selected.' })
    onlyWhenSelected = false;

    @property({ tooltip: 'World-space offset from the node\'s position.' })
    offset = new Vec3(0, 0, 0);

    @property({ type: TextAnchor, tooltip: 'Where the label sits relative to its point.' })
    anchor = TextAnchor.LowerCenter;

    @property
    color = new Color(235, 235, 235, 255);

    @property({ type: CCInteger, min: 6, max: 64 })
    fontSize = 11;

    @property
    bold = false;

    @property({ tooltip: 'Draw the text in a box.' })
    box = true;

    @property({ visible(this: SceneLabel) { return this.box; } })
    boxColor = new Color(25, 25, 25, 210);

    private style: LabelStyle = {};

    onDrawHandles(): void {
        if (!this.onlyWhenSelected) this.draw();
    }

    onDrawHandlesSelected(): void {
        if (this.onlyWhenSelected) this.draw();
    }

    private draw(): void {
        const s = this.style;
        s.color = this.color;
        s.fontSize = this.fontSize;
        s.bold = this.bold;
        s.anchor = this.anchor;
        s.background = this.box ? this.boxColor : null;
        s.padding = this.box ? 4 : 0;
        s.outline = !this.box;
        Vec3.add(_p, this.node.worldPosition, this.offset);
        Handles.label(_p, this.text || this.node.name, s);
    }
}
