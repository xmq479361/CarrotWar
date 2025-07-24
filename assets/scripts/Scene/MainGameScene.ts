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
  Vec2,
  PhysicsSystem2D,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { GameManager } from "../Manager/GameManager";
import { EventManager, EventType } from "../Manager/EventManager";
import { CellView } from "../View/CellView";
import { GameState } from "../Data/GameDef";
import { MonsterManager } from "../Manager/MonsterManager";
import { Move } from "../Model/Move";
import { MapConfig, WaveConfig } from "../Model/MapConfig";
import { CellMenuView } from "../View/CellMenuView";
import { TowerType } from "../Model/TowerModel";
import { ObstacleView } from "../View/ObstacleView";
import { GameView } from "../View/GameView";

const { ccclass, property } = _decorator;

@ccclass("MainGameScene")
export class MainGameScene extends Component {
  @property(Node)
  mapContainer: Node = null!;
  @property(Prefab)
  cellPrefab: Prefab = null!;
  @property(Node)
  menuNode: Node | null = null;
  private _mentView: CellMenuView | null = null;

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
  obstacleContainer: Node = null!;
  @property(Prefab)
  obstaclePrefab: Prefab = null!;
  @property(Prefab)
  carrotPrefab: Prefab = null!;
  @property(String)
  currentLevel: string = "level1";

  _carrotNode: Node | null = null;
  private gameState: GameState = GameState.LOADING;
  private _showBuildMenu = false;

  private _cellViews: Array<any | null>[] = [];

  private _selectedCell: CellView | null = null;

  //   @property(Node)
  //   gameView: GameView;
  private static _instance: MainGameScene;

  static get Instance(): MainGameScene {
    return MainGameScene._instance;
  }

  protected onLoad(): void {
    if (MainGameScene._instance) {
      this.destroy(); // destroy the current instance of the class if it's also an instance of the class
      return;
    }
    MainGameScene._instance = this;
    PhysicsSystem2D.instance.gravity = Vec2.ZERO;
  }

  protected start(): void {
    if (this.menuNode) {
      this.menuNode.active = false;
      this._mentView = this.menuNode.getComponent(CellMenuView);
    }
    input.on(Input.EventType.TOUCH_START, this.onTouch, this);
    this.gameState = GameState.LOADING;
    console.log("initializeMap");
    // 获取地图容器尺寸
    const transform = this.mapContainer.getComponent(UITransform);
    if (!transform) {
      console.error("地图容器缺少UITransform组件");
      return;
    }
    // 设置地图尺寸
    MapManager.Instance.setSize(transform.width, transform.height);
    this.loadGame();
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouch, this);
  }

  onTouch(event: EventTouch) {
    if (this.gameState !== GameState.PLAYING) {
      return;
    }
    let hasChanged = this.handleSelectView(event);
    if (!hasChanged && this._showBuildMenu) {
      this.hideBuildMenu();
      return;
    }
  }
  handleSelectView(event: EventTouch): boolean {
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
    // GameManager.Instance.handleClickPosition(position.x, position.y);
    // GameManager.Instance.onCellClicked(row, col);
  }

  private hideBuildMenu() {
    if (this.menuNode) {
      this.menuNode.active = false;
      this._showBuildMenu = false;
    }
    if (this._selectedCell) {
      this._selectedCell.selected = false;
      this._selectedCell = null;
    }
  }

  private showBuildMenu(row: number, col: number) {
    if (this._mentView) {
      this._showBuildMenu = true;
      // 获取可用的塔类型
      const availableTowers = [
        TowerType.ARROW,
        // TowerType.MAGIC,
        // TowerType.CANNON,
        // TowerType.FREEZE,
      ];
      // 设置菜单
      this._mentView.setup(row, col, availableTowers);
      this.menuNode.active = true;
    }
  }

  transitionToGameStart() {
    this.gameState = GameState.PLAYING;
    EventManager.Instance.emit(EventType.GameStart);
  }
  transitionToGamePause() {
    this.gameState = GameState.PAUSED;
    EventManager.Instance.emit(EventType.GamePause);
  }
  transitionToGameResume() {
    this.gameState = GameState.PLAYING;
    EventManager.Instance.emit(EventType.GameResume);
  }
  transitionToGameOver() {
    this.gameState = GameState.GAME_OVER;
    EventManager.Instance.emit(EventType.GameOver);
  }

  loadGame() {
    GameManager.Instance.initGame(this.currentLevel)
      .then((mapConfig: MapConfig) => {
        this.initializeGame(mapConfig);
        this.transitionToGameStart();
      })
      .catch((error) => {
        console.error("初始化游戏失败:", error);
      });
  }

  initializeGame(mapConfig: MapConfig) {
    // 清除现有格子
    this.towerContainer.removeAllChildren();
    this.roadContainer.removeAllChildren();
    this.obstacleContainer.removeAllChildren();

    if (!mapConfig) {
      console.error("地图配置为空");
      return;
    }
    console.info("initializeGame", mapConfig);
    this.initBackground(mapConfig);
    this.initCarrot(mapConfig);
    this.initCells(mapConfig);
  }

  initBackground(mapConfig: MapConfig) {
    if (this.bg && mapConfig.background) {
      resources.load(mapConfig.background, SpriteFrame, (err, spriteFrame) => {
        if (err) {
          console.error("加载背景图失败:", err);
          return;
        }
        this.bg.getComponent(Sprite).spriteFrame = spriteFrame;
      });
    }
  }

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
          this.roadContainer.addChild(roadNode);
        }
      }
    }
  }
}
