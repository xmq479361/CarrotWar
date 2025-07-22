import {
  _decorator,
  Component,
  Node,
  UITransform,
  instantiate,
  Prefab,
  resources,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { GameManager } from "../Manager/GameManager";
import { EventManager } from "../Manager/EventManager";
import { CellView } from "../View/CellView";
import { GameModel } from "../Model/GameModel";

const { ccclass, property } = _decorator;

@ccclass("MainGameScene")
export class MainGameScene extends Component {
  @property(Node)
  mapContainer: Node = null!;

  @property(Prefab)
  cellPrefab: Prefab = null!;

  @property(String)
  currentLevel: string = "level1";

  private _cellViews: Node[][] = [];

  start() {
    this.initializeMap();
  }

  initializeMap() {
    console.log("initializeMap");
    // 获取地图容器尺寸
    const transform = this.mapContainer.getComponent(UITransform);
    if (!transform) {
      console.error("地图容器缺少UITransform组件");
      return;
    }

    // 设置地图尺寸
    MapManager.Instance.setSize(transform.width, transform.height);

    console.log("initGame: ", this.currentLevel);
    GameManager.Instance.initGame(this.currentLevel)
      .then(() => {
        this.createCellViews();
      })
      .catch((error) => {
        console.error("初始化游戏失败:", error);
      });
  }

  createCellViews() {
    // 清除现有格子
    this.mapContainer.removeAllChildren();
    this._cellViews = [];

    const mapConfig = GameManager.Instance.mapConfig;

    const rows = mapConfig.rows;
    const cols = mapConfig.cols;
    const cellWidth = MapManager.Instance.cellWidth;
    const cellHeight = MapManager.Instance.cellHeight;

    // 创建格子视图
    for (let row = 0; row < rows; row++) {
      this._cellViews[row] = [];

      for (let col = 0; col < cols; col++) {
        const cellModel = GameManager.Instance.getCellModel(row, col);
        const cellNode = instantiate(this.cellPrefab);

        // 设置位置
        cellNode.setPosition(MapManager.Instance.getCellPosition(row, col));

        // 设置尺寸
        const cellTransform = cellNode.getComponent(UITransform);
        if (cellTransform) {
          cellTransform.width = cellWidth;
          cellTransform.height = cellHeight;
        }

        // 初始化格子视图
        const cellView = cellNode.getComponent(CellView);
        if (cellView) {
          cellView.init(row, col, cellModel);
        }

        // 添加到容器
        this.mapContainer.addChild(cellNode);
        this._cellViews[row][col] = cellNode;
      }
    }

    // 触发格子创建完成事件
    EventManager.Instance.emit("cells-created", this._cellViews);
  }
}
