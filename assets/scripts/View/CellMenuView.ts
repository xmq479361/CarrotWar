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
import { EventManager, EventType } from "../Manager/EventManager";
import { MapManager } from "../Manager/MapManager";
import { MainGameScene } from "../Scene/MainGameScene";
import { TowerConfig, TowerConfigs, TowerType } from "../Config/TowerConfig";
import { CellView } from "./CellView";
import { MenuItemDef, MenuItemView } from "./MenuItemView";
const { ccclass, property } = _decorator;

@ccclass("CellMenuView")
export class CellMenuView extends Component {
  @property(Prefab)
  menuItemPrefab: Prefab = null!;

  @property(Node)
  container: Node = null!;

  @property(Node)
  attackRadiusBg: Node = null!;

  @property
  radius: number = 80;

  private _row: number = 0;
  private _col: number = 0;
  private _menuItems: Node[] = [];

  setup(
    row: number,
    col: number,
    cellView: CellView,
    vailableTowers: TowerType[]
  ) {
    this._row = row;
    this._col = col;
    this.radius = MapManager.Instance.cellHeight * 1;

    // 清除现有菜单项
    this.container.removeAllChildren();
    this._menuItems = [];

    this.node.position = MapManager.Instance.getCellPosition(row, col);
    let bgRadius = MapManager.Instance.cellHeight * 1.5;
    let items: MenuItemDef[] = [];
    /// 已经存在Tower，显示删除按钮
    if (cellView.tower) {
      // 创建删除按钮（底部中央）
      let towerConfig: TowerConfig = cellView.tower.getTowerConfig();
      if (!towerConfig) return;
      let currentLevel = cellView.tower.getCurrentLevel();
      let levelConfig = towerConfig.levels[currentLevel];
      bgRadius = levelConfig.range;
      this.createDeleteButton(levelConfig.recycle);
      let item = this._createMenuItem(towerConfig, currentLevel + 1);
      if (item) items.push(item);
    } else {
      // 创建建造按钮（上方环绕）
      vailableTowers.map((type) => {
        let item = this._createMenuItem(TowerConfigs.getTowerConfig(type));
        if (item) items.push(item);
      });
    }
    this.createMenuItems(items);
    let bgRadiusUITransform = this.attackRadiusBg.getComponent(UITransform);
    bgRadiusUITransform.setContentSize(bgRadius * 2, bgRadius * 2);
  }

  _createMenuItem(towerConfig: TowerConfig, level: number = 0): MenuItemDef {
    let levelConfig = towerConfig.levels[level];

    if (levelConfig) {
      let cost = levelConfig.upgradeCost;
      let canUpgrade = MainGameScene.Instance.gold >= cost;
      return {
        label: `${towerConfig.name} 建造${cost}`,
        enable: canUpgrade,
        gold: cost,
        spritePath: levelConfig.spritePath,
        towerConfig: towerConfig,
        level: level,
      };
    }
    return null;
  }
  private createDeleteButton(recycleGold: number) {
    const deleteBtn = instantiate(this.menuItemPrefab);

    // 设置位置在底部中央
    deleteBtn.setPosition(new Vec3(0, -this.radius, 0));

    // 设置按钮文本和样式
    const label = deleteBtn.getComponentInChildren(Label);
    if (label) {
      label.string = `拆除 ¥${recycleGold}`;
    }

    // 设置按钮背景颜色
    const sprite = deleteBtn.getComponent(Sprite);
    if (sprite) {
      sprite.color = new Color(255, 100, 100, 255);
    }

    // 添加点击事件
    const button = deleteBtn.getComponent(Button);
    if (button) {
      button.node.on(
        Button.EventType.CLICK,
        () => {
          this.onDeleteClick(recycleGold);
        },
        this
      );
    }

    this.container.addChild(deleteBtn);
    this._menuItems.push(deleteBtn);
  }

  private createMenuItems(items: MenuItemDef[]) {
    const count = items.length;
    const angleStep = (2 * Math.PI) / (count + 1);
    const centerAngle = Math.PI / 2; // 从正上方开始

    // 计算起始角度
    // 5 ->
    console.log("count", count, centerAngle, angleStep, Math.PI / 2, Math.PI);
    for (let i = 0; i < count; i++) {
      const angle = centerAngle - (i - (count - 1) / 2.0) * angleStep;

      const menuItemNode = instantiate(this.menuItemPrefab);
      let menuItemView = menuItemNode.getComponent(MenuItemView);
      menuItemView.setup(items[i]);

      // 计算环形位置
      const x = this.radius * Math.cos(angle);
      const y = this.radius * Math.sin(angle);
      menuItemNode.setPosition(new Vec3(x, y, 0));

      let item = items[i];
      // 添加点击事件
      const button = menuItemView.getComponent(Button);
      if (button) {
        button.node.on(
          Button.EventType.CLICK,
          () => {
            this.onMenuItemClick(item);
          },
          this
        );
      }

      this.container.addChild(menuItemNode);
      this._menuItems.push(menuItemNode);
    }
  }

  private onMenuItemClick(menuItem: MenuItemDef) {
    console.log(
      `选择在 (${this._row}, ${this._col}) 建造 ${menuItem.towerConfig.name}`
    );
    if (menuItem.towerConfig) {
      let towerConfig = menuItem.towerConfig;
      let cost = towerConfig.levels[menuItem.level].upgradeCost;
      if (MainGameScene.Instance.gold < cost) return;
      EventManager.Instance.emit(EventType.GoldChanged, -cost);
      if (menuItem.level > 0) {
        EventManager.Instance.emit(
          EventType.UpgradeTower,
          menuItem.towerConfig,
          menuItem.level
        );
      } else {
        EventManager.Instance.emit(
          EventType.BuildTower,
          this._row,
          this._col,
          menuItem.towerConfig
        );
      }
      this.close();
    }
  }

  private onDeleteClick(recycleGold: number) {
    console.log(`选择删除 (${this._row}, ${this._col}) 的塔`);
    EventManager.Instance.emit(EventType.DemolishTower, this._row, this._col);
    EventManager.Instance.emit(EventType.GoldChanged, recycleGold);
    this.close();
  }

  close() {
    this.node.active = false;
  }
}
