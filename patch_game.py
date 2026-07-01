import re

filepath = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. HUD De-congestion ---
# Remove starText entirely
content = re.sub(r'starText = scene\.add\.text.*?setScrollFactor\(0\);', '', content, flags=re.DOTALL)
# Remove missionTexts creation
content = re.sub(r'for \(let i = 0; i < 3; i\+\+\) \{.*?missionTexts\.push\(mt\);\s*\}', '', content, flags=re.DOTALL)

# Update collectStar so it uses floating text instead of starText update
collect_star_orig = """function collectStar(rocket, star) {
    star.destroy();
    AudioEngine.starCollect();
    updateMissionProgress('stars', 1);
    if (gameState.hasShield) return;
    gameState.collectedStars++;
    starText.setText(`STARS: ${gameState.collectedStars}/${GAME.STARS_FOR_SHIELD}`);
    sceneRef.tweens.add({ targets: starText, scale: { from: 1.5, to: 1 }, duration: 200 });
    if (gameState.collectedStars >= GAME.STARS_FOR_SHIELD) activateShield();
}"""
collect_star_new = """function collectStar(rocket, star) {
    star.destroy();
    AudioEngine.starCollect();
    updateMissionProgress('stars', 1);
    if (gameState.hasShield) return;
    gameState.collectedStars++;
    showFloatingText(rocket.x, rocket.y - 30, `STAR ${gameState.collectedStars}/${GAME.STARS_FOR_SHIELD} ⭐`, '#ffd700');
    if (gameState.collectedStars >= GAME.STARS_FOR_SHIELD) activateShield();
}"""
content = content.replace(collect_star_orig, collect_star_new)

# Update activateShield and deactivateShield to remove starText refs
content = re.sub(r"starText\.setText\('[^']+'\);\s*starText\.setColor\('[^']+'\);", '', content)

# Remove updateMissionDisplay function body to do nothing, preventing errors
mission_display_regex = r'function updateMissionDisplay\(\) \{.*?(?=\n// ====================================)'
content = re.sub(mission_display_regex, 'function updateMissionDisplay() { /* Hidden from HUD to reduce clutter */ }', content, flags=re.DOTALL)

# Update startGame to remove starText references
content = re.sub(r"starText\.setText\('[^']+'\);\s*starText\.setColor\('[^']+'\);", '', content)


# --- 2. Obstacles Overhaul ---
# Replace spawnObstacle, spawnGiantCanyon, spawnClassicPlanets
obstacle_code_old_regex = r'function spawnObstacle\(\).*?(?=function spawnFlyingAsteroid\(\))'
obstacle_code_new = """function spawnObstacle() {
    if (gameState.isGameOver) return;

    let gapPosition = Phaser.Math.Between(GAME.MIN_GAP_Y, GAME.MAX_GAP_Y);
    let gap = GAME.GAP_SIZE - Math.min(60, gameState.score * 0.5);
    
    // Choose randomly between a stationary UFO gap or a Planet gap
    const isUfoGap = Math.random() < 0.5;
    const topKey = isUfoGap ? 'ufo' : 'planet';
    const botKey = isUfoGap ? 'ufo' : 'planet';
    
    // Top obstacle
    let topObs = gameState.obstacles.create(800, gapPosition - gap/2 - 40, topKey);
    topObs.body.allowGravity = false;
    topObs.body.setVelocityX(-gameState.obstacleSpeed);
    if (isUfoGap) topObs.setScale(1.5).body.setSize(60, 30);
    else topObs.body.setCircle(40);
    topObs.isTop = true;
    topObs.scored = false;

    // Bottom obstacle
    let botObs = gameState.obstacles.create(800, gapPosition + gap/2 + 40, botKey);
    botObs.body.allowGravity = false;
    botObs.body.setVelocityX(-gameState.obstacleSpeed);
    if (isUfoGap) botObs.setScale(1.5).body.setSize(60, 30);
    else botObs.body.setCircle(40);
    botObs.isTop = false;

    // Optional scattered mid-air obstacles
    if (gameState.score > 20 && Math.random() < 0.4) {
        let midPos = (gapPosition < 300) ? gapPosition + gap + 150 : gapPosition - gap - 150;
        let midObs = gameState.obstacles.create(800 + Phaser.Math.Between(100, 200), midPos, 'asteroid');
        midObs.body.allowGravity = false;
        midObs.body.setVelocityX(-gameState.obstacleSpeed);
        midObs.body.setCircle(20);
        midObs.isTop = false;
    }

    gameState.lastSpawnX = 800;
}

"""
content = re.sub(obstacle_code_old_regex, obstacle_code_new, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("game.js patched!")
