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
import { EventManager, EventType } from "../Manager/EventManager";
import { CellView } from "../View/CellView";
import { GameState } from "../Data/GameDef";
import { MonsterManager } from "../Manager/MonsterManager";
import { Move } from "../Model/Move";
import { WaveConfig } from "../Model/MapConfig";
import { CellMenuView } from "../View/CellMenuView";
import { TowerType } from "../Model/TowerModel";

const { ccclass, property } = _decorator;

@ccclass("MainGameScene")
export class MainGameScene extends Component {
  @property(Node)
  mapContainer: Node = null!;
  @property(Prefab)
  cellPrefab: Prefab = null!;
  @property(Node)
  menuNode: Node | null = null;

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

  @property(String)
  currentLevel: string = "level1";
  /// 记录当前时间, 暂停和恢复时间
  private _currentRunTime: number = 0;
  private gameState: GameState = GameState.LOADING;

  private _cellViews: Array<any | null>[] = [];

  private _selectedCell: CellView | null = null;

  protected start(): void {
    input.on(Input.EventType.TOUCH_START, this.onTouch, this);
    this.loadGame();
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouch, this);
  }

  protected update(dt: number): void {
    if (this.gameState !== GameState.PLAYING) {
      return;
    }
    this._currentRunTime += dt;
    // MonsterManager.Instance.update(dt);
    // if (this._currentRunTime > 1) {
    //   this._currentRunTime = 0;
    //   GameManager.Instance.update();
    // }
  }

  onTouch(event: EventTouch) {
    if (this.gameState !== GameState.PLAYING) {
      return;
    }
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
    this.showBuildMenu(row, col);
    // GameManager.Instance.handleClickPosition(position.x, position.y);
    // GameManager.Instance.onCellClicked(row, col);
  }

  private showBuildMenu(row: number, col: number) {
    // 如果菜单已存在，先移除
    if (this.menuNode != null) {
      this.menuNode.active = true;
      //   this.menuNode.removeAllChildren();
      //   // this._menuNode.removeFromParent();
      //   // this._menuNode = null;
    }

    // 创建菜单
    // this._menuNode = instantiate(this.menuPrefab);
    const menuView = this.menuNode.getComponent(CellMenuView);

    if (menuView) {
      // 获取可用的塔类型
      const availableTowers = [
        TowerType.ARROW,
        TowerType.MAGIC,
        TowerType.CANNON,
        TowerType.FREEZE,
      ];

      // 设置菜单
      menuView.setup(row, col, availableTowers);

      //   // 将菜单添加到场景中
      //   this.node.addChild(this.menuNode);

      // 监听点击其他地方关闭菜单
      const closeHandler = () => {
        if (this.menuNode && this.menuNode.active) {
          this.menuNode.active = false;
          this.node.parent?.off(Node.EventType.TOUCH_END, closeHandler);
        }
      };

      this.scheduleOnce(() => {
        this.node.parent?.on(Node.EventType.TOUCH_END, closeHandler);
      }, 0.1);
    }
  }

  loadGame() {
    this.loadMap()
      .then(() => {
        this.initializeMap();
        // this.initializeMonsterSpawners();
        // this.initializeTowers();
        // this.initializeMonsters();
        this.gameState = GameState.PLAYING;
        EventManager.Instance.emit(EventType.GameStart);
        // this.gameState = GameState.READY;
      })
      .catch((error) => {
        console.error("初始化游戏失败:", error);
      });
  }

  loadMap(): Promise<boolean> {
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

    console.log("initGame: ", this.currentLevel);
    return GameManager.Instance.initGame(this.currentLevel);
  }

  initializeMap() {
    // 清除现有格子
    this.towerContainer.removeAllChildren();
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
              this._cellViews[row][col] = cellView;
              this.towerContainer.addChild(cellNode);
            }
          } else if (cellModel.path) {
            const roadNode = instantiate(this.roadPrefab);
            roadNode.setPosition(MapManager.Instance.getCellPosition(row, col));
            this.roadContainer.addChild(roadNode);
          }
        }
      }
    }

    // 触发格子创建完成事件
    EventManager.Instance.emit("cells-created", this._cellViews);
  }

  //   _waves: WaveConfig[] = [];
  //   initializeMonsterSpawners() {
  //     this._waves = GameManager.Instance.mapConfig.waves;
  //     this.unscheduleAllCallbacks();
  //     this.startSpawningMonsters();
  //   }

  //   startSpawningMonsters() {
  //     if (this._waves.length === 0) {
  //       return;
  //     }
  //     let wave = this._waves.shift();
  //     if (wave) {
  //       this.schedule(
  //         () => {
  //           let monster = instantiate(this.monsterPrefab);
  //           let move = monster.getComponent(Move);
  //           if (move) {
  //             move.setPoint(wave.startRow, wave.startCol);
  //             //   终点
  //             move.setTarget(GameManager.Instance.mapConfig.paths[0]);
  //             this.monsterContainer.addChild(monster);
  //           }
  //           // spawner.getComponent(MonsterSpawner).init(wave);
  //         },
  //         wave.interval,
  //         wave.count - 1,
  //         wave.delay
  //       );
  //     }
  //   }
}
