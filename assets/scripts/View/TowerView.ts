import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Vec3,
  Sprite,
  resources,
  SpriteFrame,
  UITransform,
  Vec2,
  Label,
} from "cc";
import { TowerConfig, TowerLevelConfig } from "../Config/TowerConfig";
import { BulletView, BulletConfig } from "./BulletView";
import { EventManager, EventType } from "../Manager/EventManager";
import { MainGameScene } from "../Scene/MainGameScene";
import { SpeedCtrlComponent } from "../Model/SpeedCtrlComponent";
const { ccclass, property } = _decorator;

@ccclass("TowerView")
export class TowerView extends SpeedCtrlComponent {
  @property(Sprite)
  towerSprite: Sprite = null!;

  towerLabel: Label = null!;

  monsterContainer: Node = null!;
  @property(Prefab)
  bulletPrefab: Prefab = null!;

  private _towerConfig: TowerConfig = null!;
  private _currentLevel: number = 1;
  private _levelConfig: TowerLevelConfig = null!;
  private _row: number = 0;
  private _col: number = 0;
  private _targetNode: Node | null = null;
  private _priorityTarget: Node | null = null;

  protected start(): void {
    // 注册事件
    EventManager.Instance.on(EventType.GamePause, this.onGamePause);
    EventManager.Instance.on(EventType.GameResume, this.onGameResume);
    this.monsterContainer =
      MainGameScene.Instance.gameView.node.getChildByName("MonsterContainer");
    this.towerLabel = this.node.getComponentInChildren(Label);
  }

  onDestroy() {
    // 取消事件监听
    EventManager.Instance.off(EventType.GamePause, this.onGamePause);
    EventManager.Instance.off(EventType.GameResume, this.onGameResume);
    this.unscheduleAllCallbacks();
    EventManager.Instance.off(
      EventType.SetPriorityTarget,
      this.onSetPriorityTarget
    );
    EventManager.Instance.off(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged
    );
  }

  setup(row: number, col: number, towerConfig: TowerConfig) {
    this._row = row;
    this._col = col;
    this._towerConfig = towerConfig;
    this._currentLevel = 0;
    this._levelConfig = towerConfig.levels[this._currentLevel];

    console.info("setTower setup");
    // 加载塔的图片
    this.updateTowerSprite();
    this.setSchedule(0, this._towerConfig.attackSpeed);
    // 开始攻击循环
    this.startAttacking();

    // 监听优先攻击目标事件
    EventManager.Instance.on(
      EventType.SetPriorityTarget,
      this.onSetPriorityTarget.bind(this)
    );
    EventManager.Instance.on(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged.bind(this)
    );
  }

  updateTowerSprite() {
    if (this.towerSprite && this._levelConfig.spritePath) {
      resources.load(
        this._levelConfig.spritePath,
        SpriteFrame,
        (err, spriteFrame) => {
          if (!err) {
            this.towerSprite.spriteFrame = spriteFrame;
          }
        }
      );
    }
    if (this.towerLabel) {
      this.towerLabel.string = `${
        this._towerConfig.name
      }-lv:${this._levelConfig.level.toString()}`;
    }
  }

  startAttacking() {
    this.startSchedule();
  }

  stopAttacking() {
    this.stopSchedule();
  }

  // 设置优先攻击目标
  onSetPriorityTarget(targetNode: Node) {
    this._priorityTarget = targetNode;

    // 检查目标是否在攻击范围内
    if (this._priorityTarget && this.isTargetInRange(this._priorityTarget)) {
      // 立即攻击优先目标
      this._targetNode = this._priorityTarget;
    }
  }

  // 检查目标是否在攻击范围内
  isTargetInRange(target: Node): boolean {
    const distance = Vec3.distance(this.node.position, target.position);
    return distance <= this._levelConfig.range;
  }

  // 游戏速度变化处理
  onGameSpeedChanged(speedFactor: number) {
    this.speedFactor = speedFactor;
  }

  onScheduleCallback(dt: number): void {
    console.info("Tower onScheduleCallback");
    if (!this.isScheduleEnable) return;

    // 检查优先目标是否有效且在范围内
    if (this._priorityTarget && this._priorityTarget.isValid) {
      if (this.isTargetInRange(this._priorityTarget)) {
        this._targetNode = this._priorityTarget;
      } else {
        // 超出范围，清除优先目标
        this._priorityTarget = null;
      }
    }

    // 如果没有优先目标或优先目标无效，寻找最近的目标
    if (!this._targetNode || !this._targetNode.isValid) {
      this._targetNode = this.findTarget();
    }

    // 如果有目标，则攻击
    if (this._targetNode) {
      this.attack();
    }
  }

  findTarget() {
    // 获取范围内的所有怪物
    const monsters = this.getMonstersInRange();

    // 根据策略选择目标（这里简单选择第一个）
    return monsters.length > 0 ? monsters[0] : null;
  }

  getMonstersInRange() {
    // 这里需要实现获取范围内怪物的逻辑
    // 可以通过事件系统或直接查询场景中的怪物节点

    // 示例实现：
    const monsters: Node[] = [];
    if (!this.monsterContainer) {
      this.monsterContainer =
        MainGameScene.Instance.gameView.node.getChildByName("MonsterContainer");
    }
    if (this.monsterContainer) {
      const towerPos = this.node.worldPosition;
      const range = this._levelConfig.range;

      this.monsterContainer.children.forEach((monster) => {
        const distance = Vec2.distance(towerPos, monster.worldPosition);
        // console.info("findMonster: ", range, distance);
        if (distance <= range) {
          monsters.push(monster);
        }
      });
    } else {
      console.error("monsterContainer is null");
    }

    return monsters;
  }

  // 在攻击方法中也考虑游戏速度
  attack() {
    console.info("Tower attack");
    if (!this._targetNode || !this._targetNode.isValid) return;

    // 创建子弹
    const bullet = instantiate(this.bulletPrefab);
    const bulletView = bullet.getComponent(BulletView);

    if (bulletView) {
      // 设置子弹属性
      const bulletConfig: BulletConfig = {
        id: this._towerConfig.type,
        name: this._towerConfig.name + "子弹",
        damage: this._levelConfig.damage,
        damageType: this._towerConfig.damageType,
        speed: 500,
        spritePath: `bullets/${this._towerConfig.type}_bullet`,
        effects: this._levelConfig.effects,
      };

      // 设置子弹位置
      bullet.position = this.node.worldPosition;

      // 设置子弹目标
      let targetPos = this._targetNode.worldPosition;
      bulletView.setup(targetPos, this._targetNode, bulletConfig);
      // 将子弹添加到场景
      this.node.parent.parent.addChild(bullet);
      // 播放攻击动画或音效
      this.playAttackEffect();
    } else {
      console.error("BulletView component not found on bullet prefab.");
    }
  }

  playAttackEffect() {
    // 这里可以实现攻击特效或音效
    console.log(`${this._towerConfig.name} 攻击!`);
  }

  upgrade() {
    if (this._currentLevel < this._towerConfig.levels.length) {
      this._currentLevel++;
      this._levelConfig = this._towerConfig.levels[this._currentLevel - 1];
      // 更新塔的外观和属性
      this.updateTowerSprite();

      return true;
    }
    return false;
  }

  onGamePause() {
    this.stopAttacking();
  }

  onGameResume() {
    this.startAttacking();
  }

  getTowerConfig() {
    return this._towerConfig;
  }

  getCurrentLevel(): number {
    return this._currentLevel;
  }

  getUpgradeCost() {
    return this._towerConfig.upgradeCost[this._currentLevel - 1] || 0;
  }

  getRecycleValue() {
    let totalCost = this._towerConfig.cost;
    for (let i = 0; i < this._currentLevel - 1; i++) {
      totalCost += this._towerConfig.upgradeCost[i];
    }
    return Math.floor(totalCost * this._towerConfig.recycleRate);
  }
}
