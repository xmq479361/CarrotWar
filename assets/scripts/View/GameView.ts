import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  UITransform,
  Vec3,
  resources,
  SpriteFrame,
  Sprite,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { GameManager } from "../Manager/GameManager";
import { EventManager, EventType } from "../Manager/EventManager";
import { CellView } from "./CellView";
import { MapConfig } from "../Model/MapConfig";
import { ObstacleView } from "./ObstacleView";
import { CellMenuView } from "./CellMenuView";
import { TowerType } from "../Model/TowerModel";

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

    if (!mapConfig) {
      console.error("地图配置为空");
      return;
    }
    
    console.info("GameView - initializeGame", mapConfig);
    this.initBackground(mapConfig);
    this.initCarrot(mapConfig);
    this.initCells(mapConfig);
  }

  /**
   * 初始化背景
   */
  initBackground(mapConfig: MapConfig) {
    if (this.backgroundNode && mapConfig.background) {
      resources.load(mapConfig.background, SpriteFrame, (err, spriteFrame) => {
        if (err) {
          console.error("加载背景图失败:", err);
          return;
        }
        this.backgroundNode.getComponent(Sprite).spriteFrame = spriteFrame;
      });
    }
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
        const cellModel = GameManager.Instance.getCellModel(row, col);
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
  // if (cellModel.obstacle) {
  //           const obstacleNode = instantiate(this.obstaclePrefab);
  //           const obstacleView = obstacleNode.getComponent(ObstacleView);
  //           obstacleNode.setPosition(cellPosition);
  //           this.obstacleContainer.addChild(obstacleNode);
  //           cellView.obstacle = obstacleView;
  //         }
    } else 
if (cellModel.path) {
          const roadNode = instantiate(this.roadPrefab);
          roadNode.setPosition(cellPosition);
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
      console.error("cellView is null");
      return false;
    }
    
    if (cellView.path) {
      console.error("cellView is path");
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
    this.showBuildMenu(row, col);
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
  showBuildMenu(row: number, col: number) {
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
      this._mentView.setup(row, col, availableTowers);
      this.menuNode.active = true;
    }
  }

  /**
   * 建造防御塔
   */
  buildTower(row: number, col: number, towerType: TowerType) {
    const cellView = this._cellViews[row][col];
    if (!cellView) return false;
    
    // 调用GameManager建造塔
    const result = GameManager.Instance.buildTower(row, col, towerType);
    
    if (result) {
      // 更新视图
      cellView.setTower(towerType);
      this.hideBuildMenu();
    }
    
    return result;
  }

  /**
   * 升级防御塔
   */
  upgradeTower(row: number, col: number) {
    const cellView = this._cellViews[row][col];
    if (!cellView) return false;
    
    // 调用GameManager升级塔
// const result = GameManager.Instance.upgradeTower(row, col);
    
//     if (result) {
//       // 更新视图
  cellView.updateTower();
  this.hideBuildMenu();
    // }
    return true;
// return result;
  }

  /**
   * 拆除防御塔
   */
  demolishTower(row: number, col: number) {
    const cellView = this._cellViews[row][col];
    if (!cellView) return false;
    
    // 调用GameManager拆除塔
    const result = GameManager.Instance.demolishTower(row, col);
    
    if (result) {
      // 更新视图
      cellView.removeTower();
      this.hideBuildMenu();
    }
    
    return result;
  }

  /**
   * 获取格子视图
   */
  getCellView(row: number, col: number): CellView | null {
    if (row < 0 || row >= this._cellViews.length || 
        col < 0 || !this._cellViews[row] || col >= this._cellViews[row].length) {
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

