import { _decorator, Component, instantiate, Node, NodePool, Prefab } from "cc";
import { GameManager } from "./GameManager";
import { WaveConfig } from "../Model/MapConfig";
import { EventManager, EventType } from "./EventManager";
import { Move } from "../Model/Move";
import { MonsterManager } from "./MonsterManager";
const { ccclass, property } = _decorator;

@ccclass("MonsterSpawn")
export class MonsterSpawn extends Component {
  @property(Node)
  monsterContainer: Node = null!;
  @property(Prefab)
  monsterPrefab: Prefab = null!;
  _waves: WaveConfig[] = [];

  //   static monsterPool: NodePool = new NodePool();

  //   static _Instance: MonsterSpawn = null;

  //   static get Instance() {
  //     if (MonsterSpawn._Instance == null) {
  //       console.log("MonsterManager init: ");
  //       MonsterSpawn._Instance = new MonsterSpawn();
  //     }
  //     return MonsterSpawn._Instance;
  //   }
  start() {
    for (let i = 0; i < 3; i++) {
      MonsterManager.Instance.recycleMonster(instantiate(this.monsterPrefab));
    }
    EventManager.Instance.on(EventType.GameStart, this.onGameStart.bind(this));
    EventManager.Instance.on(EventType.GamePause, this.onGamePause.bind(this));
    EventManager.Instance.on(
      EventType.GameResume,
      this.onGameResume.bind(this)
    );
  }

  onDestroy() {
    MonsterManager.Instance.monsterPool.clear();
    // TODO: 这里需要取消所有的事件监听，否则会出现内存泄漏
    EventManager.Instance.off(EventType.GameStart, this.onGameStart);
    EventManager.Instance.off(EventType.GamePause, this.onGamePause);
    EventManager.Instance.off(EventType.GameResume, this.onGameResume);
  }
  onGameStart() {
    console.log("MonsterSpawn onGameStart");
    this.unscheduleAllCallbacks();
    if (this.monsterContainer) {
      this.monsterContainer.removeAllChildren();
      this._waves = GameManager.Instance.mapConfig.waves;
      this.startSpawningMonsters();
    }
  }
  onGamePause() {
    console.log("MonsterSpawn onGamePause");
    this.unscheduleAllCallbacks();
  }

  onGameResume() {
    console.log("MonsterSpawn onGameResume");
    this.startSpawningMonsters();
  }
  onGameOver() {
    console.log("MonsterSpawn onGameOver");
    this.unscheduleAllCallbacks();
  }

  startSpawningMonsters() {
    if (this._waves.length === 0) {
      return;
    }
    let mapConfig = GameManager.Instance.mapConfig;
    let wave = this._waves.shift();
    if (wave) {
      this.schedule(
        () => {
          let monster = MonsterManager.Instance.newMonster(this.monsterPrefab);
          let move = monster.getComponent(Move);
          if (move) {
            this.monsterContainer.addChild(monster);
            move.setPoint(
              wave.startCol ?? mapConfig.startCol,
              wave.startRow ?? mapConfig.startRow
            );
            move.speed = wave.speed * 100;
            move.setTarget([...mapConfig.paths[wave.pathIndex ?? 0]]);
          }
          // spawner.getComponent(MonsterSpawner).init(wave);
        },
        wave.interval,
        wave.count - 1,
        wave.delay
      );
    }
  }

  // _waves: WaveConfig[] = [];
  // initializeMonsterSpawners(waves: WaveConfig[]) {
  //     this._waves = waves;
  //     this.unscheduleAllCallbacks();
  //     this.startSpawningMonsters();
  //     // let waves = GameManager.Instance.mapConfig.waves;
  //     for (let wave of waves) {
  //     //   let spawner = instantiate(this.monsterPrefab);
  //     //   spawner.setPosition(MapManager.Instance.getCellPosition(wave.startRow, wave.startCol));
  //     //   this.monsterContainer.addChild(spawner);
  //       // spawner.getComponent(MonsterSpawner).init(wave);
  //     }
  //     this.schedule(
  //       () => {
  //         if (waves.length === 0) {
  //           this.unscheduleAllCallbacks();
  //           return;
  //         }
  //       },
  //     )
  //   }

  //   startSpawningMonsters() {
  //     if (this._waves.length === 0) {
  //         return;
  //     }
  //     let wave = this._waves.shift();
  //     if (wave) {
  //         this.schedule(() => {
  //             this.spawn();
  //         }, wave.interval, wave.count - 1, wave.delay);
  //     }

  //   }
}
