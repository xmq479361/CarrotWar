import { TowerConfig } from "./TowerModel";

export class CellModel {
  private _row: number;
  private _col: number;
  private _type: number | null;
  /// 是否可以建造
  private _buildable: boolean = false;
  /// 装饰
  private _decoration: number | null;
  /// 防御塔
  private _tower: TowerConfig | null = null; // 防御塔，后续可以替换为具体的Tower类型

  constructor(row: number, col: number) {
    this._row = row;
    this._col = col;
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

  /**
   * 建造防御塔
   * @param tower 防御塔
   * @returns 是否建造成功
   */
  buildTower(tower: any): boolean {
    if (!this.canBuild()) return false;

    this._tower = tower;
    return true;
  }

  /**
   * 移除防御塔
   * @returns 是否移除成功
   */
  removeTower(): boolean {
    if (this._tower === null) return false;

    this._tower = null;
    return true;
  }
}
