import {
  _decorator,
  Component,
  Node,
  Sprite,
  Color,
  UITransform,
  Prefab,
  instantiate,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { ObstacleView } from "./ObstacleView";
import { TowerView } from "./TowerView";
import { TowerConfig } from "../Config/GameConfig";

const { ccclass, property } = _decorator;

@ccclass("CellView")
export class CellView extends Component {
  @property(Sprite)
  background: Sprite = null!;

  @property([Color])
  cellColors: Color[] = [];

  _sprite: Sprite = null!;
  private _tower: TowerView | null = null; // 放置的塔模型，默认为null
  private _obstacle: ObstacleView | null = null; // 放置的障碍物模型，默认为null

  private _row: number = 0;
  private _col: number = 0;
  private _model: CellModel = null!;

  @property(Prefab)
  towerPrefab: Prefab = null!;

  private _isSelected: boolean = false; // 是否被选中
  // private _tower: TowerModel | null = null; // 放置的塔模型，默认为nul

  private uiTransform: UITransform = null!;
  onLoad() {
    this.uiTransform = this.getComponent(UITransform)!;
    this._sprite = this.getComponent(Sprite)!;
  }

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

  upgradeTower() {
    if (!this._tower) return;
    this._tower.upgrade();
  }
  setTower(towerConfig: TowerConfig) {
    console.info("setTower");
    // if (!this.buildable) return;
    // 移除旧的塔
    if (this._tower) {
      this._tower.node.removeFromParent();
      this._tower = null;
    }
    // 创建新的塔
    if (!towerConfig) {
      console.error("无效的防御塔类型");
      return;
    }
    let tower = instantiate(this.towerPrefab);
    this._tower = tower.getComponent(TowerView);
    tower.parent = this.node;
    tower.setPosition(0, 0, 0);
    this._tower.setup(this.row, this.col, towerConfig);
  }

  /**
   * 更新视图
   */
  updateView() {
    if (!this._model) return;

    this.uiTransform = this.getComponent(UITransform)!;
    this._sprite = this.getComponent(Sprite)!;
    // 设置位置
    this.node.setPosition(
      MapManager.Instance.getCellPosition(this._row, this._col)
    );
    // 设置尺寸
    if (!this.uiTransform) {
      this.uiTransform = this.getComponent(UITransform)!;
    }
    this.uiTransform.width = MapManager.Instance.cellWidth;
    this.uiTransform.height = MapManager.Instance.cellHeight;
    // // 设置背景颜色
    // if (this.background && this.cellColors.length > 0) {
    //   const colorIndex = Math.min(this._model.type, this.cellColors.length - 1);
    //   this.background.color = this.cellColors[colorIndex];
    // }

    // 根据是否可建造设置透明度
    // if (this._sprite) {
    // const color = this._sprite.color.clone();
    // color.a = this._model.buildable ? 255 : 0;
    // this._sprite.color = color;
    // }
    if (this.background) {
      const opacity = this._isSelected ? 255 : 0;
      const color = this.background.color.clone();
      color.a = opacity;
      this.background.color = color;
      if (this._isSelected) {
        this.node.setScale(1.2, 1.2, 1);
      } else {
        this.node.setScale(1, 1, 1);
      }
    }
  }

  get isSelected(): boolean {
    return this._isSelected;
  }
  set selected(selected: boolean) {
    this._isSelected = selected;
    this.updateView();
  }

  get buildable(): boolean {
    return this._model.buildable;
  }

  get type(): number {
    return this._model.type;
  }

  get tower(): TowerView | null {
    return this._tower;
  }
  set tower(tower: TowerView | null) {
    this._tower = tower;
  }
  get obstacle(): ObstacleView | null {
    return this._obstacle;
  }
  set obstacle(obstacle: ObstacleView | null) {
    this._obstacle = obstacle;
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
