import {
  _decorator,
  Component,
  Collider2D,
  Contact2DType,
  Node,
  Tween,
  tween,
  Sprite,
  Color,
} from "cc";
import { EventManager, EventType } from "../Manager/EventManager";
import { Point, WaveConfig } from "../Model/MapConfig";
import { MapManager } from "../Manager/MapManager";
import { MonsterManager } from "../Manager/MonsterManager";
import { MonsterConfig } from "../Config/GameConfig";
import { Utils } from "../Utils/Utils";
import { BulletView } from "./BulletView";
const { ccclass, property } = _decorator;

@ccclass("MonsterView")
export class MonsterView extends Component {
  @property
  speed: number = 100;

  targets: Point[] = [];
  private _isMoving: boolean = false;
  private _isPaused: boolean = false;
  private _currentTween: Tween<Node> | null = null;
  private monsterConfig: MonsterConfig | null = null;
  private _hp: number = 0;

  protected start(): void {
    // console.log("Move start: ", this.node.position);
    // 注册游戏暂停和恢复事件
    EventManager.Instance.on(EventType.GamePause, this.onGamePause);
    EventManager.Instance.on(EventType.GameResume, this.onGameResume);
    // 注册单个碰撞体的回调函数
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }

    // 添加点击事件
    this.node.on(Node.EventType.TOUCH_END, this.onMonsterClick, this);
  }

  protected onDestroy(): void {
    let collider = this.getComponentInChildren(Collider2D);
    if (collider) {
      collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
    // 取消事件监听
    EventManager.Instance.off(EventType.GamePause, this.onGamePause);
    EventManager.Instance.off(EventType.GameResume, this.onGameResume);
    this.node.off(Node.EventType.TOUCH_END, this.onMonsterClick);
  }

  onHit(selfCollider: Collider2D, otherCollider: Collider2D) {
    // 子弹
    if (otherCollider.tag == 20) {
      console.log("Monster onHit", otherCollider.node.name, otherCollider.tag);
      let bulletView = otherCollider.node.getComponent(BulletView);
      if (bulletView) {
        this._hp -= bulletView.attack;
        if (this._hp <= 0) {
          this.onDismiss();
        }
        bulletView.onDismiss();
        return;
      }
    } else {
      this.onDismiss();
    }
  }

  onDismiss() {
    EventManager.Instance.emit(EventType.MonsterDie, this.node);
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

  setup(
    col: number,
    row: number,
    monsterConfig: MonsterConfig,
    wave: WaveConfig
  ) {
    this.node.position = MapManager.Instance.getLocationVec3(col, row);
    this.speed = wave.speed * 100;
    this._hp = wave.hp;
    // wave.enemyType;
    this.monsterConfig = monsterConfig;
    // TODO: 这里应该是根据配置来设置图片
    Utils.setSpriteFrame(
      this.node.getComponentInChildren(Sprite),
      monsterConfig.spritePath
    );
  }

  // setPoint(col: number, row: number) {
  //   this.node.position = MapManager.Instance.getLocationVec3(col, row);
  // }

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
        this.onDismiss();
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
        // console.log("Move end: ", this.node.position);
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

  onMonsterClick(event) {
    // 阻止事件冒泡
    event.stopPropagation();

    // 设置为优先攻击目标
    EventManager.Instance.emit(EventType.SetPriorityTarget, this.node);

    // 显示选中效果
    this.showSelectedEffect(true);

    console.log(`选中怪物作为优先攻击目标: ${this.monsterConfig.name}`);
  }

  showSelectedEffect(selected: boolean) {
    // 这里可以添加选中效果，比如高亮显示
    const sprite = this.node.getComponent(Sprite);
    if (sprite) {
      if (selected) {
        sprite.color = new Color(255, 255, 150, 255); // 黄色高亮
      } else {
        sprite.color = Color.WHITE;
      }
    }
  }
}
