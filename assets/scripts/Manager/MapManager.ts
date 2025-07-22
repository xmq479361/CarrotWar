import { MapConfig, Point } from "../Model/MapConfig";
import { Utils } from "../Utils/Utils";
import { CellModel } from "../Model/CellModel";
import { Vec3 } from "cc";

/// 地图管理
export class MapManager {
  private _rows: number = 0;
  private _cols: number = 0;
  private _gridWidth: number = 0;
  private _gridHeight: number = 0;
  private _cellWidth: number = 0;
  private _cellHeight: number = 0;
  private _mapConfig: MapConfig | null = null;

  static _Instance: MapManager;

  static get Instance() {
    if (!MapManager._Instance) {
      console.log("MapManager init: ");
      MapManager._Instance = new MapManager();
    }
    return MapManager._Instance;
  }

  // get cells() {
  //   return this._cells;
  // }
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
}
