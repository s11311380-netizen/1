import CONFIG from './config.js';

/**
 * Obstacle — single on-screen hazard.
 * Hitbox geometry is identical to the original implementation.
 * Visual drawing uses coloured rounded-rect shapes with outline for clarity.
 */
class Obstacle {
    constructor(typeDef, gameWidth) {
        this.typeDef = typeDef;
        this.width   = typeDef.width;
        this.height  = typeDef.height;
        this.groundY = CONFIG.GROUND_Y;
        this.x       = gameWidth + 20;

        // Animation: gentle oscillation for flying obstacles
        this._phase = Math.random() * Math.PI * 2;
    }

    move(speed) {
        this.x -= speed;
        this._phase += 0.08; // advance oscillation each frame
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    /** Hitbox rect — UNCHANGED from original to preserve collision feel. */
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

        // Flying obstacles bob gently
        const flyBob = isFlying ? Math.sin(this._phase) * 4 : 0;
        const y = canvasHeight - bottom - this.height + flyBob;

        ctx.save();

        if (isFlying) {
            // Flying enemy: oval body + wing shapes
            this._drawFlyingEnemy(ctx, this.x, y, this.width, this.height);
        } else {
            // Ground cactus / rock obstacle
            this._drawGroundObstacle(ctx, this.x, y, this.width, this.height, this.typeDef.color);
        }

        ctx.restore();
    }

    _drawGroundObstacle(ctx, x, y, w, h, color) {
        // Main body
        ctx.fillStyle = color || '#27ae60';
        this._roundRect(ctx, x, y, w, h, 4);
        ctx.fill();

        // Dark outline
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, x, y, w, h, 4);
        ctx.stroke();

        // Highlight strip
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this._roundRect(ctx, x + 3, y + 3, Math.max(w - 6, 4), Math.min(h / 3, 10), 2);
        ctx.fill();

        // Spikes on top (cactus feel)
        ctx.fillStyle = color || '#27ae60';
        const spikeCount = Math.max(1, Math.floor(w / 12));
        const spikeW = Math.max(4, w / (spikeCount * 2));
        for (let i = 0; i < spikeCount; i++) {
            const sx = x + (w / (spikeCount + 1)) * (i + 1) - spikeW / 2;
            ctx.beginPath();
            ctx.moveTo(sx, y);
            ctx.lineTo(sx + spikeW / 2, y - 8);
            ctx.lineTo(sx + spikeW, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawFlyingEnemy(ctx, x, y, w, h) {
        // Body
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Left wing
        ctx.fillStyle = 'rgba(155, 89, 182, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h / 2);
        ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x - w * 0.2, y + h * 0.1);
        ctx.quadraticCurveTo(x, y + h * 0.5, x + 4, y + h / 2);
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(x + w - 4, y + h / 2);
        ctx.quadraticCurveTo(x + w + w * 0.4, y - h * 0.4, x + w + w * 0.2, y + h * 0.1);
        ctx.quadraticCurveTo(x + w, y + h * 0.5, x + w - 4, y + h / 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.4, h * 0.13, 0, Math.PI * 2);
        ctx.arc(x + w * 0.65, y + h * 0.4, h * 0.13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x + w * 0.37, y + h * 0.42, h * 0.065, 0, Math.PI * 2);
        ctx.arc(x + w * 0.67, y + h * 0.42, h * 0.065, 0, Math.PI * 2);
        ctx.fill();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

// ── EnemyManager ─────────────────────────────────────────────────────────────

export class EnemyManager {
    constructor(gameWidth) {
        this.gameWidth      = gameWidth;
        this.obstacles      = [];
        this.framesTillNext = this._nextInterval();
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
        this.obstacles.push(new Obstacle(typeDef, this.gameWidth));
    }

    _nextInterval() {
        const { MIN_INTERVAL, MAX_INTERVAL } = CONFIG.OBSTACLE;
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    }
}
