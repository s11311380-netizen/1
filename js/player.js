import CONFIG from './config.js';

/**
 * Player — handles physics, state, and sprite-based drawing.
 *
 * Sprite strategy:
 *   The provided player.png (190×195) is a single dino illustration.
 *   We simulate multi-frame animation by:
 *     • Run / Idle  — alternating body-bob (vertical offset oscillation)
 *     • Jump        — slight CCW tilt
 *     • Duck        — strong CW tilt (squash)
 *     • Dead        — red tint overlay + CW tilt
 *   The physics hitbox (getRect) is UNCHANGED from the original geometry,
 *   so feel and collision remain identical regardless of sprite rendering.
 */
export class Player {
    constructor() {
        this.velocityY   = 0;
        this.isOnGround  = true;
        this.isJumping   = false;
        this.isDucking   = false;
        this.isDead      = false;

        this.cfg    = CONFIG.PLAYER;
        this.groundY = CONFIG.GROUND_Y;

        this._baseBottom = this.groundY;
        this.bottom      = this._baseBottom;

        // Animation frame counter (drives bob oscillation)
        this.frameTimer   = 0;
        this.currentFrame = 0;   // 0‥3, used for bob phase
        this.facingRight  = true;

        // Bob state: smooth sinusoidal offset for running legs effect
        this._bobAngle = 0;
    }

    // ── Public actions ────────────────────────────────────────────────────────

    jump(audioMgr) {
        if (!this.isOnGround || this.isDead) return;
        this.velocityY  = this.cfg.JUMP_FORCE;
        this.isOnGround = false;
        this.isJumping  = true;
        this.isDucking  = false;
        if (audioMgr) audioMgr.playJump();
    }

    duck() {
        if (this.isDead || !this.isOnGround) return;
        this.isDucking = true;
    }

    standUp() {
        if (!this.isDucking) return;
        this.isDucking = false;
    }

    die() {
        this.isDead = true;
    }

    reset() {
        this.velocityY   = 0;
        this.isOnGround  = true;
        this.isJumping   = false;
        this.isDucking   = false;
        this.isDead      = false;
        this.bottom      = this._baseBottom;
        this.currentFrame = 0;
        this.frameTimer   = 0;
        this._bobAngle    = 0;
    }

    // ── Update (called every game frame) ─────────────────────────────────────

    update() {
        if (this.isDead) return;
        this._applyGravity();

        // Advance frame timer for animation
        this.frameTimer++;
        if (this.frameTimer > 8) {
            this.frameTimer   = 0;
            this.currentFrame = (this.currentFrame + 1) % 4;
        }

        // Advance bob angle for smooth running oscillation
        if (this.isOnGround && !this.isDucking) {
            this._bobAngle += 0.35; // ~60fps → ~3.3 Hz leg-cycle
        }
    }

    // ── Collision rect (UNCHANGED from original — hitbox integrity preserved) ─

    getRect() {
        const margin = this.isDucking ? 5 : 8;
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

    // ── Drawing ───────────────────────────────────────────────────────────────

    /**
     * draw(ctx, img, canvasHeight)
     *   img     — HTMLImageElement loaded from player.png (190×195)
     *   Uses the big dino region (SPRITE_SRC_X/Y/W/H from config).
     *   Falls back to a coloured rectangle if the image hasn't loaded.
     */
    draw(ctx, img, canvasHeight) {
        const w = this.isDucking ? this.cfg.DUCK_WIDTH  : this.cfg.WIDTH;
        const h = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const x = this.cfg.START_LEFT;
        const y = canvasHeight - this.bottom - h;

        // ── Fallback rectangle if image failed to load ──────────────────────
        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = this.isDead ? '#e74c3c' : '#2ecc71';
            ctx.fillRect(x, y, w, h);
            return;
        }

        // ── Compute animation transform ─────────────────────────────────────
        let bobY      = 0;    // vertical bob offset (px)
        let rotation  = 0;    // rotation (radians)
        let scaleX    = 1;    // horizontal scale (for mirror)
        let alpha     = 1.0;  // opacity

        if (this.isDead) {
            rotation = Math.PI / 8;  // tilt right when dead
            alpha    = 0.85;
        } else if (this.isJumping || !this.isOnGround) {
            rotation = -Math.PI / 12; // slight CCW tilt mid-air
        } else if (this.isDucking) {
            rotation = Math.PI / 10;  // CW tilt while ducking
        } else {
            // Running bob: ±2px vertical oscillation
            bobY = Math.sin(this._bobAngle) * 2;
        }

        // Mirror when facing left
        if (!this.facingRight) scaleX = -1;

        // ── Source region from sprite sheet ─────────────────────────────────
        const sx = this.cfg.SPRITE_SRC_X;
        const sy = this.cfg.SPRITE_SRC_Y;
        const sw = this.cfg.SPRITE_SRC_W;
        const sh = this.cfg.SPRITE_SRC_H;

        // ── Render ───────────────────────────────────────────────────────────
        ctx.save();
        ctx.globalAlpha = alpha;

        // Translate to sprite centre so rotation pivots correctly
        const cx = x + w / 2;
        const cy = y + h / 2 + bobY;
        ctx.translate(cx, cy);
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.rotate(rotation);

        ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);

        // Dead red tint overlay
        if (this.isDead) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle   = '#e74c3c';
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _applyGravity() {
        if (this.isOnGround) return;
        this.velocityY += this.cfg.GRAVITY;
        if (this.velocityY > this.cfg.MAX_FALL) this.velocityY = this.cfg.MAX_FALL;
        this.bottom -= this.velocityY;

        if (this.bottom <= this._baseBottom) {
            this.bottom     = this._baseBottom;
            this.velocityY  = 0;
            this.isOnGround = true;
            this.isJumping  = false;
        }
    }
}
