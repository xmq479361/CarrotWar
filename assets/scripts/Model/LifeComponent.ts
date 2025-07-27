import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

// 生命特性接口
export interface ILife {
  maxHp: number;
  curHp: number;
  defer: number;
  preAttackHp: number;
  remainHp: number;

  preAttack(value: number): void;
  onAttack(value: number): void;
  onHeal?(value: number): void;
  onDeath?(): void;
}

// 生命组件配置接口
export interface LifeConfig {
  maxHp?: number;
  defer?: number;
  onDamage?: (damage: number) => void;
  onHeal?: (heal: number) => void;
  onDeath?: () => void;
}

// Mixin 工厂函数
export function createLifeMixin(config: LifeConfig = {}) {
  return class LifeMixin implements ILife {
    // 实现 ILife 接口
    @property
    public maxHp: number = config.maxHp ?? 100;
    @property
    public curHp: number = config.maxHp ?? 100;
    @property
    public defer: number = config.defer ?? 10;
    @property
    public preAttackHp: number = 0;

    get remainHp() {
      return this.curHp - this.preAttackHp;
    }

    preAttack(value: number) {
      const actualDamage = Math.max(0, value - this.defer);
      this.preAttackHp += actualDamage;
      config.onDamage?.(actualDamage);
    }

    onAttack(value: number) {
      const actualDamage = Math.max(0, value - this.defer);
      this.preAttackHp -= actualDamage;
      this.curHp -= actualDamage;

      if (this.curHp <= 0) {
        config.onDeath?.();
      }
    }

    onHeal(value: number) {
      const oldHp = this.curHp;
      this.curHp = Math.min(this.maxHp, this.curHp + value);
      config.onHeal?.(this.curHp - oldHp);
    }
  };
}

@ccclass("LifeComponent")
export class LifeComponent extends Component implements ILife {
  private lifeMixin: ILife;

  constructor() {
    super();
    const LifeMixinClass = createLifeMixin({
      onDamage: (damage) => this.handleDamage(damage),
      onDeath: () => this.handleDeath(),
    });
    this.lifeMixin = new LifeMixinClass();
  }

  // 代理所有 ILife 接口方法到 mixin 实例
  get maxHp() {
    return this.lifeMixin.maxHp;
  }
  set maxHp(value) {
    this.lifeMixin.maxHp = value;
  }

  get curHp() {
    return this.lifeMixin.curHp;
  }
  set curHp(value) {
    this.lifeMixin.curHp = value;
  }

  get defer() {
    return this.lifeMixin.defer;
  }
  set defer(value) {
    this.lifeMixin.defer = value;
  }

  get preAttackHp() {
    return this.lifeMixin.preAttackHp;
  }
  set preAttackHp(value) {
    this.lifeMixin.preAttackHp = value;
  }

  get remainHp() {
    return this.lifeMixin.remainHp;
  }

  preAttack(value: number) {
    this.lifeMixin.preAttack(value);
  }

  onAttack(value: number) {
    this.lifeMixin.onAttack(value);
  }

  private handleDamage(damage: number) {
    // 处理受伤效果
  }

  private handleDeath() {
    // 处理死亡效果
  }
}
