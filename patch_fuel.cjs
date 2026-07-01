const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove fuel depletion logic in update loop (from the previous patch that used isThrusting)
// Wait, my previous patch.cjs didn't successfully inject isThrusting because it didn't find the target.
// So let's just append the constant fuel drain to the end of update()
content = content.replace(
    /        if \(hole\.x < -100\) \{\s+hole\.destroy\(\);\s+updateMissionProgress\('blackHoleEscape', 1\);\s+scheduleNextBlackHole\(\);\s+\}\s+\}\);\s+\}/,
    `        if (hole.x < -100) {
            hole.destroy();
            updateMissionProgress('blackHoleEscape', 1);
            scheduleNextBlackHole();
        }
    });

    if (gameState.isPlaying && !gameState.isGameOver) {
        gameState.fuel -= 0.03;
        if (gameState.fuel <= 0) {
            gameState.fuel = 0;
            gameState.rocket.body.allowGravity = true;
        }
        drawFuelBar(gameState.fuel);
    }
}`
);

// 2. Add fuel <= 0 check to thrust()
content = content.replace(
    /function thrust\(pointer\) \{\s+if \(gameState\.isGameOver\) return;\s+if \(!gameState\.isPlaying\) \{\s+startGame\(\);\s+return;\s+\}/,
    `function thrust(pointer) {
    if (gameState.isGameOver) return;

    if (!gameState.isPlaying) {
        startGame();
        return;
    }
    if (gameState.fuel <= 0) return;`
);

// 3. Add fuel drain on laser fire
content = content.replace(
    /    gameState\.ammo--;\s+updateAmmoDisplay\(\);/,
    `    gameState.ammo--;
    updateAmmoDisplay();
    
    gameState.fuel = Math.max(0, gameState.fuel - 10);
    drawFuelBar(gameState.fuel);`
);

// 4. Refill fuel when planet is destroyed
content = content.replace(
    /    \} else \{\s+\/\/ Destroyed! Trigger explosion particles\s+createExplosionParticles\(planet\.x, planet\.y, 0xff5252, 28\);\s+AudioEngine\.explosion\(\);\s+\/\/ Award Armor \(Shield\)/,
    `    } else {
        // Destroyed! Trigger explosion particles
        createExplosionParticles(planet.x, planet.y, 0xff5252, 28);
        AudioEngine.explosion();
        
        gameState.fuel = 100;
        drawFuelBar(gameState.fuel);
        
        // Award Armor (Shield)`
);

content = content.replace(
    /showFloatingText\(planet\.x, planet\.y - 40, 'PLANET DESTROYED! 💥\\n\+ARMOR BOOST 🛡️  \+50 PTS', '#2ed573'\);/,
    `showFloatingText(planet.x, planet.y - 40, 'PLANET DESTROYED! 💥\\n+ARMOR 🛡️ +FULL TANK ⛽  +50 PTS', '#2ed573');`
);


fs.writeFileSync(file, content);
console.log('Fuel adjustments injected successfully.');
