import { DamageType } from "./DamageConfig";

// 防御塔类型枚举
export enum TowerType {
  ARROW = 1, // 箭塔
  MAGIC = 2, // 魔法塔
  CANNON = 3, // 炮塔
  FREEZE = 4, // 冰冻塔
}
// 防御塔配置
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
  recycleRate: number; // 回收返还比例，如0.7表示返还70%
  spritePath: string; // 图片资源路径
  levels: TowerLevelConfig[]; // 各等级配置
}

// 防御塔等级配置
export interface TowerLevelConfig {
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  spritePath: string;
  effects?: {
    slow?: number;
    splash?: number;
    dot?: number;
    duration?: number;
  };
}
// 游戏配置
export class GameConfigs {
  // 防御塔配置
  static readonly TOWERS: Record<TowerType, TowerConfig> = {
    [TowerType.ARROW]: {
      type: TowerType.ARROW,
      name: "箭塔",
      description: "基础防御塔，攻击单个目标",
      cost: 100,
      damage: 20,
      range: 300,
      attackSpeed: 1.0,
      damageType: DamageType.PHYSICAL,
      upgradeCost: [150, 250, 400],
      recycleRate: 0.7,
      spritePath: "towers/arrow_tower",
      levels: [
        {
          level: 1,
          damage: 20,
          range: 350,
          attackSpeed: 1.0,
          spritePath: "towers/arrow_tower_1",
        },
        {
          level: 2,
          damage: 35,
          range: 400,
          attackSpeed: 1.2,
          spritePath: "towers/arrow_tower_2",
        },
        {
          level: 3,
          damage: 55,
          range: 450,
          attackSpeed: 1.5,
          spritePath: "towers/arrow_tower_3",
        },
      ],
    },
    [TowerType.MAGIC]: {
      type: TowerType.MAGIC,
      name: "魔法塔",
      description: "魔法攻击，可以穿透护甲",
      cost: 150,
      damage: 30,
      range: 180,
      attackSpeed: 0.8,
      damageType: DamageType.MAGICAL,
      upgradeCost: [200, 300, 500],
      recycleRate: 0.7,
      spritePath: "towers/magic_tower",
      levels: [
        {
          level: 1,
          damage: 30,
          range: 180,
          attackSpeed: 0.8,
          spritePath: "towers/magic_tower_1",
        },
        {
          level: 2,
          damage: 50,
          range: 200,
          attackSpeed: 0.9,
          spritePath: "towers/magic_tower_2",
        },
        {
          level: 3,
          damage: 80,
          range: 220,
          attackSpeed: 1.0,
          spritePath: "towers/magic_tower_3",
        },
      ],
    },
    [TowerType.CANNON]: {
      type: TowerType.CANNON,
      name: "炮塔",
      description: "范围攻击，对群体敌人效果显著",
      cost: 200,
      damage: 40,
      range: 150,
      attackSpeed: 0.6,
      damageType: DamageType.PHYSICAL,
      upgradeCost: [250, 400, 600],
      recycleRate: 0.7,
      spritePath: "towers/cannon_tower",
      levels: [
        {
          level: 1,
          damage: 40,
          range: 150,
          attackSpeed: 0.6,
          spritePath: "towers/cannon_tower_1",
          effects: {
            splash: 50,
          },
        },
        {
          level: 2,
          damage: 65,
          range: 170,
          attackSpeed: 0.7,
          spritePath: "towers/cannon_tower_2",
          effects: {
            splash: 70,
          },
        },
        {
          level: 3,
          damage: 100,
          range: 190,
          attackSpeed: 0.8,
          spritePath: "towers/cannon_tower_3",
          effects: {
            splash: 90,
          },
        },
      ],
    },
    [TowerType.FREEZE]: {
      type: TowerType.FREEZE,
      name: "冰冻塔",
      description: "减缓敌人移动速度",
      cost: 180,
      damage: 15,
      range: 160,
      attackSpeed: 1.2,
      damageType: DamageType.MAGICAL,
      upgradeCost: [220, 350, 550],
      recycleRate: 0.7,
      spritePath: "towers/freeze_tower",
      levels: [
        {
          level: 1,
          damage: 15,
          range: 160,
          attackSpeed: 1.2,
          spritePath: "towers/freeze_tower_1",
          effects: {
            slow: 0.3,
            duration: 2,
          },
        },
        {
          level: 2,
          damage: 25,
          range: 180,
          attackSpeed: 1.3,
          spritePath: "towers/freeze_tower_2",
          effects: {
            slow: 0.4,
            duration: 2.5,
          },
        },
        {
          level: 3,
          damage: 40,
          range: 200,
          attackSpeed: 1.5,
          spritePath: "towers/freeze_tower_3",
          effects: {
            slow: 0.5,
            duration: 3,
          },
        },
      ],
    },
  };

  // 获取防御塔配置
  static getTowerConfig(type: TowerType): TowerConfig {
    return this.TOWERS[type];
  }
}
