import { _decorator, Component, Node, tween, Vec2, Vec3 } from "cc";
import { Point } from "./MapConfig";
import { MapManager } from "../Manager/MapManager";
import { MonsterManager } from "../Manager/MonsterManager";
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
    // this.setPoint(1, 1);
    // this.checkToMove();
    // this.scheduleOnce(() => {
    //   this.moveTo(nextTarget);
    // }, 1);
  }

  setPoint(col: number, row: number) {
    // console.log(
    //   "setPoint: ",
    //   col,
    //   "x",
    //   row,
    //   MapManager.Instance.getLocationVec2(col, row)
    // );
    this.node.position = MapManager.Instance.getLocationVec2(col, row).toVec3();
  }
  setTarget(targets: Point[]) {
    this.targets = targets;
    this.checkToMove();
  }

  moveByTargets(targets: Point[]) {
    if (targets.length == 0) {
      this._isMoving = false;
      return;
    }
    this._isMoving = true;
    let tw = tween(this.node);

    let fromPos = this.node.position;
    for (let i = 0; i < targets.length; i++) {
      let target = targets[i];
      let targetXY = MapManager.Instance.getLocationVec3(
        target.col,
        target.row
      );
      let dir = targetXY.clone().subtract(fromPos);
      tw = tw.to(dir.length() / this.speed, { position: targetXY });
    }
    tw.call(() => {
      this._isMoving = false;
      this.unscheduleAllCallbacks();
      this.node.removeFromParent();
      MonsterManager.Instance.recycleMonster(this.node);
      //   this.node.destroy();
      console.log("Move end: ", this.node.position);
    }).start();
    // this.targets.push(targets);
    // this._isMoving = true;
    // let targetXY = MapManager.Instance.getLocationVec3(
    //   nextTarget.col,
    //   nextTarget.row
    // );
    // let dir = targetXY.clone().subtract(this.node.position);
    // tween(this.node)
    //   .to(dir.length() / this.speed, { position: targetXY })
    //   .call(() => {
    //     this._isMoving = false;
    //     this.checkToMove();
    //     console.log("Move end: ", this.node.position);
    //   })
    //   .start();
  }
  addTarget(target: Point) {
    this.targets.push(target);
    this.checkToMove();
  }
  isMoving() {
    return this._isMoving;
  }

  checkToMove(fromPrev: boolean = false): boolean {
    if (this._isMoving) return false;
    if (this.targets.length == 0) {
      this._isMoving = false;
      if (fromPrev) {
        console.log("Move end: ", this.node.position);
        this.unscheduleAllCallbacks();
        this.node.removeFromParent();
        MonsterManager.Instance.recycleMonster(this.node);
      }
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
        this.checkToMove(true);
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
  //   startMove() {
  //     this._isMoving = true;
  //   }
  //   stopMove() {
  //     this._isMoving = false;
  //   }
}
