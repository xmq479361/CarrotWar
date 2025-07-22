/// 格子类型
/**
 * 格子类型
 * 0: 空, 可以放置塔
 * 1: 路, 怪物路径
 * 2: 障碍物, 可被攻击
 * 3: 塔, 可攻击,升级
 * 4: 基地, 可被攻击
 *
 */
// export enum PointType {
//     /// 空, 可以放置塔
//     NONE = 0,
//     /// 路, 怪物路径
//     ROAD = 1,
//     /// 障碍物, 可被攻击
//     OBSTACLE = 2,
//     /// 塔, 可攻击,升级
//     TOWER = 3,
//     /// 基地, 可被攻击
//     BASE = 4,
// }

export class Point {
  x: number = 0;
  y: number = 0;
  canHold: boolean = false;

  constructor(x: number, y: number, canHold: boolean) {
    this.x = x;
    this.y = y;
    this.canHold = canHold;
  }
}

/// 怪物
export class Monster {
  public id: string = "";
  public name: string = "";
  public hp: number = 0;
  public speed: number = 0;
  public reward: number = 0;
}

/**
 * 格子配置
 */
export interface CellConfig {
  type: number; // 格子类型：0-空地，1-道路，2-不可放置区域，3-起点，4-终点
  buildable: boolean; // 是否可以建造防御塔
  decoration?: number; // 装饰物ID，可选
}

/**
 * 敌人波次配置
 */
export interface WaveConfig {
  enemyType: number; // 敌人类型ID
  count: number; // 敌人数量
  interval: number; // 出现间隔(秒)
  hp: number; // 生命值
  speed: number; // 移动速度
  reward: number; // 击败奖励
}

export class MapConfig {
  /// 关卡编号
  levelId: number = 0;
  /// 关卡名称
  levelName: string = "";
  /// 关卡描述
  levelDesc: string = "";
  /// 关卡奖励
  levelReward: number = 0;
  /// 关卡路径
  levelPath: string = "";
  /// 地图背景图片
  background: string = "";
  /// 初始化金币
  initialGold: number = 0;
  /// 初始化生命
  initialLife: number = 0;

  /// 地图宽度
  cols: number = 0;
  /// 地图高度
  rows: number = 0;
  /// 关卡怪物
  waves: WaveConfig[]; // 敌人波次配置
  /// 可支持方塔的点
  holds: Point[] = [];
  // 敌人路径点，可以有多条路径
  paths: Point[][];
  // 全部的格子.
  cells: Point[][];
}
