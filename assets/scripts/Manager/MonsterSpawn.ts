import { _decorator, instantiate, Node, Prefab, Label } from "cc";
import { MapConfig, Point, WaveConfig } from "../Config/MapConfig";
import { EventManager, EventType } from "./EventManager";
import { MonsterManager } from "./MonsterManager";
import { MonsterView } from "../View/MonsterView";
import { SpeedCtrlComponent } from "../Model/SpeedCtrlComponent";
import { MonsterConfig, MonsterConfigs } from "../Config/MonsterConfig";
const { ccclass, property } = _decorator;

@ccclass("MonsterSpawn")
export class MonsterSpawn extends SpeedCtrlComponent {
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

  /// 总波数
  _waveLength: number = 0;
  /// 当前波数(下标)
  _waveNo: number = 0;
  /// 当前波中怪物已生成数量
  _waveNum: number = 0;
  /// 当前波中存活的怪物数量
  _aliveMonsters: number = 0;
  _isPaused: boolean = false;
  /// 是否正在生成怪物
  _isSpawning: boolean = false;
  /// 下一波开始的倒计时
  _nextWaveCountdown: number = 0;

  mapConfig: MapConfig = null!;
  wave: WaveConfig;
  startCol: number;
  startRow: number;
  monsterConfig: MonsterConfig;
  path: Point[];

  start() {
    // 注册事件监听
    this.registerEvents();
  }

  onDestroy() {
    // 清空对象池
    MonsterManager.Instance.monsterPool.clear();
    // 取消事件监听
    this.unregisterEvents();
  }

  registerEvents() {
    EventManager.Instance.on(EventType.GameStart, this.onGameStart.bind(this));
    EventManager.Instance.on(EventType.GamePause, this.onGamePause.bind(this));
    EventManager.Instance.on(
      EventType.GameResume,
      this.onGameResume.bind(this)
    );
    EventManager.Instance.on(EventType.GameOver, this.onGameOver.bind(this));
    EventManager.Instance.on(
      EventType.MonsterDie,
      this.onMonsterDied.bind(this)
    );
    EventManager.Instance.on(
      EventType.WaveStarted,
      this.onStartNextWave.bind(this)
    );
    EventManager.Instance.on(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged.bind(this)
    );
  }

  unregisterEvents() {
    EventManager.Instance.off(EventType.GameStart, this.onGameStart.bind(this));
    EventManager.Instance.off(EventType.GamePause, this.onGamePause.bind(this));
    EventManager.Instance.off(
      EventType.GameResume,
      this.onGameResume.bind(this)
    );
    EventManager.Instance.off(EventType.GameOver, this.onGameOver.bind(this));
    EventManager.Instance.off(
      EventType.MonsterDie,
      this.onMonsterDied.bind(this)
    );
    EventManager.Instance.off(
      EventType.WaveStarted,
      this.onStartNextWave.bind(this)
    );
    EventManager.Instance.off(
      EventType.GameSpeedChanged,
      this.onGameSpeedChanged.bind(this)
    );
  }
  setup(mapConfig: MapConfig) {
    this.mapConfig = mapConfig;
    this._waveLength = mapConfig.waves.length;
    this._waveNo = 0;
    this._waveNum = 0;
    this._aliveMonsters = 0;
    this._isPaused = false;
    this._isSpawning = false;
    this._nextWaveCountdown = 0;
    // 预先创建一些怪物实例到对象池
    for (let i = 0; i < 10; i++) {
      MonsterManager.Instance.recycleMonster(instantiate(this.monsterPrefab));
    }
    // 初始化波次信息显示
    if (this.waveInfoLabel) {
      this.waveInfoLabel.string = "准备开始";
    }
  }
  onGameStart() {
    console.log("MonsterSpawn onGameStart");
    this.unscheduleAllCallbacks();
    this._isPaused = false;
    this._isSpawning = false;
    this._waveNo = 0;
    this._waveNum = 0;
    this._aliveMonsters = 0;

    this.updateWaveInfoLabel();
    if (this.monsterContainer) {
      this.monsterContainer.removeAllChildren();

      // 开始第一波
      this.startSpawningMonsters(this._waveNo);
    }
  }

  onGameSpeedChanged(speedFactor: number) {
    this.speedFactor = speedFactor;
  }
  onGamePause() {
    console.log("MonsterSpawn onGamePause");
    this._isPaused = true;
    this.stopSchedule();
  }

  onGameResume() {
    console.log("MonsterSpawn onGameResume");
    this._isPaused = false;
    this.startSchedule();
    // 如果在波次间隔中，继续倒计时
    if (this._nextWaveCountdown > 0) {
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
    if (this._aliveMonsters <= 0 && this._waveNum >= this.wave.count) {
      this.onWaveCompleted();
    }
  }

  onWaveCompleted() {
    console.log(`第 ${this._waveNo + 1} 波怪物已全部消灭`);

    // 触发波次结束事件
    EventManager.Instance.emit(EventType.WaveCompleted);

    // 检查是否还有下一波
    if (this._waveNo + 1 < this._waveLength) {
      this._waveNo++;

      // 更新波次信息
      this.updateWaveInfoLabel();

      // 如果设置了自动开始下一波，则开始倒计时
      // if (this.autoStartNextWave) {
      this._nextWaveCountdown = this.delayBetweenWaves;
      this.startNextWaveCountdown();
      // } else {
      //   // 触发下一波准备就绪事件，等待玩家手动开始
      //   EventManager.Instance.emit(EventType.WaveNextReady, this._waveNo);
      // }
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
      this._waveNo < this._waveLength &&
      !this._isSpawning
    ) {
      this.startSpawningMonsters(this._waveNo);
    }
  }

  updateWaveInfoLabel() {
    if (this.waveInfoLabel) {
      if (this._waveNo < this._waveLength) {
        const totalWaves = this._waveLength;
        this.waveInfoLabel.string = `波次: ${this._waveNo + 1}/${totalWaves}`;
      } else {
        this.waveInfoLabel.string = "全部完成";
      }
    }
  }

  startSpawningMonsters(waveNo: number) {
    if (this._isPaused || waveNo >= this._waveLength) {
      return;
    }

    this._isSpawning = true;
    this._waveNum = 0;

    this.wave = this.mapConfig.waves[waveNo];

    if (!this.wave) {
      console.error(`Invalid wave index: ${waveNo}`);
      return; // 或者抛出一个错误或采取其他适当的处理方式，以避免后续的错误或逻辑错误
    }
    // 触发波次开始事件
    EventManager.Instance.emit(EventType.WaveStarted, waveNo);
    // 更新波次信息显示
    this.updateWaveInfoLabel();
    this.path = this.mapConfig.paths[this.wave.pathIndex ?? 0];
    this.monsterConfig = MonsterConfigs.getMonsterConfig(this.wave.enemyType);
    this.startCol = this.wave.startCol ?? this.mapConfig.startCol;
    this.startRow = this.wave.startRow ?? this.mapConfig.startRow;
    // 延迟后开始生成怪物
    this.setSchedule(this.wave.delay, this.wave.interval, null);
    this.startSchedule();
  }

  /// 定期任务毁掉
  onScheduleCallback(dt: number): void {
    if (this._isPaused || !this._isSpawning) return;
    // 创建怪物实例
    let monster = MonsterManager.Instance.newMonster(this.monsterPrefab);
    // 设置怪物移动组件
    let monsterView = monster.getComponent(MonsterView);
    if (monsterView) {
      this.monsterContainer.addChild(monster);
      // 设置怪物属性
      monsterView.setup(
        this.startCol,
        this.startRow,
        this.monsterConfig,
        this.wave
      );
      monsterView.setTarget([...this.path]);
      // 增加存活怪物计数
      this._aliveMonsters++;
    }
    // 增加已生成怪物计数
    this._waveNum++;
    // 检查是否需要继续生成怪物
    if (this._waveNum >= this.wave.count) {
      // 当前波次的怪物全部生成完毕
      this._isSpawning = false;
    }
  }
}
