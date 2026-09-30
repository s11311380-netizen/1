/**
 * ==========================================================================
 * 玩家角色控制與狀態模組 (player.js)
 * 封裝恐龍角色的狀態機（靜止、奔跑、跳躍、蹲下）、生命值與邊界碰撞計算
 * ==========================================================================
 */

import { CONFIG } from './config.js';

export class Player {
    /**
     * @param {HTMLElement} element - 恐龍角色的 DOM 元素
     * @param {Object} [config=CONFIG] - 遊戲參數配置
     */
    constructor(element, config = CONFIG) {
        this.element = element;
        this.config = config;

        this.isJumping = false;
        this.isDucking = false;
        this.isRunning = false;
        this.health = this.config.PLAYER.INITIAL_HEALTH;

        this._jumpTimeout = null;
    }

    /**
     * 啟動奔跑姿態 (雙腿踏步動畫)
     */
    startRunning() {
        this.isRunning = true;
        if (this.element) {
            this.element.classList.add("running");
        }
    }

    /**
     * 停止奔跑姿態
     */
    stopRunning() {
        this.isRunning = false;
        if (this.element) {
            this.element.classList.remove("running");
        }
    }

    /**
     * 觸發跳躍動作
     * @param {Function} [onJumpStart=null] 跳躍開始時的回呼函式 (例如播放音效)
     * @returns {boolean} 是否成功觸發跳躍
     */
    jump(onJumpStart = null) {
        if (this.isJumping || this.isDucking) {
            return false;
        }

        this.isJumping = true;
        if (this.element) {
            this.element.classList.add("jump");
        }

        if (typeof onJumpStart === "function") {
            onJumpStart();
        }

        clearTimeout(this._jumpTimeout);
        this._jumpTimeout = setTimeout(() => {
            if (this.element) {
                this.element.classList.remove("jump");
            }
            this.isJumping = false;
        }, this.config.PLAYER.JUMP_DURATION_MS);

        return true;
    }

    /**
     * 開始蹲下動作
     */
    duckStart() {
        if (this.isJumping || this.isDucking) {
            return;
        }
        this.isDucking = true;
        if (this.element) {
            this.element.classList.add("duck");
        }
    }

    /**
     * 結束蹲下動作
     */
    duckEnd() {
        this.isDucking = false;
        if (this.element) {
            this.element.classList.remove("duck");
        }
    }

    /**
     * 受到傷害
     * @param {number} amount 傷害量
     * @returns {number} 剩餘生命值
     */
    takeDamage(amount = 1) {
        this.health = Math.max(0, this.health - amount);
        return this.health;
    }

    /**
     * 判斷玩家是否存活
     * @returns {boolean}
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * 取得實體幾何碰撞邊界
     * @returns {DOMRect}
     */
    getCollisionRect() {
        return this.element ? this.element.getBoundingClientRect() : null;
    }

    /**
     * 重設玩家狀態
     */
    reset() {
        clearTimeout(this._jumpTimeout);
        this._jumpTimeout = null;
        this.isJumping = false;
        this.isDucking = false;
        this.isRunning = false;
        this.health = this.config.PLAYER.INITIAL_HEALTH;

        if (this.element) {
            this.element.classList.remove("jump", "duck", "running");
        }
    }
}

export default Player;
