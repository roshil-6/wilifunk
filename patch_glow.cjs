const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, 'www', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// For the glow
gameJs = gameJs.replace(/frequency: 12,\s*quantity: 2,/g,
    "frequency: 50,\n        quantity: 1,");

// Make sure the main exhaust is also kept reduced just in case git restore reverted it
gameJs = gameJs.replace(/frequency: 7,\s*quantity: 4,/g,
    "frequency: 25,\n        quantity: 1,");

// Cap resolution to 1.5
gameJs = gameJs.replace(/resolution: window\.devicePixelRatio \|\| 1,/,
    "resolution: Math.min(1.5, window.devicePixelRatio || 1),");

fs.writeFileSync(gameJsPath, gameJs);

console.log('Particle & Resolution patches applied successfully.');
