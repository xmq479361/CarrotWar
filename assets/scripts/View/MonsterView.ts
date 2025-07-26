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
  ProgressBar,
  Vec3,
  Vec2,
} from "cc";
import { EventManager, EventType } from "../Manager/EventManager";
import { Point, WaveConfig } from "../Config/MapConfig";
import { MonsterConfig } from "../Config/MonsterConfig";
import { MapManager } from "../Manager/MapManager";
import { MonsterManager } from "../Manager/MonsterManager";
import { Utils } from "../Utils/Utils";
import { BulletView } from "./BulletView";
import { SpeedCtrlComponent } from "../Model/SpeedCtrlComponent";
const { ccclass, property } = _decorator;

@ccclass("MonsterView")
export class MonsterView extends SpeedCtrlComponent {
  @property
  speed: number = 100;

  targets: Point[] = [];

  collider: Collider2D | null = null;
  private _isMoving: boolean = false;
  private _isPaused: boolean = false;
  private _currentTween: Tween<Node> | null = null;
  private monsterConfig: MonsterConfig | null = null;
  @property
  hp: number = 0;
  @property
  maxHp: number = 0; // 最大hp
  private _currentTarget: Point | null = null;
  // private _moveDir: Vec3 = new Vec3();

  get _hp(): number {
    return this.hp;
  }
  set _hp(value: number) {
    this.hp = value;
  }
  get _maxHp(): number {
    return this.maxHp;
  }
  set _maxHp(value: number) {
    this.maxHp = value;
  }
  // @property
  // hpSprite: Sprite | null = null;

  @property(ProgressBar)
  hpBar: ProgressBar;

  protected start(): void {
    // console.log("Move start: ", this.node.position);
    // 注册游戏暂停和恢复事件
    EventManager.Instance.on(EventType.GamePause, this.onGamePause.bind(this));
    EventManager.Instance.on(
      EventType.GameResume,
      this.onGameResume.bind(this)
    );
    // 注册单个碰撞体的回调函数
    this.collider = this.getComponentInChildren(Collider2D);
    if (this.collider) {
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }

    // 添加点击事件
    this.node.on(Node.EventType.TOUCH_END, this.onMonsterClick, this);
    if (this.hpBar) {
      this.hpBar.progress = 1;
    }
    // 监听游戏速度变化事件
    EventManager.Instance.on(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged.bind(this)
    );
  }

  protected onDestroy(): void {
    if (this.collider) {
      this.collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }
    // 取消事件监听
    EventManager.Instance.off(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged
    );
    EventManager.Instance.off(EventType.GamePause, this.onGamePause.bind(this));
    EventManager.Instance.off(
      EventType.GameResume,
      this.onGameResume.bind(this)
    );
    this.node.off(Node.EventType.TOUCH_END, this.onMonsterClick);
  }

  onHit(selfCollider: Collider2D, otherCollider: Collider2D) {
    // 子弹
    if (otherCollider.tag == 20) {
      let bulletView = otherCollider.node.parent.getComponent(BulletView);
      console.log("Monster onHit", otherCollider.node.name, otherCollider.tag);
      if (bulletView) {
        this._hp -= bulletView.attack;
        if (this.hpBar) {
          console.log(
            "Monster progress",
            this._hp,
            this._maxHp,
            this._hp / this._maxHp
          );
          this.hpBar.progress = this._hp / this._maxHp;
        }
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
    // this.node.removeFromParent();
    this.node.destroy();
    EventManager.Instance.emit(EventType.MonsterDie, this.node);
    EventManager.Instance.emit(
      EventType.GoldChanged,
      this.monsterConfig.reward
    );
  }
  // 游戏暂停处理
  onGamePause() {
    // if (this._isMoving && this._currentTween) {
    //   this._isPaused = true;
    //   this.stopSchedule();
    //   // this._currentTween.stop();
    // }
    this._isMoving = false;
    this._isPaused = true;
    this.stopSchedule();
  }

  // 游戏恢复处理
  onGameResume() {
    this._isMoving = true;
    if (this._isPaused) {
      this._isPaused = false;
    }
    this.startSchedule();
  }

  onGameSpeedChanged(speedFactor: number) {
    this.speedFactor = speedFactor;
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
    this._maxHp = wave.hp;
    // wave.enemyType;
    this.monsterConfig = monsterConfig;
    if (this.hpBar) {
      this.hpBar.progress = 1;
    }
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
    this._isMoving = true;
    this.startSchedule();
    // this.checkToMove();
  }

  addTarget(target: Point) {
    this.targets.push(target);
    if (!this._isPaused) {
      this.startSchedule();
      // this.checkToMove();
    }
  }

  isMoving() {
    return this._isMoving;
  }

  isPaused() {
    return this._isPaused;
  }

  stopMove() {
    console.info("stopMove");
    this._isMoving = false;
    this.unscheduleAllCallbacks();
    this.node.removeFromParent();
    MonsterManager.Instance.recycleMonster(this.node);
  }
  // 定时回调-移动怪物
  onScheduleCallback(dt: number): void {
    if (!this._isMoving || this._isPaused) return;

    // if (this.targets.length == 0) {
    //   console.info("Monster onScheduleCallback, taregts length is 0");
    //   this.stopMove();
    //   return;
    // }
    if (!this._currentTarget) {
      console.info("Monster shift target");
      this._currentTarget = this.targets.shift();
      if (!this._currentTarget) {
        console.info("Monster shift target empty");
        this.stopMove();
        return;
      }
    }
    // 计算这一帧要移动的距离
    const moveDistance = this.speed * dt;
    const srcPos = this.node.position.toVec2();
    const targetPos1 = MapManager.Instance.getLocationVec2(
      this._currentTarget.col,
      this._currentTarget.row
    );

    // 计算当前位置到目标位置的方向向量
    const direction = Vec2.subtract(new Vec2(), targetPos1, srcPos).normalize();

    // 计算实际移动距离（不超过剩余距离）
    const distanceToTarget = Vec2.distance(srcPos, targetPos1);
    const actualMoveDistance = Math.min(moveDistance, distanceToTarget);

    // 计算新位置
    const movement = direction.multiplyScalar(actualMoveDistance);
    const newPos = srcPos.add(movement);

    // 更新位置
    this.node.position = new Vec3(newPos.x, newPos.y, this.node.position.z);

    if (distanceToTarget <= moveDistance) {
      // 到达目标点，直接设置到目标位置
      this.node.position = targetPos1.toVec3();
      // 移除已到达的目标点
      this._currentTarget = null;
      //this.targets.shift();
      // if (!this._currentTarget) {
      //   this.stopMove();
      //   return;
      // }
    }
  }
  // checkToMove(fromPrev: boolean = false): boolean {
  //   if (this._isMoving || this._isPaused) return false;

  //   if (this.targets.length == 0) {
  //     this._isMoving = false;
  //     if (fromPrev) {
  //       // console.log("Move end: ", this.node.position);
  //       this.unscheduleAllCallbacks();
  //       this.node.removeFromParent();
  //       MonsterManager.Instance.recycleMonster(this.node);
  //     }
  //     return false;
  //   }

  //   let nextTarget = this.targets.shift();
  //   if (!nextTarget) {
  //     this._isMoving = false;
  //     return false;
  //   }

  //   this._isMoving = true;
  //   let targetXY = MapManager.Instance.getLocationVec3(
  //     nextTarget.col,
  //     nextTarget.row
  //   );
  //   let dir = targetXY.clone().subtract(this.node.position);

  //   this._currentTween = tween(this.node)
  //     .to(dir.length() / this.speed, { position: targetXY })
  //     .call(() => {
  //       this._isMoving = false;
  //       this._currentTween = null;
  //       this.checkToMove(true);
  //     })
  //     .start();

  //   return true;
  // }

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
