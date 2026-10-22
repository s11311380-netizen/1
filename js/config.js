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

    // Character definitions for the selection screen
    CHARACTERS: [
        {
            id: 'stego',
            name: '劍龍',
            description: '平衡型',
            imgSrc: './assets/images/player.png',
            // single image (190×95), no sheet — animated via canvas transforms
            isSheet: false,
            srcX: 0, srcY: 0, srcW: 190, srcH: 95,
            // tint colour shown in selection card
            color: '#2ecc71',
        },
        {
            id: 'raptor',
            name: '迅猛龍',
            description: '速度型 🔥',
            imgSrc: './assets/images/char2.png',
            // sprite sheet: 6 walk frames × 74px wide, 50px tall (white bg, use globalCompositeOperation)
            isSheet: true,
            frameW: 74, frameH: 50, numFrames: 6,
            srcX: 0, srcY: 0, srcW: 444, srcH: 50,
            // white bg → handled in player draw with ctx trick
            whiteBackground: true,
            color: '#5dade2',
        },
        {
            id: 'bronto',
            name: '腕龍',
            description: '重型防守',
            imgSrc: './assets/images/char3.png',
            isSheet: false,
            srcX: 0, srcY: 0, srcW: 210, srcH: 195,
            purpleBackground: true,  // purple bg removed via globalCompositeOperation
            color: '#8e44ad',
        },
    ],

    SCORE: {
        INCREMENT_PER_FRAME: 0.1,
        HIGH_SCORE_KEY: 'dinoHighScore',
    },

    SPEED: {
        INITIAL:      4,
        MAX:         16,       // slightly higher max for more challenge
        INCREMENT:    0.003,   // faster ramp-up (was 0.002)
    },

    OBSTACLE: {
        MIN_INTERVAL: 50,      // shorter min gap (harder)
        MAX_INTERVAL: 110,
        TYPES: [
            // Ground trees (image-based)
            { type: 'tree1', width: 48, height: 70, flyingY: false,
              imgKey: 'tree1', imgW: 60, imgH: 85 },
            { type: 'tree2', width: 55, height: 78, flyingY: false,
              imgKey: 'tree2', imgW: 60, imgH: 85 },
            { type: 'darkTree', width: 55, height: 80, flyingY: false,
              imgKey: 'darkTree', imgW: 200, imgH: 120 },
            // Double tree (stacked — harder to jump)
            { type: 'doubleTree', width: 90, height: 70, flyingY: false,
              imgKey: 'tree1', imgW: 60, imgH: 85, double: true },
            // Flying obstacles — two heights
            { type: 'flying1', width: 36, height: 36, flyingY: true, flyingBottom: 65,
              imgKey: 'flying', frameW: 27, imgH: 30, numFrames: 1 },
            { type: 'flying2', width: 36, height: 36, flyingY: true, flyingBottom: 105,
              imgKey: 'flying', frameW: 27, imgH: 30, numFrames: 1 },
            // High-altitude flyer (extra hard to duck under)
            { type: 'flying3', width: 36, height: 36, flyingY: true, flyingBottom: 140,
              imgKey: 'flying', frameW: 27, imgH: 30, numFrames: 1 },
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
        TREE1_SRC:       './assets/images/obstacle_tree1.png',
        TREE2_SRC:       './assets/images/obstacle_tree2.png',
        DARK_TREE_SRC:   './assets/images/obstacle_dark_tree.png',
        FLYING_SRC:      './assets/images/obstacle_flying.png',
    },
};

export default CONFIG;
