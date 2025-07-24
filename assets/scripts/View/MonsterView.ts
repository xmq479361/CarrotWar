import { _decorator, Component, Collider2D, Contact2DType, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("MonsterView")
export class MonsterView extends Component {
  protected start(): void {
    // 注册单个碰撞体的回调函数
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
  }

  protected onDestroy(): void {
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
  }

  onHit(selfCollider: Collider2D, otherCollider: Collider2D, contact) {
    console.log(
      "Monster onHit",
      selfCollider,
      otherCollider,
      otherCollider.node.name,
      otherCollider.tag
    );
  }
  update(deltaTime: number) {}
}
