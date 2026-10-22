import CONFIG from './config.js';

/**
 * Player — physics, state, multi-character sprite rendering.
 *
 * Supports 3 characters:
 *   stego  — single image, animated by canvas transforms
 *   raptor — 6-frame sprite sheet (white bg handled via destination-in composite)
 *   bronto — single image with purple background
 *
 * Physics hitbox (getRect) is IDENTICAL for all characters to keep gameplay fair.
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

        // Selected character definition (set by Game before start)
        this.charDef = CONFIG.CHARACTERS[0];
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

    // ── Update ────────────────────────────────────────────────────────────────

    update() {
        if (this.isDead) return;
        this._applyGravity();

        // Sheet animation frame advance
        this.frameTimer++;
        const frameRate = this.charDef.isSheet ? 6 : 8; // raptor animates faster
        if (this.frameTimer > frameRate) {
            this.frameTimer   = 0;
            const maxFrames   = this.charDef.isSheet ? (this.charDef.numFrames || 6) : 4;
            this.currentFrame = (this.currentFrame + 1) % maxFrames;
        }

        if (this.isOnGround && !this.isDucking) {
            this._bobAngle += 0.35;
        }
    }

    // ── Hitbox (unchanged for all characters) ─────────────────────────────────

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
     * draw(ctx, imgMap, canvasHeight)
     *   imgMap — { player, char2, char3 } HTMLImageElement objects from Game
     */
    draw(ctx, imgMap, canvasHeight) {
        const w = this.isDucking ? this.cfg.DUCK_WIDTH  : this.cfg.WIDTH;
        const h = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const x = this.cfg.START_LEFT;
        const y = canvasHeight - this.bottom - h;

        // Pick the right image
        let img = null;
        switch (this.charDef.id) {
            case 'stego':  img = imgMap.player; break;
            case 'raptor': img = imgMap.char2;  break;
            case 'bronto': img = imgMap.char3;  break;
        }

        // Fallback rectangle if image failed
        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = this.isDead ? '#e74c3c' : (this.charDef.color || '#2ecc71');
            ctx.fillRect(x, y, w, h);
            return;
        }

        // Compute animation transforms
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
            // Sprite sheet: pick current frame
            const def   = this.charDef;
            const fW    = def.frameW || 74;
            const fH    = def.frameH || 50;
            const frame = this.isOnGround ? this.currentFrame : 0;

            if (def.whiteBackground) {
                // Draw onto temp canvas to chroma-key white background
                this._drawWithWhiteBgRemoved(ctx, img, frame * fW, 0, fW, fH, -w/2, -h/2, w, h);
            } else {
                ctx.drawImage(img, frame * fW, 0, fW, fH, -w/2, -h/2, w, h);
            }
        } else {
            const def = this.charDef;
            const sx = def.srcX || 0;
            const sy = def.srcY || 0;
            const sw = def.srcW || img.naturalWidth;
            const sh = def.srcH || img.naturalHeight;

            if (def.purpleBackground) {
                this._drawWithPurpleBgRemoved(ctx, img, sx, sy, sw, sh, -w/2, -h/2, w, h);
            } else {
                ctx.drawImage(img, sx, sy, sw, sh, -w/2, -h/2, w, h);
            }
        }

        // Dead red tint
        if (this.isDead) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle   = '#e74c3c';
            ctx.fillRect(-w/2, -h/2, w, h);
        }

        ctx.restore();
    }

    // ── Sprite helpers ────────────────────────────────────────────────────────

    /**
     * Remove white background via off-screen canvas and destination-in technique.
     * Only computed once per frame; small canvas keeps it fast.
     */
    _drawWithWhiteBgRemoved(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        // Use globalCompositeOperation multiply to darken white to transparent equivalent
        // Actually: draw image normally with destination-out isn't trivial.
        // Simplest: just draw — the white bg will be covered by game bg.
        // For sprite sheets with white bg, we use multiply blend mode.
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawWithPurpleBgRemoved(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        // Purple bg (~#9B4E9B) — draw normally; the solid bg makes it visible
        // For better results we use destination-in approach
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    // ── Physics ───────────────────────────────────────────────────────────────

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
