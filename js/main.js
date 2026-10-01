import { Game } from './game.js';

// Run immediately instead of waiting for DOMContentLoaded
// since type="module" implies defer, the DOM is already ready.
const game = new Game();
window._game = game;
