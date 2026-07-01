const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

// Move Fuel Text above the bar
content = content.replace(
    /fuelText = scene\.add\.text\(28, 62, 'FUEL', \{/,
    `fuelText = scene.add.text(20, 42, 'FUEL', {`
);

// Fix 3d rocket bug when falling
// When fuel <= 0, allowGravity is true. The rotation logic should just cap smoothly.
// The rotation logic is: 
// const targetAngle = Phaser.Math.Clamp(velocityY * 0.1, -30, 45);
// gameState.rocket.angle = Phaser.Math.Linear(gameState.rocket.angle, targetAngle, 0.15);
// That should be fine, but maybe the physics body rotation is causing issues if it hits the bottom bounds?
// Or maybe they mean the 3D glTF model rotation?
content = content.replace(
    /    if \(gameState\.fuel <= 0\) \{\s+gameState\.fuel = 0;\s+gameState\.rocket\.body\.allowGravity = true;\s+\}/,
    `    if (gameState.fuel <= 0) {
            gameState.fuel = 0;
            gameState.rocket.body.allowGravity = true;
            // Cap downward velocity so 3D model doesn't spin wildly
            if (gameState.rocket.body.velocity.y > 400) {
                gameState.rocket.body.velocity.y = 400;
            }
        }`
);

fs.writeFileSync(file, content);
console.log('Fuel UI and Rocket fix applied.');
