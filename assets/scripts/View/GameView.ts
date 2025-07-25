import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  UITransform,
  Sprite,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { CellView } from "./CellView";
import { MapConfig } from "../Model/MapConfig";
import { ObstacleView } from "./ObstacleView";
import { CellMenuView } from "./CellMenuView";
import { Utils } from "../Utils/Utils";
import { TowerConfig, TowerType } from "../Config/TowerConfig";
import { MonsterSpawn } from "../Manager/MonsterSpawn";

const { ccclass, property } = _decorator;

@ccclass("GameView")
export class GameView extends Component {
  @property(Node)
  mapContainer: Node = null!;

  @property(Prefab)
  cellPrefab: Prefab = null!;

  @property(Node)
  menuNode: Node | null = null;

  @property(Node)
  roadContainer: Node = null!;

  @property(Prefab)
  roadPrefab: Prefab = null!;

  @property(Node)
  towerContainer: Node = null!;

  @property(Prefab)
  towerPrefab: Prefab = null!;

  @property(MonsterSpawn)
  monsterSpawn: MonsterSpawn = null!;

  @property(Node)
  obstacleContainer: Node = null!;

  @property(Prefab)
  obstaclePrefab: Prefab = null!;

  @property(Prefab)
  carrotPrefab: Prefab = null!;

  @property(Node)
  backgroundNode: Node = null!;

  private _mentView: CellMenuView | null = null;
  private _cellViews: Array<any | null>[] = [];
  private _selectedCell: CellView | null = null;
  private _showBuildMenu = false;
  private _carrotNode: Node | null = null;

  protected onLoad(): void {
    if (this.menuNode) {
      this.menuNode.active = false;
      this._mentView = this.menuNode.getComponent(CellMenuView);
    }
  }

  /**
   * 初始化游戏视图
   */
  initializeGame(mapConfig: MapConfig) {
    // 清除现有内容
    this.towerContainer.removeAllChildren();
    this.roadContainer.removeAllChildren();
    this.obstacleContainer.removeAllChildren();
    this.monsterSpawn.node.removeAllChildren();
    if (!mapConfig) {
      console.error("地图配置为空");
      return;
    }
    this.monsterSpawn.setup(mapConfig);

    console.info("GameView - initializeGame", mapConfig);
    this.initBackground(mapConfig);
    this.initCarrot(mapConfig);
    this.initCells(mapConfig);
  }

  /**
   * 初始化背景
   */
  initBackground(mapConfig: MapConfig) {
    if (this.backgroundNode)
      Utils.setSpriteFrame(
        this.backgroundNode.getComponent(Sprite),
        mapConfig.background
      );
  }

  /**
   * 初始化萝卜（终点）
   */
  initCarrot(mapConfig: MapConfig) {
    if (this._carrotNode) {
      this._carrotNode.destroy();
    }
    const carrotNode = instantiate(this.carrotPrefab);
    this._carrotNode = carrotNode;
    this.mapContainer.addChild(carrotNode);
    carrotNode.setPosition(
      MapManager.Instance.getCellPosition(
        mapConfig.targetRow,
        mapConfig.targetCol
      )
    );
  }

  /**
   * 初始化格子
   */
  initCells(mapConfig: MapConfig) {
    const rows = mapConfig.rows;
    const cols = mapConfig.cols;

    this._cellViews = [];
    // 创建格子视图
    for (let row = 0; row < rows; row++) {
      this._cellViews[row] = [];

      for (let col = 0; col < cols; col++) {
        let cellPosition = MapManager.Instance.getCellPosition(row, col);
        const cellModel = MapManager.Instance.getCellModel(row, col);
        if (!cellModel) continue;

        // 可建造区域
        if (cellModel.buildable == true) {
          const cellNode = instantiate(this.cellPrefab);
          const cellView = cellNode.getComponent(CellView);
          if (cellView) {
            cellView.init(row, col, cellModel);
            this._cellViews[row][col] = cellView;
            this.towerContainer.addChild(cellNode);
          }

          // 障碍物
          if (cellModel.obstacle) {
            const obstacleNode = instantiate(this.obstaclePrefab);
            const obstacleView = obstacleNode.getComponent(ObstacleView);
            obstacleNode.setPosition(cellPosition);
            this.obstacleContainer.addChild(obstacleNode);
            cellView.obstacle = obstacleView;
          }
        } else if (cellModel.path) {
          const roadNode = instantiate(this.roadPrefab);
          roadNode.setPosition(cellPosition);
          // 设置尺寸
          roadNode
            .getComponent(UITransform)
            .setContentSize(
              MapManager.Instance.cellWidth,
              MapManager.Instance.cellHeight
            );
          this.roadContainer.addChild(roadNode);
        }
      }
    }
  }

  /**
   * 处理格子选择
   */
  handleCellSelection(row: number, col: number): boolean {
    let cellView = this._cellViews[row][col];
    if (!cellView) {
      console.debug("cellView is null");
      return false;
    }

    if (cellView.path) {
      console.debug("cellView is path");
      return false;
    }

    cellView.selected = !cellView.isSelected;
    if (cellView === this._selectedCell) {
      return false;
    }

    if (this._selectedCell) {
      this._selectedCell.selected = false;
    }

    this._selectedCell = cellView;
    this.showBuildMenu(row, col, cellView);
    return true;
  }

  /**
   * 隐藏建造菜单
   */
  hideBuildMenu() {
    if (this.menuNode) {
      this.menuNode.active = false;
      this._showBuildMenu = false;
    }

    if (this._selectedCell) {
      this._selectedCell.selected = false;
      this._selectedCell = null;
    }
  }

  /**
   * 显示建造菜单
   */
  showBuildMenu(row: number, col: number, cellView: CellView) {
    if (this._mentView) {
      this._showBuildMenu = true;
      // 获取可用的塔类型
      const availableTowers = [
        TowerType.ARROW,
        TowerType.MAGIC,
        TowerType.CANNON,
        TowerType.FREEZE,
      ];
      // 设置菜单
      this._mentView.setup(row, col, cellView, availableTowers);
      this.menuNode.active = true;
    }
  }

  /**
   * 建造防御塔
   */
  buildTower(row: number, col: number, towerConfig: TowerConfig) {
    const cellView = this._cellViews[row][col];
    console.log("buildTower", row, col, towerConfig);
    if (!cellView) return false;
    // 调用GameManager建造塔
    cellView.setTower(towerConfig);

    // 调用GameManager建造塔
    // 更新视图
    this.hideBuildMenu();

    return true;
  }

  /**
   * 升级防御塔
   */
  upgradeTower(row: number, col: number) {
    const cellView = this._cellViews[row][col];
    console.log("upgradeTower", row, col, cellView);
    if (!cellView || cellView! instanceof CellView) return false;
    // 更新视图

    (cellView as CellView).upgradeTower();
    this.hideBuildMenu();
  }

  /**
   * 拆除防御塔
   */
  demolishTower(row: number, col: number) {
    const cellView = this._cellViews[row][col];
    console.log("demolishTower", row, col, cellView);
    if (!cellView) return false;
    // 调用GameManager拆除塔
    // const result = GameManager.Instance.demolishTower(row, col);

    // if (result) {
    // 更新视图
    cellView.removeTower();
    this.hideBuildMenu();
    // }
    // return result;
  }

  /**
   * 获取格子视图
   */
  getCellView(row: number, col: number): CellView | null {
    if (
      row < 0 ||
      row >= this._cellViews.length ||
      col < 0 ||
      !this._cellViews[row] ||
      col >= this._cellViews[row].length
    ) {
      return null;
    }
    return this._cellViews[row][col];
  }

  /**
   * 是否显示建造菜单
   */
  isShowingBuildMenu(): boolean {
    return this._showBuildMenu;
  }
}
