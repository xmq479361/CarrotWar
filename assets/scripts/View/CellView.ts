import { _decorator, Component, Node, Sprite, Color } from "cc";
import { CellModel } from "../Model/CellModel";

const { ccclass, property } = _decorator;

@ccclass("CellView")
export class CellView extends Component {
  @property(Sprite)
  background: Sprite = null!;

  @property([Color])
  cellColors: Color[] = [];

  private _row: number = 0;
  private _col: number = 0;
  private _model: CellModel = null!;

  /**
   * 初始化格子
   * @param row 行
   * @param col 列
   * @param config 格子配置
   */
  init(row: number, col: number, cellModel: CellModel) {
    this._row = row;
    this._col = col;
    // 创建数据模型
    this._model = cellModel;

    // 更新视图
    this.updateView();
  }

  /**
   * 更新视图
   */
  updateView() {
    if (!this._model) return;

    // 设置背景颜色
    if (this.background && this.cellColors.length > 0) {
      const colorIndex = Math.min(this._model.type, this.cellColors.length - 1);
      this.background.color = this.cellColors[colorIndex];
    }

    // 根据是否可建造设置透明度
    if (this.background) {
      const opacity = this._model.buildable ? 255 : 180;
      const color = this.background.color.clone();
      color.a = opacity / 255;
      this.background.color = color;
    }
  }

  /**
   * 获取行
   */
  get row(): number {
    return this._row;
  }

  /**
   * 获取列
   */
  get col(): number {
    return this._col;
  }

  /**
   * 获取模型
   */
  get model(): CellModel {
    return this._model;
  }
}
