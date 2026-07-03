const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, 'www', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// 1. Cap resolution to 1.5 or 2 max for mobile performance
gameJs = gameJs.replace(/resolution: window\.devicePixelRatio \|\| 1,/,
    "resolution: Math.min(1.5, window.devicePixelRatio || 1),");

// 2. Reduce exhaust particles which are destroying fill rate
gameJs = gameJs.replace(/frequency: 7,\s*quantity: 4,/g,
    "frequency: 25,\n        quantity: 1,");

// For the glow which has different settings if any
gameJs = gameJs.replace(/frequency: 6,\s*quantity: 2,/g,
    "frequency: 30,\n        quantity: 1,");

fs.writeFileSync(gameJsPath, gameJs);

console.log('Resolution and particle patches applied.');
