const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /    if \(gameState\.fuel <= 0\) return;/,
    `    if (gameState.fuel <= 0) return;
    
    // Drain a bit of fuel per thrust
    gameState.fuel = Math.max(0, gameState.fuel - 1.0);
    drawFuelBar(gameState.fuel);`
);

fs.writeFileSync(file, content);
console.log('Thrust fuel drain applied.');
