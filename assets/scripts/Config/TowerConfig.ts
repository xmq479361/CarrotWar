import { DamageType } from "./DamageConfig";

// 防御塔类型枚举
export enum TowerType {
  ARROW = 1, // 箭塔
  MAGIC = 2, // 魔法塔
  CANNON = 3, // 炮塔
  FREEZE = 4, // 冰冻塔
}
// 防御塔配置
export class TowerConfig {
  type: TowerType;
  name: string;
  damageType: DamageType;
  description: string;
  spritePath: string; // 图片资源路径
  levels: TowerLevelConfig[]; // 各等级配置

  //   get levelConfig(): TowerLevelConfig {
  //     return this.levels[0]; // 这里假设 levels 数组的索引从 0 开始，所以需要减去 1
  //   }
  //   levelConfig(level: number = 0): TowerLevelConfig {
  //     return this.levels[level]; // 这里假设 levels 数组的索引从 0 开始，所以需要减去 1
  //   }
}

// 防御塔等级配置
export interface TowerLevelConfig {
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  spritePath: string;
  upgradeCost: number;
  recycle: number;
  damageType?: DamageType;
  effects?: {
    slow?: number;
    splash?: number;
    dot?: number;
    duration?: number;
  };
}
// 游戏配置
export class TowerConfigs {
  // 防御塔配置
  static readonly TOWERS: Record<TowerType, TowerConfig> = {
    [TowerType.ARROW]: {
      type: TowerType.ARROW,
      name: "箭塔",
      description: "基础防御塔，攻击单个目标",
      damageType: DamageType.PHYSICAL,
      spritePath: "Game/Tower/ID1_5",
      levels: [
        {
          level: 1,
          upgradeCost: 100,
          recycle: 50,
          damage: 20,
          range: 150,
          attackSpeed: 1.0,
          spritePath: "Game/Tower/ID1_5/spriteFrame",
        },
        {
          level: 2,
          damage: 35,
          range: 200,
          attackSpeed: 1.2,
          upgradeCost: 200,
          recycle: 120,
          spritePath: "towers/arrow_tower_2",
        },
        {
          level: 3,
          damage: 55,
          range: 300,
          attackSpeed: 1.5,
          upgradeCost: 400,
          recycle: 240,
          spritePath: "towers/arrow_tower_3",
        },
      ],
    },
    [TowerType.MAGIC]: {
      type: TowerType.MAGIC,
      name: "魔法塔",
      description: "魔法攻击，可以穿透护甲",
      damageType: DamageType.MAGICAL,
      spritePath: "towers/magic_tower",
      levels: [],
    },
    [TowerType.CANNON]: {
      type: TowerType.CANNON,
      damageType: DamageType.PHYSICAL,
      name: "炮塔",
      description: "范围攻击，对群体敌人效果显著",
      spritePath: "towers/cannon_tower",
      levels: [],
    },
    [TowerType.FREEZE]: {
      type: TowerType.FREEZE,
      name: "冰冻塔",
      description: "减缓敌人移动速度",
      damageType: DamageType.MAGICAL,
      spritePath: "towers/freeze_tower",
      levels: [],
    },
  };

  // 获取防御塔配置
  static getTowerConfig(type: TowerType): TowerConfig {
    return this.TOWERS[type];
  }
}
