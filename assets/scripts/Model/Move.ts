import { _decorator, Component, Node, tween, Vec2, Vec3 } from "cc";
import { Point } from "./MapConfig";
import { MapManager } from "../Manager/MapManager";
const { ccclass, property } = _decorator;

@ccclass("Move")
export class Move extends Component {
  @property
  speed: number = 100;

  targets: Point[] = [];
  //   private _targetPos: Point = new Point(8, 8);
  private _isMoving: boolean = false;

  protected start(): void {
    console.log("Move start: ", this.node.position);
    this.setPoint(new Point(1, 1));
    this.checkToMove();
    // this.scheduleOnce(() => {
    //   this.moveTo(nextTarget);
    // }, 1);
  }

  setPoint(point: Point) {
    this.node.position = MapManager.Instance.getLocationVec2(
      point.col,
      point.row
    ).toVec3();
  }
  setTarget(targets: Point[]) {
    this.targets = targets;
    this.checkToMove();
  }

  addTarget(target: Point) {
    this.targets.push(target);
    this.checkToMove();
  }

  checkToMove(): boolean {
    if (this._isMoving) return false;
    if (this.targets.length == 0) {
      this._isMoving = false;
      return false;
    }
    let nextTarget = this.targets.shift();
    if (!nextTarget) {
      this._isMoving = false;
      return false;
    }
    this._isMoving = true;
    let targetXY = MapManager.Instance.getLocationVec3(
      nextTarget.col,
      nextTarget.row
    );
    let dir = targetXY.clone().subtract(this.node.position);
    tween(this.node)
      .to(dir.length() / this.speed, { position: targetXY })
      .call(() => {
        this._isMoving = false;
        this.checkToMove();
        console.log("Move end: ", this.node.position);
      })
      .start();
    return true;
  }
  //   moveTo(target: Point) {
  //     this._isMoving = true;
  //     this.targets.shift();
  //     this._targetPos = target;
  //     let targetXY = MapManager.Instance.getLocationVec3(
  //       this._targetPos.col,
  //       this._targetPos.row
  //     );
  //     // let ox = targetXY.x - this.node.position.x;
  //     // let oy = targetXY.y - this.node.position.y;
  //     // console.log(
  //     //   "Move start1: ",
  //     //   MapManager.Instance.cellWidth,
  //     //   "x",
  //     //   MapManager.Instance.cellHeight,
  //     //   this.node.position,
  //     //   this._targetPos,
  //     //   targetXY,
  //     //   ox,
  //     //   "x",
  //     //   oy,
  //     //   targetXY.clone().subtract(this.node.position)
  //     // );
  //     let dir = targetXY.clone().subtract(this.node.position);
  //     tween(this.node)
  //       .to(dir.length() / this.speed, { position: targetXY })
  //       .call(() => {
  //         this._isMoving = false;
  //         // this.node.position = targetXY;
  //         console.log("Move end: ", this.node.position);
  //       })
  //       .start();
  //     return;
  //   }
  startMove() {
    this._isMoving = true;
  }
  stopMove() {
    this._isMoving = false;
  }
}
