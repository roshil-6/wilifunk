const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, 'www', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// 1. Phaser config size
gameJs = gameJs.replace(/width: 1280,/, 'width: 720,');
gameJs = gameJs.replace(/height: 720,/, 'height: 1280,');

// 2. Rocket spawn point
// Find the exact line: gameState.rocket = scene.physics.add.sprite(..., 'rocket_' + gameState.selectedRocket);
// It was at line 1333: gameState.rocket = scene.physics.add.sprite(150, 300, 'rocket_' + gameState.selectedRocket);
gameJs = gameJs.replace(/gameState\.rocket = scene\.physics\.add\.sprite\(\d+, \d+, 'rocket_' \+ gameState\.selectedRocket\);/,
                        "gameState.rocket = scene.physics.add.sprite(150, 640, 'rocket_' + gameState.selectedRocket);");

// 3. Fall out-of-bounds check (was 760) -> (1320)
gameJs = gameJs.replace(/if \(gameState\.rocket\.y < -40 \|\| gameState\.rocket\.y >= 760\) \{/,
                        "if (gameState.rocket.y < -40 || gameState.rocket.y >= 1320) {");

fs.writeFileSync(gameJsPath, gameJs);

console.log('game.js patches applied successfully.');
