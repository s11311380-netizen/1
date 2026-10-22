const CONFIG = {
    GAME_WIDTH:  900,
    GAME_HEIGHT: 300,
    GROUND_Y:    20,  // Ground offset from bottom

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

    // 4 Distinct dinosaur characters with clean transparent sprites
    CHARACTERS: [
        {
            id: 'stego',
            name: '經典劍龍',
            description: '平衡型・經典手感',
            imgSrc: './assets/images/player.png',
            isSheet: false,
            srcX: 0, srcY: 0, srcW: 190, srcH: 95,
            color: '#2ecc71',
        },
        {
            id: 'raptor',
            name: '疾速迅猛龍',
            description: '敏捷型・6幀奔跑動畫 🔥',
            imgSrc: './assets/images/char2.png',
            isSheet: true,
            frameW: 50, frameH: 42, numFrames: 6,
            srcX: 0, srcY: 0,
            color: '#3498db',
        },
        {
            id: 'bronto',
            name: '長頸腕龍',
            description: '巨型恐龍・穩健步伐',
            imgSrc: './assets/images/char3.png',
            isSheet: false,
            srcX: 0, srcY: 0, srcW: 238, srcH: 170,
            color: '#9b59b6',
        },
        {
            id: 'rex',
            name: '霸氣暴龍',
            description: '威猛型・霸王氣場 ⚡',
            imgSrc: './assets/images/char_rex.png',
            isSheet: false,
            srcX: 0, srcY: 0, srcW: 175, srcH: 177,
            color: '#e67e22',
        },
    ],

    SCORE: {
        INCREMENT_PER_FRAME: 0.1,
        HIGH_SCORE_KEY: 'dinoHighScore',
    },

    SPEED: {
        INITIAL:      4,
        MAX:         16,
        INCREMENT:    0.003,
    },

    OBSTACLE: {
        MIN_INTERVAL: 45,
        MAX_INTERVAL: 105,
        TYPES: [
            // Ground trees (clean standalone transparent sprites)
            { type: 'tree1', width: 44, height: 55, flyingY: false,
              imgKey: 'tree1', imgW: 48, imgH: 60 },
            { type: 'tree2', width: 44, height: 55, flyingY: false,
              imgKey: 'tree2', imgW: 48, imgH: 60 },
            { type: 'tree3', width: 44, height: 55, flyingY: false,
              imgKey: 'tree3', imgW: 48, imgH: 60 },
            { type: 'darkTree', width: 45, height: 70, flyingY: false,
              imgKey: 'darkTree', imgW: 58, imgH: 89 },
            // Flying obstacles with animated wing flap (2 frames: 14x16 each)
            { type: 'flyingLow', width: 32, height: 36, flyingY: true, flyingBottom: 55,
              imgKey: 'flying', frameW: 14, frameH: 16, numFrames: 2 },
            { type: 'flyingMid', width: 32, height: 36, flyingY: true, flyingBottom: 95,
              imgKey: 'flying', frameW: 14, frameH: 16, numFrames: 2 },
            { type: 'flyingHigh', width: 32, height: 36, flyingY: true, flyingBottom: 135,
              imgKey: 'flying', frameW: 14, frameH: 16, numFrames: 2 },
        ],
    },

    NIGHT_SCORE_THRESHOLD: 500,

    AUDIO: {
        BGM_SRC:      './assets/audio/bgm.mp3',
        SFX_JUMP_SRC: './assets/audio/sfx_jump.wav',
        BGM_VOLUME:   0.4,
        SFX_VOLUME:   0.7,
    },

    ASSETS: {
        PLAYER_SRC:      './assets/images/player.png',
        BG_SRC:          './assets/images/background.png',
        CHAR2_SRC:       './assets/images/char2.png',
        CHAR3_SRC:       './assets/images/char3.png',
        CHAR_REX_SRC:    './assets/images/char_rex.png',
        TREE1_SRC:       './assets/images/obstacle_tree1.png',
        TREE2_SRC:       './assets/images/obstacle_tree2.png',
        TREE3_SRC:       './assets/images/obstacle_tree3.png',
        DARK_TREE_SRC:   './assets/images/obstacle_dark_tree.png',
        FLYING_SRC:      './assets/images/obstacle_flying.png',
    },
};

export default CONFIG;
