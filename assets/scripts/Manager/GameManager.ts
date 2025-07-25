import { director } from "cc";

/// 全局游戏管理器
export class GameManager {
  private static _instance: GameManager;

  private constructor() {}

  static get Instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  /**
   * 加载主菜单
   */
  loadMainMenu() {
    // 切换到主菜单场景
    director.loadScene("MainMenu");
  }
}
