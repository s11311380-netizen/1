import CONFIG from './config.js';

class Obstacle {
    constructor(typeDef, gameWidth) {
        this.typeDef   = typeDef;
        this.width     = typeDef.width;
        this.height    = typeDef.height;
        this.groundY   = CONFIG.GROUND_Y;
        this.x = gameWidth + 20;
    }

    move(speed) {
        this.x -= speed;
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
        const bottom = this.typeDef.flyingY ? this.typeDef.flyingBottom : this.groundY;
        const y = canvasHeight - bottom - this.height;
        
        ctx.fillStyle = this.typeDef.color || 'red';
        ctx.fillRect(this.x, y, this.width, this.height);
    }
}

export class EnemyManager {
    constructor(gameWidth) {
        this.gameWidth  = gameWidth;
        this.obstacles  = [];
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
        this.obstacles = [];
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
        const obs = new Obstacle(typeDef, this.gameWidth);
        this.obstacles.push(obs);
    }

    _nextInterval() {
        const { MIN_INTERVAL, MAX_INTERVAL } = CONFIG.OBSTACLE;
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    }
}
