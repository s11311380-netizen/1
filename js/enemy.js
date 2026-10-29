import CONFIG from './config.js';

/**
 * Obstacle — Ground trees and floating airborne monsters.
 * Ground trees use `groundSink` from typeDef to push their roots firmly into ground.
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

        // Explosion state
        this.isExploding   = false;
        this.explodeFrame  = 0;
        this.isDead        = false; // true = fully exploded and should be removed
    }

    move(speed) {
        this.x      -= speed;
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

    triggerExplosion() {
        this.isExploding  = true;
        this.explodeFrame = 0;
    }

    updateExplosion() {
        if (!this.isExploding) return;
        const cfg = CONFIG.EXPLOSION;
        this.explodeFrame++;
        if (this.explodeFrame >= cfg.NUM_FRAMES * cfg.FRAME_DURATION) {
            this.isDead = true;
        }
    }

    draw(ctx, canvasHeight, explosionImg) {
        if (this.isDead) return;

        const isFlying    = this.typeDef.flyingY;
        const groundLineY = canvasHeight - CONFIG.GROUND_Y;

        if (this.isExploding) {
            // Draw explosion sprite at obstacle position
            const cfg   = CONFIG.EXPLOSION;
            const frame = Math.floor(this.explodeFrame / cfg.FRAME_DURATION);
            const safeFrame = Math.min(frame, cfg.NUM_FRAMES - 1);
            const sx    = safeFrame * cfg.FRAME_W;
            const drawY = isFlying
                ? canvasHeight - this.typeDef.flyingBottom - this.height
                : groundLineY - this.height;
            const drawX = this.x + this.width / 2 - cfg.FRAME_W / 2;

            if (explosionImg && explosionImg.complete && explosionImg.naturalWidth > 0) {
                ctx.drawImage(explosionImg, sx, 0, cfg.FRAME_W, cfg.FRAME_H,
                    drawX, drawY - cfg.FRAME_H / 2, cfg.FRAME_W, cfg.FRAME_H);
            } else {
                ctx.save();
                ctx.globalAlpha = 1 - (this.explodeFrame / (cfg.NUM_FRAMES * cfg.FRAME_DURATION));
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, drawY, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            this.updateExplosion();
            return;
        }

        ctx.save();

        if (isFlying) {
            const bottom = this.typeDef.flyingBottom;
            const flyBob = Math.sin(this._phase * 1.5) * 5;
            const y      = canvasHeight - bottom - this.height + flyBob;
            this._drawFlyingObstacle(ctx, this.x, y, this.typeDef);
        } else {
            const sink = this.typeDef.groundSink !== undefined ? this.typeDef.groundSink : 2;
            const y    = groundLineY - this.height + sink;

            if (this.isDouble) {
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

// ── Fruit ────────────────────────────────────────────────────────────────────

class Fruit {
    constructor(gameWidth, canvasHeight, imgMap) {
        this.x        = gameWidth + 20;
        this.width    = CONFIG.FRUIT.WIDTH;
        this.height   = CONFIG.FRUIT.HEIGHT;
        this.imgMap   = imgMap;
        // Random fruit type
        const types   = CONFIG.FRUIT.TYPES;
        this.imgKey   = types[Math.floor(Math.random() * types.length)];
        // Hover just above the ground
        this.groundLineY = canvasHeight - CONFIG.GROUND_Y;
        this.y        = this.groundLineY - this.height - 10;
        this.isDead   = false;

        // Gentle bob
        this._phase   = Math.random() * Math.PI * 2;
    }

    move(speed) {
        this.x      -= speed;
        this._phase += 0.06;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getRect() {
        return {
            left:   this.x + 2,
            right:  this.x + this.width - 2,
            top:    this.y,
            bottom: this.y + this.height,
        };
    }

    draw(ctx) {
        if (this.isDead) return;
        const bob = Math.sin(this._phase) * 4;
        const img = this.imgMap[this.imgKey];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x, this.y + bob, this.width, this.height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + bob, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ── Meteor ───────────────────────────────────────────────────────────────────

class Meteor {
    constructor(gameWidth) {
        this.x      = Math.random() * (gameWidth - 40) + 20;
        this.y      = -CONFIG.METEOR.SIZE;
        this.vy     = CONFIG.METEOR.SPEED_MIN + Math.random() * (CONFIG.METEOR.SPEED_MAX - CONFIG.METEOR.SPEED_MIN);
        this.vx     = (Math.random() - 0.5) * 2;
        this.size   = CONFIG.METEOR.SIZE;
        this.isDead = false;

        // Explosion state
        this.isExploding  = false;
        this.explodeFrame = 0;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight + this.size;
    }

    getRect() {
        const margin = 4;
        return {
            left:   this.x - this.size / 2 + margin,
            right:  this.x + this.size / 2 - margin,
            top:    this.y - this.size / 2 + margin,
            bottom: this.y + this.size / 2 - margin,
        };
    }

    triggerExplosion() {
        this.isExploding  = true;
        this.explodeFrame = 0;
    }

    draw(ctx, imgMap) {
        if (this.isDead) return;

        if (this.isExploding) {
            const cfg       = CONFIG.EXPLOSION;
            const frame     = Math.floor(this.explodeFrame / cfg.FRAME_DURATION);
            const safeFrame = Math.min(frame, cfg.NUM_FRAMES - 1);
            const sx        = safeFrame * cfg.FRAME_W;
            this.explodeFrame++;
            if (this.explodeFrame >= cfg.NUM_FRAMES * cfg.FRAME_DURATION) {
                this.isDead = true;
            }

            const explosionImg = imgMap['explosion'];
            if (explosionImg && explosionImg.complete && explosionImg.naturalWidth > 0) {
                ctx.drawImage(explosionImg, sx, 0, cfg.FRAME_W, cfg.FRAME_H,
                    this.x - cfg.FRAME_W / 2, this.y - cfg.FRAME_H / 2,
                    cfg.FRAME_W, cfg.FRAME_H);
            } else {
                ctx.save();
                ctx.globalAlpha = 1 - this.explodeFrame / (cfg.NUM_FRAMES * cfg.FRAME_DURATION);
                ctx.fillStyle = '#ff4400';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            return;
        }

        ctx.save();
        const meteorImg = imgMap['meteor'];
        if (meteorImg && meteorImg.complete && meteorImg.naturalWidth > 0) {
            ctx.drawImage(meteorImg, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else {
            // Fallback: draw a glowing orange/red circle
            const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.size / 2);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, '#ff8800');
            grad.addColorStop(1, '#cc2200');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            // Trail
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(this.x - this.vx * 3, this.y - this.vy * 3, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// ── EnemyManager ─────────────────────────────────────────────────────────────

export class EnemyManager {
    constructor(gameWidth) {
        this.gameWidth        = gameWidth;
        this.obstacles        = [];
        this.fruits           = [];
        this.meteors          = [];
        this.framesTillNext   = this._nextInterval();
        this.meteorFramesTill = this._nextMeteorInterval();
        this.imgMap           = {};
        this.canvasHeight     = CONFIG.GAME_HEIGHT;

        // Tracks distance for fruit spawning
        this._fruitDistanceTravelled = 0;
        this._nextFruitAtDistance    = CONFIG.FRUIT.SPAWN_INTERVAL;

        this._isNight = false;
    }

    setImages(imgMap) {
        this.imgMap = imgMap;
    }

    setIsNight(val) {
        this._isNight = val;
        if (!val) {
            // Switching to day: stop new meteors; let existing ones expire
            this.meteorFramesTill = 9999;
        } else {
            this.meteorFramesTill = this._nextMeteorInterval();
        }
    }

    update(speed, canvasHeight) {
        this.canvasHeight = canvasHeight || CONFIG.GAME_HEIGHT;

        // ── Regular obstacles ──
        this.framesTillNext--;
        if (this.framesTillNext <= 0) {
            this._spawnRandom();
            this.framesTillNext = this._nextInterval();
        }

        this.obstacles = this.obstacles.filter(obs => {
            obs.move(speed);
            if (obs.isDead) return false;
            return !obs.isOffScreen();
        });

        // ── Fruit distance tracking ──
        this._fruitDistanceTravelled += speed;
        if (this._fruitDistanceTravelled >= this._nextFruitAtDistance) {
            this._spawnFruit(this.canvasHeight);
            this._nextFruitAtDistance = this._fruitDistanceTravelled + CONFIG.FRUIT.SPAWN_INTERVAL;
        }

        this.fruits = this.fruits.filter(f => {
            f.move(speed);
            return !f.isOffScreen() && !f.isDead;
        });

        // ── Meteors (night only) ──
        if (this._isNight) {
            this.meteorFramesTill--;
            if (this.meteorFramesTill <= 0) {
                this.meteors.push(new Meteor(this.gameWidth));
                this.meteorFramesTill = this._nextMeteorInterval();
            }
        }

        this.meteors = this.meteors.filter(m => {
            if (!m.isDead && !m.isExploding) m.move();
            return !m.isDead && !m.isOffScreen(this.canvasHeight);
        });
    }

    /**
     * Check collision between player and obstacles/meteors.
     * Returns an object describing what was hit:
     *   { hit: false }                   — no collision
     *   { hit: true, isMeteor: true }    — meteor hit (stars DO block meteors)
     *   { hit: true, isMeteor: false }   — tree/flying obstacle hit
     */
    checkCollision(playerRect) {
        for (const obs of this.obstacles) {
            if (obs.isDead || obs.isExploding) continue;
            const r = obs.getRect();
            if (this._rectOverlap(playerRect, r)) {
                return { hit: true, isMeteor: false, obstacle: obs };
            }
        }
        for (const m of this.meteors) {
            if (m.isDead || m.isExploding) continue;
            const r = m.getRect();
            if (this._rectOverlap(playerRect, r)) {
                return { hit: true, isMeteor: true, meteor: m };
            }
        }
        return { hit: false };
    }

    /**
     * Check if player overlaps any fruit. Returns the fruit if yes, null otherwise.
     */
    checkFruitCollision(playerRect) {
        for (const f of this.fruits) {
            if (f.isDead) continue;
            if (this._rectOverlap(playerRect, f.getRect())) {
                return f;
            }
        }
        return null;
    }

    /**
     * Explode a random ground obstacle (or meteor).
     * Returns true if something was exploded.
     */
    explodeRandom(audioMgr) {
        // Try ground obstacles first
        const candidates = this.obstacles.filter(o => !o.isDead && !o.isExploding);
        if (candidates.length > 0) {
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            target.triggerExplosion();
            if (audioMgr) audioMgr.playExplosion();
            return true;
        }
        // If no obstacles, try meteors
        const mCandidates = this.meteors.filter(m => !m.isDead && !m.isExploding);
        if (mCandidates.length > 0) {
            const target = mCandidates[Math.floor(Math.random() * mCandidates.length)];
            target.triggerExplosion();
            if (audioMgr) audioMgr.playExplosion();
            return true;
        }
        return false;
    }

    reset() {
        this.obstacles             = [];
        this.fruits                = [];
        this.meteors               = [];
        this.framesTillNext        = this._nextInterval();
        this.meteorFramesTill      = 9999;
        this._fruitDistanceTravelled = 0;
        this._nextFruitAtDistance  = CONFIG.FRUIT.SPAWN_INTERVAL;
        this._isNight              = false;
    }

    draw(ctx, canvasHeight) {
        const expImg = this.imgMap['explosion'];
        for (const obs of this.obstacles) {
            obs.draw(ctx, canvasHeight, expImg);
        }
        for (const f of this.fruits) {
            f.draw(ctx);
        }
        for (const m of this.meteors) {
            m.draw(ctx, this.imgMap);
        }
    }

    _spawnRandom() {
        const types   = CONFIG.OBSTACLE.TYPES;
        const typeDef = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push(new Obstacle(typeDef, this.gameWidth, this.imgMap));
    }

    _spawnFruit(canvasHeight) {
        this.fruits.push(new Fruit(this.gameWidth, canvasHeight, this.imgMap));
    }

    _nextInterval() {
        const { MIN_INTERVAL, MAX_INTERVAL } = CONFIG.OBSTACLE;
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    }

    _nextMeteorInterval() {
        const { MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL } = CONFIG.METEOR;
        return Math.floor(Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL + 1)) + MIN_SPAWN_INTERVAL;
    }

    _rectOverlap(a, b) {
        return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
    }
}
