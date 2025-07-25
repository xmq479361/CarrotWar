import { _decorator, Component, Node, Sprite } from "cc";
import { Utils } from "../Utils/Utils";
import { EventManager, EventType } from "../Manager/EventManager";
const { ccclass, property } = _decorator;

@ccclass("ObstacleView")
export class ObstacleView extends Component {
  sprite: Sprite | null = null;
  obstacleId: number = 0;

  _hp: number = 0;
  _maxHp: number = 0;
  // 防御值
  _def: number = 0;
  // 收益值
  _gold: number = 0;

  start() {
    this.sprite = this.node.getComponentInChildren(Sprite);
  }

  // 初始化
  setup(config: ObstacleConfig) {
    this.obstacleId = config.obstacleId;
    this._hp = config.hp;
    this._maxHp = config.hp;
    this._def = config.def;
    this.node.active = true;
    Utils.setSpriteFrame(this.sprite, config.spritePath);
  }

  onHit(damage: number) {
    this._hp -= damage / this._def;
    if (this._hp <= 0) {
      this.node.active = false;
      EventManager.Instance.emit(EventType.GoldChanged, this._gold);
    }
  }
}

export interface ObstacleConfig {
  spritePath: string | null;
  obstacleId: number;
  hp: number;
  def: number;
  gold: number; // 消灭收益
}
