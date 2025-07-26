import { TowerConfig } from "../Config/TowerConfig";

export class CellModel {
  private _row: number;
  private _col: number;
  private _type: number | null;
  /// 是否是路径
  private _path: boolean = false;
  /// 是否可以建造
  private _buildable: boolean = false;
  /// 装饰
  private _decoration: number | null;
  // 障碍物，后续可以替换为具体的Obstacle类型，例如Wall、Roo
  private _obstacle: number | null = null;
  /// 防御塔，后续可以替换为具体的Tower类型
  private _tower: TowerConfig | null = null;

  constructor(row: number, col: number) {
    this._row = row;
    this._col = col;
  }

  set obstacle(value: number) {
    this._obstacle = value;
  }
  get obstacle(): number {
    return this._obstacle;
  }
  set path(value: boolean) {
    this._path = value;
  }
  get path(): boolean {
    return this._path;
  }

  set type(value: number) {
    this._type = value;
  }

  set buildable(value: boolean) {
    this._buildable = value;
  }
  set decoration(value: number) {
    this._decoration = value;
  }
  get row(): number {
    return this._row;
  }

  get col(): number {
    return this._col;
  }

  get type(): number {
    return this._type;
  }

  get buildable(): boolean {
    return this._buildable;
  }

  get decoration(): number {
    return this._decoration;
  }

  get tower(): any | null {
    return this._tower;
  }

  set tower(value: TowerConfig | null) {
    this._tower = value;
  }

  /**
   * 检查是否可以建造防御塔
   */
  canBuild(): boolean {
    return this._buildable && this._tower === null;
  }
}
