import CONFIG        from './config.js';
import { AudioManager } from './audio.js';
import { Player }       from './player.js';
import { EnemyManager } from './enemy.js';

const STATE = {
    LOADING:    'LOADING',
    CHAR_SELECT:'CHAR_SELECT',   // NEW: character selection screen
    IDLE:       'IDLE',
    PLAYING:    'PLAYING',
    GAME_OVER:  'GAME_OVER',
};

export class Game {
    constructor() {
        // ── DOM refs ──────────────────────────────────────────────────────────
        this.startScreen   = document.getElementById('startScreen');
        this.gameOverEl    = document.getElementById('gameOver');
        this.charSelectEl  = document.getElementById('charSelectScreen');
        this.scoreEl       = document.getElementById('score');
        this.highScoreEl   = document.getElementById('highScore');
        this.finalScoreEl  = document.getElementById('finalScore');
        this.speedTextEl   = document.getElementById('speedText');
        this.restartBtn    = document.getElementById('restartBtn');
        this.nightModeBtn  = document.getElementById('nightModeBtn');
        this.musicBtn      = document.getElementById('musicBtn');
        this.sfxBtn        = document.getElementById('sfxBtn');
        this.loadingScreen = document.getElementById('loadingScreen');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx    = this.canvas.getContext('2d');

        // ── Core systems ──────────────────────────────────────────────────────
        this.audioMgr = new AudioManager();
        this.player   = new Player();
        this.enemies  = new EnemyManager(CONFIG.GAME_WIDTH);

        // ── Game state ────────────────────────────────────────────────────────
        this.state         = STATE.LOADING;
        this.score         = 0;
        this.highScore     = parseInt(localStorage.getItem(CONFIG.SCORE.HIGH_SCORE_KEY)) || 0;
        this.speed         = CONFIG.SPEED.INITIAL;
        this.isNight       = false;
        this.rafId         = null;
        this.bgX           = 0;
        this._lastMilestone = 0;
        this._particles     = [];

        // Selected character index (default 0)
        this._selectedCharIdx = 0;

        // ── Image assets ──────────────────────────────────────────────────────
        this.imgs = {
            player:   new Image(),
            char2:    new Image(),
            char3:    new Image(),
            bg:       new Image(),
            tree1:    new Image(),
            tree2:    new Image(),
            darkTree: new Image(),
            flying:   new Image(),
        };

        this._updateScoreDisplay();
        this._buildCharSelectUI();
        this._bindEvents();
        this._loadAssets();
    }

    // ── Asset preloading ──────────────────────────────────────────────────────

    _loadAssets() {
        const total    = Object.keys(this.imgs).length;
        let   loaded   = 0;
        let   resolved = false;

        const proceed = () => {
            loaded++;
            if (loaded >= total && !resolved) enterCharSelect();
        };
        const enterCharSelect = () => {
            if (resolved) return;
            resolved = true;
            if (this.state !== STATE.LOADING) return;

            // Pass obstacle images to EnemyManager
            this.enemies.setImages({
                tree1:    this.imgs.tree1,
                tree2:    this.imgs.tree2,
                darkTree: this.imgs.darkTree,
                flying:   this.imgs.flying,
            });

            this.state = STATE.CHAR_SELECT;
            if (this.loadingScreen) this.loadingScreen.style.display = 'none';
            if (this.charSelectEl)  this.charSelectEl.style.display  = 'flex';
            this._renderCharSelectCards();
            // Draw idle background behind the overlay
            this._drawScene();
        };

        // Safety timeout
        setTimeout(enterCharSelect, 4000);

        const A = CONFIG.ASSETS;
        const srcs = {
            player:   A.PLAYER_SRC,
            char2:    A.CHAR2_SRC,
            char3:    A.CHAR3_SRC,
            bg:       A.BG_SRC,
            tree1:    A.TREE1_SRC,
            tree2:    A.TREE2_SRC,
            darkTree: A.DARK_TREE_SRC,
            flying:   A.FLYING_SRC,
        };

        for (const [key, src] of Object.entries(srcs)) {
            this.imgs[key].onload  = proceed;
            this.imgs[key].onerror = () => { console.warn(`[Game] ${src} failed to load`); proceed(); };
            this.imgs[key].src     = src;
        }

        // All cached already
        if (Object.values(this.imgs).every(i => i.complete)) enterCharSelect();
    }

    // ── Character select ──────────────────────────────────────────────────────

    _buildCharSelectUI() {
        if (!this.charSelectEl) return;
        // Cards are generated dynamically
    }

    _renderCharSelectCards() {
        const container = document.getElementById('charCardsContainer');
        if (!container) return;
        container.innerHTML = '';

        CONFIG.CHARACTERS.forEach((ch, idx) => {
            const card = document.createElement('div');
            card.className = 'char-card' + (idx === this._selectedCharIdx ? ' selected' : '');
            card.dataset.idx = idx;

            // Mini canvas preview
            const cvs = document.createElement('canvas');
            cvs.width  = 100;
            cvs.height = 80;
            cvs.style.display = 'block';
            cvs.style.margin  = '0 auto 8px';
            this._drawCharPreview(cvs, ch);

            const nameEl = document.createElement('div');
            nameEl.className   = 'char-name';
            nameEl.textContent = ch.name;

            const descEl = document.createElement('div');
            descEl.className   = 'char-desc';
            descEl.textContent = ch.description;

            card.appendChild(cvs);
            card.appendChild(nameEl);
            card.appendChild(descEl);

            card.addEventListener('click', () => {
                this._selectedCharIdx = idx;
                document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });

            container.appendChild(card);
        });
    }

    _drawCharPreview(cvs, charDef) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        let img = null;
        switch (charDef.id) {
            case 'stego':  img = this.imgs.player; break;
            case 'raptor': img = this.imgs.char2;  break;
            case 'bronto': img = this.imgs.char3;  break;
        }

        if (img && img.complete && img.naturalWidth > 0) {
            const sw = charDef.isSheet ? charDef.frameW : (charDef.srcW || img.naturalWidth);
            const sh = charDef.isSheet ? charDef.frameH : (charDef.srcH || img.naturalHeight);
            const scale = Math.min(cvs.width / sw, cvs.height / sh) * 0.85;
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (cvs.width  - dw) / 2;
            const dy = (cvs.height - dh) / 2;

            if (charDef.whiteBackground) {
                ctx.fillStyle = '#e8f4fc';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
                ctx.globalCompositeOperation = 'multiply';
            }
            ctx.drawImage(img, charDef.srcX || 0, charDef.srcY || 0, sw, sh, dx, dy, dw, dh);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Placeholder circle
            ctx.fillStyle = charDef.color || '#2ecc71';
            ctx.beginPath();
            ctx.arc(cvs.width/2, cvs.height/2, 28, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // ── Confirm character selection and enter IDLE ────────────────────────────

    _confirmCharSelect() {
        const charDef = CONFIG.CHARACTERS[this._selectedCharIdx];
        this.player.charDef = charDef;

        if (this.charSelectEl) this.charSelectEl.style.display = 'none';
        if (this.startScreen)  this.startScreen.style.display  = 'flex';

        this.state = STATE.IDLE;
        this._drawIdle();
    }

    // ── Game lifecycle ────────────────────────────────────────────────────────

    start() {
        if (this.state === STATE.PLAYING || this.state === STATE.LOADING) return;
        if (this.state === STATE.CHAR_SELECT) return; // must confirm first

        this.audioMgr.onUserInteraction();
        this.audioMgr.startBgm();

        this.state          = STATE.PLAYING;
        this.score          = 0;
        this.speed          = CONFIG.SPEED.INITIAL;
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

        this.speed = Math.min(this.speed + CONFIG.SPEED.INCREMENT, CONFIG.SPEED.MAX);

        this.player.update();
        this.enemies.update(this.speed);

        // Scroll bg
        if (this.imgs.bg.complete && this.imgs.bg.naturalWidth > 0) {
            const scale = this.canvas.height / this.imgs.bg.naturalHeight;
            const bgW   = this.imgs.bg.naturalWidth * scale;
            this.bgX   -= this.speed * 0.5;
            if (this.bgX <= -bgW) this.bgX = 0;
        }

        this._updateParticles();

        if (this.enemies.checkCollision(this.player.getRect())) {
            this._endGame();
            return;
        }

        this.score += CONFIG.SCORE.INCREMENT_PER_FRAME;
        this._checkScoreMilestone();
        this._updateScoreDisplay();

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

        // Background parallax
        if (this.imgs.bg.complete && this.imgs.bg.naturalWidth > 0) {
            const bgNatW = this.imgs.bg.naturalWidth;
            const bgNatH = this.imgs.bg.naturalHeight;
            const scale  = cH / bgNatH;
            const bgW    = bgNatW * scale;
            const bgH    = cH;

            if (this.isNight) ctx.globalAlpha = 0.4;
            ctx.drawImage(this.imgs.bg, this.bgX,       0, bgW, bgH);
            ctx.drawImage(this.imgs.bg, this.bgX + bgW, 0, bgW, bgH);
            if (this.bgX + bgW * 2 < cW)
                ctx.drawImage(this.imgs.bg, this.bgX + bgW * 2, 0, bgW, bgH);
            ctx.globalAlpha = 1.0;
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, cH);
            if (this.isNight) {
                grad.addColorStop(0, '#0a0a2e'); grad.addColorStop(1, '#1a3a0a');
            } else {
                grad.addColorStop(0, '#87CEEB'); grad.addColorStop(0.6, '#b0e0f5');
                grad.addColorStop(0.6, '#c8f0a0'); grad.addColorStop(1, '#90EE90');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cW, cH);
        }

        // Ground line
        const groundLineY = cH - CONFIG.GROUND_Y;
        ctx.strokeStyle = this.isNight ? 'rgba(200,200,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundLineY);
        ctx.lineTo(cW, groundLineY);
        ctx.stroke();

        // Ground strip
        const groundGrad = ctx.createLinearGradient(0, groundLineY, 0, cH);
        if (this.isNight) {
            groundGrad.addColorStop(0, '#2d4a1e'); groundGrad.addColorStop(1, '#1a3a0a');
        } else {
            groundGrad.addColorStop(0, '#8B6914'); groundGrad.addColorStop(1, '#5a3e08');
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundLineY, cW, CONFIG.GROUND_Y);

        // Particles
        this._drawParticles(ctx);

        // Enemies
        this.enemies.draw(ctx, cH);

        // Player
        this.player.draw(ctx, this.imgs, cH);

        // Producer tag (top-left)
        this._drawProducerTag(ctx, cW, cH);
    }

    _drawProducerTag(ctx, cW, cH) {
        const text     = '製作人：11311380/張智媛';
        const fontSize = 10;
        const padX = 6, padY = 4, margin = 6, radius = 4;

        ctx.save();
        ctx.font         = `bold ${fontSize}px "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif`;
        ctx.textBaseline = 'top';

        const tw = ctx.measureText(text).width;
        const bw = tw + padX * 2;
        const bh = fontSize + padY * 2;
        const bx = margin, by = margin;

        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + bw - radius, by);
        ctx.quadraticCurveTo(bx + bw, by,      bx + bw, by + radius);
        ctx.lineTo(bx + bw, by + bh - radius);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
        ctx.lineTo(bx + radius, by + bh);
        ctx.quadraticCurveTo(bx, by + bh,      bx, by + bh - radius);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by,            bx + radius, by);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.fillText(text, bx + padX, by + padY);
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
        if (this.player.isOnGround && !this.player.isDead && Math.random() < 0.4)
            this._spawnRunParticles();

        this._particles = this._particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.06;
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

    _checkScoreMilestone() {
        const m = Math.floor(this.score / 100) * 100;
        if (m > 0 && m !== this._lastMilestone) {
            this._lastMilestone = m;
            this.audioMgr.playScore();
        }
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    _updateScoreDisplay() {
        this.scoreEl.textContent     = String(Math.floor(this.score)).padStart(5, '0');
        this.highScoreEl.textContent = String(this.highScore).padStart(5, '0');
        this.speedTextEl.textContent = ' ' + (this.speed / CONFIG.SPEED.INITIAL).toFixed(1) + 'x';
    }

    // ── Events ────────────────────────────────────────────────────────────────

    _bindEvents() {
        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup',   e => this._onKeyUp(e));

        this.restartBtn?.addEventListener('click', () => {
            this.audioMgr.onUserInteraction();
            // Go back to char select on game over restart
            this._goToCharSelect();
        });

        this.nightModeBtn?.addEventListener('click', () => this.toggleNight());

        this.musicBtn?.addEventListener('click', () => {
            this.audioMgr.onUserInteraction();
            const muted = this.audioMgr.toggleMusicMute();
            this.musicBtn.textContent = muted ? '🎵 音樂: 關' : '🎵 音樂: 開';
            this.musicBtn.classList.toggle('muted', muted);
            if (!muted && this.state === STATE.PLAYING) this.audioMgr.startBgm();
        });

        this.sfxBtn?.addEventListener('click', () => {
            this.audioMgr.onUserInteraction();
            const muted = this.audioMgr.toggleSfxMute();
            this.sfxBtn.textContent = muted ? '🔊 音效: 關' : '🔊 音效: 開';
            this.sfxBtn.classList.toggle('muted', muted);
        });

        // Confirm character selection button
        document.getElementById('confirmCharBtn')?.addEventListener('click', () => {
            this.audioMgr.onUserInteraction();
            this._confirmCharSelect();
        });

        document.addEventListener('touchstart', e => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('.char-card') || e.target.closest('#charSelectScreen')) return;
            e.preventDefault();
            this.audioMgr.onUserInteraction();
            if (this.state === STATE.IDLE || this.state === STATE.GAME_OVER) {
                this.start();
            } else if (this.state === STATE.PLAYING) {
                this.player.jump(this.audioMgr);
            }
        }, { passive: false });
    }

    _goToCharSelect() {
        this.audioMgr.stopBgm();
        this.audioMgr.hasStartedBgm = false;
        this.state = STATE.CHAR_SELECT;
        this.gameOverEl.style.display  = 'none';
        this.startScreen.style.display = 'none';
        if (this.charSelectEl) this.charSelectEl.style.display = 'flex';
        this._renderCharSelectCards();
        this._drawScene();
    }

    _onKeyDown(e) {
        const key = e.code;
        this.audioMgr.onUserInteraction();

        // Confirm char select with Enter
        if (key === 'Enter' && this.state === STATE.CHAR_SELECT) {
            this._confirmCharSelect();
            return;
        }
        // Arrow keys to cycle characters in char select
        if (this.state === STATE.CHAR_SELECT) {
            if (key === 'ArrowLeft') {
                this._selectedCharIdx = (this._selectedCharIdx - 1 + CONFIG.CHARACTERS.length) % CONFIG.CHARACTERS.length;
                this._renderCharSelectCards();
            }
            if (key === 'ArrowRight') {
                this._selectedCharIdx = (this._selectedCharIdx + 1) % CONFIG.CHARACTERS.length;
                this._renderCharSelectCards();
            }
            return;
        }

        if ((key === 'Space' || key === 'ArrowUp') && (this.state === STATE.IDLE || this.state === STATE.GAME_OVER)) {
            if (this.state === STATE.GAME_OVER) { this._goToCharSelect(); return; }
            this.start();
            return;
        }

        if (this.state !== STATE.PLAYING) return;

        if (key === 'Space' || key === 'ArrowUp') { e.preventDefault(); this.player.jump(this.audioMgr); }
        if (key === 'ArrowDown')  { e.preventDefault(); this.player.duck(); }
        if (key === 'ArrowLeft')  this.player.facingRight = false;
        if (key === 'ArrowRight') this.player.facingRight = true;
    }

    _onKeyUp(e) {
        if (e.code === 'ArrowDown') this.player.standUp();
    }
}
