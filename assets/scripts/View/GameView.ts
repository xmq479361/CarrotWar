import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  log,
  input,
  Input,
  EventTouch,
  UITransform,
  Vec2,
} from "cc";
import { MapManager } from "../Manager/MapManager";
import { Utils } from "../Utils/Utils";
import { GameModel } from "../Model/GameModel";
import { Level } from "../Model/MapConfig";
import { LevelDef } from "../Data/GameDef";
const { ccclass, property } = _decorator;

@ccclass("GameView")
export class GameView extends Component {
  monsterPrefabs: Prefab[];
  gridUITransform: UITransform;
  gameModel: GameModel;
  private isCanMove: boolean = false;
  private touchEnable: boolean = true;
  protected onLoad(): void {
    this.gridUITransform = this.getComponent(UITransform);
    //   input.on(Input.EventType.TOUCH_START, this.onTouch, this);
    //   input.on(Input.EventType.TOUCH_MOVE, this.onTouch, this);
    this.touchEnable = true;
    let box = this.gridUITransform.getBoundingBoxToWorld();
    MapManager.Instance.setSize(box.width, box.height);
  }

  protected start(): void {
    this.gameModel = new GameModel();
    this.initMap();
  }

  /// 地图初始化
  initMap() {
    try {
      // 加载地图配置
      MapManager.Instance.loadMap(LevelDef.LEVEL_1);

      // 创建格子视图
      this.createCellViews(MapManager.Instance.mapConfig);
      // 创建游戏模型
      this._gameModel = new GameModel(mapConfig);

      // 注册事件
      this.registerEvents();

      console.log("游戏初始化完成");
    } catch (error) {
      console.error("初始化地图失败:", error);
    }
  }
}
