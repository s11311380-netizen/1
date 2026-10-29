import CONFIG from './config.js';

/**
 * Player — handles physics, collision hitbox, and running sprite animations.
 * EVERY dinosaur character has a multi-frame running animation sprite sheet.
 * Stars (shields) are displayed above the player's head.
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

        // Stars (shield charges): earned by eating fruit
        this.stars = 0;

        // Brief invincibility after absorbing a hit (frames countdown)
        this.invincibleFrames = 0;

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
        this.facingRight  = true;
        this.stars        = 0;
        this.invincibleFrames = 0;
    }

    update() {
        if (this.isDead) return;
        this._applyGravity();

        // Advance running animation frame
        this.frameTimer++;
        if (this.frameTimer >= 5) {
            this.frameTimer   = 0;
            const maxFrames   = this.charDef.numFrames || 6;
            this.currentFrame = (this.currentFrame + 1) % maxFrames;
        }

        // Countdown invincibility frames
        if (this.invincibleFrames > 0) {
            this.invincibleFrames--;
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
        // Align feet right onto the ground (sink 2px so feet firmly step on the line)
        const footSink = (this.charDef.id === 'dino1') ? 4 : 2;
        const y = canvasHeight - this.bottom - h + footSink;

        // Retrieve the corresponding sprite image
        const img = imgMap[this.charDef.id];

        // Draw star shields above the player's head before drawing the dino
        if (this.stars > 0) {
            this._drawStars(ctx, x, y, w);
        }

        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = this.isDead ? '#e74c3c' : (this.charDef.color || '#2ecc71');
            ctx.fillRect(x, y, w, h);
            return;
        }

        // Invincibility blink effect: skip drawing every other 4 frames
        if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 4) % 2 === 0) {
            return;
        }

        let rotation = 0;
        let alpha    = 1.0;

        if (this.isDead) {
            rotation = Math.PI / 8;
            alpha    = 0.85;
        } else if (this.isJumping || !this.isOnGround) {
            rotation = -Math.PI / 14;
        } else if (this.isDucking) {
            rotation = Math.PI / 12;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.translate(cx, cy);

        // charDef.flipH: sprite faces left by default → needs horizontal flip to face right.
        // facingRight=true (default): dino heads to the right (towards obstacles).
        // For a normal sprite (no flipH): facingRight=true → do NOT mirror.
        // For flipH sprite:             facingRight=true → DO mirror (flip to face right).
        // facingRight=false: reverse the above (player pressed left).
        const needsFlip = this.charDef.flipH ? this.facingRight : !this.facingRight;
        if (needsFlip) ctx.scale(-1, 1);

        ctx.rotate(rotation);

        // Frame slice calculation
        const def    = this.charDef;
        const frameW = def.frameW;
        const frameH = def.frameH;
        // In the air, hold a dynamic leap frame (frame 1), on ground cycle through all running frames
        const frameIdx = this.isOnGround ? this.currentFrame : 1;
        const srcX     = frameIdx * frameW;

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

    _drawStars(ctx, playerX, playerY, playerW) {
        ctx.save();
        ctx.font = '14px serif';
        ctx.textBaseline = 'bottom';
        const starStr = '⭐'.repeat(Math.min(this.stars, 5));
        const overflow = this.stars > 5 ? ` +${this.stars - 5}` : '';
        const text = starStr + overflow;
        // Centre above the player
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, playerX + playerW / 2 - tw / 2, playerY - 2);
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
