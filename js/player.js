import CONFIG from './config.js';

/**
 * Player — handles physics, hitbox, and clean multi-character sprite rendering.
 * All sprites have 100% clean transparent backgrounds.
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
        this._bobAngle    = 0;

        // Default selected character
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
        this._bobAngle    = 0;
    }

    update() {
        if (this.isDead) return;
        this._applyGravity();

        this.frameTimer++;
        const frameRate = this.charDef.isSheet ? 5 : 8;
        if (this.frameTimer > frameRate) {
            this.frameTimer   = 0;
            const maxFrames   = this.charDef.isSheet ? (this.charDef.numFrames || 6) : 4;
            this.currentFrame = (this.currentFrame + 1) % maxFrames;
        }

        if (this.isOnGround && !this.isDucking) {
            this._bobAngle += 0.35;
        }
    }

    // ── Hitbox (Identical for all characters to maintain fair physics) ────────
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
    draw(ctx, imgMap, canvasHeight) {
        const w = this.isDucking ? this.cfg.DUCK_WIDTH  : this.cfg.WIDTH;
        const h = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const x = this.cfg.START_LEFT;
        const y = canvasHeight - this.bottom - h;

        let img = null;
        switch (this.charDef.id) {
            case 'stego':  img = imgMap.player;   break;
            case 'raptor': img = imgMap.char2;    break;
            case 'bronto': img = imgMap.char3;    break;
            case 'rex':    img = imgMap.char_rex; break;
        }

        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = this.isDead ? '#e74c3c' : (this.charDef.color || '#2ecc71');
            ctx.fillRect(x, y, w, h);
            return;
        }

        let bobY     = 0;
        let rotation = 0;
        let alpha    = 1.0;

        if (this.isDead) {
            rotation = Math.PI / 8;
            alpha    = 0.85;
        } else if (this.isJumping || !this.isOnGround) {
            rotation = -Math.PI / 12;
        } else if (this.isDucking) {
            rotation = Math.PI / 10;
        } else {
            bobY = Math.sin(this._bobAngle) * 2;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        const cx = x + w / 2;
        const cy = y + h / 2 + bobY;
        ctx.translate(cx, cy);
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.rotate(rotation);

        if (this.charDef.isSheet) {
            const def   = this.charDef;
            const fW    = def.frameW || 50;
            const fH    = def.frameH || 42;
            const frame = this.isOnGround ? this.currentFrame : 0;
            ctx.drawImage(img, frame * fW, 0, fW, fH, -w/2, -h/2, w, h);
        } else {
            const def = this.charDef;
            const sx = def.srcX || 0;
            const sy = def.srcY || 0;
            const sw = def.srcW || img.naturalWidth;
            const sh = def.srcH || img.naturalHeight;
            ctx.drawImage(img, sx, sy, sw, sh, -w/2, -h/2, w, h);
        }

        if (this.isDead) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle   = '#e74c3c';
            ctx.fillRect(-w/2, -h/2, w, h);
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
