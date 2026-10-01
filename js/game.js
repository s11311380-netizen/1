import CONFIG  from './config.js';
import { Player }      from './player.js';
import { EnemyManager } from './enemy.js';
import { AudioManager } from './audio.js';

export const STATE = {
    LOADING:   'LOADING',
    IDLE:      'IDLE',
    PLAYING:   'PLAYING',
    GAME_OVER: 'GAME_OVER',
};

export class Game {
    constructor() {
        this.startScreen  = document.getElementById('startScreen');
        this.gameOverEl   = document.getElementById('gameOver');
        this.scoreEl      = document.getElementById('score');
        this.highScoreEl  = document.getElementById('highScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.speedTextEl  = document.getElementById('speedText');
        this.restartBtn   = document.getElementById('restartBtn');
        this.nightModeBtn = document.getElementById('nightModeBtn');
        this.muteBtn      = document.getElementById('muteBtn');
        this.loadingScreen = document.getElementById('loadingScreen');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audioMgr = new AudioManager();
        this.player  = new Player();
        this.enemies = new EnemyManager(CONFIG.GAME_WIDTH);

        this.state     = STATE.LOADING;
        this.score     = 0;
        this.highScore = parseInt(localStorage.getItem(CONFIG.SCORE.HIGH_SCORE_KEY)) || 0;
        this.speed     = CONFIG.SPEED.INITIAL;
        this.isNight   = false;
        this.rafId     = null;
        
        this.bgX = 0;
        this.assets = {
            player: new Image(),
            bg: new Image()
        };

        this._updateScoreDisplay();
        this._bindEvents();
        this.loadAssets();
    }

    loadAssets() {
        let loaded = 0;
        const total = 2;
        const checkLoad = () => {
            loaded++;
            if (loaded >= total) {
                this.state = STATE.IDLE;
                this.loadingScreen.style.display = 'none';
                this.startScreen.style.display = 'flex';
                this._drawIdle();
            }
        };

        this.assets.player.onload = checkLoad;
        this.assets.player.onerror = checkLoad; // proceed even if error
        this.assets.player.src = './assets/images/player.png';

        this.assets.bg.onload = checkLoad;
        this.assets.bg.onerror = checkLoad; // proceed even if error
        this.assets.bg.src = './assets/images/background.png';
    }

    start() {
        if (this.state === STATE.PLAYING || this.state === STATE.LOADING) return;

        this.audioMgr.startBgm();

        this.state  = STATE.PLAYING;
        this.score  = 0;
        this.speed  = CONFIG.SPEED.INITIAL;

        this.player.reset();
        this.enemies.reset();

        this.startScreen.style.display  = 'none';
        this.gameOverEl.style.display   = 'none';

        this._loop();
    }

    toggleNight() {
        this.isNight = !this.isNight;
    }

    _drawIdle() {
        if (this.state !== STATE.IDLE) return;
        this._drawScene();
        requestAnimationFrame(() => this._drawIdle());
    }

    _drawScene() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.isNight) {
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw background scrolling
        if (this.assets.bg.complete && this.assets.bg.naturalWidth > 0) {
            const bgW = this.assets.bg.width || this.canvas.width;
            const bgH = this.canvas.height;
            // loop background
            this.ctx.drawImage(this.assets.bg, this.bgX, 0, bgW, bgH);
            this.ctx.drawImage(this.assets.bg, this.bgX + bgW, 0, bgW, bgH);
        }

        // Draw ground line
        this.ctx.strokeStyle = this.isNight ? '#fff' : '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - CONFIG.GROUND_Y);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - CONFIG.GROUND_Y);
        this.ctx.stroke();

        this.enemies.draw(this.ctx, this.canvas.height);
        this.player.draw(this.ctx, this.assets.player, this.canvas.height);
    }

    _loop() {
        if (this.state !== STATE.PLAYING) return;

        this.speed = Math.min(this.speed + CONFIG.SPEED.INCREMENT, CONFIG.SPEED.MAX);

        this.player.update();
        this.enemies.update(this.speed);

        if (this.assets.bg.complete && this.assets.bg.naturalWidth > 0) {
            const bgW = this.assets.bg.width;
            this.bgX -= this.speed * 0.5;
            if (this.bgX <= -bgW) {
                this.bgX = 0;
            }
        }

        if (this.enemies.checkCollision(this.player.getRect())) {
            this._endGame();
            return;
        }

        this.score += CONFIG.SCORE.INCREMENT_PER_FRAME;
        this._updateScoreDisplay();

        this._drawScene();

        this.rafId = requestAnimationFrame(() => this._loop());
    }

    _endGame() {
        this.state = STATE.GAME_OVER;
        cancelAnimationFrame(this.rafId);

        this.player.die();
        this._drawScene();

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem(CONFIG.SCORE.HIGH_SCORE_KEY, this.highScore);
        }

        const displayScore = String(Math.floor(this.score)).padStart(5, '0');
        this.finalScoreEl.textContent = displayScore;
        this._updateScoreDisplay();

        this.gameOverEl.style.display = 'flex';
    }

    _updateScoreDisplay() {
        this.scoreEl.textContent     = String(Math.floor(this.score)).padStart(5, '0');
        this.highScoreEl.textContent = String(this.highScore).padStart(5, '0');
        this.speedTextEl.textContent = ${(this.speed / CONFIG.SPEED.INITIAL).toFixed(1)}x;
    }

    _bindEvents() {
        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup',   e => this._onKeyUp(e));

        this.restartBtn.addEventListener('click', () => this.start());
        this.nightModeBtn.addEventListener('click', () => this.toggleNight());
        
        this.muteBtn.addEventListener('click', () => {
            const isMuted = this.audioMgr.toggleMute();
            this.muteBtn.textContent = isMuted ? '🔇 音效: 關' : '🔊 音效: 開';
            // Start BGM if first interaction was mute button
            if(!isMuted && !this.audioMgr.hasStartedBgm && this.state === STATE.PLAYING) {
                this.audioMgr.startBgm();
            }
        });

        document.addEventListener('touchstart', e => {
            if (e.target.tagName === 'BUTTON') return; // Allow button clicks
            e.preventDefault();
            if (this.state === STATE.IDLE || this.state === STATE.GAME_OVER) {
                this.start();
            } else if (this.state === STATE.PLAYING) {
                this.player.jump(this.audioMgr);
            }
        }, { passive: false });
    }

    _onKeyDown(e) {
        const key = e.code;
        if ((key === 'Space' || key === 'ArrowUp') && (this.state === STATE.IDLE || this.state === STATE.GAME_OVER)) {
            this.start();
            return;
        }

        if (this.state !== STATE.PLAYING) return;

        if (key === 'Space' || key === 'ArrowUp') {
            e.preventDefault();
            this.player.jump(this.audioMgr);
        }

        if (key === 'ArrowDown') {
            e.preventDefault();
            this.player.duck();
        }
        
        // Mirroring requirement
        if (key === 'ArrowLeft') {
            this.player.facingRight = false;
        }
        if (key === 'ArrowRight') {
            this.player.facingRight = true;
        }
    }

    _onKeyUp(e) {
        if (e.code === 'ArrowDown') {
            this.player.standUp();
        }
    }
}
