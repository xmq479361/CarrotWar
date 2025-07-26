// 怪物配置
export interface MonsterConfig {
  id: number;
  name: string;
  description: string;
  hp: number;
  speed: number;
  reward: number;
  damage: number; // 对萝卜造成的伤害
  spritePath: string;
  animationPath: string; // 动画资源路径
  resistance?: {
    // 抗性
    physical?: number;
    magical?: number;
    slow?: number;
  };
}
export class MonsterConfigs {
  // 怪物配置
  static readonly MONSTERS: MonsterConfig[] = [
    {
      id: 1,
      name: "小兔子",
      description: "普通的小兔子",
      hp: 100,
      speed: 1.0,
      reward: 10,
      damage: 1,
      // spritePath: "",
      spritePath: "Monsters/Monster1/spriteFrame",
      animationPath: "animations/rabbit",
    },
    {
      id: 2,
      name: "狐狸",
      description: "速度较快的狐狸",
      hp: 80,
      speed: 1.5,
      reward: 15,
      damage: 1,
      spritePath: "monsters/fox",
      animationPath: "animations/fox",
    },
    {
      id: 3,
      name: "野猪",
      description: "生命值较高的野猪",
      hp: 200,
      speed: 0.8,
      reward: 20,
      damage: 2,
      spritePath: "monsters/boar",
      animationPath: "animations/boar",
      resistance: {
        physical: 0.2,
      },
    },
    {
      id: 4,
      name: "狼",
      description: "攻击力较高的狼",
      hp: 150,
      speed: 1.2,
      reward: 25,
      damage: 3,
      spritePath: "monsters/wolf",
      animationPath: "animations/wolf",
    },
  ];
  // 获取怪物配置
  static getMonsterConfig(id: number): MonsterConfig | undefined {
    return this.MONSTERS.find((monster) => monster.id === id);
  }
}
