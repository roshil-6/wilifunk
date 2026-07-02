const fs = require('fs');
const path = require('path');

const gameJsPath = path.join(__dirname, 'www', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// 1. Phaser config size
gameJs = gameJs.replace(/width: 1280,/, 'width: 720,');
gameJs = gameJs.replace(/height: 720,/, 'height: 1280,');

// 2. Rocket spawn point (was x: 200, y: 360) -> (x: 150, y: 640)
gameJs = gameJs.replace(/gameState\.rocket = sceneRef\.physics\.add\.sprite\(200, 360, 'rocket'\);/, 
                        "gameState.rocket = sceneRef.physics.add.sprite(150, 640, 'rocket');");

// 3. Fall out-of-bounds check (was 760) -> (1320)
gameJs = gameJs.replace(/if \(gameState\.rocket\.y < -40 \|\| gameState\.rocket\.y >= 760\) \{/,
                        "if (gameState.rocket.y < -40 || gameState.rocket.y >= 1320) {");

fs.writeFileSync(gameJsPath, gameJs);

// CSS patch
const cssPath = path.join(__dirname, 'www', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Find the @media (max-width: 950px) and (orientation: portrait) and remove it entirely.
css = css.replace(/@media \(max-width: 950px\) and \(orientation: portrait\) \{[\s\S]*?\}\s*\}/m, '');
fs.writeFileSync(cssPath, css);

// HTML patch
const htmlPath = path.join(__dirname, 'www', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Remove <div id="orientation-overlay">...</div>
html = html.replace(/    <!-- Orientation warning overlay for horizontal play -->\s*<div id="orientation-overlay">[\s\S]*?<\/div>/m, '');
fs.writeFileSync(htmlPath, html);

console.log('Portrait patches applied successfully.');
