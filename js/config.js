/**
 * ==========================================================================
 * 遊戲設定與常數配置模組 (config.js)
 * 集中管理畫布尺寸、速度曲線、計分頻率、角色碰撞、障礙物生成等核心參數
 * ==========================================================================
 */

export const CONFIG = {
    // 畫布與舞台設定
    CANVAS: {
        WIDTH: 1000,
        HEIGHT: 330
    },

    // 遊戲物理與主循環
    GAME: {
        BASE_SPEED: 6,                     // 初始移動速度 (px/frame)
        SPEED_INCREMENT_INTERVAL: 100,     // 每獲得多少分增加一次速度
        SPEED_INCREMENT_AMOUNT: 0.7,       // 每次提升的速度量 (px/frame)
        SCORE_INTERVAL_MS: 100,            // 每獲得 1 分之時間間隔 (毫秒)
        TICK_INTERVAL_MS: 20               // 遊戲主循環週期 (50 FPS)
    },

    // 玩家角色 (恐龍) 數值設定
    PLAYER: {
        JUMP_DURATION_MS: 650,             // 跳躍滯空與動畫時間 (毫秒)
        INITIAL_HEALTH: 1,                 // 玩家初始生命值 (預設 1 點血量，撞擊即結束)
        COLLISION_PADDING: {               // 碰撞箱內縮補償 (提升遊戲手感與容錯率)
            LEFT: 8,
            RIGHT: 8,
            TOP: 8,
            BOTTOM: 5
        }
    },

    // 障礙物與敵人生成設定
    OBSTACLES: {
        BASE_SPAWN_DELAY: 1500,            // 初始生成間隔 (毫秒)
        MIN_SPAWN_DELAY: 650,              // 最短生成間隔下限 (毫秒)
        SPAWN_RATE_SCALE: 2.5,             // 依分數動態縮短生成時間之係數
        BIRD_SPAWN_CHANCE: 0.25,           // 飛行翼手龍出現機率
        DOUBLE_CACTUS_CHANCE: 0.35,        // 雙仙人掌出現機率
        SMALL_CACTUS_CHANCE: 0.30,         // 小仙人掌出現機率
        BIRD_HEIGHTS: [105, 145, 185],     // 翼手龍三種飛行高度 (低空需蹲下、中空、高空可直跑)
        COLLISION_PADDING: {               // 障礙物碰撞箱容錯內縮
            LEFT: 2,
            RIGHT: 2,
            TOP: 2,
            BOTTOM: 2
        }
    },

    // 本地快取儲存鍵值
    STORAGE: {
        HIGH_SCORE_KEY: "dinoHighScore"
    }
};

export default CONFIG;
