import CONFIG from './config.js';

/**
 * Obstacle — image-based tree and flying monster obstacles.
 * Hitbox geometry is fully preserved; drawing uses clean transparent sprites.
 */
class Obstacle {
    constructor(typeDef, gameWidth, imgMap) {
        this.typeDef  = typeDef;
        this.width    = typeDef.width;
        this.height   = typeDef.height;
        this.groundY  = CONFIG.GROUND_Y;
        this.x        = gameWidth + 20;
        this.imgMap   = imgMap;

        // Oscillation phase for flying obstacles
        this._phase   = Math.random() * Math.PI * 2;
    }

    move(speed) {
        this.x     -= speed;
        this._phase += 0.08;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getRect() {
        const margin = 5;
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
        const flyBob   = isFlying ? Math.sin(this._phase * 1.5) * 4 : 0;
        const y        = canvasHeight - bottom - this.height + flyBob;
        const def      = this.typeDef;

        ctx.save();

        if (isFlying) {
            this._drawFlyingObstacle(ctx, this.x, y, def);
        } else {
            this._drawGroundTree(ctx, this.x, y, def);
        }

        ctx.restore();
    }

    _drawGroundTree(ctx, x, y, def) {
        const imgKey = def.imgKey;
        const img    = this.imgMap[imgKey];

        if (img && img.complete && img.naturalWidth > 0) {
            // Draw clean tree fitted to obstacle dimensions, anchored to the ground
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, this.width, this.height);
        } else {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x, y, this.width, this.height);
        }
    }

    _drawFlyingObstacle(ctx, x, y, def) {
        const img = this.imgMap['flying'];

        if (img && img.complete && img.naturalWidth > 0) {
            const frameW   = def.frameW || 14;
            const frameH   = def.frameH || 16;
            // Flap wings: toggle frame 0 and frame 1 every few updates
            const frameIdx = Math.floor(this._phase * 2) % 2;
            const srcX     = frameIdx * frameW;
            ctx.drawImage(img, srcX, 0, frameW, frameH, x, y, this.width, this.height);
        } else {
            ctx.fillStyle = '#8e44ad';
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
        this.imgMap         = {};
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
