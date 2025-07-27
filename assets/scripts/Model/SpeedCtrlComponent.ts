import { _decorator, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass("SpeedCtrlComponent")
export class SpeedCtrlComponent extends Component {
  private _isScheduleEnable: boolean = false;
  private _delayTime: number = 0;
  private _intervalTime: number = 0;
  private _speedFactor: number = 1.0;

  set isScheduleEnable(paused: boolean) {
    this._isScheduleEnable = paused;
  }
  get isScheduleEnable() {
    return this._isScheduleEnable;
  }
  get delayTime() {
    return this._delayTime;
  }
  get intervalTime() {
    return this._intervalTime;
  }
  set intervalTime(intervalTime: number) {
    this._intervalTime = intervalTime;
  }
  set delayTime(delayTime: number) {
    this._delayTime = delayTime;
  }
  /// 设置调度器
  /// @param delayTime 延迟时间
  /// @param intervalTime 间隔时间
  /// @param speedFactor 速度因子, or null
  setSchedule(
    delayTime: number,
    intervalTime: number,
    speedFactor: number | null = null
  ) {
    this._delayTime = -delayTime;
    this._intervalTime = intervalTime;
    this._speedFactor = speedFactor ?? this._speedFactor;
    console.log(
      "set schedule: ",
      this._delayTime,
      this._intervalTime,
      this._speedFactor
    );
  }

  protected update(dt: number): void {
    if (!this._isScheduleEnable) return;
    this._delayTime += dt;
    // console.log("delay time: ", this._delayTime);
    // if delay time is greater than interval time, then call callback
    if (this._delayTime * this._speedFactor > this._intervalTime) {
      // console.log("schedule callback: ", this.speedFactor, this._intervalTime);
      if (this._isScheduleEnable) {
        this.onScheduleCallback(this._delayTime * this._speedFactor);
      }
      this._delayTime = 0;
    }
  }
  get speedFactor() {
    return this._speedFactor;
  }

  set speedFactor(speedFactor: number) {
    console.log(
      "set speed factor: ",
      this.name,
      this._speedFactor,
      "=",
      speedFactor
    );
    this._speedFactor = speedFactor;
  }
  stopSchedule() {
    this._isScheduleEnable = false;
  }
  startSchedule() {
    this._isScheduleEnable = true;
  }

  onScheduleCallback(dt: number) {
    // to be overwrite
  }
}
