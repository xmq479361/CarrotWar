import { _decorator, Component, Node, tween, Vec3, Sprite, resources, SpriteFrame } from 'cc';
import { MapManager } from '../Manager/MapManager';
import { EventManager, EventType } from '../Manager/EventManager';
import { DamageType } from '../Model/TowerModel';
const { ccclass, property } = _decorator;

@ccclass('BulletView')
export class BulletView extends Component {
    bulletConfig: BulletConfig = null!;
    targetCol: number = 0;
    targetRow: number = 0;
    targetNode: Node = null!;
    attack: number = 0;
    damageType: DamageType = DamageType.PHYSICAL;
    effects: any = null;
    // 子弹速度，单位：像素/秒
    speed: number = 500;
    
    @property(Sprite)
    bulletSprite: Sprite = null!;
    
    setup(targetCol: number, targetRow: number, bulletConfig: BulletConfig) {
        this.bulletConfig = bulletConfig;
        this.targetCol = targetCol;
        this.targetRow = targetRow;
        this.attack = bulletConfig.damage || 10;
        this.damageType = bulletConfig.damageType || DamageType.PHYSICAL;
        this.effects = bulletConfig.effects;
        this.speed = bulletConfig.speed || 500;
        
        // 加载子弹图片
        if (bulletConfig.spritePath) {
            resources.load(bulletConfig.spritePath, SpriteFrame, (err, spriteFrame) => {
                if (!err && this.bulletSprite) {
                    this.bulletSprite.spriteFrame = spriteFrame;
                }
            });
        }
    }
    
    // 设置目标节点（直接追踪怪物）
    setTargetNode(node: Node) {
        this.targetNode = node;
    }
    
    start() {
        this.moveBullet();
    }
    
    moveBullet() {
        if (this.targetNode && this.targetNode.isValid) {
            // 如果有目标节点，直接追踪目标
            const distance = Vec3.distance(this.node.position, this.targetNode.position);
            const duration = distance / this.speed;
            
            tween(this.node)
                .to(duration, { position: this.targetNode.position })
                .call(() => {
                    this.hitTarget();
                })
                .start();
        } else {
            // 否则飞向目标格子
            const targetPos = MapManager.Instance.getLocationVec3(this.targetCol, this.targetRow);
            const distance = Vec3.distance(this.node.position, targetPos);
            const duration = distance / this.speed;
            
            tween(this.node)
                .to(duration, { position: targetPos })
                .call(() => {
                    this.hitTarget();
                })
                .start();
        }
    }
    
    hitTarget() {
        // 发射命中事件
        if (this.targetNode && this.targetNode.isValid) {
    EventManager.Instance.emit(EventType.BulletHit, {
                targetNode: this.targetNode,
                damage: this.attack,
                damageType: this.damageType,
                effects: this.effects
            });
            
            // 播放命中特效
            this.playHitEffect();
        }
        
        // 销毁子弹
        this.onDismiss();
    }
    
    playHitEffect() {
        // 根据子弹类型播放不同的命中特效
        if (this.bulletConfig.hitEffectPath) {
            // 这里可以实现特效播放逻辑
            console.log("播放命中特效:", this.bulletConfig.hitEffectPath);
        }
    }

    onDismiss() {
        this.node.destroy();
    }
}

// 子弹配置接口
export interface BulletConfig {
    id: number;
    name: string;
    damage?: number;
    damageType?: DamageType;
    speed?: number;
    spritePath?: string;
    hitEffectPath?: string;
    effects?: {
        slow?: number;
        splash?: number;
        dot?: number;
        duration?: number;
    };
}

