// 障碍物配置
export interface ObstacleConfig {
  id: number;
  name: string;
  description: string;
  hp: number;
  reward: number; // 消灭后的金币奖励
  spritePath: string;
}

export class ObstacleConfig {
  // 障碍物配置
  static readonly OBSTACLES: ObstacleConfig[] = [
    {
      id: 1,
      name: "石头",
      description: "普通的石头障碍物",
      hp: 100,
      reward: 20,
      spritePath: "obstacles/rock",
    },
    {
      id: 2,
      name: "树桩",
      description: "坚固的树桩",
      hp: 200,
      reward: 30,
      spritePath: "obstacles/stump",
    },
    {
      id: 3,
      name: "木箱",
      description: "可以被摧毁的木箱",
      hp: 50,
      reward: 15,
      spritePath: "obstacles/crate",
    },
  ];

  // 获取障碍物配置
  static getObstacleConfig(id: number): ObstacleConfig | undefined {
    return this.OBSTACLES.find((obstacle) => obstacle.id === id);
  }
}
