import { _decorator, Component, Node } from 'cc';
import { Handles } from 'db://scene-handles/Handles';
const { ccclass, property } = _decorator;

@ccclass('Demo')
export class Demo extends Component {
    onDrawHandles() {
        Handles.label(this.node.worldPosition, this.node.name);
    }

    // only while this node, or a parent, is selected (Unity: OnDrawGizmosSelected)
    onDrawHandlesSelected() {
        Handles.label(this.node.worldPosition, `<b>HP</b> <color=#ff5050>${123}</color>`, Handles.styles.box);
    }
}


