// =============================================
// config.js — 遊戲全域設定參數
// 所有魔法數字集中在此，方便調整平衡
// =============================================

const CONFIG = {
    // ---------- 畫布 / 場地 ----------
    GAME_WIDTH:  900,
    GAME_HEIGHT: 300,
    GROUND_Y:    10,       // 地面厚度（px），恐龍的 bottom offset

    // ---------- 玩家 ----------
    PLAYER: {
        START_LEFT:    80,       // 恐龍距左側距離（px）
        WIDTH:         50,
        HEIGHT:        60,
        DUCK_WIDTH:    70,
        DUCK_HEIGHT:   35,
        JUMP_FORCE:   -18,       // 跳躍初速（負值 = 向上）
        GRAVITY:        1.0,     // 每 frame 增加的下落速度
        MAX_FALL:      20,       // 最大下落速度
    },

    // ---------- 分數 ----------
    SCORE: {
        INCREMENT_PER_FRAME: 0.1,   // 每 frame 增加分數
        HIGH_SCORE_KEY: 'dinoHighScore',
    },

    // ---------- 速度 ----------
    SPEED: {
        INITIAL:      4,        // 初始像素/frame
        MAX:         14,        // 最高速度上限
        INCREMENT:    0.002,    // 每 frame 速度遞增量
    },

    // ---------- 障礙物 ----------
    OBSTACLE: {
        MIN_INTERVAL: 60,       // 最短生成間隔（frame）
        MAX_INTERVAL: 120,      // 最長生成間隔（frame）
        TYPES: [
            // 仙人掌（矮）
            { cssClass: 'obstacle obstacle-cactus', width: 25, height: 45, flyingY: false },
            // 仙人掌（高）
            { cssClass: 'obstacle obstacle-cactus', width: 25, height: 60, flyingY: false },
            // 雙仙人掌
            { cssClass: 'obstacle obstacle-double', width: 45, height: 45, flyingY: false },
            // 飛行障礙物（低空）
            { cssClass: 'obstacle obstacle-flying', width: 40, height: 30, flyingY: true, flyingBottom: 60 },
            // 飛行障礙物（高空）
            { cssClass: 'obstacle obstacle-flying', width: 40, height: 30, flyingY: true, flyingBottom: 100 },
        ],
    },

    // ---------- 夜間模式 ----------
    NIGHT_SCORE_THRESHOLD: 500,    // 達到此分數後自動切換夜間（0 = 手動）
};

export default CONFIG;
