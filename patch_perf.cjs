const fs = require('fs');
const path = require('path');

// 1. Fix Modal Overflow in CSS
const cssPath = path.join(__dirname, 'www', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/\.modal-content \{/, `.modal-content {
    max-height: 90vh;
    overflow-y: auto;`);

fs.writeFileSync(cssPath, css);

// 2. Fix WebGL Lag in game.js
const gameJsPath = path.join(__dirname, 'www', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// Add needsUpdate flag inside GLTF Loader callback
gameJs = gameJs.replace(/console\.log\('Successfully loaded 3D GLB for: ' \+ key\);/,
    "console.log('Successfully loaded 3D GLB for: ' + key);\n            if(this.scenes[key]) this.scenes[key].needsUpdate = true;");

// Initialize needsUpdate flag to true for the first frame
gameJs = gameJs.replace(/rotateSpeed,(\s+)size(\s+)\};/, "rotateSpeed,\n            size,\n            needsUpdate: true\n        };");

// Modify update loop to skip redundant rendering
gameJs = gameJs.replace(/let mesh = s\.getMesh\(\);/,
    `let mesh = s.getMesh();
            // SKIP RENDER IF STATIC AND ALREADY RENDERED ONCE
            if (!s.needsUpdate && (!s.rotateSpeed || (s.rotateSpeed.x === 0 && s.rotateSpeed.y === 0))) continue;
            s.needsUpdate = false;`);

fs.writeFileSync(gameJsPath, gameJs);

console.log('Performance and UI patches applied.');
