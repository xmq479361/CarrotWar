import { _decorator, Color, Component, Label, Node, Sprite } from "cc";
import { Utils } from "../Utils/Utils";
import { MainGameScene } from "../Scene/MainGameScene";
import { TowerConfig } from "../Config/TowerConfig";
import { EventManager, EventType } from "../Manager/EventManager";
const { ccclass, property } = _decorator;

@ccclass("MenuItemView")
export class MenuItemView extends Component {
  @property(Sprite)
  protected sprite: Sprite = null!;
  @property(Label)
  protected label: Label = null!;
  protected _item: MenuItemDef = null!;
  protected onEnable(): void {}
  protected start(): void {
    EventManager.Instance.on(
      EventType.GoldChanged,
      this.onGoldChanged.bind(this)
    );
  }

  protected onDestroy(): void {
    EventManager.Instance.off(
      EventType.GoldChanged,
      this.onGoldChanged.bind(this)
    );
  }
  protected onDisable(): void {}

  onGoldChanged() {
    this.updateEnable();
  }

  setup(item: MenuItemDef) {
    this._item = item;
    if (this.sprite) {
      Utils.setSpriteFrame(this.sprite, item.spritePath);
      this.updateEnable();
    }
    if (this.label) {
      this.label.string = item.label;
    }
  }
  updateEnable() {
    if (!this._item) return;
    if (this.sprite) {
      this.sprite.color =
        MainGameScene.Instance.gold >= this._item.gold
          ? new Color(255, 255, 255, 255)
          : Color.GRAY;
    }
  }
}

export interface MenuItemDef {
  label: string;
  enable: boolean;
  spritePath: string;
  gold: number;
  towerConfig: TowerConfig;
  level: number;
}
