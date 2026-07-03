const fs = require('fs');
const path = require('path');

const wwwPath = path.join(__dirname, 'www');

// 1. game.js - Fix the missing event listener for Thrust button
let gameJsPath = path.join(wwwPath, 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

const thrustLogicStr = `
    const mobileThrustBtn = document.getElementById('mobileThrustBtn');
    if (mobileThrustBtn) {
        mobileThrustBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(gameState.isPlaying && !gameState.isGameOver) {
                gameState.rocket.body.velocity.y = -350;
            }
        }, { passive: false });
        mobileThrustBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if(gameState.isPlaying && !gameState.isGameOver) {
                gameState.rocket.body.velocity.y = -350;
            }
        });
    }
`;

// Insert the thrust listener right after the laserBtn setup
gameJs = gameJs.replace(/(const laserBtn = document\.getElementById\('mobileLaserBtn'\);[\s\S]*?\}\);[\s\S]*?\})/, `$1\n${thrustLogicStr}`);

// Make sure the bottom tap ignore rule is updated properly
gameJs = gameJs.replace(/if \(pointer\.y > 600 && pointer\.x > 500\) return;/g, 
    "if (pointer.y > scene.scale.height - 150) return; // Ignore bottom area for buttons");

fs.writeFileSync(gameJsPath, gameJs);

// 2. index.html - Fix menu lag (3D models running at high pixel ratio)
let htmlPath = path.join(wwwPath, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Cap pixel ratio to 1 for the 3D menu preview renderer
html = html.replace(/sharedModalRenderer\.setPixelRatio\(window\.devicePixelRatio \|\| 1\);/g, 
    "sharedModalRenderer.setPixelRatio(1);");

// Also, let's fix another potential lag: The animation loop doing too much if it's running behind.
// The requestAnimationFrame loop shouldn't lag if pixelRatio is 1, but let's make sure it's 1.

fs.writeFileSync(htmlPath, html);

console.log('Thrust button fixed and menu lag resolved.');
