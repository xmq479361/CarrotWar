import {
  _decorator,
  Component,
  Node,
  UITransform,
  input,
  Input,
  EventTouch,
  PhysicsSystem2D,
  Vec2,
  Label
} from "cc"
import { MapManager } from "../Manager/MapManager"
import { GameManager } from "../Manager/GameManager"
import { EventManager, EventType } from "../Manager/EventManager"
import { GameState } from "../Data/GameDef"
import { GameView } from "../View/GameView"
import { MapConfig } from "../Model/MapConfig"
import { TowerType } from "../Model/TowerModel"

const { ccclass, property } = _decorator

@ccclass("MainGameScene")
export class MainGameScene extends Component {
  @property(GameView)
  gameView: GameView = null!

  @property(Label)
  goldLabel: Label = null!

  @property(Label)
  lifeLabel: Label = null!

  @property(Label)
  waveLabel: Label = null!

  @property(Node)
  pauseAndResumeButton: Node = null!

  @property(Node)
  menuButton: Node = null!

  @property(String)
  currentLevel: string = "level1"
  gold: number = 0
  life: number = 0
  currentWave: number = 0
  totalWaves: number = 0

  private gameState: GameState = GameState.LOADING
  private static _instance: MainGameScene

  static get Instance(): MainGameScene {
    return MainGameScene._instance
  }

  protected onLoad(): void {
    if (MainGameScene._instance) {
      this.destroy()
      return
    }
    MainGameScene._instance = this
// PhysicsSystem2D.instance.gravity = Vec2.ZERO
    PhysicsSystem2D.instance.enable = true;
  }

  protected start(): void {
    // 注册事件监听
    this.registerEvents()

    // 初始化UI
    this.initUI()

    // 设置输入事件
    input.on(Input.EventType.TOUCH_START, this.onTouch, this)

    // 初始化游戏
    this.gameState = GameState.LOADING
    console.log("初始化游戏场景")

    // 获取地图容器尺寸
    const transform = this.gameView.mapContainer.getComponent(UITransform)
    if (!transform) {
      console.error("地图容器缺少UITransform组件")
      return
    }

    // 设置地图尺寸
    MapManager.Instance.setSize(transform.width, transform.height)

    // 加载游戏
    this.loadGame()
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouch, this)
    this.unregisterEvents()
  }

  /**
   * 注册事件监听
   */
  private registerEvents(): void {
EventManager.Instance.on(EventType.GoldChanged, this.updateGold.bind(this))
EventManager.Instance.on(EventType.LifeChanged, this.updateLife.bind(this))
    EventManager.Instance.on(EventType.WaveChanged, this.updateWave.bind(this))
    EventManager.Instance.on(EventType.BuildTower, this.onBuildTower.bind(this))
    EventManager.Instance.on(EventType.UpgradeTower, this.onUpgradeTower.bind(this))
    EventManager.Instance.on(EventType.DemolishTower, this.onDemolishTower.bind(this))
  }

  /**
   * 取消事件监听
   */
  private unregisterEvents(): void {
EventManager.Instance.off(EventType.GoldChanged, this.updateGold.bind(this))
EventManager.Instance.off(EventType.LifeChanged, this.updateLife.bind(this))
    EventManager.Instance.off(EventType.WaveChanged, this.updateWave.bind(this))
    EventManager.Instance.off(EventType.BuildTower, this.onBuildTower.bind(this))
    EventManager.Instance.off(EventType.UpgradeTower, this.onUpgradeTower.bind(this))
    EventManager.Instance.off(EventType.DemolishTower, this.onDemolishTower.bind(this))
  }

  /**
   * 初始化UI
   */
  private initUI(): void {
this.pauseAndResumeButton.active = false
    this.updateGold()
    this.updateLife()
    this.updateWave()
  }

  /**
   * 处理触摸事件
   */
  onTouch(event: EventTouch) {
    if (this.gameState !== GameState.PLAYING) {
      return
    }

    let position = this.gameView.mapContainer
      .getComponent(UITransform)
      .convertToNodeSpaceAR(event.getUILocation().toVec3())

    // 将坐标转换为格子位置
    let [col, row] = MapManager.Instance.getLocationFromPoint(
      position.x,
      position.y
    )

    console.log("点击位置: ", position, "格子:", col, "x", row)

    // 处理格子选择
    let hasChanged = this.gameView.handleCellSelection(row, col)

    // 如果没有选中新格子且当前有建造菜单，则隐藏菜单
    if (!hasChanged && this.gameView.isShowingBuildMenu()) {
      this.gameView.hideBuildMenu()
    }
  }

  /**
   * 加载游戏
   */
  loadGame() {
    GameManager.Instance.initGame(this.currentLevel)
      .then((mapConfig: MapConfig) => {
        this.gameView.initializeGame(mapConfig)
        this.updateGold()
        this.updateLife()
        this.updateWave()
        this.transitionToGameStart()
      })
      .catch((error) => {
        console.error("初始化游戏失败:", error)
      })
  }

  /**
   * 切换到游戏开始状态
   */
  transitionToGameStart() {
    this.gameState = GameState.PLAYING
    EventManager.Instance.emit(EventType.GameStart)
  }

  /**
   * 切换到游戏暂停状态
   */
  transitionToGamePause() {
    this.gameState = GameState.PAUSE
    this.pauseAndResumeButton.active = true
    EventManager.Instance.emit(EventType.GamePause)
  }

  /**
   * 切换到游戏恢复状态
   */
  transitionToGameResume() {
    this.gameState = GameState.PLAYING
    this.pauseAndResumeButton.active = true
    EventManager.Instance.emit(EventType.GameResume)
  }

  /**
   * 切换到游戏结束状态
   */
  transitionToGameOver() {
    this.gameState = GameState.GAME_OVER
    EventManager.Instance.emit(EventType.GameOver)
  }

  /**
   * 更新金币显示
   */
  updateGold() {
    this.goldLabel.string = `金币: ${this.gold}`
  }

  /**
 更新生命值显示
   */
  updateLife() {
    this.lifeLabel.string = `生命: ${this.life}`
  }

  /**
   * 更新波次显示
   */
  updateWave() {
    this.waveLabel.string = `波次: ${this.currentWave}/${this.totalWaves}`
  }

  /**
   * 处理建造防御塔事件
   */
  onBuildTower(row: number, col: number, towerType: TowerType) {
    this.gameView.buildTower(row, col, towerType)
  }

  /**
   * 处理升级防御塔事件
   */
  onUpgradeTower(row: number, col: number) {
    this.gameView.upgradeTower(row, col)
  }

  /**
   * 处理拆除防御塔事件
   */
  onDemolishTower(row: number, col: number) {
    this.gameView.demolishTower(row, col)
  }

  /**
   * 暂停按钮点击事件
   */
  onPauseButtonClick() {
    if (this.gameState === GameState.PLAYING) {
      this.transitionToGamePause()
    }
  }

  /**
   * 恢复按钮点击事件
   */
  onResumeButtonClick() {
if (this.gameState === GameState.PAUSE) {
      this.transitionToGameResume()
    }
  }

  /**
   * 重新开始按钮点击事件
   */
  onRestartButtonClick() {
    this.loadGame()
  }

  /**
   * 返回主菜单按钮点击事件
   */
  onBackToMenuButtonClick() {
    // 返回主菜单逻辑
// GameManager.Instance.loadMainMenu()
  }
}
