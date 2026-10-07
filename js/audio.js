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

        // ── SFX: die — generated via Web Audio API (no extra file needed) ───
        this._audioCtx = null; // lazily created on first interaction

        // ── State ─────────────────────────────────────────────────────────────
        this.isMuted       = false;
        this.isMusicMuted  = false; // separate music mute toggle
        this.isSfxMuted    = false; // separate SFX mute toggle
        this.hasStartedBgm = false;
        this._userInteracted = false;
    }

    // ── Public: called once on first user interaction ────────────────────────
    onUserInteraction() {
        if (this._userInteracted) return;
        this._userInteracted = true;

        // Unlock Web Audio API context (required for Chrome)
        this._getAudioCtx();
    }

    // ── Public: start BGM (respects autoplay policy) ─────────────────────────
    startBgm() {
        if (this.isMusicMuted) return;
        if (!this._userInteracted) return; // wait for first interaction

        const p = this.bgm.play();
        if (p !== undefined) {
            p.then(() => {
                this.hasStartedBgm = true;
            }).catch(e => console.warn('[AudioManager] BGM autoplay blocked:', e));
        }
    }

    // ── Public: resume BGM after mute-off ────────────────────────────────────
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

    /** Synthesised "game-over" sound using Web Audio API oscillator. */
    playDie() {
        if (this.isSfxMuted) return;
        const ctx = this._getAudioCtx();
        if (!ctx) return;

        // Descending two-tone hit
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

    // ── Legacy: single global mute (kept for backward compat) ─────────────────
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
        // Resume if suspended (Chrome requires user gesture)
        if (this._audioCtx.state === 'suspended') {
            this._audioCtx.resume().catch(() => {});
        }
        return this._audioCtx;
    }
}
