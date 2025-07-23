type EventCallback = (...args: any[]) => void;

export enum EventType {
  // 游戏事件
  GameStart = "GameStart",
  GamePause = "GamePause",
  GameResume = "GameResume",
  GameOver = "GameOver",
  GameRestart = "GameRestart",
  // 地图事件
  MapInit = "MapInit",
  MapUpdate = "MapUpdate",
  // 怪物事件
  MonsterInit = "MonsterInit",
  MonsterUpdate = "MonsterUpdate",
  MonsterDie = "MonsterDie",
  MonsterMove = "MonsterMove",
  MonsterAttack = "MonsterAttack",
  // 塔事件
  TowerInit = "TowerInit",
  TowerUpdate = "TowerUpdate",
  TowerBuy = "TowerBuy",
  TowerSell = "TowerSell",
  TowerUpgrade = "TowerUpgrade",
  // 子弹事件
  BulletInit = "BulletInit",
  BulletUpdate = "BulletUpdate",
  BulletFire = "BulletFire",
  BulletHit = "BulletHit",
  // 游戏UI事件
  UIUpdate = "UIUpdate",
  // 游戏音效事件
  SoundPlay = "SoundPlay",
  SoundStop = "SoundStop",
}
export class EventManager {
  private static _instance: EventManager;
  private _events: Map<string, EventCallback[]>;

  private constructor() {
    this._events = new Map<string, EventCallback[]>();
  }

  static get Instance(): EventManager {
    if (!EventManager._instance) {
      EventManager._instance = new EventManager();
    }
    return EventManager._instance;
  }

  /**
   * 注册事件监听
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  on(eventName: string, callback: EventCallback): void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }

    const callbacks = this._events.get(eventName)!;
    if (callbacks.indexOf(callback) === -1) {
      callbacks.push(callback);
    }
  }

  /**
   * 取消事件监听
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  off(eventName: string, callback: EventCallback): void {
    if (!this._events.has(eventName)) return;

    const callbacks = this._events.get(eventName)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this._events.delete(eventName);
    }
  }

  /**
   * 触发事件
   * @param eventName 事件名称
   * @param args 参数
   */
  emit(eventName: string, ...args: any[]): void {
    if (!this._events.has(eventName)) return;

    const callbacks = this._events.get(eventName)!;
    for (const callback of callbacks) {
      callback(...args);
    }
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this._events.clear();
  }
}
