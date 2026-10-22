const CONFIG = {
    GAME_WIDTH:  900,
    GAME_HEIGHT: 300,
    GROUND_Y:    20,  // Ground offset from bottom

    PLAYER: {
        START_LEFT:    80,
        WIDTH:         60,   // slightly wider to show running legs clearly
        HEIGHT:        55,
        DUCK_WIDTH:    75,
        DUCK_HEIGHT:   32,
        JUMP_FORCE:   -18,
        GRAVITY:        1.0,
        MAX_FALL:      20,
    },

    // 5 Distinct Dinosaur Characters — EVERY ONE HAS A FULL RUNNING ANIMATION SPRITE SHEET!
    CHARACTERS: [
        {
            id: 'dino1',
            name: '金橙疾速龍',
            description: '敏捷獵手・6幀極速奔跑 🔥',
            imgSrc: './assets/images/dinosaur1.png',
            frameW: 94,
            frameH: 49,
            numFrames: 6,
            color: '#e67e22',
        },
        {
            id: 'dino2',
            name: '青翠迅猛龍',
            description: '叢林霸主・6幀流暢步伐 🌿',
            imgSrc: './assets/images/dinosaur2.png',
            frameW: 50,
            frameH: 42,
            numFrames: 6,
            color: '#27ae60',
        },
        {
            id: 'dino3',
            name: '翡翠厚頭龍',
            description: '重裝衝鋒・4幀剛猛衝鋒 🛡️',
            imgSrc: './assets/images/dinosaur3.png',
            frameW: 62,
            frameH: 54,
            numFrames: 4,
            color: '#2ecc71',
        },
        {
            id: 'dino4',
            name: '琥珀迅猛龍',
            description: '狂暴獵捕・4幀獵殺姿態 ⚡',
            imgSrc: './assets/images/dinosaur4.png',
            frameW: 84,
            frameH: 46,
            numFrames: 4,
            color: '#d35400',
        },
        {
            id: 'dino5',
            name: '銀羽似鳥龍',
            description: '靈巧飛馳・5幀輕盈騰躍 💨',
            imgSrc: './assets/images/dinosaur5.png',
            frameW: 75,
            frameH: 58,
            numFrames: 5,
            color: '#95a5a6',
        },
    ],

    SCORE: {
        INCREMENT_PER_FRAME: 0.12,
        HIGH_SCORE_KEY: 'dinoHighScore',
    },

    // Higher difficulty settings: faster ramp-up and higher max speed!
    SPEED: {
        INITIAL:      4.5,
        MAX:         17.0,
        INCREMENT:    0.0035,
    },

    // Obstacle difficulty settings: denser spawns (shorter intervals)
    OBSTACLE: {
        MIN_INTERVAL: 35,     // Harder: min frames between obstacles down from 60 to 35
        MAX_INTERVAL: 75,     // Harder: max frames down from 120 to 75
        TYPES: [
            // Ground Trees (8 different species, roots firmly grounded)
            { type: 'tree1', width: 44, height: 55, flyingY: false, imgKey: 'tree1' },
            { type: 'tree2', width: 44, height: 55, flyingY: false, imgKey: 'tree2' },
            { type: 'tree3', width: 44, height: 55, flyingY: false, imgKey: 'tree3' },
            { type: 'tree4', width: 46, height: 52, flyingY: false, imgKey: 'tree4' },
            { type: 'tree5', width: 46, height: 58, flyingY: false, imgKey: 'tree5' },
            { type: 'tree6', width: 48, height: 56, flyingY: false, imgKey: 'tree6' },
            { type: 'tree7', width: 46, height: 72, flyingY: false, imgKey: 'tree7' },
            { type: 'tree8', width: 68, height: 65, flyingY: false, imgKey: 'tree8' },
            // Double Trees (Combo hazard for high difficulty!)
            { type: 'doubleTree', width: 88, height: 55, flyingY: false, imgKey: 'tree1', isDouble: true },

            // Floating Airborne Obstacles (3 distinct monsters across 3 flight altitudes)
            { type: 'flyingLow',  width: 28, height: 32, flyingY: true, flyingBottom: 55,  imgKey: 'fly1' },
            { type: 'flyingMid',  width: 36, height: 32, flyingY: true, flyingBottom: 95,  imgKey: 'fly2' },
            { type: 'flyingHigh', width: 36, height: 34, flyingY: true, flyingBottom: 135, imgKey: 'fly3' },
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
        BG_SRC:          './assets/images/background.png',
        // 5 Dinosaurs
        DINO1_SRC:       './assets/images/dinosaur1.png',
        DINO2_SRC:       './assets/images/dinosaur2.png',
        DINO3_SRC:       './assets/images/dinosaur3.png',
        DINO4_SRC:       './assets/images/dinosaur4.png',
        DINO5_SRC:       './assets/images/dinosaur5.png',
        // 8 Trees
        TREE1_SRC:       './assets/images/obstacle_tree1.png',
        TREE2_SRC:       './assets/images/obstacle_tree2.png',
        TREE3_SRC:       './assets/images/obstacle_tree3.png',
        TREE4_SRC:       './assets/images/obstacle_tree4.png',
        TREE5_SRC:       './assets/images/obstacle_tree5.png',
        TREE6_SRC:       './assets/images/obstacle_tree6.png',
        TREE7_SRC:       './assets/images/obstacle_tree7.png',
        TREE8_SRC:       './assets/images/obstacle_tree8.png',
        // 3 Flying airborne monsters
        FLY1_SRC:        './assets/images/obstacle_flying1.png',
        FLY2_SRC:        './assets/images/obstacle_flying2.png',
        FLY3_SRC:        './assets/images/obstacle_flying3.png',
    },
};

export default CONFIG;
