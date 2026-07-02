const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Add gameState variables
content = content.replace(
    /starItems: null,/,
    "starItems: null,\n    fuelItems: null,\n    fuel: 100,\n    fuelTimer: null,"
);

// 2. Add variables for Fuel Bar HUD
content = content.replace(
    /let scoreText;/,
    "let scoreText;\nlet fuelBarBg;\nlet fuelBarFill;\nlet fuelText;"
);

// 3. createFuelItemTexture call
content = content.replace(
    /createStarItemTexture\(this\);/,
    "createStarItemTexture(this);\n    createFuelItemTexture(this);"
);

// 4. createFuelItemTexture function definition
const textureCode = `
function createFuelItemTexture(scene) {
    const key = 'fuelItem';
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 30, 40);
    const ctx = canvas.context;
    
    // Outer glow
    ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
    ctx.shadowBlur = 8;
    
    // Cylinder body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.roundRect(5, 5, 20, 30, 4);
    ctx.fill();
    
    // Metal bands
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0628';
    ctx.fillRect(5, 10, 20, 4);
    ctx.fillRect(5, 26, 20, 4);
    
    // F symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.fillText('F', 11, 24);
    
    scene.textures.get(key).refresh();
}
`;
content = content.replace(
    /function createStarItemTexture\(scene\) {/,
    textureCode + "\nfunction createStarItemTexture(scene) {"
);

// 5. Initialize physics groups and HUD in create()
const createPhysicsCode = `
    gameState.starItems = this.physics.add.group();
    gameState.fuelItems = this.physics.add.group();
`;
content = content.replace(/gameState\.starItems = this\.physics\.add\.group\(\);/, createPhysicsCode);

const drawHUDCode = `
    scoreText = scene.add.text(20 + scorePillW / 2, 18, '0', {
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(11).setScrollFactor(0);

    // Fuel Gauge HUD
    fuelBarBg = scene.add.graphics();
    fuelBarBg.setDepth(10).setScrollFactor(0);
    fuelBarBg.fillStyle(0x000000, 0.5);
    fuelBarBg.fillRoundedRect(20, 60, 150, 16, 8);
    fuelBarBg.lineStyle(2, 0xffffff, 0.2);
    fuelBarBg.strokeRoundedRect(20, 60, 150, 16, 8);
    
    fuelText = scene.add.text(28, 62, 'FUEL', {
        fontFamily: 'Orbitron',
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setDepth(11).setScrollFactor(0);

    fuelBarFill = scene.add.graphics();
    fuelBarFill.setDepth(10).setScrollFactor(0);
    drawFuelBar(gameState.fuel);
`;
content = content.replace(/scoreText = scene\.add\.text[\s\S]*?\.setScrollFactor\(0\);/, drawHUDCode);

const overlapCode = `
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.fuelItems, collectFuel, null, this);
`;
content = content.replace(/this\.physics\.add\.overlap\(gameState\.rocket, gameState\.starItems, collectStar, null, this\);/, overlapCode);

// 6. Draw Fuel Bar function and Collect Fuel function
const logicCode = `
function drawFuelBar(fuel) {
    if (!fuelBarFill) return;
    fuelBarFill.clear();
    const percent = Math.max(0, Math.min(100, fuel)) / 100;
    const color = percent > 0.3 ? 0x00ff88 : 0xff0055;
    
    // Add pulsing glow if critical
    if (percent <= 0.3) {
        if (Math.floor(Date.now() / 200) % 2 === 0) {
            fuelBarBg.lineStyle(2, 0xff0055, 0.8);
            fuelBarBg.strokeRoundedRect(20, 60, 150, 16, 8);
        } else {
            fuelBarBg.lineStyle(2, 0xffffff, 0.2);
            fuelBarBg.strokeRoundedRect(20, 60, 150, 16, 8);
        }
    } else {
        fuelBarBg.lineStyle(2, 0xffffff, 0.2);
        fuelBarBg.strokeRoundedRect(20, 60, 150, 16, 8);
    }

    fuelBarFill.fillStyle(color, 1);
    fuelBarFill.fillRoundedRect(22, 62, Math.max(1, 146 * percent), 12, 6);
}

function spawnFuel() {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    const fuel = gameState.fuelItems.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'fuelItem');
    fuel.body.allowGravity = false;
    fuel.body.setVelocityX(-gameState.obstacleSpeed * 0.9);
    fuel.setDepth(5);
    
    sceneRef.tweens.add({ targets: fuel, y: fuel.y - 15, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

function collectFuel(rocket, fuel) {
    fuel.destroy();
    
    // Small heal if already maxed to reward collecting
    if (gameState.fuel >= 95) {
        addScore(5);
        showFloatingText(fuel.x, fuel.y - 30, '+5 PTS', '#ffd700');
    }
    
    gameState.fuel = Math.min(100, gameState.fuel + 30);
    drawFuelBar(gameState.fuel);
    
    AudioEngine._sweep(600, 1200, 'sine', 0.1, 0.15);
    createExplosionParticles(fuel.x, fuel.y, 0x00ff88, 12);
    showFloatingText(fuel.x, fuel.y + 20, '+FUEL ⛽', '#00ff88');
}
`;
content = content.replace(/function spawnStar\(\) {/, logicCode + "\nfunction spawnStar() {");

// 7. Update fuel in update loop
const updateCode = `
    const cursors = sceneRef.input.keyboard.createCursorKeys();
    const isThrusting = (cursors.up.isDown || cursors.space.isDown || sceneRef.input.activePointer.isDown);
    
    if (gameState.isPlaying && !gameState.isGameOver) {
        // Fuel Depletion
        const depletionRate = isThrusting ? 0.08 : 0.02; // Faster drain when thrusting
        gameState.fuel -= depletionRate;
        
        if (gameState.fuel <= 0) {
            gameState.fuel = 0;
            // Force gravity
            gameState.rocket.body.allowGravity = true;
            // Prevent upward velocity if thrusting while empty
            if (isThrusting && gameState.rocket.body.velocity.y < 0) {
                 gameState.rocket.body.velocity.y *= 0.9;
            }
        }
        drawFuelBar(gameState.fuel);
    }
    
    const outOfFuel = gameState.fuel <= 0;

    // Thrust mechanics (disabled if out of fuel)
    if (!outOfFuel && isThrusting) {
`;
// Replace the start of the thrust mechanics in update()
content = content.replace(
    /    if \(cursors\.up\.isDown \|\| cursors\.space\.isDown \|\| sceneRef\.input\.activePointer\.isDown\) \{/,
    updateCode
);

// 8. Start Game timer reset
content = content.replace(
    /gameState\.starTimer = sceneRef\.time\.addEvent\(\{ delay: 2000, callback: spawnStar, loop: true \}\);/,
    "gameState.starTimer = sceneRef.time.addEvent({ delay: 2000, callback: spawnStar, loop: true });\n    gameState.fuelTimer = sceneRef.time.addEvent({ delay: 3500, callback: spawnFuel, loop: true });"
);

// 9. Reset variables in reset button and initialization
content = content.replace(
    /gameState\.score = 0;/,
    "gameState.score = 0;\n    gameState.fuel = 100;\n    if (fuelBarBg) drawFuelBar(gameState.fuel);"
);
// Make sure clearing fuelItems happens on Game Over or reset
content = content.replace(
    /gameState\.starItems\.clear\(true, true\);/,
    "gameState.starItems.clear(true, true);\n    gameState.fuelItems.clear(true, true);"
);
content = content.replace(
    /if \(gameState\.starTimer\) gameState\.starTimer\.remove\(\);/,
    "if (gameState.starTimer) gameState.starTimer.remove();\n    if (gameState.fuelTimer) gameState.fuelTimer.remove();"
);

fs.writeFileSync(file, content);
console.log('Fuel mechanic injected successfully.');
