// =============================================
// enemy.js — 障礙物生成、移動與碰撞邏輯
// 職責：生成 DOM 障礙物、每 frame 推進、清除離屏元素
// =============================================

import CONFIG from './config.js';

/** 單一障礙物實體 */
class Obstacle {
    /**
     * @param {HTMLElement} gameEl   - #game 容器
     * @param {object}      typeDef  - CONFIG.OBSTACLE.TYPES 中的定義
     * @param {number}      gameWidth
     */
    constructor(gameEl, typeDef, gameWidth) {
        this.gameEl    = gameEl;
        this.typeDef   = typeDef;
        this.width     = typeDef.width;
        this.height    = typeDef.height;
        this.groundY   = CONFIG.GROUND_Y;

        // 初始 X 位置（從右側邊界外出現）
        this.x = gameWidth + 20;

        // 建立 DOM 元素
        this.el = document.createElement('div');
        this.el.className = typeDef.cssClass;
        this._applyStyle();
        gameEl.appendChild(this.el);
    }

    /** 每 frame 向左移動 */
    move(speed) {
        this.x -= speed;
        this._applyStyle();
    }

    /** 障礙物是否已完全離開左側 */
    isOffScreen() {
        return this.x + this.width < 0;
    }

    /** 從 DOM 移除 */
    destroy() {
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    /**
     * 取得碰撞矩形
     * @returns {{ left, right, top, bottom }}
     */
    getRect() {
        const margin = 5;
        const bottom = this.typeDef.flyingY
            ? this.typeDef.flyingBottom
            : this.groundY;
        return {
            left:   this.x + margin,
            right:  this.x + this.width - margin,
            top:    bottom,
            bottom: bottom + this.height,
        };
    }

    // ─── Private ──────────────────────────────────────────

    _applyStyle() {
        this.el.style.left   = `${this.x}px`;
        this.el.style.width  = `${this.width}px`;
        this.el.style.height = `${this.height}px`;
        if (this.typeDef.flyingY) {
            this.el.style.bottom = `${this.typeDef.flyingBottom}px`;
        }
    }
}

// ─────────────────────────────────────────────────────────
/** 障礙物管理器：負責生成時機、批次更新、碰撞偵測 */
export class EnemyManager {
    /**
     * @param {HTMLElement} gameEl
     * @param {number}      gameWidth
     */
    constructor(gameEl, gameWidth) {
        this.gameEl     = gameEl;
        this.gameWidth  = gameWidth;
        this.obstacles  = [];   // 當前存活的障礙物陣列
        this.framesTillNext = this._nextInterval();
    }

    /** 每 frame 更新（傳入當前速度） */
    update(speed) {
        // 計時生成
        this.framesTillNext--;
        if (this.framesTillNext <= 0) {
            this._spawnRandom();
            this.framesTillNext = this._nextInterval();
        }

        // 移動 & 清除
        this.obstacles = this.obstacles.filter(obs => {
            obs.move(speed);
            if (obs.isOffScreen()) {
                obs.destroy();
                return false;
            }
            return true;
        });
    }

    /**
     * 偵測玩家與所有障礙物的碰撞
     * @param {{ left, right, top, bottom }} playerRect
     * @returns {boolean} 是否碰撞
     */
    checkCollision(playerRect) {
        for (const obs of this.obstacles) {
            const r = obs.getRect();
            // AABB 碰撞
            if (
                playerRect.right  > r.left  &&
                playerRect.left   < r.right &&
                playerRect.bottom > r.top   &&
                playerRect.top    < r.bottom
            ) {
                return true;
            }
        }
        return false;
    }

    /** 清除所有障礙物（重新開始時呼叫） */
    reset() {
        this.obstacles.forEach(obs => obs.destroy());
        this.obstacles = [];
        this.framesTillNext = this._nextInterval();
    }

    // ─── Private ──────────────────────────────────────────

    _spawnRandom() {
        const types   = CONFIG.OBSTACLE.TYPES;
        const typeDef = types[Math.floor(Math.random() * types.length)];
        const obs = new Obstacle(this.gameEl, typeDef, this.gameWidth);
        this.obstacles.push(obs);
    }

    _nextInterval() {
        const { MIN_INTERVAL, MAX_INTERVAL } = CONFIG.OBSTACLE;
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    }
}
