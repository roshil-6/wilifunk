import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Floating Score Text when passing obstacles
score_pass_old = """if (obstacle.isTop) {
                addScore(GAME.POINTS_PER_PASS);
                spawnCoinsAtPosition(obstacle.x, obstacle.y + 100);
                updateMissionProgress('obstacles', 1);
            }"""
score_pass_new = """if (obstacle.isTop) {
                addScore(GAME.POINTS_PER_PASS);
                showFloatingText(gameState.rocket.x, gameState.rocket.y - 50, '+1 SCORE!', '#00ff88');
                spawnCoinsAtPosition(obstacle.x, obstacle.y + 100);
                updateMissionProgress('obstacles', 1);
            }"""
js = js.replace(score_pass_old, score_pass_new)

# 2. More Intense Crash screen shake
game_over_old = "sceneRef.cameras.main.shake(300, 0.02);"
game_over_new = "sceneRef.cameras.main.shake(800, 0.06);\n    sceneRef.cameras.main.flash(500, 255, 0, 0);"
js = js.replace(game_over_old, game_over_new)

# 3. Add Speed lines to create
create_old = "createRocket(this);"
create_new = """
    // Speed lines for arcade sense of speed
    gameState.speedLines = this.add.particles(0, 0, 'flare', {
        x: { min: this.scale.width, max: this.scale.width + 100 },
        y: { min: 0, max: this.scale.height },
        speedX: { min: -1000, max: -2000 },
        speedY: 0,
        lifespan: 1000,
        scaleX: { min: 2, max: 6 },
        scaleY: { min: 0.05, max: 0.1 },
        alpha: { start: 0.3, end: 0 },
        blendMode: 'ADD',
        frequency: 50
    });
    gameState.speedLines.setDepth(0);
    gameState.speedLines.setVisible(false);

    createRocket(this);
"""
js = js.replace(create_old, create_new)

# Start/Stop speed lines
start_game_old = "if (gameState.exhaust) gameState.exhaust.setVisible(true);"
start_game_new = "if (gameState.speedLines) gameState.speedLines.setVisible(true);\n    if (gameState.exhaust) gameState.exhaust.setVisible(true);"
js = js.replace(start_game_old, start_game_new)

stop_game_old = "if (gameState.exhaust) gameState.exhaust.setVisible(false);"
stop_game_new = "if (gameState.speedLines) gameState.speedLines.setVisible(false);\n    if (gameState.exhaust) gameState.exhaust.setVisible(false);"
js = js.replace(stop_game_old, stop_game_new)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("game.js juiced up")
