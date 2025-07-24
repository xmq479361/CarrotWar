import {
  _decorator,
  Component,
  instantiate,
  Node,
  NodePool,
  Prefab,
  Label,
} from "cc";
import { GameManager } from "./GameManager";
import { MapConfig, Point, WaveConfig } from "../Model/MapConfig";
import { EventManager, EventType } from "./EventManager";
import { MonsterManager } from "./MonsterManager";
import { GameConfigs, MonsterConfig } from "../Config/GameConfig";
import { MonsterView } from "../View/MonsterView";
const { ccclass, property } = _decorator;

@ccclass("MonsterSpawn")
export class MonsterSpawn extends Component {
  @property(Node)
  monsterContainer: Node = null!;

  @property(Prefab)
  monsterPrefab: Prefab = null!;

  @property(Label)
  waveInfoLabel: Label = null!;

  @property
  autoStartNextWave: boolean = false;

  @property
  delayBetweenWaves: number = 5;

  _waves: WaveConfig[] = [];
  /// 波数
  _waveNo: number = 0;
  /// 当前波中怪物生成数量
  _waveNum: number = 0;
  /// 当前波中存活的怪物数量
  _aliveMonsters: number = 0;
  /// 是否暂停
  _isPaused: boolean = false;
  /// 是否正在生成怪物
  _isSpawning: boolean = false;
  /// 下一波开始的倒计时
  _nextWaveCountdown: number = 0;

  start() {
    // 预先创建一些怪物实例到对象池
    for (let i = 0; i < 10; i++) {
      MonsterManager.Instance.recycleMonster(instantiate(this.monsterPrefab));
    }

    // 注册事件监听
    this.registerEvents();

    // 初始化波次信息显示
    if (this.waveInfoLabel) {
      this.waveInfoLabel.string = "准备开始";
    }
  }

  onDestroy() {
    // 清空对象池
    MonsterManager.Instance.monsterPool.clear();
    // 取消事件监听
    this.unregisterEvents();
  }

  registerEvents() {
    EventManager.Instance.on(EventType.GameStart, this.onGameStart);
    EventManager.Instance.on(EventType.GamePause, this.onGamePause);
    EventManager.Instance.on(EventType.GameResume, this.onGameResume);
    EventManager.Instance.on(EventType.GameOver, this.onGameOver);
    EventManager.Instance.on(EventType.MonsterDie, this.onMonsterDied);
    EventManager.Instance.on(EventType.WaveStarted, this.onStartNextWave);
  }

  unregisterEvents() {
    EventManager.Instance.off(EventType.GameStart, this.onGameStart);
    EventManager.Instance.off(EventType.GamePause, this.onGamePause);
    EventManager.Instance.off(EventType.GameResume, this.onGameResume);
    EventManager.Instance.off(EventType.GameOver, this.onGameOver);
    EventManager.Instance.off(EventType.MonsterDie, this.onMonsterDied);
    EventManager.Instance.off(EventType.WaveStarted, this.onStartNextWave);
  }

  onGameStart() {
    console.log("MonsterSpawn onGameStart");
    this.unscheduleAllCallbacks();
    this._isPaused = false;
    this._isSpawning = false;
    this._waveNo = 0;
    this._waveNum = 0;
    this._aliveMonsters = 0;

    if (this.monsterContainer) {
      this.monsterContainer.removeAllChildren();
      this._waves = GameManager.Instance.mapConfig.waves;

      // 更新波次信息显示
      this.updateWaveInfoLabel();

      // 开始第一波
      this.startSpawningMonsters(this._waveNo);
    }
  }

  onGamePause() {
    console.log("MonsterSpawn onGamePause");
    this._isPaused = true;
    this.unscheduleAllCallbacks();
  }

  onGameResume() {
    console.log("MonsterSpawn onGameResume");
    this._isPaused = false;

    // 如果正在生成怪物，继续生成
    if (this._isSpawning) {
      this.startSpawningMonsters(this._waveNo);
    }
    // 如果在波次间隔中，继续倒计时
    else if (this._nextWaveCountdown > 0) {
      this.startNextWaveCountdown();
    }
  }

  onGameOver() {
    console.log("MonsterSpawn onGameOver");
    this._isPaused = true;
    this.unscheduleAllCallbacks();
  }

  onMonsterDied() {
    // 减少存活怪物计数
    this._aliveMonsters--;

    // 检查当前波次是否结束
    if (
      this._aliveMonsters <= 0 &&
      this._waveNum >= this._waves[this._waveNo].count
    ) {
      this.onWaveCompleted();
    }
  }

  onWaveCompleted() {
    console.log(`第 ${this._waveNo + 1} 波怪物已全部消灭`);

    // 触发波次结束事件
    EventManager.Instance.emit(EventType.WaveCompleted, this._waveNo);

    // 检查是否还有下一波
    if (this._waveNo + 1 < this._waves.length) {
      this._waveNo++;

      // 更新波次信息
      this.updateWaveInfoLabel();

      // 如果设置了自动开始下一波，则开始倒计时
      if (this.autoStartNextWave) {
        this._nextWaveCountdown = this.delayBetweenWaves;
        this.startNextWaveCountdown();
      } else {
        // 触发下一波准备就绪事件，等待玩家手动开始
        EventManager.Instance.emit(EventType.WaveNexteady, this._waveNo);
      }
    } else {
      // 所有波次完成，游戏胜利
      console.log("所有波次完成");
      EventManager.Instance.emit(EventType.GameWin);
    }
  }

  startNextWaveCountdown() {
    if (this._isPaused) return;

    this.unschedule(this.updateCountdown);
    this.schedule(this.updateCountdown, 1, this._nextWaveCountdown - 1);
  }

  updateCountdown() {
    this._nextWaveCountdown--;

    // 更新倒计时显示
    if (this.waveInfoLabel) {
      this.waveInfoLabel.string = `下一波: ${this._nextWaveCountdown}秒`;
    }

    // 倒计时结束，开始下一波
    if (this._nextWaveCountdown <= 0) {
      this.startSpawningMonsters(this._waveNo);
    }
  }

  onStartNextWave() {
    // 手动开始下一波
    if (
      !this._isPaused &&
      this._waveNo < this._waves.length &&
      !this._isSpawning
    ) {
      this.startSpawningMonsters(this._waveNo);
    }
  }

  updateWaveInfoLabel() {
    if (this.waveInfoLabel) {
      if (this._waveNo < this._waves.length) {
        const totalWaves = this._waves.length;
        this.waveInfoLabel.string = `波次: ${this._waveNo + 1}/${totalWaves}`;
      } else {
        this.waveInfoLabel.string = "全部完成";
      }
    }
  }

  startSpawningMonsters(waveNo: number) {
    if (this._isPaused || waveNo >= this._waves.length) {
      return;
    }

    this._isSpawning = true;
    this._waveNum = 0;

    let mapConfig = GameManager.Instance.mapConfig;
    let wave = this._waves[waveNo];

    if (wave) {
      // 触发波次开始事件
      EventManager.Instance.emit(EventType.WaveStarted, waveNo);

      // 更新波次信息显示
      if (this.waveInfoLabel) {
        this.waveInfoLabel.string = `波次 ${waveNo + 1}/${
          this._waves.length
        } 进行中`;
      }

      // 延迟后开始生成怪物
      this.scheduleOnce(
        () =>
          this.spawn(
            wave,
            wave.startCol ?? mapConfig.startCol,
            wave.startRow ?? mapConfig.startRow,
            mapConfig.paths[wave.pathIndex ?? 0]
          ),
        wave.delay
      );
    }
  }

  spawn(wave: WaveConfig, startCol: number, startRow: number, path: Point[]) {
    if (this._isPaused) return;

    // 获取怪物配置
    const monsterConfig = GameConfigs.getMonsterConfig(wave.enemyType);

    // 创建怪物实例
    let monster = MonsterManager.Instance.newMonster(this.monsterPrefab);

    // 设置怪物属性
    MonsterManager.Instance.setupMonster(monster, wave.enemyType, wave.hp);

    // 设置怪物移动组件
    let monsterView = monster.getComponent(MonsterView);
    if (monsterView) {
      this.monsterContainer.addChild(monster);
      monsterView.setPoint(startCol, startRow);
      monsterView.speed = wave.speed * 100;
      monsterView.setTarget(path);

      // 增加存活怪物计数
      this._aliveMonsters++;
    }

    // 增加已生成怪物计数
    this._waveNum++;

    // 检查是否需要继续生成怪物
    if (this._waveNum < wave.count) {
      // 按间隔继续生成
      return this.scheduleOnce(
        () => this.spawn(wave, startCol, startRow, path),
        wave.interval
      );
    }

    // 当前波次的怪物全部生成完毕
    this._isSpawning = false;

    // 如果没有存活的怪物，直接触发波次完成
    if (this._aliveMonsters <= 0) {
      this.onWaveCompleted();
    }
  }
}
