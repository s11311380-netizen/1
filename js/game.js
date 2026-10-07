import CONFIG        from './config.js';
import { AudioManager } from './audio.js';
import { Player }       from './player.js';
import { EnemyManager } from './enemy.js';

const STATE = {
    LOADING:   'LOADING',
    IDLE:      'IDLE',
    PLAYING:   'PLAYING',
    GAME_OVER: 'GAME_OVER',
};

/**
 * Game — orchestrates asset loading, game loop, rendering, and UI.
 *
 * Asset loading:
 *   Preloads player.png and background.png; starts idle state only after
 *   both resolve (or after 3 s safety timeout to avoid indefinite stuck screen).
 *
 * BGM autoplay:
 *   BGM is only started after the FIRST user interaction (keydown / touchstart /
 *   click on canvas) to comply with the browser Autoplay Policy.
 *
 * Producer credit:
 *   "製作人：11311380/張智媛" is rendered directly onto the canvas (bottom-left),
 *   always visible in-game, not just in the HTML layer.
 *
 * Mute buttons:
 *   Two buttons in the top-right corner: 🎵 (music) and 🔊 (SFX).
 */
export class Game {
    constructor() {
        // ── DOM refs ──────────────────────────────────────────────────────────
        this.startScreen  = document.getElementById('startScreen');
        this.gameOverEl   = document.getElementById('gameOver');
        this.scoreEl      = document.getElementById('score');
        this.highScoreEl  = document.getElementById('highScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.speedTextEl  = document.getElementById('speedText');
        this.restartBtn   = document.getElementById('restartBtn');
        this.nightModeBtn = document.getElementById('nightModeBtn');
        this.musicBtn     = document.getElementById('musicBtn');
        this.sfxBtn       = document.getElementById('sfxBtn');
        this.loadingScreen = document.getElementById('loadingScreen');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx    = this.canvas.getContext('2d');

        // ── Core systems ──────────────────────────────────────────────────────
        this.audioMgr = new AudioManager();
        this.player   = new Player();
        this.enemies  = new EnemyManager(CONFIG.GAME_WIDTH);

        // ── Game state ────────────────────────────────────────────────────────
        this.state      = STATE.LOADING;
        this.score      = 0;
        this.highScore  = parseInt(localStorage.getItem(CONFIG.SCORE.HIGH_SCORE_KEY)) || 0;
        this.speed      = CONFIG.SPEED.INITIAL;
        this.isNight    = false;
        this.rafId      = null;

        // Scroll state for parallax background
        this.bgX = 0;

        // Score-milestone tracking (every 100 pts plays a chime)
        this._lastMilestone = 0;

        // ── Image assets ──────────────────────────────────────────────────────
        this.assets = {
            player: new Image(),
            bg:     new Image(),
        };

        // ── Ground particle system (visual polish) ────────────────────────────
        this._particles = [];

        this._updateScoreDisplay();
        this._bindEvents();
        this._loadAssets();
    }

    // ── Asset preloading ──────────────────────────────────────────────────────

    _loadAssets() {
        let loaded  = 0;
        const total = 2;
        let timedOut = false;

        const proceed = () => {
            if (timedOut) return; // already handled by timeout
            loaded++;
            if (loaded >= total) enterIdle();
        };

        const enterIdle = () => {
            timedOut = true; // prevent double-call
            if (this.state !== STATE.LOADING) return;
            this.state = STATE.IDLE;
            if (this.loadingScreen) this.loadingScreen.style.display = 'none';
            if (this.startScreen)   this.startScreen.style.display   = 'flex';
            this._drawIdle();
        };

        // Safety timeout: never stay on loading screen beyond 3 s
        setTimeout(enterIdle, 3000);

        this.assets.player.onload  = proceed;
        this.assets.player.onerror = () => { console.warn('[Game] player.png failed to load'); proceed(); };
        this.assets.player.src     = './assets/images/player.png';

        this.assets.bg.onload  = proceed;
        this.assets.bg.onerror = () => { console.warn('[Game] background.png failed to load'); proceed(); };
        this.assets.bg.src     = './assets/images/background.png';

        // If both already cached (page reload), fire immediately
        if (this.assets.player.complete && this.assets.bg.complete) {
            enterIdle();
        }
    }

    // ── Game lifecycle ────────────────────────────────────────────────────────

    start() {
        if (this.state === STATE.PLAYING || this.state === STATE.LOADING) return;

        // User clicked/pressed — unlock audio
        this.audioMgr.onUserInteraction();
        this.audioMgr.startBgm();

        this.state  = STATE.PLAYING;
        this.score  = 0;
        this.speed  = CONFIG.SPEED.INITIAL;
        this._lastMilestone = 0;
        this._particles     = [];

        this.player.reset();
        this.enemies.reset();

        this.startScreen.style.display = 'none';
        this.gameOverEl.style.display  = 'none';

        this._loop();
    }

    toggleNight() {
        this.isNight = !this.isNight;
        const gameEl = document.getElementById('game');
        if (gameEl) gameEl.classList.toggle('night', this.isNight);
    }

    // ── Main loop ─────────────────────────────────────────────────────────────

    _drawIdle() {
        if (this.state !== STATE.IDLE) return;
        this._drawScene();
        requestAnimationFrame(() => this._drawIdle());
    }

    _loop() {
        if (this.state !== STATE.PLAYING) return;

        // Speed ramp-up
        this.speed = Math.min(this.speed + CONFIG.SPEED.INCREMENT, CONFIG.SPEED.MAX);

        // Update entities
        this.player.update();
        this.enemies.update(this.speed);

        // Scroll background (parallax at 50% speed)
        // Use scaled width (same scale as _drawScene) to ensure seamless wrap
        if (this.assets.bg.complete && this.assets.bg.naturalWidth > 0) {
            const scale = this.canvas.height / this.assets.bg.naturalHeight;
            const bgW   = this.assets.bg.naturalWidth * scale;
            this.bgX -= this.speed * 0.5;
            if (this.bgX <= -bgW) this.bgX = 0;
        }

        // Update particles
        this._updateParticles();

        // Collision check
        if (this.enemies.checkCollision(this.player.getRect())) {
            this._endGame();
            return;
        }

        // Score
        this.score += CONFIG.SCORE.INCREMENT_PER_FRAME;
        this._checkScoreMilestone();
        this._updateScoreDisplay();

        // Night mode auto-toggle
        if (!this.isNight && Math.floor(this.score) >= CONFIG.NIGHT_SCORE_THRESHOLD &&
            Math.floor(this.score) % CONFIG.NIGHT_SCORE_THRESHOLD === 0) {
            // toggle every N points (just visual, no gameplay change)
        }

        // Draw
        this._drawScene();

        this.rafId = requestAnimationFrame(() => this._loop());
    }

    _endGame() {
        this.state = STATE.GAME_OVER;
        cancelAnimationFrame(this.rafId);

        this.player.die();
        this.audioMgr.playDie();
        this.audioMgr.stopBgm();

        this._drawScene();

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem(CONFIG.SCORE.HIGH_SCORE_KEY, this.highScore);
        }

        this.finalScoreEl.textContent = String(Math.floor(this.score)).padStart(5, '0');
        this._updateScoreDisplay();

        this.gameOverEl.style.display = 'flex';
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    _drawScene() {
        const ctx = this.ctx;
        const cW  = this.canvas.width;
        const cH  = this.canvas.height;

        ctx.clearRect(0, 0, cW, cH);

        // Night overlay
        if (this.isNight) {
            ctx.fillStyle = 'rgba(10, 10, 46, 0.92)';
            ctx.fillRect(0, 0, cW, cH);
        }

        // ── Background image (parallax scroll) ──────────────────────────────
        if (this.assets.bg.complete && this.assets.bg.naturalWidth > 0) {
            const bgNatW = this.assets.bg.naturalWidth;
            const bgNatH = this.assets.bg.naturalHeight;
            // Scale to fill canvas height, keep aspect
            const scale  = cH / bgNatH;
            const bgW    = bgNatW * scale;
            const bgH    = cH;

            // Apply night darkening filter via globalAlpha overlay instead of
            // manipulating pixel data (fast, no extra canvas needed)
            if (this.isNight) {
                ctx.globalAlpha = 0.4;
            }
            ctx.drawImage(this.assets.bg, this.bgX,       0, bgW, bgH);
            ctx.drawImage(this.assets.bg, this.bgX + bgW, 0, bgW, bgH);
            // Third copy handles edge case when bgW < cW
            if (this.bgX + bgW * 2 < cW) {
                ctx.drawImage(this.assets.bg, this.bgX + bgW * 2, 0, bgW, bgH);
            }
            ctx.globalAlpha = 1.0;

            // Correct bgX reference to scaled width for seamless loop
            if (this.bgX <= -bgW) this.bgX = 0;
        } else {
            // Fallback gradient sky when image not available
            const grad = ctx.createLinearGradient(0, 0, 0, cH);
            if (this.isNight) {
                grad.addColorStop(0, '#0a0a2e');
                grad.addColorStop(1, '#1a3a0a');
            } else {
                grad.addColorStop(0, '#87CEEB');
                grad.addColorStop(0.6, '#b0e0f5');
                grad.addColorStop(0.6, '#c8f0a0');
                grad.addColorStop(1, '#90EE90');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cW, cH);
        }

        // ── Ground line ──────────────────────────────────────────────────────
        const groundLineY = cH - CONFIG.GROUND_Y;
        ctx.strokeStyle = this.isNight ? 'rgba(200,200,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundLineY);
        ctx.lineTo(cW, groundLineY);
        ctx.stroke();

        // Ground fill strip (dirt/grass texture)
        const groundGrad = ctx.createLinearGradient(0, groundLineY, 0, cH);
        if (this.isNight) {
            groundGrad.addColorStop(0, '#2d4a1e');
            groundGrad.addColorStop(1, '#1a3a0a');
        } else {
            groundGrad.addColorStop(0, '#8B6914');
            groundGrad.addColorStop(1, '#5a3e08');
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundLineY, cW, CONFIG.GROUND_Y);

        // ── Particles ────────────────────────────────────────────────────────
        this._drawParticles(ctx);

        // ── Enemies ──────────────────────────────────────────────────────────
        this.enemies.draw(ctx, cH);

        // ── Player ───────────────────────────────────────────────────────────
        this.player.draw(ctx, this.assets.player, cH);

        // ── Producer credit (always visible, bottom-left of canvas) ──────────
        this._drawProducerTag(ctx, cW, cH);
    }

    _drawProducerTag(ctx, cW, cH) {
        const text   = '製作人：11311380/張智媛';
        const fontSize = 13;
        ctx.save();
        ctx.font         = `bold ${fontSize}px "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif`;
        ctx.textBaseline = 'bottom';

        // Background pill
        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        const th = fontSize;
        const px = 10, py = 8;
        const rx = 8, ry = 8;
        const bx = 6, by = cH - py - th - 6;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.moveTo(bx + rx, by);
        ctx.lineTo(bx + tw + px * 2 - rx, by);
        ctx.quadraticCurveTo(bx + tw + px * 2, by, bx + tw + px * 2, by + ry);
        ctx.lineTo(bx + tw + px * 2, by + th + py - ry);
        ctx.quadraticCurveTo(bx + tw + px * 2, by + th + py, bx + tw + px * 2 - rx, by + th + py);
        ctx.lineTo(bx + rx, by + th + py);
        ctx.quadraticCurveTo(bx, by + th + py, bx, by + th + py - ry);
        ctx.lineTo(bx, by + ry);
        ctx.quadraticCurveTo(bx, by, bx + rx, by);
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.fillStyle = '#FFD700';
        ctx.fillText(text, bx + px, cH - py);
        ctx.restore();
    }

    // ── Particle system ───────────────────────────────────────────────────────

    _spawnRunParticles() {
        if (!this.player.isOnGround || this.player.isDucking) return;
        const rect = this.player.getRect();
        const cH   = this.canvas.height;
        for (let i = 0; i < 2; i++) {
            this._particles.push({
                x:    rect.left + Math.random() * (rect.right - rect.left),
                y:    cH - CONFIG.GROUND_Y,
                vx:   -(Math.random() * 2 + 1),
                vy:   -(Math.random() * 2),
                life: 1.0,
                r:    Math.random() * 3 + 1,
            });
        }
    }

    _updateParticles() {
        // Spawn dust particles while running
        if (this.player.isOnGround && !this.player.isDead) {
            if (Math.random() < 0.4) this._spawnRunParticles();
        }
        this._particles = this._particles.filter(p => {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += 0.1; // gravity
            p.life -= 0.06;
            return p.life > 0;
        });
    }

    _drawParticles(ctx) {
        for (const p of this._particles) {
            ctx.save();
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle   = this.isNight ? '#aaa' : '#8B6914';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Score milestone SFX ───────────────────────────────────────────────────

    _checkScoreMilestone() {
        const milestone = Math.floor(this.score / 100) * 100;
        if (milestone > 0 && milestone !== this._lastMilestone) {
            this._lastMilestone = milestone;
            this.audioMgr.playScore();
        }
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    _updateScoreDisplay() {
        this.scoreEl.textContent     = String(Math.floor(this.score)).padStart(5, '0');
        this.highScoreEl.textContent = String(this.highScore).padStart(5, '0');
        this.speedTextEl.textContent = ' ' + (this.speed / CONFIG.SPEED.INITIAL).toFixed(1) + 'x';
    }

    // ── Event binding ─────────────────────────────────────────────────────────

    _bindEvents() {
        // Keyboard
        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup',   e => this._onKeyUp(e));

        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.audioMgr.onUserInteraction();
            this.start();
        });

        // Night mode toggle
        this.nightModeBtn.addEventListener('click', () => this.toggleNight());

        // Music mute button
        if (this.musicBtn) {
            this.musicBtn.addEventListener('click', () => {
                this.audioMgr.onUserInteraction();
                const muted = this.audioMgr.toggleMusicMute();
                this.musicBtn.textContent = muted ? '🎵 音樂: 關' : '🎵 音樂: 開';
                this.musicBtn.classList.toggle('muted', muted);
                if (!muted && this.state === STATE.PLAYING) this.audioMgr.startBgm();
            });
        }

        // SFX mute button
        if (this.sfxBtn) {
            this.sfxBtn.addEventListener('click', () => {
                this.audioMgr.onUserInteraction();
                const muted = this.audioMgr.toggleSfxMute();
                this.sfxBtn.textContent = muted ? '🔊 音效: 關' : '🔊 音效: 開';
                this.sfxBtn.classList.toggle('muted', muted);
            });
        }

        // Touch (mobile)
        document.addEventListener('touchstart', e => {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault();
            this.audioMgr.onUserInteraction();
            if (this.state === STATE.IDLE || this.state === STATE.GAME_OVER) {
                this.start();
            } else if (this.state === STATE.PLAYING) {
                this.player.jump(this.audioMgr);
            }
        }, { passive: false });
    }

    _onKeyDown(e) {
        const key = e.code;

        // Unlock audio on first keypress
        this.audioMgr.onUserInteraction();

        // Start / restart
        if ((key === 'Space' || key === 'ArrowUp') &&
            (this.state === STATE.IDLE || this.state === STATE.GAME_OVER)) {
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
        if (key === 'ArrowLeft')  this.player.facingRight = false;
        if (key === 'ArrowRight') this.player.facingRight = true;
    }

    _onKeyUp(e) {
        if (e.code === 'ArrowDown') this.player.standUp();
    }
}
