import { MapManager } from "./MapManager";
import { EventManager } from "./EventManager";
import { MapConfig, Point, WaveConfig } from "../Model/MapConfig";
import { CellModel } from "../Model/CellModel";
import { TowerConfigs, TowerModel, TowerType } from "../Model/TowerModel";

export interface BuildResult {
  success: boolean;
  message: string;
}

export class GameManager {
  private static _instance: GameManager;
  private _isGameStarted: boolean = false;
  private _mapConfig: MapConfig;
  private _gold: number = 0;
  private _life: number = 0;
  private _currentWave: number = 0;
  private _enemiesAlive: number = 0;
  private _cells: CellModel[][] = [];

  private constructor() {}

  static get Instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  getCellModel(row: number, col: number): CellModel | null {
    return this._cells[row][col];
  }
  get mapConfig(): MapConfig {
    return this._mapConfig;
  }
  get currWave(): number {
    return this._currentWave;
  }
  get totalWaves(): number {
    return this.mapConfig.waves.length;
  }

  /**
   * 初始化游戏
   */
  async initGame(level: string): Promise<MapConfig> {
    try {
      console.log("开始初始化游戏");
      this._mapConfig = await MapManager.Instance.loadMap(level);
      console.log("地图配置加载完成", this._mapConfig);

      this._gold = this._mapConfig.initialGold;
      this._life = this._mapConfig.initialLife;

      // 初始化格子模型
      this.initCells();
      // 注册事件
      this.registerEvents();

      console.log("游戏初始化完成");
      return this._mapConfig;
    } catch (error) {
      console.error("初始化地图失败:", error);
      throw error;
    }
  }
  //   get _cells() {
  //     return MapManager.Instance.cells;
  //   }
  /**
   * 初始化格子模型
   */
  private initCells() {
    const rows = this.mapConfig.rows;
    const cols = this.mapConfig.cols;

    this._cells = [];
    for (let row = 0; row < rows; row++) {
      this._cells[row] = [];

      for (let col = 0; col < cols; col++) {
        this._cells[row][col] = new CellModel(row, col);
      }
    }
    this.mapConfig.holds.forEach((hold) => {
      const cell = this.getCell(hold.row, hold.col);
      if (cell) {
        cell.buildable = true;
      }
    });
    this.mapConfig.paths.forEach((path) => {
      path.forEach((cell) => {
        const cellModel = this.getCell(cell.row, cell.col);
        if (cellModel) {
          cellModel.path = true;
        }
      });
    });
  }

  /**
   * 注册事件
   */
  private registerEvents() {
    // 监听格子点击事件
    EventManager.Instance.on("cell-clicked", this.onCellClicked.bind(this));

    // 监听游戏开始事件
    EventManager.Instance.on("game-start", this.startGame.bind(this));

    // 监听游戏暂停事件
    EventManager.Instance.on("game-pause", this.pauseGame.bind(this));

    // 监听游戏结束事件
    EventManager.Instance.on("game-over", this.gameOver.bind(this));
  }

  /**
   * 处理格子点击事件
   * @param row 行
   * @param col 列
   */
  onCellClicked(row: number, col: number) {
    if (!this._mapConfig) return;
    let cell = this.getCell(row, col);
    console.log(`点击格子: (${row}, ${col})`, cell);

    // 检查是否可以在该格子上建造
    if (this.isBuildable(col, row)) {
      // 触发建造UI显示事件
      EventManager.Instance.emit("show-build-ui", row, col);
    } else {
      console.log("该位置不可建造");
    }
  }

  /**
   * 处理点击坐标
   * @param x X坐标
   * @param y Y坐标
   */
  handleClickPosition(x: number, y: number) {
    // 将坐标转换为格子位置
    const [col, row] = MapManager.Instance.getLocationFromPoint(x, y);

    // 触发格子点击事件
    this.onCellClicked(row, col);
  }

  /**
   * 开始游戏
   */
  startGame() {
    if (!this._mapConfig) return;

    this._isGameStarted = true;
    console.log("游戏开始");

    // 开始第一波敌人
    this.startNextWave();
  }

  /**
   * 暂停游戏
   */
  pauseGame() {
    this._isGameStarted = false;
    console.log("游戏暂停");
  }

  /**
   * 游戏结束
   * @param isWin 是否胜利
   */
  gameOver(isWin: boolean) {
    this._isGameStarted = false;
    console.log(`游戏结束，${isWin ? "胜利" : "失败"}`);

    // 触发游戏结束UI显示事件
    EventManager.Instance.emit("show-game-over-ui", isWin);
  }

  /**
   * 开始下一波敌人
   */
  startNextWave() {
    if (!this._mapConfig || !this._isGameStarted) return;

    const currentWave = this.currWave;
    if (currentWave >= this.totalWaves) {
      // 所有波次完成，游戏胜利
      this.gameOver(true);
      return;
    }

    console.log(`开始第 ${currentWave + 1} 波敌人`);

    // 触发波次开始事件
    EventManager.Instance.emit("wave-start", currentWave);

    // 生成敌人
    this.startWave();
  }

  /**
   * 建造防御塔
   * @param row 行
   * @param col 列
   * @param towerType 防御塔类型
   */
  buildTower(row: number, col: number, towerType: number) {
    if (!this._mapConfig) return false;

    // 委托给 GameModel 处理具体的建造逻辑
    const result = this.tryBuildTower(row, col, towerType);

    if (result.success) {
      // 触发防御塔建造事件
      EventManager.Instance.emit("tower-built", row, col, towerType);
      console.log(`在 (${row}, ${col}) 建造了类型为 ${towerType} 的防御塔`);
    } else {
      console.log(result.message);
    }

    return result.success;
  }

  /**
   * 游戏是否已开始
   */
  get isGameStarted(): boolean {
    return this._isGameStarted;
  }
  /**
   * 获取格子模型
   * @param row 行
   * @param col 列
   */
  getCell(row: number, col: number): CellModel | null {
    if (
      row < 0 ||
      row >= this.mapConfig.rows ||
      col < 0 ||
      col >= this.mapConfig.cols
    ) {
      return null;
    }

    return this._cells[row][col];
  }

  /**
   * 开始波次
   */
  startWave() {
    if (this._currentWave >= this.mapConfig.waves.length) return;

    const wave = this.mapConfig.waves[this._currentWave];
    this._enemiesAlive = wave.count;

    // 模拟生成敌人
    this.spawnEnemies(wave);

    // 增加当前波次
    this._currentWave++;
  }

  /**
   * 生成敌人
   * @param wave 波次配置
   */
  private spawnEnemies(wave: WaveConfig) {
    // 这里只是模拟，实际游戏中需要根据波次配置生成敌人
    console.log(`生成 ${wave.count} 个类型为 ${wave.enemyType} 的敌人`);

    // 模拟敌人生成完成事件
    setTimeout(() => {
      // 模拟敌人生成过程
      let enemiesSpawned = 0;

      // 创建定时器，按照间隔时间生成敌人
      const spawnInterval = setInterval(() => {
        // 生成一个敌人
        this.spawnEnemy(wave.enemyType, wave.hp, wave.speed);
        enemiesSpawned++;

        // 检查是否已生成所有敌人
        if (enemiesSpawned >= wave.count) {
          clearInterval(spawnInterval);
          console.log(`第 ${this._currentWave} 波敌人全部生成完毕`);

          // 触发波次敌人生成完成事件
          EventManager.Instance.emit("wave-spawned", this._currentWave - 1);
        }
      }, wave.interval * 1000);
    }, 1000); // 延迟1秒开始生成敌人
  }

  /**
   * 生成单个敌人
   * @param enemyType 敌人类型
   * @param hp 生命值
   * @param speed 移动速度
   */
  private spawnEnemy(enemyType: number, hp: number, speed: number) {
    // 获取第一条路径的起点
    const paths = this.mapConfig.paths;
    if (!paths || paths.length === 0 || paths[0].length === 0) {
      console.error("没有可用的路径");
      return;
    }

    const startPoint = paths[0][0];
    console.log(
      `在位置 (${startPoint.row}, ${startPoint.col}) 生成敌人，类型: ${enemyType}, 生命值: ${hp}, 速度: ${speed}`
    );

    // 触发敌人生成事件，实际游戏中会创建敌人实体
    EventManager.Instance.emit(
      "enemy-spawned",
      enemyType,
      startPoint.row,
      startPoint.col,
      hp,
      speed
    );
  }

  /**
   * 敌人死亡处理
   * @param reward 奖励金币
   */
  enemyDied(reward: number) {
    // 减少存活敌人数量
    this._enemiesAlive--;

    // 增加金币
    this._gold += reward;

    // 触发金币更新事件
    EventManager.Instance.emit("gold-updated", this._gold);

    // 检查当前波次是否结束
    if (this._enemiesAlive <= 0) {
      console.log(`第 ${this._currentWave} 波敌人已全部消灭`);

      // 触发波次结束事件
      EventManager.Instance.emit("wave-completed", this._currentWave - 1);

      // 检查是否还有下一波
      if (this._currentWave < this.mapConfig.waves.length) {
        // 延迟开始下一波
        setTimeout(() => {
          EventManager.Instance.emit("next-wave-ready", this._currentWave);
        }, 3000);
      } else {
        // 所有波次完成，游戏胜利
        EventManager.Instance.emit("game-completed", true);
      }
    }
  }

  tryBuildTower(row: number, col: number, towerType: TowerType): BuildResult {
    // 获取防御塔配置
    const towerConfig = TowerConfigs.getTowerConfig(towerType);

    // 检查金币
    if (this._gold < towerConfig.cost) {
      return { success: false, message: "金币不足" };
    }

    // 检查位置
    const cell = this.getCell(row, col);
    if (!cell || !cell.canBuild()) {
      return { success: false, message: "该位置不可建造" };
    }

    // 建造防御塔
    const tower = new TowerModel(towerConfig, row, col);
    const success = cell.buildTower(tower);

    if (success) {
      // 扣除金币
      this._gold -= towerConfig.cost;
      // 触发金币更新事件
      EventManager.Instance.emit("gold-updated", this._gold);
      return { success: true, message: "建造成功" };
    }

    return { success: false, message: "建造失败" };
  }

  /**
   * 升级防御塔
   */
  tryUpgradeTower(row: number, col: number): BuildResult {
    const cell = this.getCell(row, col);
    if (!cell || !cell.tower) {
      return { success: false, message: "该位置没有防御塔" };
    }

    const tower = cell.tower;
    if (!tower.canUpgrade()) {
      return { success: false, message: "防御塔已达到最高等级" };
    }

    if (this._gold < tower.upgradeCost) {
      return { success: false, message: "金币不足" };
    }

    // 升级防御塔
    tower.upgrade();
    // 扣除金币
    this._gold -= tower.upgradeCost;
    // 触发金币更新事件
    EventManager.Instance.emit("gold-updated", this._gold);
    // 触发防御塔升级事件
    EventManager.Instance.emit("tower-upgraded", row, col, tower.level);

    return { success: true, message: "升级成功" };
  }

  /**
   * 拆除防御塔
   */
  demolishTower(row: number, col: number): BuildResult {
    const cell = this.getCell(row, col);
    if (!cell || !cell.tower) {
      return { success: false, message: "该位置没有防御塔" };
    }

    // 返还部分金币（例如50%）
    const refund = Math.floor(cell.tower.upgradeCost * 0.5);
    this._gold += refund;

    // 移除防御塔
    cell.removeTower();

    // 触发相关事件
    EventManager.Instance.emit("gold-updated", this._gold);
    EventManager.Instance.emit("tower-demolished", row, col);

    return { success: true, message: `拆除成功，返还 ${refund} 金币` };
  }
  /**
   * 检查指定位置是否可以建造
   * @param col 列
   * @param row 行
   * @returns 是否可建造
   */
  isBuildable(col: number, row: number): boolean {
    if (!this._cells) return false;
    if (
      row < 0 ||
      row >= this.mapConfig.rows ||
      col < 0 ||
      col >= this.mapConfig.cols
    )
      return false;

    return this._cells[row][col].buildable;
  }

  /**
   * 获取敌人路径
   * @param pathIndex 路径索引，默认为0
   * @returns 路径点数组
   */
  getPath(pathIndex: number = 0): Point[] {
    if (!this._mapConfig || !this._mapConfig.paths) return [];
    if (pathIndex < 0 || pathIndex >= this._mapConfig.paths.length) return [];

    return this._mapConfig.paths[pathIndex];
  }

  /**
   * 获取所有路径
   * @returns 所有路径
   */
  getAllPaths(): Point[][] {
    if (!this._mapConfig || !this._mapConfig.paths) return [];
    return this._mapConfig.paths;
  }
}
