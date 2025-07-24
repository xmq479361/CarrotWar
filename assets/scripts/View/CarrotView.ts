import {
  _decorator,
  Collider2D,
  Component,
  Contact2DType,
  input,
  IPhysics2DContact,
  Label,
  Node,
  Sprite,
} from "cc";
import { EventManager, EventType } from "../Manager/EventManager";
const { ccclass, property } = _decorator;

@ccclass("CarrotView")
export class CarrotView extends Component {
  private _bodySprite: Sprite = null!;
  private _bodyHpLabel: Label = null!;
  private _hp: number = 10;
  onLoad() {
    this._bodySprite = this.getComponentInChildren(Sprite);
    this._bodyHpLabel = this.getComponentInChildren(Label);
    if (this._bodyHpLabel) {
      this._bodyHpLabel.string = this._hp.toString();
    }
  }

  protected start(): void {
    // 注册单个碰撞体的回调函数
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      console.log("collider", collider);
      collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
  }

  protected onDestroy(): void {
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
  }

  onHit(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    console.log(
      "onHit",
      selfCollider,
      otherCollider,
      otherCollider.node.name,
      otherCollider.tag
    );
    this._hp--;
    if (this._bodyHpLabel) {
      this._bodyHpLabel.string = this._hp.toString();
    }
    this._bodySprite.fillRange = this._hp / 10;
    if (this._hp <= 0) {
      this.node.destroy();
      EventManager.Instance.emit(EventType.GameOver);
    } else {
      EventManager.Instance.emit(EventType.CarrotHit);
    }
  }
}
