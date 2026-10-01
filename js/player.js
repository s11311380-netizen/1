import CONFIG from './config.js';

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
        
        this.frameTimer = 0;
        this.currentFrame = 0;
        this.facingRight = true;
    }

    jump(audioMgr) {
        if (!this.isOnGround || this.isDead) return;
        this.velocityY  = this.cfg.JUMP_FORCE;
        this.isOnGround = false;
        this.isJumping  = true;
        this.isDucking = false;
        if(audioMgr) audioMgr.playJump();
    }

    duck() {
        if (this.isDead || !this.isOnGround) return;
        this.isDucking = true;
    }

    standUp() {
        if (!this.isDucking) return;
        this.isDucking = false;
    }

    update() {
        if (this.isDead) return;
        this._applyGravity();
        
        this.frameTimer++;
        if (this.frameTimer > 8) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % 4; // Assume 4 frames animation
        }
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
        this.frameTimer = 0;
    }

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

    draw(ctx, img, canvasHeight) {
        const w = this.isDucking ? this.cfg.DUCK_WIDTH : this.cfg.WIDTH;
        const h = this.isDucking ? this.cfg.DUCK_HEIGHT : this.cfg.HEIGHT;
        const x = this.cfg.START_LEFT;
        const y = canvasHeight - this.bottom - h;
        
        if (!img) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(x, y, w, h);
            return;
        }
        
        // Sprite dimensions assumption: 
        // We divide image height into multiple rows (e.g. idle, run, dead)
        // Or if it's a simple strip, we just take segments.
        // As a fallback to work with any image size, we'll slice a segment:
        let frameWidth = img.width / 4;
        let frameHeight = img.height / 3;
        if(frameWidth <= 0) frameWidth = w;
        if(frameHeight <= 0) frameHeight = h;

        let row = 0;
        if (this.isDead) row = 2; // Dead row
        else if (this.isJumping || !this.isOnGround) row = 1; // Jump row
        else if (this.isDucking) row = 2; // Duck row
        else row = 0; // Run/Idle row

        let f = this.currentFrame;
        
        ctx.save();
        if (!this.facingRight) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, f * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, w, h);
        } else {
            ctx.drawImage(img, f * frameWidth, row * frameHeight, frameWidth, frameHeight, x, y, w, h);
        }
        ctx.restore();
        
        // Debug hitbox
        // const r = this.getRect();
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(r.left, canvasHeight - r.bottom, r.right - r.left, r.bottom - r.top);
    }
}
