export class GameDef {}

export enum GameState {
  LOADING = "loading",
  READY = "ready",
  PLAYING = "playing",
  PAUSE = "pause",
  GAME_OVER = "game_over",
}

export enum LevelDef {
  LEVEL_1 = "level1",
}

export enum MonsterDef {
  MONSTER_1 = "monster1",
}

export class MonsterConfig {
  public monsterType: MonsterDef = MonsterDef.MONSTER_1;
  public hp: number = 100;
  public speed: number = 10;
  public reward: number = 100;
  public rewardGold: number = 100;
}

export enum BulletDef {
  BULLET_1 = "bullet1",
}
