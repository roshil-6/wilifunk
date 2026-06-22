/**
 * WILIFUNK SPACE ROCKET - Addictive Space Survival Game
 * Professional Phaser 3 Implementation
 * Flappy Bird-style mechanics in space
 */

// ====================================
// CONFIGURATION
// ====================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#0a0a1a',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 480 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ====================================
// GAME CONSTANTS
// ====================================
const GAME = {
    THRUST_POWER: -300,
    MAX_VELOCITY: 400,
    OBSTACLE_SPEED: 250,
    OBSTACLE_SPAWN_RATE: 1500,
    GAP_SIZE: 130,
    MIN_GAP_Y: 100,
    MAX_GAP_Y: 400,
    SPEED_INCREASE: 8,
    SPAWN_DECREASE: 50,
    MIN_SPAWN_RATE: 700,
    POINTS_PER_PASS: 1,
    NEAR_MISS_BONUS: 5,
    NEAR_MISS_DISTANCE: 30,
    STARS_FOR_SHIELD: 3,
    SHIELD_DURATION: 5000
};

// ====================================
// BADGES
// ====================================
const BADGES = [
    { score: 10, name: "Rookie Pilot", icon: "🥉" },
    { score: 25, name: "Space Ranger", icon: "🥈" },
    { score: 50, name: "Galaxy Commander", icon: "🥇" },
    { score: 100, name: "Cosmic Legend", icon: "👑" },
    { score: 200, name: "Void Walker", icon: "🌌" },
    { score: 500, name: "Star Lord", icon: "✨" },
    { score: 1000, name: "Universal Entity", icon: "♾️" }
];

// ====================================
// ZONE DEFINITIONS
// ====================================
const ZONES = [
    {
        minScore: 0, name: 'DEEP SPACE',
        bgTop: 0x0a0a1a, bgBot: 0x1a0a2e, nebulaColor: 0x6b46c1,
        asteroidRate: 800, ufoRate: 8000, bhMin: 3000, bhMax: 5000,
        ambientPitch: 38, ambientMid: 110, label: '🌌 DEEP SPACE'
    },
    {
        minScore: 50, name: 'ASTEROID BELT',
        bgTop: 0x1a0808, bgBot: 0x2e0f0f, nebulaColor: 0x8b2020,
        asteroidRate: 450, ufoRate: 6000, bhMin: 2000, bhMax: 4000,
        ambientPitch: 45, ambientMid: 90, label: '☄️ ASTEROID BELT'
    },
    {
        minScore: 100, name: 'NEBULA CLOUD',
        bgTop: 0x0d0a2e, bgBot: 0x2a0a3e, nebulaColor: 0xec4899,
        asteroidRate: 550, ufoRate: 3500, bhMin: 2000, bhMax: 3500,
        ambientPitch: 34, ambientMid: 130, label: '💜 NEBULA CLOUD'
    },
    {
        minScore: 150, name: 'SOLAR STORM',
        bgTop: 0x1a0d00, bgBot: 0x2e1800, nebulaColor: 0xff6b00,
        asteroidRate: 380, ufoRate: 3000, bhMin: 1500, bhMax: 2800,
        ambientPitch: 55, ambientMid: 160, label: '🔥 SOLAR STORM'
    },
    {
        minScore: 200, name: 'THE VOID',
        bgTop: 0x000000, bgBot: 0x060210, nebulaColor: 0x1a0a2e,
        asteroidRate: 300, ufoRate: 2000, bhMin: 1000, bhMax: 2000,
        ambientPitch: 28, ambientMid: 80, label: '🕳️ THE VOID'
    }
];

// ====================================
// COLORS
// ====================================


// ====================================
// THEME TINTING HELPER
// ====================================
function getThemedColor(baseColor, isTop) {
    if (!gameState || !gameState.selectedRocket) return baseColor;
    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket);
    if (!rocket) return baseColor;
    
    const hexToRGB = hex => {
        let h = hex.replace('#', '');
        return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16)
        };
    };

    const rColor = hexToRGB(isTop ? rocket.color1 : rocket.color2);
    
    // Extract base color components
    const bR = (baseColor >> 16) & 255;
    const bG = (baseColor >> 8) & 255;
    const bB = baseColor & 255;

    // Rich dynamic mix: 40% rocket color, 60% original zone background, boosted slightly for vividness
    const mixR = Math.min(255, Math.floor(bR * 0.6 + rColor.r * 0.25));
    const mixG = Math.min(255, Math.floor(bG * 0.6 + rColor.g * 0.25));
    const mixB = Math.min(255, Math.floor(bB * 0.6 + rColor.b * 0.25));

    return (mixR << 16) + (mixG << 8) + mixB;
}

const COLORS = {
    ROCKET_BODY: 0xffffff,
    ROCKET_NOSE: 0xff3366,
    ROCKET_FINS: 0x00aaff,
    FLAME_INNER: 0xffff00,
    FLAME_OUTER: 0xff6600,
    OBSTACLE: 0x4a5568,
    OBSTACLE_GLOW: 0x00ffff,
    STAR: 0xffffff,
    NEBULA: 0x6b46c1
};

// ====================================
// ROCKETS ARRAY
// ====================================
const ROCKETS = [
    { id: 'pioneer', name: 'Level 1: Deep Space', cost: 0, color1: '#00a8ff', color2: '#192a56', gravity: 480, thrust: -300, special: 'none', emoji: '🌌', description: 'Standard physics. Monsters: Planets.', monsterType: 'planet' },
    { id: 'titan', name: 'Level 2: Toxic Nebula', cost: 150, color1: '#2ed573', color2: '#10ac84', gravity: 560, thrust: -230, special: 'extraHP', emoji: '☣️', description: 'Heavy gravity. Monsters: Tentacles.', monsterType: 'tentacle' },
    { id: 'viper', name: 'Level 3: Blood Moon', cost: 300, color1: '#a4b0be', color2: '#ff4757', gravity: 440, thrust: -350, special: 'scoreMultiplier', emoji: '🌑', description: 'Fast thrust. Monsters: Big Octopus.', monsterType: 'octopus' },
    { id: 'phantom', name: 'Level 4: Bio-Luminescent', cost: 500, color1: '#3742fa', color2: '#7bed9f', gravity: 480, thrust: -300, special: 'ghostHit', emoji: '🍄', description: 'Ghost mode. Monsters: Space Bugs.', monsterType: 'bug' },
    { id: 'pulsar', name: 'Level 5: The Void', cost: 750, color1: '#ff6b81', color2: '#747d8c', gravity: 600, thrust: -270, special: 'autoCollect', emoji: '🕳️', description: 'Auto-collect. Monsters: Void Entities.', monsterType: 'void' },
    { id: 'voidbreaker', name: 'Level X: Final Challenge', cost: -1, color1: '#2f3542', color2: '#ff4757', gravity: 400, thrust: -330, special: 'voidbreaker', emoji: '⚔️', description: 'Unlock: Score 500. Insane difficulty.', monsterType: 'octopus' }
];

// ====================================
// MISSION POOL
// ====================================
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

// ====================================
// AUDIO ENGINE (Web Audio API - No Files)
// ====================================
const AudioEngine = {
    ctx: null,
    muted: false,

    init() {
        this.muted = localStorage.getItem('wilifunkMuted') === 'true';
    },

    _getCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    },

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('wilifunkMuted', this.muted);
        return this.muted;
    },

    _tone(freq, type, gainVal, duration, when = 0, fadeOut = true) {
        if (this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal, now);
        if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    },

    _sweep(freqStart, freqEnd, type, gainVal, duration, when = 0) {
        if (this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    },

    thrust() {
        if (this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1); gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(160, now);
        osc1.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc1.start(now); osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(90, now);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc2.start(now); osc2.stop(now + 0.1);

        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3); gain3.connect(ctx.destination);
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(800, now + 0.02);
        osc3.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain3.gain.setValueAtTime(0.08, now + 0.02);
        gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc3.start(now + 0.02); osc3.stop(now + 0.1);
    },

    starCollect() {
        [523, 659, 784].forEach((f, i) => this._tone(f, 'sine', 0.15, 0.12, i * 0.07));
    },

    shieldActivate() {
        this._sweep(300, 900, 'sine', 0.2, 0.3);
        this._sweep(600, 1200, 'triangle', 0.1, 0.25, 0.1);
        [1047, 1319, 1568].forEach((f, i) => this._tone(f, 'sine', 0.12, 0.15, 0.3 + i * 0.08));
    },

    shieldHit() {
        this._sweep(400, 80, 'sawtooth', 0.25, 0.15);
        this._tone(880, 'sine', 0.12, 0.1, 0.2);
    },

    explosion() {
        if (this.muted) return;
        const ctx = this._getCtx();
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(1.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        source.start();
        this._sweep(80, 20, 'sine', 0.3, 0.5);
    },

    badgeUnlock() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._tone(f, 'triangle', 0.18, 0.2, i * 0.12));
        this._tone(1047, 'sine', 0.1, 0.4, 0.5);
    },

    blackHoleRumble(intensity) {
        if (this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.frequency.value = 4;
        lfoGain.gain.value = 15;
        osc.frequency.value = 40 + intensity * 10;
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(intensity * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        lfo.start(now); osc.start(now);
        lfo.stop(now + 0.3); osc.stop(now + 0.3);
    },

    meteorWarning() {
        for (let i = 0; i < 3; i++) {
            this._sweep(1200, 600, 'sawtooth', 0.15, 0.4, i * 0.45);
        }
    },

    nearMiss() {
        this._sweep(600, 150, 'sine', 0.18, 0.15);
    },

    coinCollect() {
        this._tone(1200, 'sine', 0.15, 0.08);
        this._tone(1800, 'triangle', 0.1, 0.06, 0.03);
    },

    missionComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._tone(f, 'triangle', 0.18, 0.2, i * 0.12));
        this._tone(1047, 'sine', 0.1, 0.4, 0.5);
    },

    _ambientNodes: null,
    _engineNodes: null,

    startAmbient() {
        if (this.muted || this._ambientNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 380;
        windFilter.Q.value = 0.8;

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(0.12, now + 3);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 120;
        lfo.connect(lfoGain);
        lfoGain.connect(windFilter.frequency);

        noise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);

        noise.start(now);
        lfo.start(now);

        this._ambientNodes = { noise, windFilter, windGain, lfo };
    },

    stopAmbient() {
        if (!this._ambientNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._ambientNodes;
        n.windGain.gain.setValueAtTime(n.windGain.gain.value, now);
        n.windGain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
            try { n.noise.stop(); } catch (e) { }
            try { n.lfo.stop(); } catch (e) { }
        }, 1600);
        this._ambientNodes = null;
    },

    startEngineHum() {
        if (this.muted || this._engineNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 85;
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        filter.Q.value = 2;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 1.2);
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start(now);

        const oscSub = ctx.createOscillator();
        const lfoSub = ctx.createOscillator();
        const lfoGainSub = ctx.createGain();
        const gainSub = ctx.createGain();
        oscSub.type = 'sine';
        oscSub.frequency.value = 42;
        lfoSub.type = 'sine';
        lfoSub.frequency.value = 7;
        lfoGainSub.gain.value = 0.06;
        lfoSub.connect(lfoGainSub);
        lfoGainSub.connect(gainSub.gain);
        gainSub.gain.setValueAtTime(0, now);
        gainSub.gain.linearRampToValueAtTime(0.1, now + 1.2);
        oscSub.connect(gainSub); gainSub.connect(ctx.destination);
        oscSub.start(now); lfoSub.start(now);

        this._engineNodes = { osc, filter, gain, oscSub, gainSub, lfoSub };
    },

    engineRev() {
        if (!this._engineNodes || this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._engineNodes;
        n.osc.frequency.cancelScheduledValues(now);
        n.osc.frequency.setValueAtTime(n.osc.frequency.value, now);
        n.osc.frequency.linearRampToValueAtTime(160, now + 0.06);
        n.osc.frequency.linearRampToValueAtTime(85, now + 0.25);
        n.gain.gain.setValueAtTime(n.gain.gain.value, now);
        n.gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
        n.gain.gain.linearRampToValueAtTime(0.14, now + 0.3);
    },

    stopEngineHum() {
        if (!this._engineNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._engineNodes;
        n.gain.gain.setValueAtTime(n.gain.gain.value, now);
        n.gain.gain.linearRampToValueAtTime(0, now + 1.0);
        n.gainSub.gain.setValueAtTime(n.gainSub.gain.value, now);
        n.gainSub.gain.linearRampToValueAtTime(0, now + 1.0);
        [n.osc, n.oscSub, n.lfoSub].forEach(o => o.stop(now + 1.1));
        this._engineNodes = null;
    },

    shiftAmbient(zoneIndex) {
        if (!this._ambientNodes || this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._ambientNodes;
        const filterTargets = [380, 320, 420, 280, 200];
        const gainTargets = [0.12, 0.14, 0.10, 0.16, 0.08];
        const lfoSpeeds = [0.1, 0.12, 0.08, 0.18, 0.06];
        const target = filterTargets[zoneIndex] ?? 380;
        const gainT = gainTargets[zoneIndex] ?? 0.12;
        const lfoSpd = lfoSpeeds[zoneIndex] ?? 0.1;
        n.windFilter.frequency.setValueAtTime(n.windFilter.frequency.value, now);
        n.windFilter.frequency.linearRampToValueAtTime(target, now + 2.5);
        n.windGain.gain.setValueAtTime(n.windGain.gain.value, now);
        n.windGain.gain.linearRampToValueAtTime(gainT, now + 2.5);
        n.lfo.frequency.setValueAtTime(n.lfo.frequency.value, now);
        n.lfo.frequency.linearRampToValueAtTime(lfoSpd, now + 2.5);
    }
};

AudioEngine.init();

// ====================================
// GAME STATE
// ====================================
let gameState = {
    rocket: null,
    obstacles: null,
    flyingObstacles: null,
    starItems: null,
    stars: [],
    isGameOver: false,
    isPlaying: false,
    score: 0,
    highScore: 0,
    obstacleSpeed: GAME.OBSTACLE_SPEED,
    spawnRate: GAME.OBSTACLE_SPAWN_RATE,
    obstacleTimer: null,
    asteroidTimer: null,
    starTimer: null,
    difficultyTimer: null,
    collectedStars: 0,
    hasShield: false,
    shieldEndTime: 0,
    isInvincible: false,
    unlockedBadges: [],
    blackHoles: null,
    blackHoleTimer: null,
    meteorTimer: null,
    lastSpawnX: 0,
    currentZone: 0,
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
    scoreMultiplier: 1,
    gameStartTime: 0
};

// ====================================
// GLOBAL VARS
// ====================================
let sceneRef;
let shieldEffect;
let bgGraphics;
let coinText;
let scoreText;
let highScoreText;
let meteorText;
let badgeText;
let zoneBannerText;

// ====================================
// PRELOAD
// ====================================
function preload() {
    sceneRef = this;

    gameState.highScore = parseInt(localStorage.getItem('spaceRocketHighScore') || '0');
    gameState.unlockedBadges = JSON.parse(localStorage.getItem('spaceRocketBadges') || '[]');
    gameState.intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');
    gameState.totalCoins = parseInt(localStorage.getItem('wilifunkCoins') || '0');
    let savedRocket = localStorage.getItem('wilifunkSelectedRocket');
    if (!savedRocket || savedRocket === 'undefined' || savedRocket === 'null') {
        savedRocket = 'pioneer';
    }
    gameState.selectedRocket = savedRocket;
    gameState.unlockedRockets = JSON.parse(localStorage.getItem('wilifunkUnlockedRockets') || '["pioneer"]');

    if (typeof updateHomeBadges === 'function') updateHomeBadges();

    ROCKETS.forEach(r => createRocketTexture(this, r.id, r.color1, r.color2));
    createFlameTexture(this);
    
    createMonsterOrb(this);
    createMonsterTentacle(this);
    createMonsterOctopus(this);
    createMonsterBug(this);
    createMonsterVoid(this);

    createPlanetTexture(this);
    createAsteroidTexture(this);
    createUFOTexture(this);
    createStarItemTexture(this);
    createBlackHoleTexture(this);
    createCoinTexture(this);
}

// ====================================
// TEXTURE CREATION

// ====================================
// MONSTER TEXTURES
// ====================================
function createMonsterOrb(scene) {
    if (scene.textures.exists('monster_orb')) return;
    const gfx = scene.add.graphics();
    gfx.generateTexture('monster_orb', 60, 60);
    gfx.destroy();
}

function createMonsterTentacle(scene) {
    if (scene.textures.exists('monster_tentacle')) return;
    const gfx = scene.add.graphics();
    
    // Slime body
    gfx.fillStyle(0x10ac84, 1);
    gfx.fillEllipse(30, 25, 25, 20);
    
    // Tentacle blocks
    gfx.fillRect(10, 25, 8, 30);
    gfx.fillRect(25, 30, 10, 40);
    gfx.fillRect(42, 25, 8, 35);

    // Jagged mouth
    gfx.fillStyle(0x000000, 1);
    gfx.fillTriangle(20, 25, 40, 25, 30, 35);

    // Eye
    gfx.fillStyle(0xff4757, 1);
    gfx.fillCircle(30, 15, 6);
    gfx.fillStyle(0xffff00, 1);
    gfx.fillCircle(30, 15, 2);

    gfx.generateTexture('monster_tentacle', 60, 70);
    gfx.destroy();
}

function createMonsterOctopus(scene) {
    if (scene.textures.exists('monster_octopus')) return;
    const gfx = scene.add.graphics();
    
    // Main bulky head
    gfx.fillStyle(0xff4757, 1);
    gfx.fillEllipse(40, 30, 35, 25);
    
    // Multiple straight legs
    gfx.lineStyle(6, 0xff4757, 1);
    gfx.beginPath();
    // Arm 1
    gfx.moveTo(15, 40); gfx.lineTo(5, 70);
    // Arm 2
    gfx.moveTo(30, 50); gfx.lineTo(25, 80);
    // Arm 3
    gfx.moveTo(50, 50); gfx.lineTo(55, 80);
    // Arm 4
    gfx.moveTo(65, 40); gfx.lineTo(75, 70);
    gfx.strokePath();

    // Eyes
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(30, 25, 8);
    gfx.fillCircle(50, 25, 8);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(30, 25, 4);
    gfx.fillCircle(50, 25, 4);

    gfx.generateTexture('monster_octopus', 80, 90);
    gfx.destroy();
}

function createMonsterBug(scene) {
    if (scene.textures.exists('monster_bug')) return;
    const gfx = scene.add.graphics();
    
    // Bug thorax (capsule)
    gfx.fillStyle(0x7bed9f, 1);
    gfx.fillRect(20, 10, 40, 50);
    
    // Huge pointy wings (triangles)
    gfx.fillStyle(0x3742fa, 0.7);
    gfx.fillTriangle(20, 20, 0, 40, 20, 50);
    gfx.fillTriangle(60, 20, 80, 40, 60, 50);

    // Antennae
    gfx.lineStyle(3, 0xffffff, 1);
    gfx.beginPath();
    gfx.moveTo(30, 10); gfx.lineTo(20, 0);
    gfx.moveTo(50, 10); gfx.lineTo(60, 0);
    gfx.strokePath();

    gfx.generateTexture('monster_bug', 80, 70);
    gfx.destroy();
}

function createMonsterVoid(scene) {
    if (scene.textures.exists('monster_void')) return;
    const gfx = scene.add.graphics();
    
    // Jagged geometric star
    gfx.fillStyle(0x2f3542, 1);
    gfx.lineStyle(3, 0xff4757, 1);
    gfx.beginPath();
    gfx.moveTo(30, 0); gfx.lineTo(40, 20); gfx.lineTo(60, 30);
    gfx.lineTo(40, 40); gfx.lineTo(30, 60); gfx.lineTo(20, 40);
    gfx.lineTo(0, 30); gfx.lineTo(20, 20);
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
    
    gfx.generateTexture('monster_void', 60, 60);
    gfx.destroy();
}

// ====================================
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

function createRocketTexture(scene, id, color1, color2) {
    const key = 'rocket_' + id;
    if (scene.textures.exists(key)) return;
    const width = 64;
    const height = 50;
    const canvas = scene.textures.createCanvas(key, width, height);
    const ctx = canvas.context;
    
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    
    let nozzleGrad = ctx.createLinearGradient(0, 12, 0, 38);
    nozzleGrad.addColorStop(0, '#57606f');
    nozzleGrad.addColorStop(0.5, '#747d8c');
    nozzleGrad.addColorStop(1, '#2f3542');
    ctx.fillStyle = nozzleGrad;
    ctx.beginPath();
    ctx.moveTo(2, 12); ctx.lineTo(12, 14); ctx.lineTo(12, 20); ctx.lineTo(2, 22);
    ctx.moveTo(2, 28); ctx.lineTo(12, 30); ctx.lineTo(12, 36); ctx.lineTo(2, 38);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = color1;
    ctx.fillRect(2, 15, 3, 4);
    ctx.fillRect(2, 31, 3, 4);

    let wingGrad = ctx.createLinearGradient(4, 0, 40, 50);
    wingGrad.addColorStop(0, color2);
    wingGrad.addColorStop(0.5, color1);
    wingGrad.addColorStop(1, '#341f97');
    ctx.fillStyle = wingGrad;
    
    ctx.beginPath();
    ctx.moveTo(16, 25); ctx.lineTo(4, 46); ctx.lineTo(36, 28);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, 25); ctx.lineTo(4, 4); ctx.lineTo(36, 22);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, 4); ctx.lineTo(36, 22);
    ctx.moveTo(4, 46); ctx.lineTo(36, 28);
    ctx.stroke();

    let fuseGrad = ctx.createLinearGradient(12, 16, 12, 34);
    fuseGrad.addColorStop(0, '#ffffff');
    fuseGrad.addColorStop(0.4, color2);
    fuseGrad.addColorStop(1, '#2f3542');
    ctx.fillStyle = fuseGrad;
    
    ctx.beginPath();
    ctx.moveTo(12, 16); ctx.lineTo(48, 18); ctx.lineTo(60, 25); ctx.lineTo(48, 32); ctx.lineTo(12, 34);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 25); ctx.lineTo(48, 25);
    ctx.stroke();

    let noseGrad = ctx.createLinearGradient(40, 18, 60, 25);
    noseGrad.addColorStop(0, color1);
    noseGrad.addColorStop(1, color2);
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(46, 18.2); ctx.lineTo(60, 25); ctx.lineTo(46, 31.8);
    ctx.closePath(); ctx.fill();

    let cockpitGrad = ctx.createLinearGradient(28, 20, 42, 28);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.5, color1);
    cockpitGrad.addColorStop(1, '#1e272e');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.ellipse(34, 25, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(32, 23, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(14, 25); ctx.lineTo(4, 13); ctx.lineTo(24, 25);
    ctx.closePath(); ctx.fill();

    canvas.refresh();
}

function createFlameTexture(scene) {
    const key = 'flare';
    const size = 16;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.context;
    
    ctx.clearRect(0, 0, size, size);
    
    let grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
    grad.addColorStop(0.6, 'rgba(0, 100, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    canvas.refresh();
}

function createPlanetTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0x2d3748, 1);
    gfx.fillCircle(40, 40, 40);
    gfx.fillStyle(0x4a5568, 1);
    gfx.fillCircle(25, 25, 10);
    gfx.fillCircle(55, 50, 15);
    gfx.fillCircle(30, 60, 8);
    gfx.generateTexture('planet', 80, 80);
    gfx.destroy();
}

function createAsteroidTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0x718096, 1);
    gfx.beginPath();
    gfx.moveTo(20, 0); gfx.lineTo(40, 10); gfx.lineTo(50, 30);
    gfx.lineTo(30, 50); gfx.lineTo(10, 40); gfx.lineTo(0, 20);
    gfx.closePath();
    gfx.fillPath();
    gfx.fillStyle(0x4a5568, 1);
    gfx.fillCircle(15, 15, 5);
    gfx.fillCircle(35, 25, 8);
    gfx.generateTexture('asteroid', 50, 50);
    gfx.destroy();
}

function createUFOTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xa0aec0, 1);
    gfx.fillEllipse(30, 20, 30, 10);
    gfx.fillStyle(0x4fd1c5, 0.8);
    gfx.fillEllipse(30, 15, 15, 15);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(15, 20, 2);
    gfx.fillCircle(30, 20, 2);
    gfx.fillCircle(45, 20, 2);
    gfx.generateTexture('ufo', 60, 30);
    gfx.destroy();
}

function createStarItemTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xffd700, 1);
    gfx.beginPath();
    for (let i = 0; i < 5; i++) {
        gfx.lineTo(15 + 15 * Math.cos(18 + i * 72 * Math.PI / 180), 15 - 15 * Math.sin(18 + i * 72 * Math.PI / 180));
        gfx.lineTo(15 + 6 * Math.cos(54 + i * 72 * Math.PI / 180), 15 - 6 * Math.sin(54 + i * 72 * Math.PI / 180));
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.lineStyle(2, 0xffa500, 1);
    gfx.strokePath();
    gfx.generateTexture('starItem', 30, 30);
    gfx.destroy();
}

function createBlackHoleTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(40, 40, 30);
    for (let i = 0; i < 3; i++) {
        gfx.lineStyle(2 + i, 0x8b5cf6, 0.3 - i*0.1);
        gfx.strokeCircle(40, 40, 32 + i*4);
    }
    gfx.generateTexture('blackhole', 80, 80);
    gfx.destroy();
}

// ====================================
// CREATE
// ====================================
function create() {
    bgGraphics = this.add.graphics();
    const zone0 = ZONES[0];
    bgGraphics.fillGradientStyle(getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgBot, false), getThemedColor(zone0.bgBot, false), 1);
    bgGraphics.fillRect(0, 0, this.scale.width, this.scale.height);
    bgGraphics.setDepth(0);

    for (let i = 0; i < 100; i++) {
        const star = this.add.circle(
            Phaser.Math.Between(0, this.scale.width),
            Phaser.Math.Between(0, this.scale.height),
            Phaser.Math.FloatBetween(0.5, 2),
            COLORS.STAR,
            Phaser.Math.FloatBetween(0.3, 0.8)
        );
        star.setDepth(1);
        star.scrollSpeed = Phaser.Math.FloatBetween(0.1, 0.5);
        gameState.stars.push(star);
    }

    gameState.obstacles = this.physics.add.group();
    gameState.flyingObstacles = this.physics.add.group();
    gameState.ufos = this.physics.add.group();
    gameState.starItems = this.physics.add.group();
    gameState.blackHoles = this.physics.add.group();
    gameState.coinItems = this.physics.add.group();

    
    

    createRocket(this);


    this.physics.add.collider(gameState.rocket, gameState.obstacles, onCollision, null, this);
    this.physics.add.collider(gameState.rocket, gameState.flyingObstacles, onCollision, null, this);
    this.physics.add.collider(gameState.rocket, gameState.ufos, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.coinItems, collectCoin, null, this);

    createUI(this);

    this.input.on('pointerdown', thrust, this);
    this.input.keyboard.on('keydown-SPACE', thrust, this);
    
    this.scale.on('resize', function (gameSize) {
        if (bgGraphics) {
            bgGraphics.clear();
            const z = ZONES[gameState.currentZone];
            bgGraphics.fillGradientStyle(getThemedColor(z.bgTop, true), getThemedColor(z.bgTop, true), getThemedColor(z.bgBot, false), getThemedColor(z.bgBot, false), 1);
            bgGraphics.fillRect(0, 0, gameSize.width, gameSize.height);
        }
    }, this);

    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (AudioEngine.ctx && AudioEngine.ctx.state === 'suspended') {
                AudioEngine.ctx.resume();
            }
            startGame();
        };
    }
}

// ====================================
// CREATE ROCKET
// ====================================
function createRocket(scene) {
    gameState.rocket = scene.physics.add.sprite(150, 300, 'rocket_' + gameState.selectedRocket);
    gameState.rocket.setOrigin(0.5, 0.5);
    gameState.rocket.setDepth(10);
    
    gameState.rocket.body.setSize(40, 25);
    gameState.rocket.body.setOffset(12, 12);
    
    gameState.rocket.body.allowGravity = false;

    shieldEffect = scene.add.circle(0, 0, 35, 0x00ffff, 0.3);
    shieldEffect.setStrokeStyle(2, 0x00ffff, 0.8);
    shieldEffect.setDepth(11);
    shieldEffect.setVisible(false);

    gameState.exhaust = scene.add.particles(0, 0, 'flare', {
        speed: { min: 120, max: 280 },
        angle: { min: 165, max: 195 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x00d2ff, 0x0077ff, 0x4400ff, 0x0000ff],
        lifespan: 350,
        blendMode: 'ADD',
        frequency: 8,
        quantity: 3,
        follow: gameState.rocket,
        followOffset: { x: -25, y: 7 }
    });
    gameState.exhaust.setDepth(9);
    gameState.exhaust.setVisible(false);

    gameState.exhaustGlow = scene.add.particles(0, 0, 'flare', {
        speed: { min: 50, max: 100 },
        angle: { min: 170, max: 190 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        tint: [0xffffff, 0x88ddff],
        lifespan: 150,
        blendMode: 'ADD',
        frequency: 15,
        quantity: 1,
        follow: gameState.rocket,
        followOffset: { x: -20, y: 7 }
    });
    gameState.exhaustGlow.setDepth(9);
    gameState.exhaustGlow.setVisible(false);
}

// ====================================
// CREATE UI
// ====================================
function createUI(scene) {
    const isMobile = window.innerWidth < 600;
    const mobileScale = isMobile ? 0.7 : 1;

    scoreText = scene.add.text(20, 20, '0', {
        fontSize: (48 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    });
    scoreText.setDepth(100);
    scoreText.setScrollFactor(0);

    highScoreText = scene.add.text(20, 25 + (48 * mobileScale), 'HI: ' + gameState.highScore, {
        fontSize: (18 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 3
    });
    highScoreText.setDepth(100);
    highScoreText.setScrollFactor(0);

    coinText = scene.add.text(scene.scale.width - 20, 20, '🪙 0', {
        fontSize: (22 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    zoneBannerText = scene.add.text(scene.scale.width / 2, scene.scale.height / 4, '', {
        fontSize: (36 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    });
    zoneBannerText.setOrigin(0.5);
    zoneBannerText.setAlpha(0);
    zoneBannerText.setDepth(100);
    zoneBannerText.setScrollFactor(0);

    meteorText = scene.add.text(scene.scale.width / 2, scene.scale.height / 4 + 50, 'WARNING: METEOR SHOWER!', {
        fontSize: (24 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    meteorText.setOrigin(0.5);
    meteorText.setVisible(false);
    meteorText.setDepth(100);
    meteorText.setScrollFactor(0);

    badgeText = scene.add.text(scene.scale.width / 2, scene.scale.height - 50, '', {
        fontSize: (24 * mobileScale) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    badgeText.setOrigin(0.5);
    badgeText.setAlpha(0);
    badgeText.setDepth(100);
    badgeText.setScrollFactor(0);
}

// ====================================
// ZONE SYSTEM
// ====================================
function checkZone(score) {
    for (let i = ZONES.length - 1; i >= 0; i--) {
        if (score >= ZONES[i].minScore) {
            if (gameState.currentZone !== i) {
                transitionToZone(i);
            }
            break;
        }
    }
}

function transitionToZone(zoneIndex) {
    gameState.currentZone = zoneIndex;
    const newZone = ZONES[zoneIndex];

    AudioEngine.shiftAmbient(zoneIndex);

    zoneBannerText.setText('ENTERING: ' + newZone.label);
    zoneBannerText.setColor('#' + newZone.nebulaColor.toString(16).padStart(6, '0'));
    sceneRef.tweens.add({
        targets: zoneBannerText,
        alpha: 1, y: sceneRef.scale.height / 4 - 20,
        duration: 1000, yoyo: true, hold: 2000,
        onComplete: () => { zoneBannerText.y = sceneRef.scale.height / 4; }
    });

    sceneRef.tweens.addCounter({
        from: 0, to: 100, duration: 2000,
        onUpdate: tween => {
            const v = tween.getValue() / 100;
            const oldZone = ZONES[Math.max(0, zoneIndex - 1)];
            const r1 = (oldZone.bgTop >> 16) & 255, g1 = (oldZone.bgTop >> 8) & 255, b1 = oldZone.bgTop & 255;
            const r2 = (newZone.bgTop >> 16) & 255, g2 = (newZone.bgTop >> 8) & 255, b2 = newZone.bgTop & 255;
            const r3 = (oldZone.bgBot >> 16) & 255, g3 = (oldZone.bgBot >> 8) & 255, b3 = oldZone.bgBot & 255;
            const r4 = (newZone.bgBot >> 16) & 255, g4 = (newZone.bgBot >> 8) & 255, b4 = newZone.bgBot & 255;
            
            const currTop = Phaser.Display.Color.GetColor(r1 + (r2 - r1) * v, g1 + (g2 - g1) * v, b1 + (b2 - b1) * v);
            const currBot = Phaser.Display.Color.GetColor(r3 + (r4 - r3) * v, g3 + (g4 - g3) * v, b3 + (b4 - b3) * v);
            
            bgGraphics.clear();
            bgGraphics.fillGradientStyle(getThemedColor(currTop, true), getThemedColor(currTop, true), getThemedColor(currBot, false), getThemedColor(currBot, false), 1);
            bgGraphics.fillRect(0, 0, sceneRef.scale.width, sceneRef.scale.height);
        }
    });

    gameState.stars.forEach(star => {
        sceneRef.tweens.add({
            targets: star,
            alpha: Phaser.Math.FloatBetween(0.1, 0.4),
            duration: 1000, yoyo: true,
            onYoyo: () => {
                if (Math.random() > 0.5) {
                    star.setFillStyle(newZone.nebulaColor, Phaser.Math.FloatBetween(0.4, 0.9));
                } else {
                    star.setFillStyle(COLORS.STAR, Phaser.Math.FloatBetween(0.4, 0.9));
                }
            }
        });
    });

    if (gameState.asteroidTimer) {
        gameState.asteroidTimer.reset({ delay: newZone.asteroidRate, callback: spawnFlyingAsteroid, loop: true });
    }
    if (gameState.ufoTimer) {
        gameState.ufoTimer.reset({ delay: newZone.ufoRate, callback: spawnUFO, loop: true });
    }
}

// ====================================
// UPDATE
// ====================================
function update() {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    if (gameState.hasShield) {
        shieldEffect.setVisible(true);
        shieldEffect.setPosition(gameState.rocket.x, gameState.rocket.y);
        const remaining = gameState.shieldEndTime - Date.now();
        if (remaining <= 0) {
            deactivateShield();
        } else if (remaining < 1500) {
            shieldEffect.setVisible(Math.floor(Date.now() / 100) % 2 === 0);
        }
    } else {
        shieldEffect.setVisible(false);
    }

    const velocityY = gameState.rocket.body.velocity.y;
    const targetAngle = Phaser.Math.Clamp(velocityY * 0.1, -30, 45);
    gameState.rocket.angle = Phaser.Math.Linear(gameState.rocket.angle, targetAngle, 0.15);

    if (gameState.rocket.body.velocity.y > 380) {
        gameState.rocket.body.velocity.y *= 0.97;
    }

    if (gameState.isPlaying && !gameState.isGameOver) {
        if (gameState.rocket.y < -40 || gameState.rocket.y >= 760) {
            gameOver();
        }
    }

    gameState.stars.forEach(star => {
        if (star.scrollSpeed) {
            star.x -= gameState.obstacleSpeed * star.scrollSpeed * 0.016;
            if (star.x < -100) {
                star.x = 900;
            }
        }
    });

    gameState.lastSpawnX -= gameState.obstacleSpeed * 0.016;

    gameState.obstacles.getChildren().forEach(obstacle => {
        if (!obstacle.scored && obstacle.x < gameState.rocket.x - 30) {
            if (obstacle.isTop) {
                addScore(GAME.POINTS_PER_PASS);
                // showFloatingText(gameState.rocket.x, gameState.rocket.y - 50, '+1 SCORE!', '#00ff88'); // Removed to make scoring less "obvious"
                spawnCoinsAtPosition(obstacle.x, obstacle.y + 100);
                updateMissionProgress('obstacles', 1);
            }
            obstacle.scored = true;
            
            const dist = Math.abs(gameState.rocket.y - obstacle.y);
            if (dist < GAME.NEAR_MISS_DISTANCE + 50 && dist > 20) {
                addScore(GAME.NEAR_MISS_BONUS);
                addCoins(3);
                showFloatingText(gameState.rocket.x + 40, gameState.rocket.y, '+5 NEAR MISS! 🔥', '#ffdd59');
                showFloatingText(gameState.rocket.x + 40, gameState.rocket.y + 25, '+3 🪙', '#ffd700');
                AudioEngine.nearMiss();
                updateMissionProgress('nearMiss', 1);
                gameState.nearMissCount++;
            }
        }
        if (obstacle.x < -100) {
            obstacle.destroy();
        }
    });

    gameState.flyingObstacles.getChildren().forEach(asteroid => {
        asteroid.rotation += 0.02;
        if (!asteroid.scored && asteroid.x < gameState.rocket.x - 30) {
            addScore(GAME.POINTS_PER_PASS);
            updateMissionProgress('obstacles', 1);
            asteroid.scored = true;
        }
        if (asteroid.x < -100) {
            asteroid.destroy();
        }
    });

    gameState.ufos.getChildren().forEach(ufo => {
        if (ufo.isDummy) {
            ufo.x -= gameState.obstacleSpeed * 1.5 * 0.016;
        } else {
            ufo.x -= gameState.obstacleSpeed * 1.2 * 0.016;
            ufo.sineOffset += 0.05;
            ufo.y = ufo.startY + Math.sin(ufo.sineOffset) * 100;
        }
        if (ufo.x < -100) ufo.destroy();
    });

    gameState.starItems.getChildren().forEach(star => {
        if (star.x < -100) star.destroy();
    });

    gameState.coinItems.getChildren().forEach(coin => {
        if (coin.x < -100) coin.destroy();
    });

    if (gameState.selectedRocket === 'pulsar') {
        gameState.starItems.getChildren().forEach(star => {
            const dx = star.x - gameState.rocket.x;
            const dy = star.y - gameState.rocket.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                collectStar(gameState.rocket, star);
            }
        });
    }

    if (gameState.gameStartTime > 0) {
        const elapsed = (Date.now() - gameState.gameStartTime) / 1000;
        updateMissionProgress('time', elapsed, true);
    }

    gameState.blackHoles.getChildren().forEach(hole => {
        hole.x -= gameState.obstacleSpeed * 0.016;
        hole.rotation -= 0.05;

        if (Math.random() > 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(30, 60);
            const p = sceneRef.add.circle(hole.x + Math.cos(angle) * dist, hole.y + Math.sin(angle) * dist, 2, 0x8b5cf6, 1);
            sceneRef.tweens.add({
                targets: p,
                x: hole.x, y: hole.y, alpha: 0, duration: 400,
                onComplete: () => p.destroy()
            });
        }

        hole.setVelocityX(-gameState.obstacleSpeed * 0.8);

        const dx = hole.x - gameState.rocket.x;
        const dy = hole.y - gameState.rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 350) {
            const force = (350 - dist) * 0.08;
            const angle = Math.atan2(dy, dx);
            gameState.rocket.body.velocity.y += Math.sin(angle) * force;
            const now = Date.now();
            if (!hole._lastRumble || now - hole._lastRumble > 300) {
                const intensity = Math.min(1, (350 - dist) / 350);
                AudioEngine.blackHoleRumble(intensity);
                hole._lastRumble = now;
            }
        }

        if (dist < 25) {
            gameOver();
        }

        if (hole.x < -100) {
            hole.destroy();
            updateMissionProgress('blackHoleEscape', 1);
            scheduleNextBlackHole();
        }
    });
}

// ====================================
// CONTROLS
// ====================================
function thrust() {
    if (gameState.isGameOver) return;
    if (!gameState.isPlaying) {
        startGame();
        return;
    }
    AudioEngine.thrust();
    AudioEngine.engineRev();
    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket) || ROCKETS[0];
    gameState.rocket.setVelocityY(rocket.thrust);
    if (gameState.exhaust) {
        gameState.exhaust.emitParticle(5);
    }
    if (gameState.exhaustGlow) {
        gameState.exhaustGlow.emitParticle(3);
    }
    createThrustParticles();
}

function createThrustParticles() {
    for (let i = 0; i < 4; i++) {
        const color = Phaser.Math.RND.pick([0xff6600, 0xff9900, 0x00aaff, 0x0066ff]);
        const particle = sceneRef.add.circle(
            gameState.rocket.x - 25 + Phaser.Math.Between(-3, 3),
            gameState.rocket.y + Phaser.Math.Between(-8, 8),
            Phaser.Math.Between(2, 5),
            color,
            0.9
        );
        particle.setDepth(8);
        sceneRef.tweens.add({
            targets: particle,
            x: particle.x - Phaser.Math.Between(30, 60),
            y: particle.y + Phaser.Math.Between(-10, 10),
            alpha: 0, scale: 0.1, duration: Phaser.Math.Between(150, 300),
            onComplete: () => particle.destroy()
        });
    }
    const spark = sceneRef.add.circle(
        gameState.rocket.x - 20,
        gameState.rocket.y + Phaser.Math.Between(-3, 3),
        Phaser.Math.Between(1, 3),
        0xffffff,
        1
    );
    spark.setDepth(8);
    sceneRef.tweens.add({
        targets: spark, x: spark.x - 25, alpha: 0, scale: 0.2, duration: 100,
        onComplete: () => spark.destroy()
    });
}

// ====================================
// GAME FLOW
// ====================================
function startGame() {
    gameState.isPlaying = true;
    gameState.isGameOver = false;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.nearMissCount = 0;
    gameState.meteorShowerActive = false;
    gameState.gameStartTime = Date.now();

    const intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');
    gameState.intensity = intensity;
    gameState.obstacleSpeed = 150 + (intensity * 6);
    gameState.spawnRate = 3000 - (intensity * 60);

    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;

    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket) || ROCKETS[0];
    sceneRef.physics.world.gravity.y = rocket.gravity;
    
    gameState.extraHP = (rocket.special === 'extraHP') ? 1 : 0;
    gameState.ghostHit = (rocket.special === 'ghostHit');
    gameState.scoreMultiplier = (rocket.special === 'scoreMultiplier') ? 1.5 : 1;

    initMissions();

    gameState.missionStats = { stars: 0, time: 0, obstacles: 0, nearMisses: 0, coins: 0, blackHoleEscapes: 0, meteorSurvived: false };

    gameState.rocket.body.allowGravity = true;
    gameState.rocket.setVelocity(0, 0);

    gameState.obstacleTimer = sceneRef.time.addEvent({ delay: gameState.spawnRate, callback: spawnObstacle, loop: true });
    gameState.asteroidTimer = sceneRef.time.addEvent({ delay: 800, callback: spawnFlyingAsteroid, loop: true });
    gameState.ufoTimer = sceneRef.time.addEvent({ delay: 8000, callback: spawnUFO, loop: true });
    
    scheduleNextBlackHole();

    gameState.meteorTimer = sceneRef.time.addEvent({ delay: 20000, callback: triggerMeteorShower, loop: true });
    gameState.starTimer = sceneRef.time.addEvent({ delay: 2000, callback: spawnStar, loop: true });
    gameState.difficultyTimer = sceneRef.time.addEvent({ delay: 5000, callback: increaseDifficulty, loop: true });

    updateScoreDisplay();
    updateCoinDisplay();

    AudioEngine.startAmbient();
    AudioEngine.startEngineHum();

    document.getElementById('homeMenu')?.classList.add('hidden');
    document.getElementById('rocketSelect')?.classList.add('hidden');
    document.getElementById('gameUI')?.classList.remove('hidden');
    
    
    if (gameState.exhaust) gameState.exhaust.setVisible(true);
    if (gameState.exhaustGlow) gameState.exhaustGlow.setVisible(true);
}

// ====================================
// COLLISIONS & INTERACTIONS
// ====================================
function onCollision(rocket, obstacle) {
    if (gameState.isGameOver || gameState.isInvincible || obstacle.isDummy) return;

    if (gameState.hasShield) {
        gameState.hasShield = false;
        gameState.shieldEndTime = 0;
        deactivateShield();
        gameState.isInvincible = true;
        AudioEngine.shieldHit();
        showFloatingText(gameState.rocket.x, gameState.rocket.y - 30, 'SHIELD! 🛡️', '#00ffff');
        sceneRef.tweens.add({
            targets: gameState.rocket, alpha: 0.5, duration: 100, yoyo: true, repeat: 10,
            onComplete: () => { gameState.rocket.alpha = 1; gameState.isInvincible = false; }
        });
        gameState.rocket.setVelocityX(-200);
        sceneRef.time.delayedCall(200, () => { if (!gameState.isGameOver) gameState.rocket.setVelocityX(0); });
        sceneRef.cameras.main.shake(200, 0.01);
        return;
    }

    if (gameState.ghostHit) {
        gameState.ghostHit = false;
        gameState.isInvincible = true;
        AudioEngine.shieldHit();
        showFloatingText(gameState.rocket.x, gameState.rocket.y - 30, 'GHOST PHASE! 👻', '#aa88ff');
        sceneRef.tweens.add({
            targets: gameState.rocket, alpha: 0.3, duration: 100, yoyo: true, repeat: 15,
            onComplete: () => { gameState.rocket.alpha = 1; gameState.isInvincible = false; }
        });
        sceneRef.cameras.main.shake(150, 0.008);
        return;
    }

    if (gameState.extraHP > 0) {
        gameState.extraHP--;
        gameState.isInvincible = true;
        AudioEngine.shieldHit();
        showFloatingText(gameState.rocket.x, gameState.rocket.y - 30, 'HULL HIT! 🛡️', '#ff8800');
        sceneRef.tweens.add({
            targets: gameState.rocket, alpha: 0.5, duration: 100, yoyo: true, repeat: 10,
            onComplete: () => { gameState.rocket.alpha = 1; gameState.isInvincible = false; }
        });
        gameState.rocket.setVelocityX(-200);
        sceneRef.time.delayedCall(200, () => { if (!gameState.isGameOver) gameState.rocket.setVelocityX(0); });
        sceneRef.cameras.main.shake(200, 0.015);
        return;
    }

    gameOver();
}

function collectStar(rocket, star) {
    star.destroy();
    AudioEngine.starCollect();
    updateMissionProgress('stars', 1);
    if (gameState.hasShield) return;
    gameState.collectedStars++;
    showFloatingText(rocket.x, rocket.y - 30, `STAR ${gameState.collectedStars}/${GAME.STARS_FOR_SHIELD} ⭐`, '#ffd700');
    if (gameState.collectedStars >= GAME.STARS_FOR_SHIELD) activateShield();
}

function activateShield() {
    gameState.hasShield = true;
    gameState.collectedStars = 0;
    gameState.shieldEndTime = Date.now() + GAME.SHIELD_DURATION;
    AudioEngine.shieldActivate();
    showFloatingText(gameState.rocket.x, gameState.rocket.y - 40, 'SHIELD ACTIVE! 🛡️', '#00ffff');
    sceneRef.cameras.main.flash(200, 0, 255, 255);
}

function deactivateShield() {
    gameState.hasShield = false;
    shieldEffect.setVisible(false);
}

// ====================================
// SPAWNERS
// ====================================

function spawnObstacle() {
    if (gameState.isGameOver) return;

    let minGapY = 100;
    let maxGapY = sceneRef.scale.height - 100;
    if (maxGapY < minGapY) maxGapY = minGapY;
    let gapPosition = Phaser.Math.Between(minGapY, maxGapY);
    
    // Difficulty logic based on Level
    const rocketIndex = ROCKETS.findIndex(r => r.id === gameState.selectedRocket);
    const difficultyMultiplier = Math.max(1, rocketIndex + 1); // 1 to 6
    
    // Tighter gaps and faster speeds for higher levels
    let gap = GAME.GAP_SIZE - Math.min(80, (gameState.score * 0.8) + (difficultyMultiplier * 5));
    let speed = gameState.obstacleSpeed + (difficultyMultiplier * 15);


    const rocketDef = ROCKETS[rocketIndex] || ROCKETS[0];
    const monsterType = rocketDef.monsterType || 'planet';
    const textureKey = monsterType === 'planet' ? 'planet' : 'monster_' + monsterType;
    
    let spawnX = sceneRef.scale.width + 100;

    // Obstacles get BIGGER as you progress!
    let scaleBoost = Math.min(2.5, 1 + (gameState.score * 0.02));

    // Top monster
    let topObs = gameState.obstacles.create(spawnX, gapPosition - gap/2 - (40 * scaleBoost), textureKey);
    topObs.body.allowGravity = false;
    topObs.body.setVelocityX(-speed);
    topObs.isTop = true;
    topObs.scored = false;
    topObs.setScale(scaleBoost);
    topObs.setDepth(5); // Ensure they render properly

    // Bottom monster
    let botObs = gameState.obstacles.create(spawnX, gapPosition + gap/2 + (40 * scaleBoost), textureKey);
    botObs.body.allowGravity = false;
    botObs.body.setVelocityX(-speed);
    botObs.isTop = false;
    botObs.setScale(scaleBoost);
    botObs.setDepth(5); // Ensure they render properly

    // Adjust hitboxes based on monster type (scale the hitboxes too)
    if (monsterType === 'octopus') {
        topObs.body.setCircle(35 * scaleBoost); botObs.body.setCircle(35 * scaleBoost);
    } else if (monsterType === 'tentacle') {
        topObs.body.setSize(40 * scaleBoost, 60 * scaleBoost); botObs.body.setSize(40 * scaleBoost, 60 * scaleBoost);
    } else if (monsterType === 'bug') {
        topObs.body.setSize(50 * scaleBoost, 70 * scaleBoost); botObs.body.setSize(50 * scaleBoost, 70 * scaleBoost);
    } else if (monsterType === 'void') {
        topObs.body.setSize(50 * scaleBoost, 50 * scaleBoost); botObs.body.setSize(50 * scaleBoost, 50 * scaleBoost);
    } else {
        topObs.body.setCircle(25 * scaleBoost); botObs.body.setCircle(25 * scaleBoost);
    }


    // Add floating up and down movement
    sceneRef.tweens.add({
        targets: [topObs, botObs],
        y: (target) => target.y + Phaser.Math.Between(-30, 30) - (difficultyMultiplier * 10),
        duration: 1000 - (difficultyMultiplier * 50),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}
function spawnFlyingAsteroid() {
    if (gameState.isGameOver || gameState.score < 5) return;
    const asteroid = gameState.flyingObstacles.create(sceneRef.scale.width + 100, Phaser.Math.Between(50, sceneRef.scale.height - 50), 'asteroid');
    asteroid.body.allowGravity = false;
    asteroid.body.setVelocityX(-(gameState.obstacleSpeed * 1.5));
    asteroid.setDepth(6);
    asteroid.scored = false;
}

function spawnUFO() {
    if (gameState.isGameOver || gameState.score < 2) return;
    const ufo = gameState.ufos.create(sceneRef.scale.width + 100, Phaser.Math.Between(150, sceneRef.scale.height - 150), 'ufo');
    if (Phaser.Math.Between(0, 100) < 20) {
        ufo.isDummy = true;
        ufo.setTint(0x888888);
        ufo.body.allowGravity = false;
        ufo.body.setVelocityX(-gameState.obstacleSpeed * 1.5);
    } else {
        ufo.isDummy = false;
        ufo.sineOffset = 0;
        ufo.startY = ufo.y;
        ufo.body.allowGravity = false;
        ufo.body.setVelocityX(-gameState.obstacleSpeed * 1.2);
    }
    ufo.setDepth(6);
}

function spawnStar() {
    if (gameState.isGameOver || Phaser.Math.Between(0, 100) > 70) return;
    const star = gameState.starItems.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'starItem');
    star.body.allowGravity = false;
    star.body.setVelocityX(-gameState.obstacleSpeed);
    star.setDepth(7);
    sceneRef.tweens.add({ targets: star, angle: 360, duration: 2000, repeat: -1 });
}

// ====================================
// NEW SYSTEMS: COINS & MISSIONS
// ====================================
function spawnCoinsAtPosition(x, y) {
    const count = Phaser.Math.Between(1, 3);
    for (let i = 0; i < count; i++) {
        const coin = gameState.coinItems.create(
            x + Phaser.Math.Between(-20, 20),
            y + Phaser.Math.Between(-30, 30),
            'coin'
        );
        coin.body.allowGravity = false;
        coin.body.setVelocityX(-gameState.obstacleSpeed * 0.8);
        coin.body.setVelocityY(Phaser.Math.Between(-30, -60));
        coin.setDepth(8);
        sceneRef.tweens.add({ targets: coin, angle: 360, duration: 1000, repeat: -1 });
        sceneRef.tweens.add({ targets: coin, scaleX: { from: 1, to: 0.3 }, duration: 400, yoyo: true, repeat: -1 });
    }
}

function collectCoin(rocket, coin) {
    coin.destroy();
    AudioEngine.coinCollect();
    addCoins(1);
    showFloatingText(gameState.rocket.x + 30, gameState.rocket.y - 10, '+1 🪙', '#ffd700');
}

function addCoins(amount) {
    gameState.coins += amount;
    gameState.totalCoins += amount;
    localStorage.setItem('wilifunkCoins', gameState.totalCoins.toString());
    updateCoinDisplay();
    updateMissionProgress('coins', amount);
}

function updateCoinDisplay() {
    if (coinText) {
        coinText.setText('🪙 ' + gameState.totalCoins);
        sceneRef.tweens.add({ targets: coinText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
    }
}

function showFloatingText(x, y, text, color) {
    const popup = sceneRef.add.text(x, y, text, {
        fontSize: '16px', fontFamily: "'Orbitron', monospace", fill: color,
        fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setDepth(200);
    sceneRef.tweens.add({
        targets: popup, y: popup.y - 60, alpha: 0, duration: 800,
        onComplete: () => popup.destroy()
    });
}

function initMissions() {
    const shuffled = Phaser.Utils.Array.Shuffle([...MISSION_POOL]);
    gameState.activeMissions = shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, completed: false }));
}

function updateMissionProgress(type, amount, absolute = false) {
    gameState.activeMissions.forEach((mission, index) => {
        if (mission.completed) return;
        let matches = false;
        switch (mission.type) {
            case 'stars': matches = (type === 'stars'); break;
            case 'time': matches = (type === 'time'); break;
            case 'obstacles': matches = (type === 'obstacles'); break;
            case 'nearMiss': matches = (type === 'nearMiss'); break;
            case 'score': matches = (type === 'score'); break;
            case 'coins': matches = (type === 'coins'); break;
            case 'meteorSurvive': matches = (type === 'meteorSurvive'); break;
            case 'blackHoleEscape': matches = (type === 'blackHoleEscape'); break;
        }
        if (matches) {
            if (absolute) {
                mission.progress = amount;
            } else {
                mission.progress += amount;
            }
            if (mission.progress >= mission.target && !mission.completed) {
                completeMission(index);
            }
        }
    });
    if (type === 'score') {
        gameState.activeMissions.forEach((mission, index) => {
            if (mission.type === 'score' && !mission.completed && gameState.score >= mission.target) {
                mission.progress = mission.target;
                completeMission(index);
            }
        });
    }
}

function completeMission(index) {
    const mission = gameState.activeMissions[index];
    if (mission.completed) return;
    mission.completed = true;
    addCoins(mission.reward);
    AudioEngine.missionComplete();
    showFloatingText(sceneRef.scale.width - 100, 120 + index * 55, `+${mission.reward} 🪙 MISSION!`, '#00ff88');
    
    sceneRef.time.delayedCall(1500, () => {
        const usedIds = gameState.activeMissions.map(m => m.id);
        const available = MISSION_POOL.filter(m => !usedIds.includes(m.id));
        if (available.length > 0) {
            const newMission = Phaser.Math.RND.pick(available);
            gameState.activeMissions[index] = { ...newMission, progress: 0, completed: false };
        }
    });
}

// ====================================
// SCORE & DIFFICULTY
// ====================================
function addScore(points) {
    const actualPoints = Math.floor(points * gameState.scoreMultiplier);
    gameState.score += actualPoints;
    updateScoreDisplay();
    checkZone(gameState.score);
    updateMissionProgress('score', gameState.score, true);
    sceneRef.tweens.add({ targets: scoreText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    if (gameState.score > 0 && gameState.score % 5 === 0) increaseDifficulty();
}

function increaseDifficulty() {
    if (gameState.isGameOver) return;
    gameState.obstacleSpeed += GAME.SPEED_INCREASE;
    if (gameState.spawnRate > GAME.MIN_SPAWN_RATE) {
        gameState.spawnRate -= GAME.SPAWN_DECREASE;
    }
    if (gameState.obstacleTimer) {
        gameState.obstacleTimer.reset({ delay: gameState.spawnRate, callback: spawnObstacle, loop: true });
    }
}

function updateScoreDisplay() {
    scoreText.setText(gameState.score.toString());
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreText.setText('HI: ' + gameState.highScore);
        if (gameState.score % 10 === 0) {
            sceneRef.tweens.add({ targets: highScoreText, scale: 1.2, duration: 100, yoyo: true });
        }
    }

    BADGES.forEach(badge => {
        if (gameState.score >= badge.score && !gameState.unlockedBadges.includes(badge.name)) {
            gameState.unlockedBadges.push(badge.name);
            localStorage.setItem('spaceRocketBadges', JSON.stringify(gameState.unlockedBadges));
            showBadge(badge);
            updateHomeBadges();
        }
    });
}

function showBadge(badge) {
    AudioEngine.badgeUnlock();
    badgeText.setText(`${badge.icon} ${badge.name} Unlocked!`);
    badgeText.setAlpha(1);
    sceneRef.tweens.add({ targets: badgeText, scale: { from: 0.5, to: 1.2 }, duration: 400, ease: 'Back.easeOut' });
    sceneRef.tweens.add({ targets: badgeText, scale: 1, duration: 200, delay: 400 });
    sceneRef.tweens.add({ targets: badgeText, alpha: 0, y: badgeText.y - 50, duration: 800, delay: 2500, onComplete: () => { badgeText.y += 50; } });
}

function updateHomeBadges() {
    if (typeof window.updateBadgesUI === 'function') {
        window.updateBadgesUI(gameState.unlockedBadges, gameState.highScore);
    }
}

// ====================================
// GAME OVER & RESTART
// ====================================
function gameOver() {
    gameState.isGameOver = true;
    gameState.isPlaying = false;

    if (gameState.obstacleTimer) gameState.obstacleTimer.remove();
    if (gameState.asteroidTimer) gameState.asteroidTimer.remove();
    if (gameState.starTimer) gameState.starTimer.remove();
    if (gameState.difficultyTimer) gameState.difficultyTimer.remove();
    if (gameState.blackHoleTimer) gameState.blackHoleTimer.remove();

    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.body.allowGravity = false;
    
    if (gameState.exhaust) gameState.exhaust.setVisible(false);
    if (gameState.exhaustGlow) gameState.exhaustGlow.setVisible(false);
    
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();
    AudioEngine.explosion();
    createExplosion();

    localStorage.setItem('spaceRocketHighScore', gameState.highScore.toString());
    sceneRef.cameras.main.shake(800, 0.06);
    sceneRef.cameras.main.flash(500, 255, 0, 0);
    sceneRef.cameras.main.flash(200, 255, 100, 100);

    if (typeof window.showGameOver === 'function') {
        window.showGameOver({
            score: gameState.score,
            highScore: gameState.highScore,
            coins: gameState.coins,
            totalCoins: gameState.totalCoins,
            zone: ZONES[gameState.currentZone],
            missions: gameState.activeMissions
        });
    }
}

function createExplosion() {
    for (let i = 0; i < 20; i++) {
        const particle = sceneRef.add.circle(
            gameState.rocket.x, gameState.rocket.y,
            Phaser.Math.Between(3, 10),
            Phaser.Math.RND.pick([0xff4400, 0xff8800, 0xffff00, 0x444444]),
            1
        );
        particle.setDepth(20);
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        const speed = Phaser.Math.Between(50, 200);
        sceneRef.tweens.add({
            targets: particle,
            x: gameState.rocket.x + Math.cos(angle) * speed,
            y: gameState.rocket.y + Math.sin(angle) * speed,
            alpha: 0, scale: 0.1, duration: Phaser.Math.Between(400, 800),
            onComplete: () => particle.destroy()
        });
    }
    gameState.rocket.setVisible(false);
}

window.restartGame = function() {
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();

    gameState.isGameOver = false;
    gameState.isPlaying = false;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.nearMissCount = 0;
    gameState.meteorShowerActive = false;
    gameState.obstacleSpeed = GAME.OBSTACLE_SPEED;
    gameState.spawnRate = GAME.OBSTACLE_SPAWN_RATE;
    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;
    gameState.currentZone = 0;
    gameState.extraHP = 0;
    gameState.ghostHit = false;
    gameState.scoreMultiplier = 1;
    gameState.gameStartTime = 0;

    if (bgGraphics) {
        const zone0 = ZONES[0];
        bgGraphics.clear();
        bgGraphics.fillGradientStyle(getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgBot, false), getThemedColor(zone0.bgBot, false), 1);
        bgGraphics.fillRect(0, 0, sceneRef.scale.width, sceneRef.scale.height);
    }
    if (zoneBannerText) zoneBannerText.setAlpha(0);

    gameState.stars.forEach(star => {
        if (star.setFillStyle) {
            star.x = Phaser.Math.Between(0, sceneRef.scale.width + 50);
            star.y = Phaser.Math.Between(0, sceneRef.scale.height);
            star.setFillStyle(COLORS.STAR, Phaser.Math.FloatBetween(0.3, 0.8));
        }
    });

    gameState.obstacles.clear(true, true);
    gameState.flyingObstacles.clear(true, true);
    gameState.ufos.clear(true, true);
    gameState.starItems.clear(true, true);
    gameState.blackHoles.clear(true, true);
    gameState.coinItems.clear(true, true);

    gameState.rocket.setPosition(150, 300).setVelocity(0, 0).setAngle(0).setVisible(true);
    gameState.rocket.body.allowGravity = false;
    
    sceneRef.physics.world.gravity.y = 480;

    updateScoreDisplay();
    updateCoinDisplay();
    highScoreText.setColor('#888888');
    badgeText.setAlpha(0);
    if (typeof meteorText !== 'undefined') meteorText.setVisible(false);

    document.getElementById('gameOverOverlay')?.classList.add('hidden');
    document.getElementById('winScreen')?.classList.add('hidden');
    
    // Gameplay will be explicitly started by the Launch/Retry buttons
};

// ====================================
// SPECIAL EVENTS
// ====================================
function triggerMeteorShower() {
    if (gameState.isGameOver || gameState.score < 10) return;
    gameState.meteorShowerActive = true;
    AudioEngine.meteorWarning();
    if (typeof meteorText !== 'undefined') {
        meteorText.setVisible(true).setAlpha(1);
        sceneRef.tweens.add({ targets: meteorText, alpha: 0, duration: 200, yoyo: true, repeat: 5, onComplete: () => meteorText.setVisible(false) });
    }
    for (let i = 0; i < 6; i++) sceneRef.time.delayedCall(i * 600 + 1000, spawnMeteor);
    
    sceneRef.time.delayedCall(5000, () => {
        if (!gameState.isGameOver) {
            gameState.meteorShowerActive = false;
            updateMissionProgress('meteorSurvive', 1);
        }
    });
}

function spawnMeteor() {
    if (gameState.isGameOver) return;
    const meteor = gameState.flyingObstacles.create(900, Phaser.Math.Between(0, 600), 'asteroid');
    meteor.setScale(0.7).body.allowGravity = false;
    const angle = Phaser.Math.Between(160, 200) * (Math.PI / 180);
    meteor.body.setVelocity(
        Math.cos(angle) * gameState.obstacleSpeed * 1.5,
        Math.sin(angle) * gameState.obstacleSpeed * 1.5
    );
    meteor.setDepth(6);
    meteor.scored = false;
}

function scheduleNextBlackHole() {
    if (gameState.isGameOver) return;
    const z = ZONES[gameState.currentZone] || ZONES[0];
    const delay = Phaser.Math.Between(z.bhMin, z.bhMax);
    gameState.blackHoleTimer = sceneRef.time.delayedCall(delay, spawnBlackHole);
}

function spawnBlackHole() {
    if (gameState.isGameOver || gameState.score < 50) {
        scheduleNextBlackHole();
        return;
    }
    const yPos = Phaser.Math.Between(100, sceneRef.scale.height - 100);
    const bh = gameState.blackHoles.create(sceneRef.scale.width + 150, yPos, 'blackhole');
    bh.body.allowGravity = false;
    bh.body.setCircle(30);
    bh.setDepth(5);
}

const game = new Phaser.Game(config);


window.refreshTheme = function() {
    if (typeof bgGraphics !== 'undefined' && bgGraphics && typeof ZONES !== 'undefined') {
        const zone0 = ZONES[0];
        bgGraphics.clear();
        bgGraphics.fillGradientStyle(getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgTop, true), getThemedColor(zone0.bgBot, false), getThemedColor(zone0.bgBot, false), 1);
        bgGraphics.fillRect(0, 0, sceneRef.scale.width, sceneRef.scale.height);
    }
    
    // update grid graphics if it exists
    if (typeof gridGraphics !== 'undefined' && gridGraphics) {
        gridGraphics.clear();
        gridGraphics.lineStyle(2, getThemedColor(0x00ffff, false), 0.2);
        gridGraphics.beginPath();
        for (let i = 0; i < sceneRef.scale.width; i += 80) {
            gridGraphics.moveTo(i, 0);
            gridGraphics.lineTo(i, sceneRef.scale.height);
        }
        for (let j = 0; j < sceneRef.scale.height; j += 80) {
            gridGraphics.moveTo(0, j);
            gridGraphics.lineTo(sceneRef.scale.width, j);
        }
        gridGraphics.strokePath();
    }
};
