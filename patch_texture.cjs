const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

const newTextureCode = `function createFuelItemTexture(scene) {
    const key = 'fuelItem';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 32, 32);
    const ctx = canvas.context;
    
    // Draw a clearer fuel canister without relying on roundRect or excessive blur
    
    // Outer border/glow
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(4, 4, 24, 24);
    
    // Inner dark container
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(6, 6, 20, 20);
    
    // Fuel emoji or text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛽', 16, 16);
    
    scene.textures.get(key).refresh();
}`;

content = content.replace(
    /function createFuelItemTexture\(scene\) \{[\s\S]*?scene\.textures\.get\(key\)\.refresh\(\);\s*\}/,
    newTextureCode
);

fs.writeFileSync(file, content);
console.log('Fuel texture updated.');
