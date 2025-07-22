// 防御塔类型枚举
export enum TowerType {
  ARROW = 1, // 箭塔
  MAGIC = 2, // 魔法塔
  CANNON = 3, // 炮塔
  FREEZE = 4, // 冰冻塔
}

// 攻击类型枚举
export enum DamageType {
  PHYSICAL = 1, // 物理伤害
  MAGICAL = 2, // 魔法伤害
  PURE = 3, // 真实伤害
}

// 防御塔基础配置
export interface TowerConfig {
  type: TowerType;
  name: string;
  description: string;
  cost: number;
  damage: number;
  range: number;
  attackSpeed: number;
  damageType: DamageType;
  upgradeCost: number[];
  // 特殊效果
  effects?: {
    slow?: number; // 减速效果
    splash?: number; // 溅射范围
    dot?: number; // 持续伤害
    duration?: number; // 效果持续时间
  };
}

// 防御塔配置表
export class TowerConfigs {
  static readonly ARROW_TOWER: TowerConfig = {
    type: TowerType.ARROW,
    name: "箭塔",
    description: "基础防御塔，攻击单个目标",
    cost: 100,
    damage: 20,
    range: 200,
    attackSpeed: 1.0,
    damageType: DamageType.PHYSICAL,
    upgradeCost: [150, 250, 400],
  };

  static readonly MAGIC_TOWER: TowerConfig = {
    type: TowerType.MAGIC,
    name: "魔法塔",
    description: "魔法攻击，可以穿透护甲",
    cost: 150,
    damage: 30,
    range: 180,
    attackSpeed: 0.8,
    damageType: DamageType.MAGICAL,
    upgradeCost: [200, 300, 500],
  };

  static readonly CANNON_TOWER: TowerConfig = {
    type: TowerType.CANNON,
    name: "炮塔",
    description: "范围攻击，对群体敌人效果显著",
    cost: 200,
    damage: 40,
    range: 150,
    attackSpeed: 0.6,
    damageType: DamageType.PHYSICAL,
    upgradeCost: [250, 400, 600],
    effects: {
      splash: 50,
    },
  };

  static readonly FREEZE_TOWER: TowerConfig = {
    type: TowerType.FREEZE,
    name: "冰冻塔",
    description: "减缓敌人移动速度",
    cost: 180,
    damage: 15,
    range: 160,
    attackSpeed: 1.2,
    damageType: DamageType.MAGICAL,
    upgradeCost: [220, 350, 550],
    effects: {
      slow: 0.3,
      duration: 2,
    },
  };

  static getTowerConfig(type: TowerType): TowerConfig {
    switch (type) {
      case TowerType.ARROW:
        return this.ARROW_TOWER;
      case TowerType.MAGIC:
        return this.MAGIC_TOWER;
      case TowerType.CANNON:
        return this.CANNON_TOWER;
      case TowerType.FREEZE:
        return this.FREEZE_TOWER;
      default:
        throw new Error(`未知的防御塔类型: ${type}`);
    }
  }
}

export class TowerModel {
  private _config: TowerConfig;
  private _level: number = 1;
  private _position: { row: number; col: number };
  private _target: any | null = null;
  private _lastAttackTime: number = 0;

  constructor(config: TowerConfig, row: number, col: number) {
    this._config = config;
    this._position = { row, col };
  }

  get type(): TowerType {
    return this._config.type;
  }

  get damage(): number {
    return this._config.damage * this._level;
  }

  get range(): number {
    return this._config.range;
  }

  get attackSpeed(): number {
    return this._config.attackSpeed;
  }

  get damageType(): DamageType {
    return this._config.damageType;
  }

  get effects() {
    return this._config.effects;
  }

  get position() {
    return this._position;
  }

  get level(): number {
    return this._level;
  }

  get upgradeCost(): number {
    return this._config.upgradeCost[this._level - 1] || 0;
  }

  canUpgrade(): boolean {
    return this._level < this._config.upgradeCost.length + 1;
  }

  upgrade(): boolean {
    if (!this.canUpgrade()) return false;
    this._level++;
    return true;
  }

  canAttack(currentTime: number): boolean {
    return currentTime - this._lastAttackTime >= 1000 / this.attackSpeed;
  }

  setTarget(target: any) {
    this._target = target;
  }

  attack(currentTime: number) {
    if (!this._target || !this.canAttack(currentTime)) return;

    // 记录攻击时间
    this._lastAttackTime = currentTime;

    // 返回攻击数据
    return {
      damage: this.damage,
      damageType: this.damageType,
      effects: this.effects,
    };
  }
}
