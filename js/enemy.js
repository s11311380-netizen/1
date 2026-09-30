/**
 * ==========================================================================
 * 障礙物與敵人生成暨碰撞管理模組 (enemy.js)
 * 包含仙人掌、飛行翼手龍等障礙物實體類別與生成回收、AABB 碰撞判定
 * ==========================================================================
 */

import { CONFIG } from './config.js';

/**
 * 障礙物基礎類別
 */
export class Obstacle {
    /**
     * @param {HTMLElement} domElement - 障礙物 DOM 節點
     * @param {number} initialX - 起始水平位置 (px)
     */
    constructor(domElement, initialX) {
        this.domElement = domElement;
        this.x = initialX;
        this.domElement.style.left = `${this.x}px`;
        this.isDestroyed = false;
    }

    /**
     * 每幀更新水平位置
     * @param {number} speed - 當前推進速度
     * @returns {number} 當前 X 座標
     */
    update(speed) {
        this.x -= speed;
        this.domElement.style.left = `${this.x}px`;
        return this.x;
    }

    /**
     * 取得幾何邊界
     * @returns {DOMRect}
     */
    getCollisionRect() {
        return this.domElement ? this.domElement.getBoundingClientRect() : null;
    }

    /**
     * 銷毀並自 DOM 移除
     */
    destroy() {
        this.isDestroyed = true;
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.remove();
        }
    }
}

/**
 * 仙人掌障礙物 (可為單支、雙支、或小型)
 */
export class CactusObstacle extends Obstacle {
    /**
     * 工廠方法：建立仙人掌實體
     * @param {HTMLElement} gameContainer - 舞台容器
     * @param {Object} [config=CONFIG] - 配置
     * @returns {CactusObstacle}
     */
    static create(gameContainer, config = CONFIG) {
        const group = document.createElement("div");
        group.className = "obstacle cactus-group";

        const count = Math.random() < config.OBSTACLES.DOUBLE_CACTUS_CHANCE ? 2 : 1;

        for (let i = 0; i < count; i++) {
            const cactus = document.createElement("div");
            cactus.className = "cactus";
            if (Math.random() < config.OBSTACLES.SMALL_CACTUS_CHANCE) {
                cactus.classList.add("small");
            }
            group.appendChild(cactus);
        }

        const startX = gameContainer.offsetWidth;
        gameContainer.appendChild(group);

        return new CactusObstacle(group, startX);
    }
}

/**
 * 飛行翼手龍障礙物 (鳥)
 */
export class BirdObstacle extends Obstacle {
    /**
     * 工廠方法：建立翼手龍實體
     * @param {HTMLElement} gameContainer - 舞台容器
     * @param {Object} [config=CONFIG] - 配置
     * @returns {BirdObstacle}
     */
    static create(gameContainer, config = CONFIG) {
        const bird = document.createElement("div");
        bird.className = "obstacle bird";

        const heights = config.OBSTACLES.BIRD_HEIGHTS;
        const chosenHeight = heights[Math.floor(Math.random() * heights.length)];
        bird.style.bottom = `${chosenHeight}px`;

        const startX = gameContainer.offsetWidth;
        gameContainer.appendChild(bird);

        return new BirdObstacle(bird, startX);
    }
}

/**
 * 幾何 AABB 碰撞檢測輔助
 */
export class CollisionDetector {
    /**
     * 檢測兩個矩形是否發生重疊，支援 padding 內縮補償
     * @param {DOMRect} rectA 實體 A 的邊界框
     * @param {Object} padA 實體 A 的內縮補償 {LEFT, RIGHT, TOP, BOTTOM}
     * @param {DOMRect} rectB 實體 B 的邊界框
     * @param {Object} padB 實體 B 的內縮補償 {LEFT, RIGHT, TOP, BOTTOM}
     * @returns {boolean}
     */
    static checkAABB(rectA, padA = {}, rectB, padB = {}) {
        if (!rectA || !rectB) return false;

        const aLeft   = rectA.left   + (padA.LEFT || 0);
        const aRight  = rectA.right  - (padA.RIGHT || 0);
        const aTop    = rectA.top    + (padA.TOP || 0);
        const aBottom = rectA.bottom - (padA.BOTTOM || 0);

        const bLeft   = rectB.left   + (padB.LEFT || 0);
        const bRight  = rectB.right  - (padB.RIGHT || 0);
        const bTop    = rectB.top    + (padB.TOP || 0);
        const bBottom = rectB.bottom - (padB.BOTTOM || 0);

        const horizontalCollision = aRight > bLeft && aLeft < bRight;
        const verticalCollision   = aBottom > bTop && aTop < bBottom;

        return horizontalCollision && verticalCollision;
    }
}

/**
 * 敵人與障礙物管理器
 */
export class EnemyManager {
    /**
     * @param {HTMLElement} gameContainer - 舞台 DOM 容器
     * @param {Object} [config=CONFIG] - 配置
     */
    constructor(gameContainer, config = CONFIG) {
        this.gameContainer = gameContainer;
        this.config = config;

        this.obstacles = [];
        this.spawnTimeout = null;
        this.isSpawning = false;
    }

    /**
     * 開始排程障礙物生成
     * @param {Function} getScoreFn - 取得目前分數的回呼函式
     */
    startSpawning(getScoreFn) {
        this.isSpawning = true;
        this._scheduleNextSpawn(getScoreFn);
    }

    /**
     * 停止生成障礙物
     */
    stopSpawning() {
        this.isSpawning = false;
        if (this.spawnTimeout) {
            clearTimeout(this.spawnTimeout);
            this.spawnTimeout = null;
        }
    }

    /**
     * 排程下一次障礙物生成
     * @param {Function} getScoreFn
     */
    _scheduleNextSpawn(getScoreFn) {
        if (!this.isSpawning) return;

        const score = typeof getScoreFn === "function" ? getScoreFn() : 0;
        const delay = Math.max(
            this.config.OBSTACLES.MIN_SPAWN_DELAY,
            this.config.OBSTACLES.BASE_SPAWN_DELAY - score * this.config.OBSTACLES.SPAWN_RATE_SCALE
        );

        this.spawnTimeout = setTimeout(() => {
            if (!this.isSpawning) return;
            this.spawn();
            this._scheduleNextSpawn(getScoreFn);
        }, delay);
    }

    /**
     * 產生單一障礙物 (仙人掌或飛行翼手龍)
     * @returns {Obstacle}
     */
    spawn() {
        const isBird = Math.random() < this.config.OBSTACLES.BIRD_SPAWN_CHANCE;
        let obstacle;

        if (isBird) {
            obstacle = BirdObstacle.create(this.gameContainer, this.config);
        } else {
            obstacle = CactusObstacle.create(this.gameContainer, this.config);
        }

        this.obstacles.push(obstacle);
        return obstacle;
    }

    /**
     * 更新所有障礙物位置並回收移出邊界者
     * @param {number} speed - 當前移動速度
     */
    update(speed) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const posX = obs.update(speed);

            // 障礙物移出畫面左側 (-150px) 予以銷毀回收
            if (posX < -150) {
                obs.destroy();
                this.obstacles.splice(i, 1);
            }
        }
    }

    /**
     * 檢測所有障礙物與玩家之碰撞
     * @param {DOMRect} playerRect - 玩家當前邊界矩形
     * @param {Object} [playerPad] - 玩家碰撞箱容錯補償
     * @returns {boolean} 是否發生碰撞
     */
    checkCollision(playerRect, playerPad = this.config.PLAYER.COLLISION_PADDING) {
        if (!playerRect) return false;

        const obsPad = this.config.OBSTACLES.COLLISION_PADDING;
        for (const obs of this.obstacles) {
            const obsRect = obs.getCollisionRect();
            if (CollisionDetector.checkAABB(playerRect, playerPad, obsRect, obsPad)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 清除當前所有障礙物並重設
     */
    clearAll() {
        this.stopSpawning();
        for (const obs of this.obstacles) {
            obs.destroy();
        }
        this.obstacles = [];

        // 清理殘留的 DOM 障礙物元素
        if (this.gameContainer) {
            const leftover = this.gameContainer.querySelectorAll(".obstacle");
            leftover.forEach(el => el.remove());
        }
    }
}

export default EnemyManager;
