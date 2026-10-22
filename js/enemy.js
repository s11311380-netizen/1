import CONFIG from './config.js';

/**
 * Obstacle — image-based tree / flying obstacle.
 * Hitbox geometry is preserved from original; only drawing is replaced.
 */
class Obstacle {
    constructor(typeDef, gameWidth, imgMap) {
        this.typeDef = typeDef;
        this.width   = typeDef.width;
        this.height  = typeDef.height;
        this.groundY = CONFIG.GROUND_Y;
        this.x       = gameWidth + 20;
        this.imgMap  = imgMap;

        // Oscillation phase for flying obstacles
        this._phase  = Math.random() * Math.PI * 2;
        // Random slight size variation for variety
        this._scale  = 0.85 + Math.random() * 0.3;

        // For double-tree: second tree is offset
        this._double = typeDef.double || false;
    }

    move(speed) {
        this.x     -= speed;
        this._phase += 0.07;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    /** Hitbox — same calculation as original code */
    getRect() {
        const margin = 6;
        const bottom = this.typeDef.flyingY ? this.typeDef.flyingBottom : this.groundY;
        return {
            left:   this.x + margin,
            right:  this.x + this.width - margin,
            top:    bottom,
            bottom: bottom + this.height,
        };
    }

    draw(ctx, canvasHeight) {
        const isFlying = this.typeDef.flyingY;
        const bottom   = isFlying ? this.typeDef.flyingBottom : this.groundY;
        const flyBob   = isFlying ? Math.sin(this._phase) * 5 : 0;
        const y        = canvasHeight - bottom - this.height + flyBob;
        const def      = this.typeDef;

        ctx.save();

        if (isFlying) {
            this._drawFlyingObstacle(ctx, this.x, y, def);
        } else if (this._double) {
            this._drawGroundTree(ctx, this.x,      y, def);
            this._drawGroundTree(ctx, this.x + 48, y + 8, def); // offset second tree
        } else {
            this._drawGroundTree(ctx, this.x, y, def);
        }

        ctx.restore();
    }

    _drawGroundTree(ctx, x, y, def) {
        const imgKey = def.imgKey;
        const img    = this.imgMap[imgKey];

        if (img && img.complete && img.naturalWidth > 0) {
            const iw = def.imgW || img.naturalWidth;
            const ih = def.imgH || img.naturalHeight;
            // Scale to fit hitbox width/height
            const scale = Math.min(this.width / iw, this.height / ih) * this._scale;
            const dw = iw * scale;
            const dh = ih * scale;
            ctx.drawImage(img, 0, 0, iw, ih, x + (this.width - dw) / 2, y + (this.height - dh), dw, dh);
        } else {
            // Fallback drawn tree
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x, y, this.width, this.height);
        }
    }

    _drawFlyingObstacle(ctx, x, y, def) {
        const img = this.imgMap['flying'];

        if (img && img.complete && img.naturalWidth > 0) {
            const frameW = def.frameW || 27;
            const imgH   = def.imgH   || 30;
            // Animate through available frames using phase
            const frame  = Math.floor(this._phase / 0.4) % 3; // cycle 3 ghost frames
            const srcX   = frame * frameW;
            const dw     = this.width;
            const dh     = this.height;
            ctx.drawImage(img, srcX, 0, frameW, imgH, x, y, dw, dh);
        } else {
            // Fallback: purple ellipse
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.ellipse(x + this.width/2, y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

// ── EnemyManager ─────────────────────────────────────────────────────────────

export class EnemyManager {
    constructor(gameWidth) {
        this.gameWidth      = gameWidth;
        this.obstacles      = [];
        this.framesTillNext = this._nextInterval();
        this.imgMap         = {};  // set by Game after asset load
    }

    setImages(imgMap) {
        this.imgMap = imgMap;
    }

    update(speed) {
        this.framesTillNext--;
        if (this.framesTillNext <= 0) {
            this._spawnRandom();
            this.framesTillNext = this._nextInterval();
        }

        this.obstacles = this.obstacles.filter(obs => {
            obs.move(speed);
            return !obs.isOffScreen();
        });
    }

    checkCollision(playerRect) {
        for (const obs of this.obstacles) {
            const r = obs.getRect();
            if (
                playerRect.right  > r.left  &&
                playerRect.left   < r.right &&
                playerRect.bottom > r.top   &&
                playerRect.top    < r.bottom
            ) {
                return true;
            }
        }
        return false;
    }

    reset() {
        this.obstacles      = [];
        this.framesTillNext = this._nextInterval();
    }

    draw(ctx, canvasHeight) {
        for (const obs of this.obstacles) {
            obs.draw(ctx, canvasHeight);
        }
    }

    _spawnRandom() {
        const types   = CONFIG.OBSTACLE.TYPES;
        const typeDef = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push(new Obstacle(typeDef, this.gameWidth, this.imgMap));
    }

    _nextInterval() {
        const { MIN_INTERVAL, MAX_INTERVAL } = CONFIG.OBSTACLE;
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    }
}
