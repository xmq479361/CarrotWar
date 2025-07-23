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
  Sprite,
  SpriteFrame,
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

  @property(Node)
  bg: Node = null!;

  @property(Node)
  roadContainer: Node = null!;
  @property(Prefab)
  roadPrefab: Prefab = null!;

  @property(Node)
  towerContainer: Node = null!;
  @property(Prefab)
  towerPrefab: Prefab = null!;

  @property(Node)
  monsterContainer: Node = null!;
  @property(Prefab)
  monsterPrefab: Prefab = null!;

  @property(String)
  currentLevel: string = "level1";

  private _cellViews: Array<any | null>[] = [];

  private _selectedCell: CellView | null = null;

  protected start(): void {
    this.initializeMap();
    input.on(Input.EventType.TOUCH_START, this.onTouch, this);
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouch, this);
  }

  onTouch(event: EventTouch) {
    let position = this.mapContainer
      .getComponent(UITransform)
      .convertToNodeSpaceAR(event.getUILocation().toVec3());
    // 将坐标转换为格子位置
    let [col, row] = MapManager.Instance.getLocationFromPoint(
      position.x,
      position.y
    );
    console.log("position: ", position, "point:", col, "x", row);
    let cellView = this._cellViews[row][col];
    if (!cellView) {
      console.error("cellView is null");
      return;
    }
    if (cellView.path) {
      console.error("cellView is path");
      return;
    }
    cellView.selected = !cellView.isSelected;
    if (this._selectedCell) {
      if (cellView === this._selectedCell) {
        this._selectedCell = null;
        return;
      }
      this._selectedCell.selected = false;
    }
    this._selectedCell = cellView;
    // GameManager.Instance.handleClickPosition(position.x, position.y);
    GameManager.Instance.onCellClicked(row, col);
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
    this.towerContainer.removeAllChildren();
    this.monsterContainer.removeAllChildren();
    this.roadContainer.removeAllChildren();
    this._cellViews = [];

    const mapConfig = GameManager.Instance.mapConfig;
    if (!mapConfig) {
      console.error("地图配置为空");
      return;
    }
    if (this.bg && mapConfig.background) {
      resources.load(mapConfig.background, SpriteFrame, (err, spriteFrame) => {
        if (err) {
          console.error("加载背景图失败:", err);
          return;
        }
        this.bg.getComponent(Sprite).spriteFrame = spriteFrame;
      });
    }
    const rows = mapConfig.rows;
    const cols = mapConfig.cols;

    // 创建格子视图
    for (let row = 0; row < rows; row++) {
      this._cellViews[row] = [];

      for (let col = 0; col < cols; col++) {
        const cellModel = GameManager.Instance.getCellModel(row, col);
        if (cellModel) {
          if (cellModel.buildable == true) {
            const cellNode = instantiate(this.cellPrefab);
            // 初始化格子视图
            const cellView = cellNode.getComponent(CellView);
            if (cellView) {
              cellView.init(row, col, cellModel);
            }
            this._cellViews[row][col] = cellView;
            // 添加到容器
            this.towerContainer.addChild(cellNode);
            continue;
          } else if (cellModel.path) {
            const roadNode = instantiate(this.roadPrefab);
            roadNode.setPosition(MapManager.Instance.getCellPosition(row, col));
            // this._cellViews[row][col] = roadNode;
            this.roadContainer.addChild(roadNode);
          }
        }
        this._cellViews[row][col] = null;
      }
    }

    // 触发格子创建完成事件
    EventManager.Instance.emit("cells-created", this._cellViews);
  }
}
