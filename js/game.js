// =============================================
// game.js — 遊戲主循環與狀態管理
// 狀態：IDLE（開始畫面）→ PLAYING（進行中）→ GAME_OVER
// =============================================

import CONFIG  from './config.js';
import { Player }      from './player.js';
import { EnemyManager } from './enemy.js';

// 遊戲狀態常數
export const STATE = {
    IDLE:      'IDLE',
    PLAYING:   'PLAYING',
    GAME_OVER: 'GAME_OVER',
};

export class Game {
    constructor() {
        // ── DOM 元素快取 ──────────────────────────────────
        this.gameEl       = document.getElementById('game');
        this.startScreen  = document.getElementById('startScreen');
        this.gameOverEl   = document.getElementById('gameOver');
        this.scoreEl      = document.getElementById('score');
        this.highScoreEl  = document.getElementById('highScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.speedTextEl  = document.getElementById('speedText');
        this.restartBtn   = document.getElementById('restartBtn');
        this.nightModeBtn = document.getElementById('nightModeBtn');

        // ── 遊戲物件 ──────────────────────────────────────
        this.player  = new Player(document.getElementById('dino'));
        this.enemies = new EnemyManager(this.gameEl, CONFIG.GAME_WIDTH);

        // ── 狀態 ──────────────────────────────────────────
        this.state     = STATE.IDLE;
        this.score     = 0;
        this.highScore = parseInt(localStorage.getItem(CONFIG.SCORE.HIGH_SCORE_KEY)) || 0;
        this.speed     = CONFIG.SPEED.INITIAL;
        this.isNight   = false;
        this.rafId     = null;   // requestAnimationFrame ID

        // 更新最高分顯示
        this._updateScoreDisplay();

        // ── 事件繫結 ──────────────────────────────────────
        this._bindEvents();
    }

    // ─── 公開方法 ─────────────────────────────────────────

    /** 啟動遊戲（從 IDLE 或 GAME_OVER → PLAYING） */
    start() {
        if (this.state === STATE.PLAYING) return;

        this.state  = STATE.PLAYING;
        this.score  = 0;
        this.speed  = CONFIG.SPEED.INITIAL;

        // 重置物件
        this.player.reset();
        this.enemies.reset();

        // 隱藏 UI 覆蓋層
        this.startScreen.style.display  = 'none';
        this.gameOverEl.style.display   = 'none';

        // 啟動迴圈
        this._loop();
    }

    /** 切換夜間模式 */
    toggleNight() {
        this.isNight = !this.isNight;
        this.gameEl.classList.toggle('night', this.isNight);
    }

    // ─── 私有：遊戲迴圈 ───────────────────────────────────

    _loop() {
        if (this.state !== STATE.PLAYING) return;

        // 1. 更新速度
        this.speed = Math.min(this.speed + CONFIG.SPEED.INCREMENT, CONFIG.SPEED.MAX);

        // 2. 更新玩家
        this.player.update();

        // 3. 更新障礙物
        this.enemies.update(this.speed);

        // 4. 碰撞偵測
        if (this.enemies.checkCollision(this.player.getRect())) {
            this._endGame();
            return;
        }

        // 5. 更新分數
        this.score += CONFIG.SCORE.INCREMENT_PER_FRAME;
        this._updateScoreDisplay();

        // 6. 自動夜間（可選）
        if (
            CONFIG.NIGHT_SCORE_THRESHOLD > 0 &&
            Math.floor(this.score) % CONFIG.NIGHT_SCORE_THRESHOLD === 0 &&
            Math.floor(this.score) > 0
        ) {
            // 每到達閾值倍數就切換一次
        }

        this.rafId = requestAnimationFrame(() => this._loop());
    }

    _endGame() {
        this.state = STATE.GAME_OVER;
        cancelAnimationFrame(this.rafId);

        this.player.die();

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem(CONFIG.SCORE.HIGH_SCORE_KEY, this.highScore);
        }

        // 顯示分數
        const displayScore = String(Math.floor(this.score)).padStart(5, '0');
        this.finalScoreEl.textContent = displayScore;
        this._updateScoreDisplay();

        // 顯示 Game Over 畫面
        this.gameOverEl.style.display = 'flex';
    }

    // ─── 私有：UI 更新 ────────────────────────────────────

    _updateScoreDisplay() {
        this.scoreEl.textContent     = String(Math.floor(this.score)).padStart(5, '0');
        this.highScoreEl.textContent = String(this.highScore).padStart(5, '0');
        this.speedTextEl.textContent = `${(this.speed / CONFIG.SPEED.INITIAL).toFixed(1)}x`;
    }

    // ─── 私有：事件 ──────────────────────────────────────

    _bindEvents() {
        // 鍵盤
        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup',   e => this._onKeyUp(e));

        // 重新開始按鈕
        this.restartBtn.addEventListener('click', () => this.start());

        // 夜間模式按鈕
        this.nightModeBtn.addEventListener('click', () => this.toggleNight());

        // 觸控支援（行動裝置）
        document.addEventListener('touchstart', e => {
            e.preventDefault();
            if (this.state !== STATE.PLAYING) {
                this.start();
            } else {
                this.player.jump();
            }
        }, { passive: false });
    }

    _onKeyDown(e) {
        const key = e.code;

        // 開始 / 重新開始
        if ((key === 'Space' || key === 'ArrowUp') && this.state !== STATE.PLAYING) {
            this.start();
            return;
        }

        if (this.state !== STATE.PLAYING) return;

        if (key === 'Space' || key === 'ArrowUp') {
            e.preventDefault();
            this.player.jump();
        }

        if (key === 'ArrowDown') {
            e.preventDefault();
            this.player.duck();
        }
    }

    _onKeyUp(e) {
        if (e.code === 'ArrowDown') {
            this.player.standUp();
        }
    }
}
