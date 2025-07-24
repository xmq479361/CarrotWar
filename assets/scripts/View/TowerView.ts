import { _decorator, Component, Node, Prefab, instantiate, Vec3, Sprite, resources, SpriteFrame, UITransform } from 'cc';
import { TowerConfig, TowerLevelConfig } from '../Config/GameConfig';
import { TowerType, DamageType } from '../Model/TowerModel';
import { BulletView, BulletConfig } from './BulletView';
import { MapManager } from '../Manager/MapManager';
import { EventManager, EventType } from '../Manager/EventManager';
const { ccclass, property } = _decorator;

@ccclass('TowerView')
export class TowerView extends Component {
    @property(Sprite)
    towerSprite: Sprite = null!;
    
    @property(Node)
    rangeIndicator: Node = null!;
    
    @property(Prefab)
    bulletPrefab: Prefab = null!;
    
    private _towerConfig: TowerConfig = null!;
    private _currentLevel: number = 1;
    private _levelConfig: TowerLevelConfig = null!;
    private _row: number = 0;
    private _col: number = 0;
    private _attackTimer: number = 0;
    private _targetMonster: Node = null!;
    private _isAttacking: boolean = false;
    private _isPaused: boolean = false;
    
    onLoad() {
        // 初始隐藏攻击范围指示器
        if (this.rangeIndicator) {
            this.rangeIndicator.active = false;
        }
        
        // 注册事件
        EventManager.Instance.on(EventType.GamePause, this.onGamePause, this);
        EventManager.Instance.on(EventType.GameResume, this.onGameResume, this);
    }
    
    onDestroy() {
        // 取消事件监听
        EventManager.Instance.off(EventType.GamePause, this.onGamePause);
        EventManager.Instance.off(EventType.GameResume, this.onGameResume);
        this.unscheduleAllCallbacks();
    }
    
    setup(row: number, col: number, towerConfig: TowerConfig) {
        this._row = row;
        this._col = col;
        this._towerConfig = towerConfig;
        this._currentLevel = 1;
        this._levelConfig = towerConfig.levels[0];
        
        // 设置塔的位置
        this.node.position = MapManager.Instance.getLocationVec3(col, row);
        
        // 加载塔的图片
        this.updateTowerSprite();
        
        // 设置攻击范围
        this.updateRangeIndicator();
        
        // 开始攻击循环
        this.startAttacking();
    }
    
    updateTowerSprite() {
        if (this.towerSprite && this._levelConfig.spritePath) {
            resources.load(this._levelConfig.spritePath, SpriteFrame, (err, spriteFrame) => {
                if (!err) {
                    this.towerSprite.spriteFrame = spriteFrame;
                }
            });
        }
    }
    
    updateRangeIndicator() {
        if (this.rangeIndicator) {
            // 设置范围指示器大小
            const transform = this.rangeIndicator.getComponent(UITransform);
            if (transform) {
                const diameter = this._levelConfig.range * 2;
                transform.width = diameter;
                transform.height = diameter;
            }
        }
    }
    
    showRange(show: boolean) {
        if (this.rangeIndicator) {
            this.rangeIndicator.active = show;
        }
    }
    
    startAttacking() {
        if (this._isPaused) return;
        
        this._isAttacking = true;
        this.schedule(this.attackTick, 0.1);
    }
    
    stopAttacking() {
        this._isAttacking = false;
        this.unschedule(this.attackTick);
    }
    
    attackTick() {
        if (!this._isAttacking || this._isPaused) return;
        
        // 寻找目标
        if (!this._targetMonster || !this._targetMonster.isValid) {
            this._targetMonster = this.findTarget();
        }
        
        // 如果有目标，则攻击
        if (this._targetMonster) {
            this._attackTimer += 0.1;
            
            // 检查攻击间隔
            if (this._attackTimer >= 1 / this._levelConfig.attackSpeed) {
                this.attack();
                this._attackTimer = 0;
            }
        }
    }
    
    findTarget() {
        // 获取范围内的所有怪物
        const monsters = this.getMonstersInRange();
        
        // 根据策略选择目标（这里简单选择第一个）
        return monsters.length > 0 ? monsters[0] : null;
    }
    
    getMonstersInRange() {
        // 这里需要实现获取范围内怪物的逻辑
        // 可以通过事件系统或直接查询场景中的怪物节点
        
        // 示例实现：
        const monsters: Node[] = [];
        const monsterContainer = this.node.parent?.parent?.getChildByName('MonsterContainer');
        
        if (monsterContainer) {
            const towerPos = this.node.position;
            const range = this._levelConfig.range;
            
            monsterContainer.children.forEach(monster => {
                const distance = Vec3.distance(towerPos, monster.position);
                if (distance <= range) {
                    monsters.push(monster);
                }
            });
        }
        
        return monsters;
    }
    
    attack() {
        if (!this._targetMonster || !this._targetMonster.isValid) return;
        
        // 创建子弹
        const bullet = instantiate(this.bulletPrefab);
        const bulletView = bullet.getComponent(BulletView);
        
        if (bulletView) {
            // 设置子弹属性
            const bulletConfig: BulletConfig = {
                id: this._towerConfig.type,
                name: this._towerConfig.name + "子弹",
                damage: this._levelConfig.damage,
                damageType: this._towerConfig.damageType,
                speed: 500,
                spritePath: `bullets/${this._towerConfig.type}_bullet`,
                effects: this._levelConfig.effects
            };
            
            // 设置子弹位置
            bullet.position = this.node.position;
            
            // 设置子弹目标
            bulletView.setTargetNode(this._targetMonster);
            bulletView.setup(0, 0, bulletConfig);
            
            // 将子弹添加到场景
            this.node.parent.addChild(bullet);
        }
        
        // 播放攻击动画或音效
        this.playAttackEffect();
    }
    
    playAttackEffect() {
        // 这里可以实现攻击特效或音效
        console.log(`${this._towerConfig.name} 攻击!`);
    }
    
    upgrade() {
        if (this._currentLevel < this._towerConfig.levels.length) {
            this._currentLevel++;
            this._levelConfig = this._towerConfig.levels[this._currentLevel - 1];
            
            // 更新塔的外观和属性
            this.updateTowerSprite();
            this.updateRangeIndicator();
            
            return true;
        }
        return false;
    }
    
    onGamePause() {
        this._isPaused = true;
        this.stopAttacking();
    }
    
    onGameResume() {
        this._isPaused = false;
        this.startAttacking();
    }
    
    getTowerConfig() {
        return this._towerConfig;
    }
    
    getCurrentLevel() {
        return this._currentLevel;
    }
    
    getUpgradeCost() {
        return this._towerConfig.upgradeCost[this._currentLevel - 1] || 0;
    }
    
    getRecycleValue() {
        let totalCost = this._towerConfig.cost;
        for (let i = 0; i < this._currentLevel - 1; i++) {
            totalCost += this._towerConfig.upgradeCost[i];
        }
        return Math.floor(totalCost * this._towerConfig.recycleRate);
    }
}

