import CONFIG from './config.js';

/**
 * Player — handles physics, collision hitbox, and running sprite animations.
 * EVERY dinosaur character has a multi-frame running animation sprite sheet.
 */
export class Player {
    constructor() {
        this.velocityY   = 0;
        this.isOnGround  = true;
        this.isJumping   = false;
        this.isDucking   = false;
        this.isDead      = false;

        this.cfg     = CONFIG.PLAYER;
        this.groundY = CONFIG.GROUND_Y;

        this._baseBottom = this.groundY;
        this.bottom      = this._baseBottom;

        this.frameTimer   = 0;
        this.currentFrame = 0;
        this.facingRight  = true;

        // Selected character definition (default dino1)
        this.charDef = CONFIG.CHARACTERS[0];
    }

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
    }

    update() {
        if (this.isDead) return;
        this._applyGravity();

        // Advance running animation frame
        this.frameTimer++;
        // Fast animation speed (every 5-6 game ticks advances 1 running frame)
        if (this.frameTimer >= 5) {
            this.frameTimer   = 0;
            const maxFrames   = this.charDef.numFrames || 6;
            this.currentFrame = (this.currentFrame + 1) % maxFrames;
        }
    }

    // ── Hitbox (Identical across all characters for fair gameplay) ────────────
    getRect() {
        const margin = this.isDucking ? 6 : 8;
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
    draw(ctx, imgMap, canvasHeight) {
        const w = this.isDucking ? this.cfg.DUCK_WIDTH  : this.cfg.WIDTH;
        const h = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const x = this.cfg.START_LEFT;
        // Align feet right onto the ground
        const y = canvasHeight - this.bottom - h;

        // Retrieve the corresponding sprite image
        const img = imgMap[this.charDef.id];

        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = this.isDead ? '#e74c3c' : (this.charDef.color || '#2ecc71');
            ctx.fillRect(x, y, w, h);
            return;
        }

        let rotation = 0;
        let alpha    = 1.0;

        if (this.isDead) {
            rotation = Math.PI / 8; // tilt back on death
            alpha    = 0.85;
        } else if (this.isJumping || !this.isOnGround) {
            rotation = -Math.PI / 14; // slight upward tilt mid-air
        } else if (this.isDucking) {
            rotation = Math.PI / 12;  // squash & stretch while ducking
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.translate(cx, cy);

        // Mirror when facing left
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.rotate(rotation);

        // Frame slice calculation
        const def       = this.charDef;
        const frameW    = def.frameW;
        const frameH    = def.frameH;
        // In the air, hold a dynamic leap frame (frame 1), on ground cycle through all running frames
        const frameIdx  = this.isOnGround ? this.currentFrame : 1;
        const srcX      = frameIdx * frameW;

        // Draw the cleanly sliced frame
        ctx.drawImage(img, srcX, 0, frameW, frameH, -w / 2, -h / 2, w, h);

        // Red tint on game over
        if (this.isDead) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle   = '#e74c3c';
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
    }

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
