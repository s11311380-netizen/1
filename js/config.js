const CONFIG = {
    GAME_WIDTH:  900,
    GAME_HEIGHT: 300,
    GROUND_Y:    20, // Ground offset

    PLAYER: {
        START_LEFT:    80,
        WIDTH:         50,
        HEIGHT:        60,
        DUCK_WIDTH:    70,
        DUCK_HEIGHT:   35,
        JUMP_FORCE:   -18,
        GRAVITY:        1.0,
        MAX_FALL:      20,
    },

    SCORE: {
        INCREMENT_PER_FRAME: 0.1,
        HIGH_SCORE_KEY: 'dinoHighScore',
    },

    SPEED: {
        INITIAL:      4,
        MAX:         14,
        INCREMENT:    0.002,
    },

    OBSTACLE: {
        MIN_INTERVAL: 60,
        MAX_INTERVAL: 120,
        TYPES: [
            { cssClass: 'obstacle-cactus', width: 25, height: 45, flyingY: false, color: 'green' },
            { cssClass: 'obstacle-cactus', width: 25, height: 60, flyingY: false, color: 'green' },
            { cssClass: 'obstacle-double', width: 45, height: 45, flyingY: false, color: 'darkgreen' },
            { cssClass: 'obstacle-flying', width: 40, height: 30, flyingY: true, flyingBottom: 60, color: 'red' },
            { cssClass: 'obstacle-flying', width: 40, height: 30, flyingY: true, flyingBottom: 100, color: 'darkred' },
        ],
    },

    NIGHT_SCORE_THRESHOLD: 500,
};

export default CONFIG;
