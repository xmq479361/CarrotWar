import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  UITransform,
  Vec3,
  Button,
  Label,
  Sprite,
  Color,
} from "cc";
import { TowerType } from "../Model/TowerModel";
import { EventManager } from "../Manager/EventManager";
import { MapManager } from "../Manager/MapManager";
const { ccclass, property } = _decorator;

@ccclass("CellMenuView")
export class CellMenuView extends Component {
  @property(Prefab)
  menuItemPrefab: Prefab = null!;

  @property(Node)
  container: Node = null!;

  @property
  radius: number = 80;

  private _row: number = 0;
  private _col: number = 0;
  private _menuItems: Node[] = [];

  setup(row: number, col: number, availableTowers: TowerType[]) {
    this._row = row;
    this._col = col;
    this.radius = MapManager.Instance.cellHeight * 1;

    // 清除现有菜单项
    this.container.removeAllChildren();
    this._menuItems = [];

    this.node.position = MapManager.Instance.getCellPosition(row, col);
    // 创建删除按钮（底部中央）
    this.createDeleteButton();

    // 创建塔建造按钮（上方环绕）
    this.createTowerButtons(availableTowers);
  }

  private createDeleteButton() {
    const deleteBtn = instantiate(this.menuItemPrefab);
    const transform = deleteBtn.getComponent(UITransform);

    // 设置位置在底部中央
    deleteBtn.setPosition(new Vec3(0, -this.radius, 0));

    // 设置按钮文本和样式
    const label = deleteBtn.getComponentInChildren(Label);
    if (label) {
      label.string = "删除";
    }

    // 设置按钮背景颜色
    const sprite = deleteBtn.getComponent(Sprite);
    if (sprite) {
      sprite.color = new Color(255, 100, 100, 255);
    }

    // 添加点击事件
    const button = deleteBtn.getComponent(Button);
    if (button) {
      button.node.on(Button.EventType.CLICK, this.onDeleteClick, this);
    }

    this.container.addChild(deleteBtn);
    this._menuItems.push(deleteBtn);
  }

  private createTowerButtons(availableTowers: TowerType[]) {
    const count = availableTowers.length;
    const angleStep = (2 * Math.PI) / (count + 1);
    const centerAngle = Math.PI / 2; // 从正上方开始

    // 计算起始角度
    // 5 ->
    console.log("count", count, centerAngle, angleStep, Math.PI / 2, Math.PI);
    for (let i = 0; i < count; i++) {
      const towerType = availableTowers[i];
      //   const angle = startAngle - i * angleStep;
      const angle = centerAngle - (i - (count - 1) / 2.0) * angleStep;

      const btn = instantiate(this.menuItemPrefab);

      // 计算环形位置
      const x = this.radius * Math.cos(angle);
      const y = this.radius * Math.sin(angle);
      btn.setPosition(new Vec3(x, y, 0));

      // 设置按钮文本
      const label = btn.getComponentInChildren(Label);
      if (label) {
        label.string = this.getTowerName(towerType);
      }

      // btn.da
      // // 设置按钮数据
      // btn.userData = { towerType };

      // 添加点击事件
      const button = btn.getComponent(Button);
      if (button) {
        button.node.on(
          Button.EventType.CLICK,
          () => {
            this.onTowerClick(towerType);
          },
          this
        );
      }

      this.container.addChild(btn);
      this._menuItems.push(btn);
    }
  }

  private getTowerName(towerType: TowerType): string {
    switch (towerType) {
      case TowerType.ARROW:
        return "箭塔";
      case TowerType.MAGIC:
        return "魔法塔";
      case TowerType.CANNON:
        return "炮塔";
      case TowerType.FREEZE:
        return "冰塔";
      default:
        return "未知";
    }
  }

  private onTowerClick(towerType: TowerType) {
    console.log(
      `选择在 (${this._row}, ${this._col}) 建造 ${this.getTowerName(towerType)}`
    );
    EventManager.Instance.emit("build-tower", this._row, this._col, towerType);
    this.close();
  }

  private onDeleteClick() {
    console.log(`选择删除 (${this._row}, ${this._col}) 的塔`);
    EventManager.Instance.emit("demolish-tower", this._row, this._col);
    this.close();
  }

  close() {
    this.node.active = false;
  }
}
