/**
 * ==========================================================================
 * 遊戲啟動與應用引導入口 (main.js)
 * 負責實例化 Game 主控制器、註冊全域控制介面與 DOM 生命週期掛載
 * ==========================================================================
 */

import { Game } from './game.js';

let gameInstance = null;

// 初始化啟動
function initGame() {
    gameInstance = new Game();
    window.game = gameInstance;

    // 綁定全域函式供 HTML 按鈕或除錯使用
    window.restartGame = () => {
        if (gameInstance) {
            gameInstance.restart();
        }
    };

    window.toggleNight = () => {
        if (gameInstance) {
            gameInstance.toggleNight();
        }
    };

    window.startGame = () => {
        if (gameInstance) {
            gameInstance.start();
        }
    };

    // 額外綁定按鈕 DOM 事件監聽，雙重保證互動正常
    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
        restartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            window.restartGame();
        });
    }

    const nightToggleBtn = document.getElementById("nightToggleBtn");
    if (nightToggleBtn) {
        nightToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            window.toggleNight();
        });
    }
}

// 確保 DOM 載入後執行初始化
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame);
} else {
    initGame();
}

export { gameInstance as game };
