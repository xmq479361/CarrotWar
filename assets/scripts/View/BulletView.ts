import {
  _decorator,
  Component,
  Node,
  tween,
  Vec3,
  Sprite,
  resources,
  SpriteFrame,
  Vec2,
} from "cc";
import { EventManager, EventType } from "../Manager/EventManager";
import { DamageType } from "../Config/DamageConfig";
import { SpeedCtrlComponent } from "../Model/SpeedCtrlComponent";
import { Utils } from "../Utils/Utils";
const { ccclass, property } = _decorator;

@ccclass("BulletView")
export class BulletView extends SpeedCtrlComponent {
  bulletConfig: BulletConfig = null!;
  targetNode: Node | null = null!;
  attack: number = 0;
  effects: any = null;
  // 子弹速度，单位：像素/秒
  speed: number = 500;
  targetPos: Vec3 = new Vec3();

  @property(Sprite)
  bulletSprite: Sprite = null!;

  setup(targetPos: Vec3, targetNode: Node | null, bulletConfig: BulletConfig) {
    this.bulletConfig = bulletConfig;
    this.targetPos = targetPos;
    this.targetNode = targetNode;
    this.attack = bulletConfig.damage || 10;
    this.effects = bulletConfig.effects;
    this.speed = bulletConfig.speed || 500;
    this.startSchedule();
    this.setSchedule(0, 0);
    // 加载子弹图片
    Utils.setSpriteFrame(this.bulletSprite, bulletConfig.spritePath);
  }

  start() {
    // 监听游戏速度变化事件
    EventManager.Instance.on(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged.bind(this)
    );
  }

  onDestroy() {
    EventManager.Instance.off(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged
    );
  }

  onGameSpeedChanged(speedFactor: number) {
    this.speedFactor = speedFactor;
  }

  moveBullet() {
    this.startSchedule();
  }
  onScheduleCallback(dt: number): void {
    if (this.targetNode && !this.targetNode.isValid) {
      console.info("targetNode is invalid");
      this.onDismiss();
      return;
    }
    // 如果有目标节点，直接追踪目标
    const distance = Vec2.distance(
      this.node.worldPosition.toVec2(),
      this.targetNode.worldPosition.toVec2()
    );
    let offset = this.speed * dt;
    let newPosition = Vec2.lerp(
      new Vec2(),
      this.node.worldPosition.toVec2(),
      this.targetNode.worldPosition.toVec2(),
      offset / distance
    );
    // console.info(
    //   "Bullet distance:",
    //   distance,
    //   "angle",
    //   offset,
    //   Vec2.angle(
    //     this.node.worldPosition.toVec2(),
    //     this.targetNode.worldPosition.toVec2()
    //   ),
    //   newPosition,
    //   this.node.worldPosition.toVec2(),
    //   this.targetNode.worldPosition.toVec2()
    // );

    if (distance <= 0.1) {
      this.hitTarget();
      return;
    }
    this.node.worldPosition = newPosition.toVec3();
  }

  hitTarget() {
    this.stopSchedule();
    // 发射命中事件
    if (this.targetNode && this.targetNode.isValid) {
      EventManager.Instance.emit(EventType.BulletHit, {
        targetNode: this.targetNode,
        damage: this.attack,
        damageType: this.bulletConfig.damageType,
        effects: this.effects,
      });

      // 播放命中特效
      this.playHitEffect();
    }
    // 销毁子弹
    this.onDismiss();
  }

  playHitEffect() {
    // 根据子弹类型播放不同的命中特效
    if (this.bulletConfig.hitEffectPath) {
      // TODO 这里可以实现特效播放逻辑
      console.log("播放命中特效:", this.bulletConfig.hitEffectPath);
    }
  }

  onDismiss() {
    this.stopSchedule();
    // TODO 播放子弹消失动画
    this.node.destroy();
  }
}

// 子弹配置接口
export interface BulletConfig {
  id: number;
  name: string;
  damage?: number;
  damageType?: DamageType;
  speed?: number;
  spritePath?: string;
  hitEffectPath?: string;
  effects?: {
    slow?: number;
    splash?: number;
    dot?: number;
    duration?: number;
  };
}
