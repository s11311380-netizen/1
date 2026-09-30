// =============================================
// main.js — 遊戲啟動入口
// 等待 DOM 就緒後建立 Game 實例
// =============================================

import { Game } from './game.js';

// 等待 DOM 完全載入後初始化遊戲
window.addEventListener('DOMContentLoaded', () => {
    // 建立遊戲實例（自動繫結事件、顯示開始畫面）
    const game = new Game();   // eslint-disable-line no-unused-vars

    // 將 game 掛載到 window，方便瀏覽器控制台除錯（可選）
    // window._game = game;
});
