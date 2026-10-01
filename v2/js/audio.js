export class AudioManager {
    constructor() {
        this.bgm = new Audio('./assets/audio/bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.5;

        this.sfxJump = new Audio('./assets/audio/sfx_jump.wav');
        
        this.isMuted = false;
        this.hasStartedBgm = false;
    }

    playJump() {
        if (!this.isMuted) {
            this.sfxJump.currentTime = 0;
            this.sfxJump.play().catch(e => console.warn('SFX Error:', e));
        }
    }

    startBgm() {
        if (!this.hasStartedBgm && !this.isMuted) {
            this.bgm.play().then(() => {
                this.hasStartedBgm = true;
            }).catch(e => console.warn('Autoplay prevented BGM:', e));
        } else if (this.hasStartedBgm && !this.isMuted) {
             this.bgm.play().catch(e => console.warn('BGM Error:', e));
        }
    }

    stopBgm() {
        this.bgm.pause();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.bgm.pause();
        } else if (this.hasStartedBgm) {
            this.bgm.play().catch(e => console.warn('BGM Error:', e));
        }
        return this.isMuted;
    }
}
