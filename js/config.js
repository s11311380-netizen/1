const CONFIG = {
    GAME_WIDTH:  900,
    GAME_HEIGHT: 300,
    GROUND_Y:    20,  // Ground offset from bottom

    PLAYER: {
        START_LEFT:    80,
        WIDTH:         60,
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
            description: '重裝衝鋒・6幀剛猛踩踏 🛡️',
            imgSrc: './assets/images/dinosaur3.png',
            frameW: 61,
            frameH: 60,
            numFrames: 6,
            color: '#2ecc71',
        },
        {
            id: 'dino4',
            name: '琥珀迅猛龍',
            description: '狂暴獵捕・4幀獵殺姿態 ⚡',
            imgSrc: './assets/images/dinosaur4.png',
            frameW: 85,
            frameH: 55,
            numFrames: 4,
            color: '#d35400',
        },
        {
            id: 'dino5',
            name: '銀羽似鳥龍',
            description: '靈巧飛馳・4幀輕盈騰躍 💨',
            imgSrc: './assets/images/dinosaur5.png',
            frameW: 62,
            frameH: 61,
            numFrames: 4,
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
        MIN_INTERVAL: 35,
        MAX_INTERVAL: 75,
        TYPES: [
            // Ground Trees (roots firmly grounded)
            { type: 'tree1', width: 44, height: 55, flyingY: false, imgKey: 'tree1', groundSink: 12 },
            { type: 'tree2', width: 44, height: 55, flyingY: false, imgKey: 'tree2', groundSink: 12 },
            { type: 'tree3', width: 44, height: 55, flyingY: false, imgKey: 'tree3', groundSink: 12 },
            { type: 'tree4', width: 46, height: 52, flyingY: false, imgKey: 'tree4', groundSink: 12 },
            { type: 'tree5', width: 46, height: 58, flyingY: false, imgKey: 'tree5', groundSink: 12 },
            { type: 'tree6', width: 48, height: 56, flyingY: false, imgKey: 'tree6', groundSink: 12 },
            { type: 'tree7', width: 46, height: 72, flyingY: false, imgKey: 'tree7', groundSink: 4 },
            { type: 'tree8', width: 68, height: 65, flyingY: false, imgKey: 'tree8', groundSink: 4 },
            // Double Trees (Combo hazard for high difficulty!)
            { type: 'doubleTree', width: 88, height: 55, flyingY: false, imgKey: 'tree1', isDouble: true, groundSink: 12 },

            // Floating Airborne Obstacles (3 distinct monsters across 3 flight altitudes)
            { type: 'flyingLow',  width: 28, height: 32, flyingY: true, flyingBottom: 55,  imgKey: 'fly1' },
            { type: 'flyingMid',  width: 36, height: 32, flyingY: true, flyingBottom: 95,  imgKey: 'fly2' },
            { type: 'flyingHigh', width: 36, height: 34, flyingY: true, flyingBottom: 135, imgKey: 'fly3' },
        ],
    },

    // Day/Night switching: every 100 score points
    DAY_NIGHT: {
        SCORE_INTERVAL: 100,
    },

    // Fruit system: spawn a fruit every 50 score points
    FRUIT: {
        SCORE_INTERVAL: 50,
        WIDTH:  28,
        HEIGHT: 28,
        // 5 fruit images
        TYPES: ['fruit1','fruit2','fruit3','fruit4','fruit5'],
    },

    // Meteor system (night only)
    METEOR: {
        MIN_SPAWN_INTERVAL: 80,   // frames between meteors (min)
        MAX_SPAWN_INTERVAL: 180,
        SPEED_MIN: 3.5,
        SPEED_MAX: 7.0,
        SIZE: 64, // Enlarged meteor size (64px)
    },

    // Explosion sprite sheet: 512×64, 8 frames (64×64 each)
    EXPLOSION: {
        FRAME_W: 64,
        FRAME_H: 64,
        NUM_FRAMES: 8,
        FRAME_DURATION: 3, // frames per sprite frame
    },

    AUDIO: {
        BGM_SRC:           './assets/audio/bgm.mp3',
        SFX_JUMP_SRC:      './assets/audio/sfx_jump.wav',
        SFX_FRUIT_SRC:     './assets/audio/sfx_fruit.mp3',
        SFX_EXPLOSION_SRC: './assets/audio/sfx_explosion.wav',
        SFX_METEOR_SRC:    './assets/audio/sfx_meteor.wav',
        BGM_VOLUME:        0.4,
        SFX_VOLUME:        0.7,
    },

    ASSETS: {
        BG_DAY_SRC:      './assets/images/bg_day.png',
        BG_NIGHT_SRC:    './assets/images/bg_night.png',
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
        // Fruits
        FRUIT1_SRC:      './assets/images/fruit1.png',
        FRUIT2_SRC:      './assets/images/fruit2.png',
        FRUIT3_SRC:      './assets/images/fruit3.png',
        FRUIT4_SRC:      './assets/images/fruit4.png',
        FRUIT5_SRC:      './assets/images/fruit5.png',
        // Meteor and explosion
        METEOR_SRC:      './assets/images/meteor.png',
        EXPLOSION_SRC:   './assets/images/explosion.png',
    },
};

export default CONFIG;
