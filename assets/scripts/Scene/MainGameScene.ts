import {
  _decorator,
  Component,
  Node,
  UITransform,
  instantiate,
  Prefab,
  resources,
  input,
  Input,
  EventTouch,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { GameManager } from "../Manager/GameManager";
import { EventManager } from "../Manager/EventManager";
import { CellView } from "../View/CellView";

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
    input.on(Input.EventType.TOUCH_START, this.onTouch, this);
  }

  destroy(): boolean {
    input.off(Input.EventType.TOUCH_START, this.onTouch, this);
    return super.destroy();
  }

  onTouch(event: EventTouch) {
    let position = this.mapContainer
      .getComponent(UITransform)
      .convertToNodeSpaceAR(event.getUILocation().toVec3());
    console.log("position: ", position);
    // let [col, row] = MapManager.Instance.getLocationFromPoint(position.x, position.y);
    // console.log("point:", col, "x", row);
    GameManager.Instance.handleClickPosition(position.x, position.y);
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

    // 创建格子视图
    for (let row = 0; row < rows; row++) {
      this._cellViews[row] = [];

      for (let col = 0; col < cols; col++) {
        const cellModel = GameManager.Instance.getCellModel(row, col);
        const cellNode = instantiate(this.cellPrefab);

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
