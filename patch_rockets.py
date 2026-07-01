import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update ROCKETS array with color1 and color2
rockets_old = """const ROCKETS = [
    { id: 'pioneer', name: 'Pioneer', cost: 0, gravity: 480, thrust: -300, special: 'none', emoji: '🚀', description: 'Balanced default rocket' },
    { id: 'titan', name: 'Titan', cost: 150, gravity: 560, thrust: -230, special: 'extraHP', emoji: '🛡️', description: 'Takes 2 hits before dying' },
    { id: 'viper', name: 'Viper', cost: 300, gravity: 440, thrust: -350, special: 'scoreMultiplier', emoji: '⚡', description: '1.5x score multiplier' },
    { id: 'phantom', name: 'Phantom', cost: 500, gravity: 480, thrust: -300, special: 'ghostHit', emoji: '👻', description: 'First collision ghosted' },
    { id: 'pulsar', name: 'Pulsar', cost: 750, gravity: 600, thrust: -270, special: 'autoCollect', emoji: '🌟', description: 'Auto-collects stars in 80px' },
    { id: 'voidbreaker', name: 'Void Breaker', cost: -1, gravity: 400, thrust: -330, special: 'voidbreaker', emoji: '🕳️', description: 'Unlock: High Score >= 500' }
];"""
rockets_new = """const ROCKETS = [
    { id: 'pioneer', name: 'Pioneer', cost: 0, color1: '#ff4757', color2: '#00d2d3', gravity: 480, thrust: -300, special: 'none', emoji: '🚀', description: 'Balanced default rocket' },
    { id: 'titan', name: 'Titan', cost: 150, color1: '#2ed573', color2: '#ffa502', gravity: 560, thrust: -230, special: 'extraHP', emoji: '🛡️', description: 'Takes 2 hits before dying' },
    { id: 'viper', name: 'Viper', cost: 300, color1: '#a4b0be', color2: '#ff4757', gravity: 440, thrust: -350, special: 'scoreMultiplier', emoji: '⚡', description: '1.5x score multiplier' },
    { id: 'phantom', name: 'Phantom', cost: 500, color1: '#3742fa', color2: '#7bed9f', gravity: 480, thrust: -300, special: 'ghostHit', emoji: '👻', description: 'First collision ghosted' },
    { id: 'pulsar', name: 'Pulsar', cost: 750, color1: '#ff6b81', color2: '#747d8c', gravity: 600, thrust: -270, special: 'autoCollect', emoji: '🌟', description: 'Auto-collects stars in 80px' },
    { id: 'voidbreaker', name: 'Void Breaker', cost: -1, color1: '#2f3542', color2: '#ff4757', gravity: 400, thrust: -330, special: 'voidbreaker', emoji: '🕳️', description: 'Unlock: High Score >= 500' }
];"""
js = js.replace(rockets_old, rockets_new)

# 2. Modify createRocketTexture to accept parameters
create_tex_old = "function createRocketTexture(scene) {\n    const key = 'rocket';"
create_tex_new = "function createRocketTexture(scene, id, color1, color2) {\n    const key = 'rocket_' + id;"
js = js.replace(create_tex_old, create_tex_new)

# 3. Replace hardcoded colors in createRocketTexture
js = js.replace("ctx.fillStyle = '#ff4757';", "ctx.fillStyle = color1;")
js = js.replace("wingGrad.addColorStop(0, '#00d2d3');", "wingGrad.addColorStop(0, color2);")
js = js.replace("wingGrad.addColorStop(0.5, '#00a8ff');", "wingGrad.addColorStop(0.5, color1);")

# 4. Generate all textures in create() instead of just one
create_call_old = "createRocketTexture(this);"
create_call_new = "ROCKETS.forEach(r => createRocketTexture(this, r.id, r.color1, r.color2));"
js = js.replace(create_call_old, create_call_new)

# 5. Use the selected rocket key in createRocket
create_rocket_old = "gameState.rocket = scene.physics.add.sprite(200, scene.scale.height / 2, 'rocket');"
create_rocket_new = "gameState.rocket = scene.physics.add.sprite(200, scene.scale.height / 2, 'rocket_' + gameState.selectedRocket);"
js = js.replace(create_rocket_old, create_rocket_new)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

# --- Fix index.html Restart Button ---
html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

restart_old = """        // Restart button
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden');
            if (typeof restartGame === 'function' && typeof sceneRef !== 'undefined') {
                restartGame(sceneRef);
            }
            if (window.selectedGameMode === 'streak') {
                gameUI.classList.remove('hidden');
                if (typeof startGame === 'function') {
                    startGame();
                }
            } else {
                // Go to rocket select
                rocketSelect.classList.remove('hidden');
                renderRocketGrid();
                updateHomeCoins();
            }
        });"""

restart_new = """        // Restart button
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden');
            if (typeof restartGame === 'function' && typeof sceneRef !== 'undefined') {
                restartGame(sceneRef);
                if (typeof startGame === 'function') startGame();
            }
        });"""
html = html.replace(restart_old, restart_new)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Game.js and index.html patched for rockets and restart")
