/**
 * ==========================================================================
 * 遊戲主循環與狀態管理模組 (game.js)
 * 整合玩家、敵人、輸入、計分、音效與 HUD 介面，提供完整的有限狀態機
 * ==========================================================================
 */

import { CONFIG } from './config.js';
import { Player } from './player.js';
import { EnemyManager } from './enemy.js';

export const GAME_STATE = {
    READY: "READY",
    RUNNING: "RUNNING",
    GAMEOVER: "GAMEOVER"
};

/**
 * 8-bit 音效引擎
 * 優先以 Web Audio API 即時合成（零外部依賴、零延遲、離線可用），
 * 同時備援 ./assets/audio/ 音效檔案播放，確保各式環境相容性
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;

        // 載入本地相對路徑備援音檔
        try {
            this.wavJump = new Audio("./assets/audio/jump.wav");
            this.wavHit = new Audio("./assets/audio/hit.wav");
            this.wavScore = new Audio("./assets/audio/score.wav");
        } catch (e) {
            this.wavJump = null;
            this.wavHit = null;
            this.wavScore = null;
        }
    }

    _init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    playJump() {
        if (!this.enabled) return;
        this._init();

        if (this.ctx) {
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = "square";
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.12);
                return;
            } catch (e) {
                // 若合成失敗則降級到音檔
            }
        }

        if (this.wavJump) {
            this.wavJump.currentTime = 0;
            this.wavJump.play().catch(() => {});
        }
    }

    playMilestone() {
        if (!this.enabled) return;
        this._init();

        if (this.ctx) {
            try {
                const now = this.ctx.currentTime;

                // 音符 1: B5 (987.77 Hz)
                const osc1 = this.ctx.createOscillator();
                const gain1 = this.ctx.createGain();
                osc1.type = "sine";
                osc1.frequency.setValueAtTime(987.77, now);
                gain1.gain.setValueAtTime(0.18, now);
                gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc1.connect(gain1);
                gain1.connect(this.ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.1);

                // 音符 2: E6 (1318.51 Hz)
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(1318.51, now + 0.1);
                gain2.gain.setValueAtTime(0.18, now + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                osc2.start(now + 0.1);
                osc2.stop(now + 0.22);
                return;
            } catch (e) {
                // 降級處理
            }
        }

        if (this.wavScore) {
            this.wavScore.currentTime = 0;
            this.wavScore.play().catch(() => {});
        }
    }

    playHit() {
        if (!this.enabled) return;
        this._init();

        if (this.ctx) {
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.25);
                return;
            } catch (e) {
                // 降級處理
            }
        }

        if (this.wavHit) {
            this.wavHit.currentTime = 0;
            this.wavHit.play().catch(() => {});
        }
    }
}

/**
 * 遊戲主控制器類別
 */
export class Game {
    /**
     * @param {Object} [config=CONFIG] 遊戲常數配置
     */
    constructor(config = CONFIG) {
        this.config = config;
        this.state = GAME_STATE.READY;

        // 快取核心 DOM 元素
        this.gameElement = document.getElementById("game");
        this.dinoElement = document.getElementById("dino");
        this.scoreElement = document.getElementById("score");
        this.highScoreElement = document.getElementById("highScore");
        this.finalScoreElement = document.getElementById("finalScore");
        this.startScreen = document.getElementById("startScreen");
        this.gameOverScreen = document.getElementById("gameOver");
        this.speedTextElement = document.getElementById("speedText");

        // 初始化子模組
        this.sound = new SoundEngine();
        this.player = new Player(this.dinoElement, this.config);
        this.enemyManager = new EnemyManager(this.gameElement, this.config);

        // 分數與速度狀態
        this.score = 0;
        this.highScore = this._loadHighScore();
        this.currentSpeed = this.config.GAME.BASE_SPEED;

        // 定時器參考
        this.gameLoopTimer = null;
        this.scoreTimer = null;

        // 綁定輸入監聽
        this._bindInputs();

        // 渲染初始 HUD
        this._updateScoreHUD();
        this._updateHighScoreHUD();
        this._updateSpeedHUD(1.0);
    }

    /**
     * 讀取最高分紀錄
     */
    _loadHighScore() {
        try {
            return Number(localStorage.getItem(this.config.STORAGE.HIGH_SCORE_KEY)) || 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * 儲存最高分紀錄
     */
    _saveHighScore(newHigh) {
        try {
            localStorage.setItem(this.config.STORAGE.HIGH_SCORE_KEY, newHigh);
        } catch (e) {
            console.warn("無法寫入 localStorage:", e);
        }
    }

    /**
     * 5 位數補零格式化
     */
    _formatScore(num) {
        return String(num).padStart(5, "0");
    }

    _updateScoreHUD() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this._formatScore(this.score);
        }
    }

    _updateHighScoreHUD() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this._formatScore(this.highScore);
        }
    }

    _updateSpeedHUD(multiplier) {
        if (this.speedTextElement) {
            this.speedTextElement.textContent = `${multiplier.toFixed(1)}x`;
        }
    }

    /**
     * 輸入事件綁定 (鍵盤、滑鼠、觸控)
     */
    _bindInputs() {
        // 鍵盤按下
        document.addEventListener("keydown", (e) => {
            // 跳躍：Space 或 ArrowUp
            if (e.code === "Space" || e.code === "ArrowUp") {
                e.preventDefault();
                this.handleJump();
            }

            // 蹲下：ArrowDown
            if (e.code === "ArrowDown") {
                e.preventDefault();
                if (this.state === GAME_STATE.RUNNING) {
                    this.player.duckStart();
                }
            }

            // 重新開始 / 開始：Enter
            if (e.code === "Enter") {
                if (this.state === GAME_STATE.READY) {
                    this.start();
                } else if (this.state === GAME_STATE.GAMEOVER) {
                    this.restart();
                }
            }
        });

        // 鍵盤放開 (取消蹲下)
        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowDown") {
                this.player.duckEnd();
            }
        });

        // 點擊遊戲畫面或觸控
        if (this.gameElement) {
            this.gameElement.addEventListener("mousedown", (e) => {
                // 若點擊的是按鈕則不重複觸發
                if (e.target.tagName === "BUTTON") return;
                this.handleJump();
            });

            this.gameElement.addEventListener("touchstart", (e) => {
                if (e.target.tagName === "BUTTON") return;
                e.preventDefault();
                this.handleJump();
            }, { passive: false });
        }
    }

    /**
     * 處理跳躍與開始動作
     */
    handleJump() {
        if (this.state === GAME_STATE.READY) {
            this.start();
        } else if (this.state === GAME_STATE.GAMEOVER) {
            this.restart();
        } else if (this.state === GAME_STATE.RUNNING) {
            this.player.jump(() => {
                this.sound.playJump();
            });
        }
    }

    /**
     * 開始遊戲
     */
    start() {
        if (this.state === GAME_STATE.RUNNING) return;

        this.state = GAME_STATE.RUNNING;

        // 隱藏開始與結束畫面
        if (this.startScreen) this.startScreen.style.display = "none";
        if (this.gameOverScreen) this.gameOverScreen.style.display = "none";

        // 玩家開始奔跑
        this.player.reset();
        this.player.startRunning();

        // 重設計分與速度
        this.score = 0;
        this.currentSpeed = this.config.GAME.BASE_SPEED;
        this._updateScoreHUD();
        this._updateSpeedHUD(1.0);

        // 啟動計分計時器
        this._startScoring();

        // 稍微等待 1 秒後開始生成障礙物，讓玩家有起跑緩衝
        setTimeout(() => {
            if (this.state === GAME_STATE.RUNNING) {
                this.enemyManager.startSpawning(() => this.score);
            }
        }, 1000);

        // 啟動主更新循環
        this._startGameLoop();
    }

    /**
     * 計分定時器
     */
    _startScoring() {
        this._stopScoring();
        this.scoreTimer = setInterval(() => {
            if (this.state !== GAME_STATE.RUNNING) return;

            this.score++;
            this._updateScoreHUD();

            // 每到達速度提升間隔 (例如 100 分)
            if (this.score % this.config.GAME.SPEED_INCREMENT_INTERVAL === 0) {
                this.sound.playMilestone();

                // 動態提升速度
                const increments = Math.floor(this.score / this.config.GAME.SPEED_INCREMENT_INTERVAL);
                this.currentSpeed = this.config.GAME.BASE_SPEED + increments * this.config.GAME.SPEED_INCREMENT_AMOUNT;
                const multiplier = this.currentSpeed / this.config.GAME.BASE_SPEED;
                this._updateSpeedHUD(multiplier);
            }
        }, this.config.GAME.SCORE_INTERVAL_MS);
    }

    _stopScoring() {
        if (this.scoreTimer) {
            clearInterval(this.scoreTimer);
            this.scoreTimer = null;
        }
    }

    /**
     * 主物理與碰撞循環 (50 FPS)
     */
    _startGameLoop() {
        this._stopGameLoop();
        this.gameLoopTimer = setInterval(() => {
            if (this.state !== GAME_STATE.RUNNING) return;

            // 1. 移動並推進障礙物
            this.enemyManager.update(this.currentSpeed);

            // 2. 檢測碰撞
            const playerRect = this.player.getCollisionRect();
            const isHit = this.enemyManager.checkCollision(
                playerRect,
                this.config.PLAYER.COLLISION_PADDING
            );

            if (isHit) {
                this.player.takeDamage(1);
                if (!this.player.isAlive()) {
                    this.gameOver();
                }
            }
        }, this.config.GAME.TICK_INTERVAL_MS);
    }

    _stopGameLoop() {
        if (this.gameLoopTimer) {
            clearInterval(this.gameLoopTimer);
            this.gameLoopTimer = null;
        }
    }

    /**
     * 遊戲結束判定與畫面呈現
     */
    gameOver() {
        if (this.state !== GAME_STATE.RUNNING) return;

        this.state = GAME_STATE.GAMEOVER;
        this._stopGameLoop();
        this._stopScoring();

        // 播放撞擊音效與停止動作
        this.sound.playHit();
        this.player.stopRunning();
        this.enemyManager.stopSpawning();

        // 更新最高分數
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this._saveHighScore(this.highScore);
            this._updateHighScoreHUD();
        }

        // 顯示 Game Over 覆蓋層
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = this._formatScore(this.score);
        }
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = "flex";
        }
    }

    /**
     * 重新開始遊戲
     */
    restart() {
        this._stopGameLoop();
        this._stopScoring();
        this.enemyManager.clearAll();
        this.player.reset();
        this.state = GAME_STATE.READY;

        this.start();
    }

    /**
     * 切換日夜模式
     */
    toggleNight() {
        document.body.classList.toggle("night");
    }
}

export default Game;
