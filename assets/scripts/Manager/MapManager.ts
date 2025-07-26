import { MapConfig } from "../Config/MapConfig";
import { Utils } from "../Utils/Utils";
import { CellModel } from "../Model/CellModel";
import { Vec2, Vec3 } from "cc";

/// 地图管理
export class MapManager {
  private _rows: number = 0;
  private _cols: number = 0;
  private _gridWidth: number = 0;
  private _gridHeight: number = 0;
  private _cellWidth: number = 0;
  private _cellHeight: number = 0;
  private _mapConfig: MapConfig | null = null;

  static _Instance: MapManager = null;
  private _cells: CellModel[][] = [];

  static get Instance() {
    if (MapManager._Instance == null) {
      console.log("MapManager init: ");
      MapManager._Instance = new MapManager();
    }
    return MapManager._Instance;
  }

  /**
   * 初始化地图尺寸
   * @param windowWidth 窗口宽度
   * @param height 窗口高度
   */
  setSize(windowWidth: number, windowHeight: number) {
    console.log("MapManager: ", windowWidth, "x", windowHeight);
    this._gridWidth = windowWidth;
    this._gridHeight = windowHeight;

    // 如果已经有地图配置，重新计算单元格尺寸
    if (this._mapConfig) {
      this.initialize(this._mapConfig.rows, this._mapConfig.cols);
    }
  }

  /**
   * 加载地图配置
   * @param level 关卡ID
   * @returns Promise<MapConfig>
   */
  async loadMap(level: string): Promise<MapConfig | null> {
    console.log("loadMap: ", level);
    return new Promise<MapConfig>((resolve, reject) => {
      Utils.loadLocalJson<MapConfig>(`levels/${level}`, (data) => {
        if (!data) {
          return reject("loadMap: data is null");
        }
        this._mapConfig = data as MapConfig;
        this.initialize(this._mapConfig.rows, this._mapConfig.cols);
        resolve(this._mapConfig);
      });
    });
    // await Utils.loadLocalJson<MapConfig>(`levels/${level}`, (data) => {
    //   if (!data) return;
    //   this._mapConfig = data as MapConfig;
    //   this.initialize(this._mapConfig.rows, this._mapConfig.cols);
    // });
  }

  /// 初始化地图
  initialize(rows: number, cols: number) {
    this._rows = rows;
    this._cols = cols;
    this._cellWidth = this.gridWidth / cols;
    this._cellHeight = this.gridHeight / rows;
    console.log("MapManager: ", this._cellWidth, this._cellHeight);
  }

  getCellPosition(row: number, col: number): Vec3 {
    return new Vec3(
      col * this._cellWidth + this._cellWidth / 2,
      row * this._cellHeight + this.cellHeight / 2,
      0
    );
  }
  get gridWidth(): number {
    return this._gridWidth;
  }

  get gridHeight(): number {
    return this._gridHeight;
  }

  get rows(): number {
    return this._rows;
  }

  get cols(): number {
    return this._cols;
  }

  get cellWidth(): number {
    return this._cellWidth;
  }

  get cellHeight(): number {
    return this._cellHeight;
  }

  get mapConfig(): MapConfig | null {
    return this._mapConfig;
  }

  /**
   * 获取指定格子的世界坐标（左下角）
   * @param col 列
   * @param row 行
   * @returns [x, y] 世界坐标
   */
  getLocation(col: number, row: number): [number, number] {
    return [col * this._cellWidth, row * this._cellHeight];
  }

  /**
   * 获取指定格子的世界坐标（左下角）
   * @param col 列
   * @param row 行
   * @returns [x, y] 世界坐标
   */
  getLocationVec2(col: number, row: number): Vec2 {
    return new Vec2(
      col * this._cellWidth + this._cellWidth / 2,
      row * this._cellHeight + this._cellHeight / 2
    );
  }
  /**
   * 获取指定格子的世界坐标（左下角）
   * @param col 列
   * @param row 行
   * @returns [x, y] 世界坐标
   */
  getLocationVec3(col: number, row: number): Vec3 {
    return new Vec3(
      col * this._cellWidth + this._cellWidth / 2,
      row * this._cellHeight + this._cellHeight / 2,
      0
    );
  }
  /**
   * 获取指定格子的世界坐标（中心点）
   * @param col 列
   * @param row 行
   * @returns [x, y] 世界坐标
   */
  getCellCenter(col: number, row: number): [number, number] {
    return [
      col * this._cellWidth + this._cellWidth / 2,
      row * this._cellHeight + this._cellHeight / 2,
    ];
  }

  /**
   * 从世界坐标获取格子坐标
   * @param x X坐标
   * @param y Y坐标
   * @returns [col, row] 格子坐标
   */
  getLocationFromPoint(x: number, y: number): [number, number] {
    return [Math.floor(x / this._cellWidth), Math.floor(y / this._cellHeight)];
  }

  getX(col: number) {
    return col * this._cellWidth;
  }

  getY(row: number) {
    return row * this._cellHeight;
  }

  getCol(x: number) {
    return Math.floor(x / this._cellWidth);
  }

  getRow(y: number) {
    return Math.floor(y / this._cellHeight);
  }

  getCellModel(row: number, col: number): CellModel | null {
    return this._cells[row][col];
  }
  getCell(row: number, col: number): CellModel | null {
    if (row < 0 || row >= this._rows || col < 0 || col >= this._cols) {
      return null;
    }
    return this._cells[row][col];
  }

  /**
   * 初始化游戏
   */
  async loadMapConfig(level: string): Promise<MapConfig> {
    try {
      console.log("开始初始化游戏");
      this._mapConfig = await MapManager.Instance.loadMap(level);
      console.log("地图配置加载完成", this._mapConfig);

      // 初始化格子模型
      this.initCells();

      console.log("游戏初始化完成");
      return this._mapConfig;
    } catch (error) {
      console.error("初始化地图失败:", error);
      throw error;
    }
  }
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
}
