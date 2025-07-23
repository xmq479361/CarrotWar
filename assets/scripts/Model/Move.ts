import { _decorator, Component, Node, tween, Vec2, Vec3, Tween } from "cc";
import { Point } from "./MapConfig";
import { MapManager } from "../Manager/MapManager";
import { MonsterManager } from "../Manager/MonsterManager";
import { EventManager, EventType } from "../Manager/EventManager";
const { ccclass, property } = _decorator;

@ccclass("Move")
export class Move extends Component {
  @property
  speed: number = 100;

  targets: Point[] = [];
  private _isMoving: boolean = false;
  private _isPaused: boolean = false;
  private _currentTween: Tween<Node> | null = null;

  protected start(): void {
    console.log("Move start: ", this.node.position);
    // 注册游戏暂停和恢复事件
    EventManager.Instance.on(EventType.GamePause, this.onGamePause);
    EventManager.Instance.on(EventType.GameResume, this.onGameResume);
  }

  protected onDestroy(): void {
    // 取消事件监听
    EventManager.Instance.off(EventType.GamePause, this.onGamePause);
    EventManager.Instance.off(EventType.GameResume, this.onGameResume);
  }

  // 游戏暂停处理
  onGamePause() {
    if (this._isMoving && this._currentTween) {
      this._isPaused = true;
      this._currentTween.stop();
    }
  }

  // 游戏恢复处理
  onGameResume() {
    if (this._isPaused) {
      this._isPaused = false;
      // 恢复移动
      this.checkToMove();
    }
  }

  setPoint(col: number, row: number) {
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

    if (this._isPaused) {
      // 如果游戏暂停中，先保存目标，等恢复时再移动
      this.targets = targets;
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
      fromPos = targetXY;
    }

    this._currentTween = tw
      .call(() => {
        this._isMoving = false;
        this._currentTween = null;
        this.unscheduleAllCallbacks();
        this.node.removeFromParent();
        MonsterManager.Instance.recycleMonster(this.node);
        console.log("Move end: ", this.node.position);
      })
      .start();
  }

  addTarget(target: Point) {
    this.targets.push(target);
    if (!this._isPaused) {
      this.checkToMove();
    }
  }

  isMoving() {
    return this._isMoving;
  }

  isPaused() {
    return this._isPaused;
  }

  checkToMove(fromPrev: boolean = false): boolean {
    if (this._isMoving || this._isPaused) return false;

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

    this._currentTween = tween(this.node)
      .to(dir.length() / this.speed, { position: targetXY })
      .call(() => {
        this._isMoving = false;
        this._currentTween = null;
        this.checkToMove(true);
      })
      .start();

    return true;
  }
}
