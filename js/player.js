// =============================================
// player.js — 玩家角色控制與狀態
// 負責：跳躍物理、蹲下、動畫狀態切換
// =============================================

import CONFIG from './config.js';

export class Player {
    /**
     * @param {HTMLElement} dinoEl - DOM 上的 #dino 元素
     */
    constructor(dinoEl) {
        this.el = dinoEl;

        // 物理狀態
        this.velocityY   = 0;
        this.isOnGround  = true;
        this.isJumping   = false;
        this.isDucking   = false;
        this.isDead      = false;

        // 預先快取設定
        this.cfg    = CONFIG.PLAYER;
        this.groundY = CONFIG.GROUND_Y;   // 地面 bottom offset

        // 初始位置
        this._baseBottom = this.groundY;  // 站立時的 bottom（px）
        this.bottom      = this._baseBottom;
        this._applyPosition();
    }

    // ─── Public API ───────────────────────────────────────

    /** 觸發跳躍（已在地面才生效） */
    jump() {
        if (!this.isOnGround || this.isDead) return;
        this.velocityY  = this.cfg.JUMP_FORCE;
        this.isOnGround = false;
        this.isJumping  = true;
        this.el.classList.add('jumping');
        this.el.classList.remove('ducking');
        this.isDucking = false;
        this._applySize();
    }

    /** 開始蹲下 */
    duck() {
        if (this.isDead) return;
        if (!this.isOnGround) return;   // 空中無法蹲下
        this.isDucking = true;
        this.el.classList.add('ducking');
        this._applySize();
    }

    /** 停止蹲下 */
    standUp() {
        if (!this.isDucking) return;
        this.isDucking = false;
        this.el.classList.remove('ducking');
        this._applySize();
    }

    /** 每 frame 更新（由 game.js 呼叫） */
    update() {
        if (this.isDead) return;
        this._applyGravity();
    }

    /** 標記玩家死亡 */
    die() {
        this.isDead = true;
        this.el.classList.add('dead');
        this.el.classList.remove('jumping', 'ducking');
    }

    /** 重置玩家到初始狀態 */
    reset() {
        this.velocityY   = 0;
        this.isOnGround  = true;
        this.isJumping   = false;
        this.isDucking   = false;
        this.isDead      = false;
        this.bottom      = this._baseBottom;
        this.el.className = '';
        this._applySize();
        this._applyPosition();
    }

    /**
     * 取得碰撞用的矩形（相對於 #game）
     * @returns {{ left: number, right: number, top: number, bottom: number }}
     */
    getRect() {
        const margin = this.isDucking ? 5 : 8;   // 留一點容錯邊距
        const w  = this.isDucking ? this.cfg.DUCK_WIDTH  : this.cfg.WIDTH;
        const h  = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const l  = this.cfg.START_LEFT + margin;
        const b  = this.bottom;
        return {
            left:   l,
            right:  l + w - margin * 2,
            bottom: b + h,
            top:    b,
        };
    }

    // ─── Private Helpers ──────────────────────────────────

    _applyGravity() {
        if (this.isOnGround) return;

        this.velocityY += this.cfg.GRAVITY;
        if (this.velocityY > this.cfg.MAX_FALL) {
            this.velocityY = this.cfg.MAX_FALL;
        }

        this.bottom -= this.velocityY;  // velocityY 負值時 bottom 增大（上升）

        if (this.bottom <= this._baseBottom) {
            this.bottom     = this._baseBottom;
            this.velocityY  = 0;
            this.isOnGround = true;
            this.isJumping  = false;
            this.el.classList.remove('jumping');
        }

        this._applyPosition();
    }

    _applyPosition() {
        this.el.style.bottom = `${this.bottom}px`;
    }

    _applySize() {
        if (this.isDucking) {
            this.el.style.width  = `${this.cfg.DUCK_WIDTH}px`;
            this.el.style.height = `${this.cfg.DUCK_HEIGHT}px`;
        } else {
            this.el.style.width  = `${this.cfg.WIDTH}px`;
            this.el.style.height = `${this.cfg.HEIGHT}px`;
        }
    }
}
