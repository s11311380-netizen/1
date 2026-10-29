/**
 * AudioManager — handles BGM loop and SFX playback.
 *
 * Autoplay policy compliance:
 *   - BGM is only started after the first user interaction (click / keydown).
 *   - SFX uses pre-loaded Audio objects with currentTime reset for instant replay.
 *   - Both BGM and SFX respect the global mute state independently.
 */
export class AudioManager {
    constructor() {
        // ── BGM ──────────────────────────────────────────────────────────────
        this.bgm = new Audio('./assets/audio/bgm.mp3');
        this.bgm.loop   = true;
        this.bgm.volume = 0.4;

        // ── SFX: jump ────────────────────────────────────────────────────────
        this.sfxJump = new Audio('./assets/audio/sfx_jump.wav');
        this.sfxJump.volume = 0.7;

        // ── SFX: fruit (eat) ─────────────────────────────────────────────────
        this.sfxFruit = new Audio('./assets/audio/sfx_fruit.mp3');
        this.sfxFruit.volume = 0.8;

        // ── SFX: explosion ────────────────────────────────────────────────────
        this.sfxExplosion = new Audio('./assets/audio/sfx_explosion.wav');
        this.sfxExplosion.volume = 0.7;

        // ── SFX: meteor ───────────────────────────────────────────────────────
        this.sfxMeteor = new Audio('./assets/audio/sfx_meteor.wav');
        this.sfxMeteor.volume = 0.65;

        // ── SFX: die — generated via Web Audio API ───────────────────────────
        this._audioCtx = null; // lazily created on first interaction

        // ── State ─────────────────────────────────────────────────────────────
        this.isMuted       = false;
        this.isMusicMuted  = false;
        this.isSfxMuted    = false;
        this.hasStartedBgm = false;
        this._userInteracted = false;
    }

    // ── Public: called once on first user interaction ────────────────────────
    onUserInteraction() {
        if (this._userInteracted) return;
        this._userInteracted = true;
        this._getAudioCtx();
    }

    // ── Public: start BGM (respects autoplay policy) ─────────────────────────
    startBgm() {
        if (this.isMusicMuted) return;
        if (!this._userInteracted) return;

        const p = this.bgm.play();
        if (p !== undefined) {
            p.then(() => {
                this.hasStartedBgm = true;
            }).catch(e => console.warn('[AudioManager] BGM autoplay blocked:', e));
        }
    }

    resumeBgm() {
        if (!this.hasStartedBgm || this.isMusicMuted) return;
        this.bgm.play().catch(e => console.warn('[AudioManager] BGM resume error:', e));
    }

    stopBgm() {
        this.bgm.pause();
    }

    // ── Public: SFX playback ─────────────────────────────────────────────────
    playJump() {
        if (this.isSfxMuted) return;
        this.sfxJump.currentTime = 0;
        this.sfxJump.play().catch(e => console.warn('[AudioManager] Jump SFX error:', e));
    }

    playFruit() {
        if (this.isSfxMuted) return;
        this.sfxFruit.currentTime = 0;
        this.sfxFruit.play().catch(e => console.warn('[AudioManager] Fruit SFX error:', e));
    }

    playExplosion() {
        if (this.isSfxMuted) return;
        this.sfxExplosion.currentTime = 0;
        this.sfxExplosion.play().catch(e => console.warn('[AudioManager] Explosion SFX error:', e));
    }

    playMeteor() {
        if (this.isSfxMuted) return;
        // Clone so multiple meteors don't cut each other off
        const s = this.sfxMeteor.cloneNode();
        s.volume = 0.55;
        s.play().catch(e => console.warn('[AudioManager] Meteor SFX error:', e));
    }

    /** Synthesised "game-over" sound using Web Audio API oscillator. */
    playDie() {
        if (this.isSfxMuted) return;
        const ctx = this._getAudioCtx();
        if (!ctx) return;

        [0, 0.12].forEach((startOffset, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            const freq = i === 0 ? 440 : 220;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + startOffset + 0.3);

            gain.gain.setValueAtTime(0.25, ctx.currentTime + startOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.4);

            osc.start(ctx.currentTime + startOffset);
            osc.stop(ctx.currentTime + startOffset + 0.45);
        });
    }

    /** Synthesised "score milestone" chime. */
    playScore() {
        if (this.isSfxMuted) return;
        const ctx = this._getAudioCtx();
        if (!ctx) return;

        [523, 659, 784].forEach((freq, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.08;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    }

    // ── Public: toggle BGM mute ───────────────────────────────────────────────
    toggleMusicMute() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.isMusicMuted) {
            this.bgm.pause();
        } else {
            this.resumeBgm();
        }
        return this.isMusicMuted;
    }

    // ── Public: toggle SFX mute ───────────────────────────────────────────────
    toggleSfxMute() {
        this.isSfxMuted = !this.isSfxMuted;
        return this.isSfxMuted;
    }

    // ── Legacy: single global mute ────────────────────────────────────────────
    toggleMute() {
        const newMuted = this.toggleMusicMute();
        this.isSfxMuted = newMuted;
        this.isMuted    = newMuted;
        return newMuted;
    }

    // ── Private ───────────────────────────────────────────────────────────────
    _getAudioCtx() {
        if (!this._audioCtx) {
            try {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('[AudioManager] Web Audio API not supported:', e);
                return null;
            }
        }
        if (this._audioCtx.state === 'suspended') {
            this._audioCtx.resume().catch(() => {});
        }
        return this._audioCtx;
    }
}
