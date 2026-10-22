import CONFIG from './config.js';

/**
 * Obstacle — Ground trees and floating airborne monsters.
 * Ground trees have their roots firmly attached to the ground line (no floating!).
 */
class Obstacle {
    constructor(typeDef, gameWidth, imgMap) {
        this.typeDef  = typeDef;
        this.width    = typeDef.width;
        this.height   = typeDef.height;
        this.groundY  = CONFIG.GROUND_Y;
        this.x        = gameWidth + 20;
        this.imgMap   = imgMap;

        // Floating phase oscillation for airborne obstacles
        this._phase   = Math.random() * Math.PI * 2;
        this.isDouble = typeDef.isDouble || false;
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
        const isFlying    = this.typeDef.flyingY;
        const groundLineY = canvasHeight - CONFIG.GROUND_Y;

        ctx.save();

        if (isFlying) {
            // Airborne floating object with smooth oscillation
            const bottom = this.typeDef.flyingBottom;
            const flyBob = Math.sin(this._phase * 1.5) * 5;
            const y      = canvasHeight - bottom - this.height + flyBob;
            this._drawFlyingObstacle(ctx, this.x, y, this.typeDef);
        } else {
            // Ground Tree: Roots firmly planted on the ground line (+2px overlap into dirt)
            const y = groundLineY - this.height + 2;

            if (this.isDouble) {
                // Double tree combo hazard
                const singleW = Math.floor(this.width * 0.55);
                this._drawTree(ctx, this.x, y, singleW, this.height, 'tree1');
                this._drawTree(ctx, this.x + singleW - 8, y + 2, singleW, this.height, 'tree2');
            } else {
                this._drawTree(ctx, this.x, y, this.width, this.height, this.typeDef.imgKey);
            }
        }

        ctx.restore();
    }

    _drawTree(ctx, x, y, w, h, imgKey) {
        const img = this.imgMap[imgKey];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
        } else {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x, y, w, h);
        }
    }

    _drawFlyingObstacle(ctx, x, y, def) {
        const img = this.imgMap[def.imgKey];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, this.width, this.height);
        } else {
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
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
