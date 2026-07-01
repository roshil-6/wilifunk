import re
import os

filepath = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update config gravity
content = re.sub(r'gravity:\s*\{\s*y:\s*\d+\s*\}', 'gravity: { y: 480 }', content)

# 2. Update GAME constants
content = re.sub(r'THRUST_POWER:\s*-\d+', 'THRUST_POWER: -300', content)

# 3. Add ROCKETS array after COLORS
rockets_code = """
const ROCKETS = [
    { id: 'pioneer', name: 'Pioneer', cost: 0, gravity: 480, thrust: -300, special: 'none', emoji: '🚀', description: 'Balanced default rocket' },
    { id: 'titan', name: 'Titan', cost: 150, gravity: 560, thrust: -230, special: 'extraHP', emoji: '🛡️', description: 'Takes 2 hits before dying' },
    { id: 'viper', name: 'Viper', cost: 300, gravity: 440, thrust: -350, special: 'scoreMultiplier', emoji: '⚡', description: '1.5x score multiplier' },
    { id: 'phantom', name: 'Phantom', cost: 500, gravity: 480, thrust: -300, special: 'ghostHit', emoji: '👻', description: 'First collision ghosted' },
    { id: 'pulsar', name: 'Pulsar', cost: 750, gravity: 600, thrust: -270, special: 'autoCollect', emoji: '🌟', description: 'Auto-collects stars in 80px' },
    { id: 'voidbreaker', name: 'Void Breaker', cost: -1, gravity: 400, thrust: -330, special: 'voidbreaker', emoji: '🕳️', description: 'Unlock: High Score >= 500' }
];

const MISSION_POOL = [
    { id: 'collect_stars', description: 'Collect 5 stars', target: 5, reward: 20, icon: '⭐', type: 'stars' },
    { id: 'survive_30', description: 'Survive 30 seconds', target: 30, reward: 15, icon: '⏱️', type: 'time' },
    { id: 'pass_20', description: 'Pass 20 obstacles', target: 20, reward: 25, icon: '🏔️', type: 'obstacles' },
    { id: 'near_miss_3', description: '3 near misses', target: 3, reward: 30, icon: '💨', type: 'nearMiss' },
    { id: 'reach_belt', description: 'Reach Asteroid Belt', target: 50, reward: 40, icon: '☄️', type: 'score' },
    { id: 'reach_nebula', description: 'Reach Nebula Cloud', target: 100, reward: 60, icon: '💜', type: 'score' },
    { id: 'collect_coins_10', description: 'Collect 10 coins', target: 10, reward: 20, icon: '🪙', type: 'coins' },
    { id: 'survive_meteor', description: 'Survive meteor shower', target: 1, reward: 35, icon: '☄️', type: 'meteorSurvive' },
    { id: 'escape_blackholes', description: 'Escape 2 black holes', target: 2, reward: 30, icon: '🕳️', type: 'blackHoleEscape' }
];
"""
content = re.sub(r'(const COLORS = \{[^}]+\};)', r'\1\n' + rockets_code, content, count=1)

# 4. Add AudioEngine methods
audio_methods = """
    coinCollect() {
        this._tone(1200, 'sine', 0.15, 0.08);
        this._tone(1800, 'triangle', 0.1, 0.06, 0.03);
    },
    missionComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._tone(f, 'triangle', 0.18, 0.2, i * 0.12));
        this._tone(1047, 'sine', 0.1, 0.4, 0.5);
    },
"""
content = content.replace("    nearMiss() {\n        this._sweep(600, 150, 'sine', 0.18, 0.15);\n    },", "    nearMiss() {\n        this._sweep(600, 150, 'sine', 0.18, 0.15);\n    },\n" + audio_methods)

# 5. Clean up gameState and add new vars
content = re.sub(r'gameMode:\s*\'rocket\',\s*//.*?\n\s*lives:\s*3.*?\n', '', content)
content = content.replace('engineHeat: 0', """engineHeat: 0,
    coins: 0,
    totalCoins: 0,
    coinItems: null,
    selectedRocket: 'pioneer',
    unlockedRockets: ['pioneer'],
    activeMissions: [],
    missionStats: { stars: 0, time: 0, obstacles: 0, nearMisses: 0, coins: 0, blackHoleEscapes: 0, meteorSurvived: false },
    meteorShowerActive: false,
    nearMissCount: 0,
    extraHP: 0,
    ghostHit: false,
    scoreMultiplier: 1""")

# 6. Global vars
content = content.replace("let bgGraphics;", "let bgGraphics;\nlet coinText;\nlet missionTexts = [];")

# 7. Add createCoinTexture in preload
content = content.replace("createBlackHoleTexture(this);", """createBlackHoleTexture(this);
    createCoinTexture(this);""")

# 8. Define createCoinTexture before createFlameTexture
coin_texture = """
function createCoinTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xffd700, 1);
    gfx.fillCircle(12, 12, 10);
    gfx.lineStyle(2, 0xffaa00, 1);
    gfx.strokeCircle(12, 12, 7);
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillCircle(9, 9, 3);
    gfx.generateTexture('coin', 24, 24);
    gfx.destroy();
}
"""
content = content.replace("function createFlameTexture(scene)", coin_texture + "\nfunction createFlameTexture(scene)")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 1 applied!")
