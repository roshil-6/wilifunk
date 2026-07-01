/**
 * spaceroot — Space Survival Game
 * Professional Phaser 3 Implementation
 * Flappy Bird-style mechanics in space
 */

// ====================================
// CONFIGURATION
// ====================================
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'phaser-game',
    backgroundColor: '#0a0a1a',
    resolution: window.devicePixelRatio || 1,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance'
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
    OBSTACLE_SPAWN_RATE: 3100, // Increased from 2200 to prevent crowding!
    GAP_SIZE: 175,
    MIN_GAP_Y: 100,
    MAX_GAP_Y: 400,
    SPEED_INCREASE: 8,
    SPAWN_DECREASE: 30, // Reduced from 50 to scale slower
    MIN_SPAWN_RATE: 1600, // Capped at 1600 to prevent screen flooding
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
        asteroidRate: 800, ufoRate: 6000, bhMin: 3000, bhMax: 5000,
        ambientPitch: 38, ambientMid: 110, label: '🌌 DEEP SPACE'
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
    { id: 'pioneer', name: 'Deep Space Explorer', cost: 0, color1: '#dcdde1', color2: '#ff3838', gravity: 480, thrust: -300, special: 'none', emoji: '🚀', description: 'Standard physics. Balanced explorer.', monsterType: 'planet' },
    { id: 'red_fury', name: 'Crimson Red Fury', cost: 150, color1: '#a4b0be', color2: '#ea2027', gravity: 500, thrust: -330, special: 'speed', emoji: '🔴', description: 'Lightweight crimson rocket. Agile and fast.', monsterType: 'planet' },
    { id: 'cosmic_pink', name: 'Cosmic Pink Shield', cost: 300, color1: '#dcdde1', color2: '#ff5bbe', gravity: 460, thrust: -290, special: 'shield', emoji: '💗', description: 'Heavily armored pink & silver cruiser with shield boost.', monsterType: 'planet' }
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
        if (type === 'sawtooth' || type === 'square') type = 'triangle';
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal * 0.5, now); // 50% reduction in volume
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
        // Soften harsh waves
        if (type === 'sawtooth' || type === 'square') type = 'triangle';
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
        gain.gain.setValueAtTime(gainVal * 0.4, now); // 60% reduction in volume
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
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc1.start(now); osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(90, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain2.gain.setValueAtTime(0.04, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc2.start(now); osc2.stop(now + 0.1);
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
        filter.frequency.value = 300;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        source.start();
        this._sweep(80, 20, 'sine', 0.15, 0.5);
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
        if (this.muted || this._musicInterval) return;
        const ctx = this._getCtx();
        this._musicActive = true;
        
        // Happy, bouncy C Major scale (C, E, G, A, G, E) for a kids tune
        // Twinkle Twinkle Little Star (C, C, G, G, A, A, G)
        const melody = [523.25, 523.25, 783.99, 783.99, 880.00, 880.00, 783.99];
        let step = 0;
        const tempo = 0.4; // 400ms per note for a kids lullaby/song pace

        this._musicInterval = setInterval(() => {
            if (!this._musicActive || this.muted) return;
            const now = ctx.currentTime;
            
            // Plucky Triangle Synth for melody
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = melody[step % melody.length];
            
            gain.gain.setValueAtTime(0.04, now); // Soft, non-irritating volume
            gain.gain.exponentialRampToValueAtTime(0.001, now + (tempo * 0.8)); // Plucky short note
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + tempo);

            // Simple bouncy sine bass on alternating beats
            if (step % 2 === 0) {
                const bassOsc = ctx.createOscillator();
                const bassGain = ctx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.value = 261.63; // C4
                
                bassGain.gain.setValueAtTime(0.06, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + (tempo * 1.5));
                
                bassOsc.connect(bassGain);
                bassGain.connect(ctx.destination);
                
                bassOsc.start(now);
                bassOsc.stop(now + (tempo * 2));
            }

            step++;
        }, tempo * 1000);
    },

    stopAmbient() {
        this._musicActive = false;
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
    },

    startEngineHum() {
        // Disabled to remove irritating drone noise
    },

    engineRev() {
        // Disabled
    },

    stopEngineHum() {
        // Disabled
    },

    shiftAmbient(zoneIndex) {
        // Disabled: music now stays consistent across zones
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
    fuelItems: null,
    fuel: 100,
    fuelTimer: null,
    stars: [],
    isGameOver: false,
    ammo: 5,
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
let bgTileSprite;
let coinText;
let scoreText;
let fuelBarBg;
let fuelBarFill;
let fuelText;
let highScoreText;
let meteorText;
let badgeText;
let zoneBannerText;
let ammoText;

// ====================================
// PRELOAD
// ====================================
function preload() {
    sceneRef = this;

    gameState.highScore = parseInt(localStorage.getItem('spaceRocketHighScore') || '0');
    gameState.unlockedBadges = JSON.parse(localStorage.getItem('spaceRocketBadges') || '[]');
    gameState.intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');
    gameState.totalCoins = parseInt(localStorage.getItem('wilifunkCoins') || '0');
    // Load selected rocket from localStorage, fallback to pioneer
    gameState.selectedRocket = localStorage.getItem('wilifunkSelectedRocket') || 'pioneer';
    gameState.unlockedRockets = JSON.parse(localStorage.getItem('wilifunkUnlockedRockets') || '["pioneer", "red_fury", "cosmic_pink", "rocket_rider", "jetpack_exec"]');

    if (typeof updateHomeBadges === 'function') updateHomeBadges();

    ROCKETS.forEach(r => createRocketTexture(this, r.id, r.color1, r.color2));
    createFlameTexture(this);
    
    createMonsterOrb(this);
    createMonsterTentacle(this);
    createMonsterOctopus(this);
    createMonsterBug(this);
    createMonsterVoid(this);

    createUniverseBackground(this);
    createPlanetTexture(this);
    createAsteroidTexture(this);
    createUFOTexture(this);
    createStarItemTexture(this);
    createFuelItemTexture(this);
    createBlackHoleTexture(this);
    createCoinTexture(this);
    createLaserTexture(this);
    createUfoProjectileTexture(this);
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
    // Big canvas for a gorgeous, detailed rocket sprite
    const W = 128, H = 96;
    const canvas = scene.textures.createCanvas(key, W, H);
    const ctx = canvas.context;
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;

    // Determine base colors: pioneer uses classic red+skyblue, others use their theme
    const isPioneer = (id === 'pioneer');
    const bodyColor = isPioneer ? '#dcdde1' : color1;  // silver body
    const accentColor = isPioneer ? '#ff2222' : color2; // red accent
    const noseColor = isPioneer ? '#ff3838' : color2;
    const wingColor = isPioneer ? '#cc1100' : color2;
    const highlightColor = 'rgba(255,255,255,0.85)';

    // ----- NOZZLE (left side) -----
    let nozzleGrad = ctx.createLinearGradient(0, 30, 22, 66);
    nozzleGrad.addColorStop(0, '#888');
    nozzleGrad.addColorStop(0.5, '#555');
    nozzleGrad.addColorStop(1, '#222');
    ctx.fillStyle = nozzleGrad;
    // Top nozzle flare
    ctx.beginPath();
    ctx.moveTo(6, 26); ctx.lineTo(22, 30); ctx.lineTo(22, 40); ctx.lineTo(6, 36);
    ctx.closePath(); ctx.fill();
    // Bottom nozzle flare
    ctx.beginPath();
    ctx.moveTo(6, 56); ctx.lineTo(22, 52); ctx.lineTo(22, 62); ctx.lineTo(6, 66);
    ctx.closePath(); ctx.fill();
    // Engine glow ring
    let engineGlow = ctx.createRadialGradient(22, 48, 0, 22, 48, 14);
    engineGlow.addColorStop(0, 'rgba(255,200,60,0.95)');
    engineGlow.addColorStop(0.4, 'rgba(255,100,20,0.7)');
    engineGlow.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = engineGlow;
    ctx.beginPath(); ctx.arc(22, 48, 14, 0, Math.PI * 2); ctx.fill();

    // Accent stripe on nozzle
    ctx.fillStyle = accentColor;
    ctx.fillRect(6, 30, 4, 6);
    ctx.fillRect(6, 56, 4, 6);

    // ----- TOP WING -----
    let wingGrad = ctx.createLinearGradient(20, 0, 70, 48);
    wingGrad.addColorStop(0, wingColor);
    wingGrad.addColorStop(0.6, accentColor);
    wingGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(24, 46); ctx.lineTo(8, 8); ctx.lineTo(68, 34); ctx.lineTo(56, 42);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(68, 34); ctx.stroke();

    // ----- BOTTOM WING -----
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(24, 50); ctx.lineTo(8, 88); ctx.lineTo(68, 62); ctx.lineTo(56, 54);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 88); ctx.lineTo(68, 62); ctx.stroke();

    // ----- MAIN FUSELAGE -----
    let bodyGrad = ctx.createLinearGradient(20, 26, 20, 70);
    bodyGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    bodyGrad.addColorStop(0.2, bodyColor);
    bodyGrad.addColorStop(0.7, bodyColor);
    bodyGrad.addColorStop(1, 'rgba(0,80,140,0.85)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(22, 30);
    ctx.lineTo(96, 38);
    ctx.lineTo(112, 48);
    ctx.lineTo(96, 58);
    ctx.lineTo(22, 66);
    ctx.closePath(); ctx.fill();
    // Body highlight streak
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(28, 36); ctx.lineTo(96, 40); ctx.stroke();

    // ----- NOSE CONE -----
    let noseGrad = ctx.createLinearGradient(90, 36, 120, 48);
    noseGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    noseGrad.addColorStop(0.3, noseColor);
    noseGrad.addColorStop(1, 'rgba(120,0,0,0.9)');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(96, 38); ctx.lineTo(120, 48); ctx.lineTo(96, 58);
    ctx.closePath(); ctx.fill();

    // ----- COCKPIT WINDOW -----
    let cockpitGrad = ctx.createRadialGradient(75, 44, 0, 75, 44, 12);
    cockpitGrad.addColorStop(0, 'rgba(255,255,255,1)');
    cockpitGrad.addColorStop(0.35, 'rgba(120,220,255,0.9)');
    cockpitGrad.addColorStop(1, 'rgba(0,80,180,0.7)');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath(); ctx.ellipse(75, 48, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Cockpit shine
    ctx.fillStyle = highlightColor;
    ctx.beginPath(); ctx.ellipse(71, 44, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill();

    // ----- RED ACCENT STRIPE -----
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(42, 30, 18, 4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(42, 62, 18, 4, 2);
    ctx.fill();

    // ----- RIVET DETAILS -----
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let rx of [34, 50, 62]) {
        ctx.beginPath(); ctx.arc(rx, 48, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    canvas.refresh();
}

function createFlameTexture(scene) {
    const key = 'flare';
    const size = 32;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.context;
    
    ctx.clearRect(0, 0, size, size);
    
    let grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(220, 220, 220, 0.85)');
    grad.addColorStop(0.6, 'rgba(120, 120, 120, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    canvas.refresh();
}

function createUniverseBackground(scene) {
    if (scene.textures.exists('bgTexture')) return;
    const w = 1200;
    const h = scene.scale.height; // Dynamically matches screen height to prevent any vertical tiling gaps!
    let canvas = scene.textures.createCanvas('bgTexture', w, h);
    let ctx = canvas.getContext();

    // Vibrant deep space gradient (Indigo to rich violet-purple)
    let bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#090514'); // Very dark void
    bgGrad.addColorStop(0.5, '#190a30'); // Deep purple
    bgGrad.addColorStop(1, '#2c0d4a'); // Rich violet
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Highly subtle (low opacity) organic nebula gas ribbons (colors: soft pink and violet)
    ctx.fillStyle = 'rgba(230, 86, 253, 0.05)'; // Very subtle Pink Ribbon
    ctx.beginPath();
    ctx.moveTo(0, h * 0.4);
    ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.15, w, h * 0.4);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    ctx.fillStyle = 'rgba(108, 92, 231, 0.04)'; // Very subtle Purple Ribbon
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.bezierCurveTo(w * 0.35, h * 0.8, w * 0.65, h * 0.25, w, h * 0.5);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Swirling starry spirals (subtle cyan/teal galaxy swirls)
    for (let i = 0; i < 4; i++) {
        let sx = Math.random() * w;
        let sy = Math.random() * h;
        ctx.strokeStyle = 'rgba(0, 206, 201, 0.15)'; // Subtle cyan
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let a = 0; a < 15; a += 0.5) {
            let r = a * 1.2;
            let px = sx + Math.cos(a) * r;
            let py = sy + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    // White stars (reduced density)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 1.5 + 1, Math.random() * 1.5 + 1);
    }

    // Glowing Golden Stars (reduced)
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 5; i++) {
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(x, y - 3); ctx.lineTo(x + 1, y - 1);
        ctx.lineTo(x + 3, y); ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x, y + 3); ctx.lineTo(x - 1, y + 1);
        ctx.lineTo(x - 3, y); ctx.lineTo(x - 1, y - 1);
        ctx.fill();
    }

    // Glowing Neon Blue / Cyan Stars (reduced)
    ctx.fillStyle = '#00d2d3';
    for (let i = 0; i < 5; i++) {
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(x, y - 2); ctx.lineTo(x + 1, y - 1);
        ctx.lineTo(x + 2, y); ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x, y + 2); ctx.lineTo(x - 1, y + 1);
        ctx.lineTo(x - 2, y); ctx.lineTo(x - 1, y - 1);
        ctx.fill();
    }

    // Glowing Neon Pink Stars (reduced)
    ctx.fillStyle = '#ff7675';
    for (let i = 0; i < 4; i++) {
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    canvas.refresh();
}

function createPlanetTexture(scene) {
    // Always remove old textures and redraw fresh
    ['planet1','planet2','planet3','planet'].forEach(k => { if (scene.textures.exists(k)) scene.textures.remove(k); });

    // HIGH QUALITY 512px canvas planets for HD rendering
    function drawPlanet(key, bodyColor, bodyColorDark, ringColor1, ringColor2, hasRings, size=512) {
        let tex = scene.textures.createCanvas(key, size, size);
        let ctx = tex.getContext();
        let cx = size / 2, cy = size / 2;
        // Planet radius: 36% of canvas so rings fit within canvas comfortably
        let r = size * 0.36;
        // Ring semi-major: 46% of canvas half-width
        let ringRX = size * 0.46;
        let ringRY = ringRX * 0.22;

        // --- RINGS BACK (drawn first, behind planet) ---
        if (hasRings) {
            ctx.save();
            // Clip to bottom half only so back rings show below planet
            ctx.beginPath(); ctx.rect(0, cy, size, size); ctx.clip();
            for (let ri = 0; ri < 3; ri++) {
                let rw = ringRX * (1 + ri * 0.12);
                let rh = ringRY * (1 + ri * 0.08);
                let rc = [ringColor1, ringColor2, ringColor1][ri];
                ctx.strokeStyle = rc;
                ctx.lineWidth = 16 - ri * 4;
                ctx.globalAlpha = 0.9 - ri * 0.15;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // --- PLANET SPHERE (radial gradient for 3D depth) ---
        let sphereGrad = ctx.createRadialGradient(
            cx - r * 0.35, cy - r * 0.35, r * 0.05,
            cx + r * 0.05, cy + r * 0.05, r
        );
        sphereGrad.addColorStop(0.0, 'rgba(255,255,255,0.95)');
        sphereGrad.addColorStop(0.18, bodyColor);
        sphereGrad.addColorStop(0.75, bodyColorDark);
        sphereGrad.addColorStop(1.0, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

        // --- INNER SHADOW (clipped) ---
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
        let shadowGrad = ctx.createRadialGradient(cx + r*0.55, cy + r*0.5, 0, cx, cy, r);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
        shadowGrad.addColorStop(0.6, 'rgba(0,0,0,0.1)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // --- SPECULAR HIGHLIGHT ---
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
        let hlGrad = ctx.createRadialGradient(cx - r*0.4, cy - r*0.4, 0, cx - r*0.2, cy - r*0.2, r*0.6);
        hlGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        hlGrad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
        hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hlGrad;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // --- RINGS FRONT (drawn on top, above planet centre) ---
        if (hasRings) {
            ctx.save();
            // Clip to top half only so front rings show above planet
            ctx.beginPath(); ctx.rect(0, 0, size, cy); ctx.clip();
            for (let ri = 0; ri < 3; ri++) {
                let rw = ringRX * (1 + ri * 0.12);
                let rh = ringRY * (1 + ri * 0.08);
                let rc = [ringColor1, ringColor2, ringColor1][ri];
                ctx.strokeStyle = rc;
                ctx.lineWidth = 16 - ri * 4;
                ctx.globalAlpha = 0.9 - ri * 0.15;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Helper to convert hex to rgba
        function hexToRgba(hex, alpha) {
            let cleanHex = hex.replace('#', '');
            if (cleanHex.length === 3) {
                cleanHex = cleanHex.split('').map(char => char + char).join('');
            }
            let num = parseInt(cleanHex, 16);
            let r = (num >> 16) & 255;
            let g = (num >> 8) & 255;
            let b = num & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // --- OUTER GLOW ---
        let glowGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
        glowGrad.addColorStop(0, hexToRgba(bodyColor, 0.3));
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = glowGrad;
        // simple glow using shadow
        ctx.shadowColor = bodyColor;
        ctx.shadowBlur = 56;
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        tex.refresh();
    }

    // planet1: Hot-pink Saturn with cyan + gold rings
    drawPlanet('planet1', '#e056fd', '#6c2a80', '#00e5ff', '#ffd700', true);
    // planet2: Deep rose-pink solid planet (no rings)
    drawPlanet('planet2', '#fd79a8', '#8b1a3a', '#ff6b81', '#ffeaa7', false);
    // planet3: Magenta Saturn with pink + lavender rings
    drawPlanet('planet3', '#ff79c6', '#5a0066', '#a29bfe', '#ff6bcb', true);
    // fallback
    drawPlanet('planet', '#e056fd', '#6c2a80', '#00e5ff', '#ffd700', false);
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

function drawUFO2DCanvas(canvas, domeColor, bodyColor1, bodyColor2, outlineColor, lightColors) {
    const ctx = canvas.context;
    ctx.clearRect(0, 0, 256, 256);
    ctx.imageSmoothingEnabled = true;

    const cx = 128;
    const cy = 128;

    // Draw glowing tractor beam
    let beamGrad = ctx.createLinearGradient(cx, cy + 10, cx, cy + 70);
    beamGrad.addColorStop(0, 'rgba(0, 255, 240, 0.4)');
    beamGrad.addColorStop(1, 'rgba(0, 255, 240, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 10);
    ctx.lineTo(cx + 20, cy + 10);
    ctx.lineTo(cx + 45, cy + 70);
    ctx.lineTo(cx - 45, cy + 70);
    ctx.closePath();
    ctx.fill();

    // Dome (Glass cabin)
    let domeGrad = ctx.createRadialGradient(cx, cy - 12, 4, cx, cy - 12, 32);
    domeGrad.addColorStop(0, '#ffffff');
    domeGrad.addColorStop(0.3, domeColor);
    domeGrad.addColorStop(1, '#001b44');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 30, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Alien pilot
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 21, 2, 3.5, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(cx + 3, cy - 21, 2, 3.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Main saucer body
    let bodyGrad = ctx.createLinearGradient(cx - 90, cy, cx + 90, cy + 20);
    bodyGrad.addColorStop(0, bodyColor1);
    bodyGrad.addColorStop(0.5, bodyColor2);
    bodyGrad.addColorStop(1, bodyColor1);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 88, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Saucer outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 84, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Lights
    const lightPositions = [
        { dx: -70, dy: 3, color: lightColors[0] },
        { dx: -42, dy: 9, color: lightColors[1] },
        { dx: -15, dy: 13, color: lightColors[2] },
        { dx: 15, dy: 13, color: lightColors[2] },
        { dx: 42, dy: 9, color: lightColors[1] },
        { dx: 70, dy: 3, color: lightColors[0] }
    ];

    lightPositions.forEach(l => {
        let lightGlow = ctx.createRadialGradient(cx + l.dx, cy + l.dy, 0, cx + l.dx, cy + l.dy, 7);
        lightGlow.addColorStop(0, l.color);
        lightGlow.addColorStop(0.4, l.color);
        lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(cx + l.dx, cy + l.dy, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + l.dx, cy + l.dy, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function createUFOTexture(scene) {
    // 1. Red Dome / Silver Saucer (ufo)
    if (!scene.textures.exists('ufo')) {
        const canvas = scene.textures.createCanvas('ufo', 256, 256);
        drawUFO2DCanvas(canvas, '#ff0055', '#2c3e50', '#bdc3c7', '#00ffff', ['#ff007f', '#ffcc00', '#00ff88']);
    }

    // 2. Cyan Dome / Blue Saucer (ufo2)
    if (!scene.textures.exists('ufo2')) {
        const canvas = scene.textures.createCanvas('ufo2', 256, 256);
        drawUFO2DCanvas(canvas, '#00d2d3', '#130f40', '#2e86de', '#9b59b6', ['#9b59b6', '#00d2d3', '#ffd32a']);
    }
}


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

function createStarItemTexture(scene) {
    const key = 'starItem';
    if (scene.textures.exists(key)) return;
    const size = 36;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.context;
    ctx.clearRect(0, 0, size, size);
    
    const cx = size / 2;
    const cy = size / 2;
    const spikes = 5;
    const outerRadius = 15;
    const innerRadius = 7.0;
    
    // Gold/Orange outer glow shadow
    ctx.shadowColor = 'rgba(255, 170, 0, 0.75)';
    ctx.shadowBlur = 6;
    
    // Draw the 5-pointed rounded star path
    ctx.beginPath();
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    
    // Fill with radial gradient for shiny 3D bubble effect
    let grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, outerRadius);
    grad.addColorStop(0, '#ffffff');      // bright shine core
    grad.addColorStop(0.3, '#ffea4a');    // primary golden yellow
    grad.addColorStop(0.8, '#ff9900');    // dark orange-gold
    grad.addColorStop(1, '#e65c00');      // deep orange edge
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Clear shadow for outline to keep borders crisp
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    canvas.refresh();
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
    ThreeGLBBridge.init(this);
    createUniverseBackground(this);
    bgTileSprite = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bgTexture').setOrigin(0, 0);
    bgTileSprite.setDepth(0);
    
    bgGraphics = this.add.graphics();
    bgGraphics.setDepth(0.1);
    // REMOVED old gradient fill logic to prevent screen overlaying!


    for (let i = 0; i < 28; i++) {
        const star = this.add.circle(
            Phaser.Math.Between(0, this.scale.width),
            Phaser.Math.Between(0, this.scale.height),
            Phaser.Math.FloatBetween(0.5, 2),
            COLORS.STAR,
            Phaser.Math.FloatBetween(0.2, 0.55)
        );
        star.setDepth(1);
        star.scrollSpeed = Phaser.Math.FloatBetween(0.08, 0.28);
        gameState.stars.push(star);
    }

    gameState.obstacles = this.physics.add.group();
    gameState.flyingObstacles = this.physics.add.group();
    gameState.ufos = this.physics.add.group();
    
    gameState.starItems = this.physics.add.group();
    gameState.fuelItems = this.physics.add.group();

    gameState.blackHoles = this.physics.add.group();
    gameState.coinItems = this.physics.add.group();
    gameState.lasers = this.physics.add.group();
    gameState.ufoProjectiles = this.physics.add.group();

    
    

    createRocket(this);


    this.physics.add.collider(gameState.rocket, gameState.obstacles, onCollision, null, this);
    this.physics.add.collider(gameState.rocket, gameState.flyingObstacles, onCollision, null, this);
    this.physics.add.collider(gameState.rocket, gameState.ufos, onCollision, null, this);
    
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.fuelItems, collectFuel, null, this);

    this.physics.add.overlap(gameState.rocket, gameState.coinItems, collectCoin, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.ufoProjectiles, hitPlayerWithProjectile, null, this);
    this.physics.add.overlap(gameState.lasers, gameState.ufos, hitUFO, null, this);
    this.physics.add.overlap(gameState.lasers, gameState.flyingObstacles, hitFlyingAsteroid, null, this);
    this.physics.add.collider(gameState.lasers, gameState.obstacles, hitPlanetObstacle, null, this);

    createUI(this);

    this.input.on('pointerdown', thrust, this);
    this.input.keyboard.on('keydown-SPACE', thrust, this);
    this.input.keyboard.on('keydown-F', fireLaser, this);
    
    // Bind HTML mobile laser button if it exists
    const laserBtn = document.getElementById('mobileLaserBtn');
    if (laserBtn) {
        laserBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent trigger thrust
            fireLaser();
        };
        // Also bind pointerdown for rapid response
        laserBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            fireLaser();
        });
    }
    
    this.scale.on('resize', function (gameSize) {
        if (bgGraphics) {
            bgGraphics.clear();
            const z = ZONES[gameState.currentZone];
            // disabled gradient
            // disabled rect fill
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
    gameState.rocket.setScale(0.5);
    
    applyRocketCollisionProfile();

    gameState.rocket.body.allowGravity = false;

    shieldEffect = scene.add.circle(0, 0, 42, 0x00ffff, 0.3);
    shieldEffect.setStrokeStyle(2, 0x00ffff, 0.8);
    shieldEffect.setDepth(11);
    shieldEffect.setVisible(false);

    const exhaustOffset = getRocketExhaustOffset();
    const exhaustGlowOffset = getRocketExhaustGlowOffset();
gameState.exhaust = scene.add.particles(0, 0, 'flare', {
        speed: { min: 130, max: 300 },
        angle: { min: 165, max: 195 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.95, end: 0 },
        tint: [0x00d2ff, 0x0077ff, 0xff8800, 0xffcc00],
        lifespan: 380,
        blendMode: 'ADD',
        frequency: 7,
        quantity: 4,
        follow: gameState.rocket,
        followOffset: exhaustOffset
    });
    gameState.exhaust.setDepth(9);
    gameState.exhaust.setVisible(false);

    gameState.exhaustGlow = scene.add.particles(0, 0, 'flare', {
        speed: { min: 50, max: 110 },
        angle: { min: 168, max: 192 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0xffffff, 0x88ddff, 0xffeeaa],
        lifespan: 180,
        blendMode: 'ADD',
        frequency: 12,
        quantity: 2,
        follow: gameState.rocket,
        followOffset: exhaustGlowOffset
    });

    gameState.exhaustGlow.setDepth(9);
    gameState.exhaustGlow.setVisible(false);
    
    updateExhaustColors();
}

function updateExhaustColors() {
    if (!gameState.exhaust || !gameState.exhaustGlow) return;
    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket) || ROCKETS[0];
    const c1 = Phaser.Display.Color.HexStringToColor(rocket.color1).color;
    const c2 = Phaser.Display.Color.HexStringToColor(rocket.color2).color;
    
    // Emitter 1 (primary trail)
    if (typeof gameState.exhaust.setTint === 'function') {
        try { gameState.exhaust.setTint([c1, c2, 0xffffff]); } catch(e) {}
    } else if (gameState.exhaust.tint !== undefined) {
        gameState.exhaust.tint = [c1, c2, 0xffffff];
    } else if (gameState.exhaust.particleTint !== undefined) {
        gameState.exhaust.particleTint = c1;
    }
    
    // Emitter 2 (glow)
    if (typeof gameState.exhaustGlow.setTint === 'function') {
        try { gameState.exhaustGlow.setTint([c1, 0xffffff]); } catch(e) {}
    } else if (gameState.exhaustGlow.tint !== undefined) {
        gameState.exhaustGlow.tint = [c1, 0xffffff];
    } else if (gameState.exhaustGlow.particleTint !== undefined) {
        gameState.exhaustGlow.particleTint = c1;
    }
}

function getRocketCollisionProfile() {
    return { hitW: 72, hitH: 26, offsetX: 0, offsetY: 0 };
}

function applyRocketCollisionProfile() {
    const scaleFactor = 1 / (gameState.rocket.scaleX || 1.0);
    const { hitW, hitH, offsetX, offsetY } = getRocketCollisionProfile();
    gameState.rocket.body.setSize(hitW * scaleFactor, hitH * scaleFactor);
    const rWidth = gameState.rocket.width;
    const rHeight = gameState.rocket.height;
    gameState.rocket.body.setOffset(
        ((rWidth - (hitW * scaleFactor)) / 2) + (offsetX * scaleFactor),
        ((rHeight - (hitH * scaleFactor)) / 2) + (offsetY * scaleFactor)
    );
}

function getRocketExhaustOffset() {
    return { x: -42, y: 0 };
}

function getRocketExhaustGlowOffset() {
    return { x: -36, y: 0 };
}

// ====================================
// CREATE UI
// ====================================
function createUI(scene) {
    const isMobile = window.innerWidth < 600;
    const mobileScale = isMobile ? 0.7 : 1;
    const sw = scene.scale.width;

    // ── Score pill background ──
    const scorePillW = isMobile ? 90 : 120;
    const scorePillH = isMobile ? 50 : 65;
    const scoreBg = scene.add.rectangle(16, 16, scorePillW, scorePillH, 0x000000, 0.55)
        .setOrigin(0, 0).setDepth(99).setScrollFactor(0);
    scoreBg.setStrokeStyle(2, 0x00ffff, 0.5);

    
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
    
    fuelText = scene.add.text(20, 42, 'FUEL', {
        fontFamily: 'Orbitron',
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setDepth(11).setScrollFactor(0);

    fuelBarFill = scene.add.graphics();
    fuelBarFill.setDepth(10).setScrollFactor(0);
    drawFuelBar(gameState.fuel);


    highScoreText = scene.add.text(20 + scorePillW / 2, 20 + (isMobile ? 30 : 40), 'HI: ' + gameState.highScore, {
        fontSize: (isMobile ? 11 : 13) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#00d4ff',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // ── Coin pill (top-right) ──
    const coinPillW = isMobile ? 100 : 130;
    const coinPillH = isMobile ? 28 : 34;
    const coinBg = scene.add.rectangle(sw - 12, 16, coinPillW, coinPillH, 0x1a1200, 0.85)
        .setOrigin(1, 0).setDepth(99).setScrollFactor(0);
    coinBg.setStrokeStyle(1.5, 0xffd700, 0.8);

    coinText = scene.add.text(sw - 22, 20, '\uD83E\uDE99 0', {
        fontSize: (isMobile ? 14 : 17) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // ── Ammo pill (top-right, below coin) ──
    const ammoPillY = 16 + coinPillH + 5;
    const ammoPillW = isMobile ? 120 : 155;
    const ammoPillH = isMobile ? 26 : 30;
    const ammoBg = scene.add.rectangle(sw - 12, ammoPillY, ammoPillW, ammoPillH, 0x1a0010, 0.85)
        .setOrigin(1, 0).setDepth(99).setScrollFactor(0);
    ammoBg.setStrokeStyle(1.5, 0xff5bbe, 0.8);

    ammoText = scene.add.text(sw - 22, ammoPillY + 5, '\u2756 AMMO  0', {
        fontSize: (isMobile ? 11 : 13) + 'px',
        fontFamily: "'Orbitron', monospace",
        color: '#ff5bbe',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);
    updateAmmoDisplay();

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
            // disabled gradient
            // disabled rect fill
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
    // if (gameState.ufoTimer) {
    //     gameState.ufoTimer.reset({ delay: newZone.ufoRate, callback: spawnUFO, loop: true });
    // }
}

// ====================================
// UPDATE
// ====================================
function update() {
    ThreeGLBBridge.update();
    if (!gameState.isPlaying || gameState.isGameOver) return;

    if (typeof bgTileSprite !== 'undefined' && bgTileSprite) {
        bgTileSprite.tilePositionX += gameState.obstacleSpeed * 0.08 * 0.016; // 0.08 scaled per frame
    }

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

    const rad = gameState.rocket.rotation;
    const deg = gameState.rocket.angle;
    const baseOffset = getRocketExhaustOffset();
    const baseGlowOffset = getRocketExhaustGlowOffset();
    
    const rx = Math.cos(rad) * baseOffset.x - Math.sin(rad) * baseOffset.y;
    const ry = Math.sin(rad) * baseOffset.x + Math.cos(rad) * baseOffset.y;
    
    const rgx = Math.cos(rad) * baseGlowOffset.x - Math.sin(rad) * baseGlowOffset.y;
    const rgy = Math.sin(rad) * baseGlowOffset.x + Math.cos(rad) * baseGlowOffset.y;
    
    if (gameState.exhaust) {
        gameState.exhaust.followOffset.set(rx, ry);
        gameState.exhaust.setAngle({ min: 165 + deg, max: 195 + deg });
    }
    if (gameState.exhaustGlow) {
        gameState.exhaustGlow.followOffset.set(rgx, rgy);
        gameState.exhaustGlow.setAngle({ min: 168 + deg, max: 192 + deg });
    }

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
        let now = Date.now();
        if (ufo.state === 'entering') {
            if (ufo.x <= ufo.targetX) {
                ufo.x = ufo.targetX;
                ufo.body.setVelocityX(0);
                ufo.state = 'hovering';
                ufo.hoverTime = now;
                ufo.lastShootTime = now;
            }
        } else if (ufo.state === 'hovering') {
            // Smooth vertical hover motion
            ufo.sineOffset += 0.04;
            ufo.y = ufo.startY + Math.sin(ufo.sineOffset) * 65;
            
            // Shoot at player every 1.8 seconds
            if (now - ufo.lastShootTime > 1800) {
                ufo.lastShootTime = now;
                shootPlayer(ufo);
            }
            
            // Fly off screen after 5 seconds
            if (now - ufo.hoverTime > 5000) {
                ufo.state = 'leaving';
                ufo.body.setVelocityX(-gameState.obstacleSpeed * 1.5);
            }
        }
        
        if (ufo.x < -150 || ufo.x > sceneRef.scale.width + 250) ufo.destroy();
    });

    // Clean up off-screen lasers and projectiles
    gameState.lasers.getChildren().forEach(laser => {
        if (laser.x > sceneRef.scale.width + 100) laser.destroy();
    });
    gameState.ufoProjectiles.getChildren().forEach(proj => {
        if (proj.x < -100 || proj.y < -100 || proj.y > sceneRef.scale.height + 100) proj.destroy();
    });

    gameState.starItems.getChildren().forEach(star => {
        if (star.x < -100) star.destroy();
    });

    gameState.coinItems.getChildren().forEach(coin => {
        if (coin.x < -100) coin.destroy();
    });

    if (gameState.selectedRocket === 'pulsar') {
        const pullRadius = 90;
        gameState.starItems.getChildren().forEach(star => {
            const dx = gameState.rocket.x - star.x;
            const dy = gameState.rocket.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pullRadius) {
                const pullSpeed = 7.5;
                star.x += (dx / dist) * pullSpeed;
                star.y += (dy / dist) * pullSpeed;
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

    if (gameState.isPlaying && !gameState.isGameOver) {
        gameState.fuel -= 0.03;
        if (gameState.fuel <= 0) {
            gameState.fuel = 0;
            gameState.rocket.body.allowGravity = true;
            // Cap downward velocity so 3D model doesn't spin wildly
            if (gameState.rocket.body.velocity.y > 400) {
                gameState.rocket.body.velocity.y = 400;
            }
        }
        drawFuelBar(gameState.fuel);
    }
}

// ====================================
// CONTROLS
// ====================================
function thrust(pointer) {
    if (gameState.isGameOver) return;

    if (!gameState.isPlaying) {
        startGame();
        return;
    }
    if (gameState.fuel <= 0) return;
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
    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket) || ROCKETS[0];
    const c1 = Phaser.Display.Color.HexStringToColor(rocket.color1).color;
    const c2 = Phaser.Display.Color.HexStringToColor(rocket.color2).color;

    const rad = gameState.rocket.rotation;
    const baseOffset = { x: -25, y: 0 };
    const rx = Math.cos(rad) * baseOffset.x - Math.sin(rad) * baseOffset.y;
    const ry = Math.sin(rad) * baseOffset.x + Math.cos(rad) * baseOffset.y;

    for (let i = 0; i < 4; i++) {
        const color = Phaser.Math.RND.pick([c1, c2, 0xffffff]);
        const px = gameState.rocket.x + rx + Phaser.Math.Between(-3, 3);
        const py = gameState.rocket.y + ry + Phaser.Math.Between(-6, 6);
        
        const particle = sceneRef.add.circle(px, py, Phaser.Math.Between(2, 5), color, 0.95);
        particle.setDepth(8);
        
        const moveDist = Phaser.Math.Between(30, 60);
        const mx = -Math.cos(rad) * moveDist + Phaser.Math.Between(-8, 8);
        const my = -Math.sin(rad) * moveDist + Phaser.Math.Between(-8, 8);
        
        sceneRef.tweens.add({
            targets: particle,
            x: particle.x + mx,
            y: particle.y + my,
            alpha: 0, scale: 0.1, duration: Phaser.Math.Between(150, 300),
            onComplete: () => particle.destroy()
        });
    }
    
    const baseSparkOffset = { x: -20, y: 0 };
    const sx = Math.cos(rad) * baseSparkOffset.x - Math.sin(rad) * baseSparkOffset.y;
    const sy = Math.sin(rad) * baseSparkOffset.x + Math.cos(rad) * baseSparkOffset.y;
    
    const spark = sceneRef.add.circle(
        gameState.rocket.x + sx,
        gameState.rocket.y + sy + Phaser.Math.Between(-2, 2),
        Phaser.Math.Between(1, 3),
        0xffffff,
        1
    );
    spark.setDepth(8);
    
    const sparkDist = 25;
    const smx = -Math.cos(rad) * sparkDist;
    const smy = -Math.sin(rad) * sparkDist;
    
    sceneRef.tweens.add({
        targets: spark,
        x: spark.x + smx,
        y: spark.y + smy,
        alpha: 0, scale: 0.2, duration: 100,
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
    gameState.fuel = 100;
    if (fuelBarBg) drawFuelBar(gameState.fuel);
    gameState.coins = 0;
    gameState.nearMissCount = 0;
    gameState.meteorShowerActive = false;
    gameState.gameStartTime = Date.now();

    const intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');
    gameState.intensity = intensity;
    gameState.obstacleSpeed = 150 + (intensity * 6);
    gameState.spawnRate = 3000 - (intensity * 60);

    gameState.collectedStars = 0;
    gameState.ammo = 5;
    gameState.hasShield = false;
    gameState.isInvincible = false;

    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket) || ROCKETS[0];
    sceneRef.physics.world.gravity.y = rocket.gravity;
    
    gameState.extraHP = (rocket.special === 'extraHP') ? 1 : 0;
    gameState.ghostHit = (rocket.special === 'ghostHit');
    gameState.scoreMultiplier = (rocket.special === 'scoreMultiplier') ? 1.5 : 1;

    if (rocket.special === 'shield') {
        activateShield();
    }

    initMissions();

    gameState.missionStats = { stars: 0, time: 0, obstacles: 0, nearMisses: 0, coins: 0, blackHoleEscapes: 0, meteorSurvived: false };

    gameState.rocket.body.allowGravity = true;
    gameState.rocket.setVelocity(0, 0);

    gameState.obstacleTimer = sceneRef.time.addEvent({ delay: gameState.spawnRate, callback: spawnObstacle, loop: true });
    gameState.asteroidTimer = sceneRef.time.addEvent({ delay: 800, callback: spawnFlyingAsteroid, loop: true });
    // gameState.ufoTimer = sceneRef.time.addEvent({ delay: 6000, callback: spawnUFO, loop: true });
    
    scheduleNextBlackHole();

    // Meteor shower disabled per user request
    // gameState.meteorTimer = sceneRef.time.addEvent({ delay: 20000, callback: triggerMeteorShower, loop: true });
    gameState.starTimer = sceneRef.time.addEvent({ delay: 2000, callback: spawnStar, loop: true });
    gameState.fuelTimer = sceneRef.time.addEvent({ delay: 3500, callback: spawnFuel, loop: true });
    gameState.difficultyTimer = sceneRef.time.addEvent({ delay: 5000, callback: increaseDifficulty, loop: true });

    updateScoreDisplay();
    updateCoinDisplay();

    AudioEngine.startAmbient();
    AudioEngine.startEngineHum();

    document.getElementById('homeMenu')?.classList.add('hidden');
    document.getElementById('rocketSelect')?.classList.add('hidden');
    document.getElementById('gameUI')?.classList.remove('hidden');
    document.getElementById('mobileLaserBtn')?.classList.remove('hidden');
    
    
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
    
    gameState.collectedStars++;
    
    if (gameState.collectedStars >= 5) {
        gameState.collectedStars = 0;
        gameState.ammo += 5;
        updateAmmoDisplay();
        
        // Play special ammo sound
        AudioEngine.shieldActivate(); // sounds like a cool upgrade chime!
        showFloatingText(rocket.x, rocket.y - 40, '⚡ BLASTER CHARGED (+5 SHOTS) 💥', '#ff0055');
    } else {
        showFloatingText(rocket.x, rocket.y - 30, `STAR ${gameState.collectedStars}/5 ⭐`, '#ffd700');
    }
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

    // Obstacle-aware edge margins — prevent planets clipping off-screen
    const edgeMargin = 140; // roughly planet radius + breathing room
    let minGapY = edgeMargin;
    let maxGapY = sceneRef.scale.height - edgeMargin;
    if (maxGapY < minGapY + 50) maxGapY = minGapY + 50;
    let gapPosition = Phaser.Math.Between(minGapY, maxGapY);
    
    // Difficulty logic based on Level
    const rocketIndex = ROCKETS.findIndex(r => r.id === gameState.selectedRocket);
    const difficultyMultiplier = Math.max(1, rocketIndex + 1); // 1 to 6
    
    // Tighter gaps and faster speeds for higher levels
    let gap = GAME.GAP_SIZE - Math.min(80, (gameState.score * 0.8) + (difficultyMultiplier * 5));
    let speed = gameState.obstacleSpeed + (difficultyMultiplier * 15);


    const rocketDef = ROCKETS[rocketIndex] || ROCKETS[0];
    const monsterType = rocketDef.monsterType || 'planet';
    let textureKey = monsterType === 'planet' ? 'planet' : 'monster_' + monsterType;
    
    // Pick randomly between planet1, planet2, and planet3 for the 3D Saturn/Jupiter sprites!
    if (monsterType === 'planet') {
        const rand = Phaser.Math.Between(1, 3);
        textureKey = 'planet' + rand;
    }
    
    let spawnX = sceneRef.scale.width + 100;

    // Obstacles get BIGGER as you progress!
    let scaleBoost = Math.min(2.5, 1.0 + (gameState.score * 0.02));

    // Top monster
    let topObs = gameState.obstacles.create(spawnX, gapPosition - gap/2 - (40 * scaleBoost), textureKey);
    topObs.body.allowGravity = false;
    topObs.body.setVelocityX(-speed);
    topObs.isTop = true;
    topObs.scored = false;
    topObs.setDepth(5);
    topObs.health = 3;

    // Bottom monster
    let botObs = gameState.obstacles.create(spawnX, gapPosition + gap/2 + (40 * scaleBoost), textureKey);
    botObs.body.allowGravity = false;
    botObs.body.setVelocityX(-speed);
    botObs.isTop = false;
    botObs.setDepth(5);
    botObs.health = 3;

    // Apply scaling and hitboxes: Planets are big colourful obstacles, asteroids are small
    if (textureKey.startsWith('planet')) {
        let pScale, hitR;
        const isSaturn = (textureKey === 'planet1' || textureKey === 'planet3');
        if (isSaturn) {
            // Saturn has rings, so we scale the whole texture up to 0.48 (~245px total width)
            pScale = Math.min(1.0, 0.48 * scaleBoost);
            hitR = 90; // Fit the sphere body snugly
        } else {
            // Solid Jupiter-style sphere scaled to 0.32 (~164px total width)
            pScale = Math.min(0.85, 0.32 * scaleBoost);
            hitR = 140; // Fit the solid sphere body snugly
        }
        topObs.setScale(pScale);
        botObs.setScale(pScale);
        const texSize = 512;
        const offset = (texSize / 2) - hitR;
        topObs.body.setCircle(hitR, offset, offset);
        botObs.body.setCircle(hitR, offset, offset);
    } else {
        topObs.setScale(scaleBoost);
        botObs.setScale(scaleBoost);
        
        // Adjust hitboxes based on monster type
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
    }


    // Removed vertical floating to preserve exact gap alignment
}
function spawnFlyingAsteroid() {
    return; // Disabled per user request (very disturbing flow of the game making crash)
}

function spawnUFO() {
    return; // UFOs completely disabled per user request
}


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

function updateAmmoDisplay() {
    if (ammoText) {
        const show = Math.min(gameState.ammo, 20);
        const dotsFull = Math.min(show, 5);
        const dotsEmpty = Math.max(0, 5 - dotsFull);
        const dots = '\u25cf'.repeat(dotsFull) + '\u25cb'.repeat(dotsEmpty);
        ammoText.setText('\u2756 ' + show + '  ' + dots);
    }
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
    if ((gameState.revivesUsed || 0) < 3 && !gameState.isReviving) {
        gameState.isReviving = true;
        sceneRef.physics.world.pause();
        if (gameState.obstacleTimer) gameState.obstacleTimer.paused = true;
        if (gameState.asteroidTimer) gameState.asteroidTimer.paused = true;
        if (gameState.starTimer) gameState.starTimer.paused = true;
        
        const reviveModal = document.getElementById('reviveModal');
        if (reviveModal) {
            reviveModal.classList.remove('hidden');
            const revTxt = document.getElementById('revivesLeftText');
            if (revTxt) revTxt.innerText = `EXTRA LIVES: ${3 - (gameState.revivesUsed || 0)} / 3`;
            const coinBtn = document.getElementById('reviveCoinBtn');
            if (coinBtn) {
                if (gameState.totalCoins >= 20) {
                    coinBtn.disabled = false;
                    coinBtn.classList.remove('disabled-btn');
                } else {
                    coinBtn.disabled = true;
                    coinBtn.classList.add('disabled-btn');
                }
            }
        }
        return;
    }
    gameState.isGameOver = true;
    gameState.isPlaying = false;

    if (gameState.obstacleTimer) gameState.obstacleTimer.remove();
    if (gameState.asteroidTimer) gameState.asteroidTimer.remove();
    if (gameState.starTimer) gameState.starTimer.remove();
    if (gameState.fuelTimer) gameState.fuelTimer.remove();
    if (gameState.difficultyTimer) gameState.difficultyTimer.remove();
    if (gameState.blackHoleTimer) gameState.blackHoleTimer.remove();

    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.body.allowGravity = false;
    
    if (gameState.exhaust) gameState.exhaust.setVisible(false);
    if (gameState.exhaustGlow) gameState.exhaustGlow.setVisible(false);
    document.getElementById('mobileLaserBtn')?.classList.add('hidden');
    
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();
    AudioEngine.explosion();
    createExplosion();

    localStorage.setItem('spaceRocketHighScore', gameState.highScore.toString());
    if (typeof window.saveLeaderboardScore === 'function') {
        window.saveLeaderboardScore(gameState.score);
    }
    
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
    const rx = gameState.rocket.x;
    const ry = gameState.rocket.y;

    // White impact flash on the rocket first
    gameState.rocket.setTint(0xffffff);
    sceneRef.time.delayedCall(60, () => { gameState.rocket.setVisible(false); });

    // Shockwave ring that expands outward
    const ring = sceneRef.add.circle(rx, ry, 10, 0xffffff, 0);
    ring.setStrokeStyle(4, 0xff8800, 1);
    ring.setDepth(25);
    sceneRef.tweens.add({
        targets: ring,
        scaleX: 9, scaleY: 9,
        alpha: 0,
        duration: 500,
        ease: 'Sine.easeOut',
        onComplete: () => ring.destroy()
    });

    // 44 particles in 3 colour tiers: white core → orange mid → red/dark outer
    const palette = [0xffffff, 0xffee88, 0xff8800, 0xff4400, 0xff2200, 0x661100];
    for (let i = 0; i < 44; i++) {
        const r = Phaser.Math.Between(3, 12);
        const color = Phaser.Math.RND.pick(palette);
        const particle = sceneRef.add.circle(rx, ry, r, color, 1);
        particle.setDepth(22);
        const angle = (i / 44) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
        const spd = Phaser.Math.Between(60, 280);
        const dur = Phaser.Math.Between(350, 900);
        sceneRef.tweens.add({
            targets: particle,
            x: rx + Math.cos(angle) * spd,
            y: ry + Math.sin(angle) * spd,
            alpha: 0, scaleX: 0.05, scaleY: 0.05,
            duration: dur,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }
}

window.restartGame = function() {
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();

    gameState.isGameOver = false;
    gameState.isPlaying = false;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.ammo = 5;
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
    gameState.revivesUsed = 0;
    gameState.isReviving = false;
    if (sceneRef && sceneRef.physics && sceneRef.physics.world) sceneRef.physics.world.resume();
    updateAmmoDisplay();

    if (bgGraphics) {
        const zone0 = ZONES[0];
        bgGraphics.clear();
        // disabled gradient
        // disabled rect fill
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
    gameState.fuelItems.clear(true, true);
    gameState.blackHoles.clear(true, true);
    gameState.coinItems.clear(true, true);
    gameState.lasers.clear(true, true);
    gameState.ufoProjectiles.clear(true, true);

    gameState.rocket.setPosition(150, 300).setVelocity(0, 0).setAngle(0).setVisible(true);
    gameState.rocket.setTexture('rocket_' + gameState.selectedRocket);
    gameState.rocket.setScale(0.5);
    applyRocketCollisionProfile();
    updateExhaustColors();
    gameState.rocket.body.allowGravity = false;
    
    sceneRef.physics.world.gravity.y = 480;

    updateScoreDisplay();
    updateCoinDisplay();
    highScoreText.setColor('#888888');
    badgeText.setAlpha(0);
    if (typeof meteorText !== 'undefined') meteorText.setVisible(false);

    document.getElementById('gameOverOverlay')?.classList.add('hidden');
    document.getElementById('winScreen')?.classList.add('hidden');
    document.getElementById('mobileLaserBtn')?.classList.add('hidden');
    
    // Gameplay will be explicitly started by the Launch/Retry buttons
};

window.resumeFromRevive = function(cost) {
    if (cost === 'coins' && gameState.totalCoins >= 20) {
        addCoins(-20); // Deduct 20 coins
    }
    gameState.revivesUsed = (gameState.revivesUsed || 0) + 1;
    gameState.isReviving = false;
    document.getElementById('reviveModal')?.classList.add('hidden');
    
    // Resume physics and timers
    if (gameState.obstacleTimer) gameState.obstacleTimer.paused = false;
    if (gameState.asteroidTimer) gameState.asteroidTimer.paused = false;
    if (gameState.starTimer) gameState.starTimer.paused = false;
    sceneRef.physics.world.resume();

    // Grant temporary invulnerability & visual effect
    gameState.isInvincible = true;
    showFloatingText(gameState.rocket.x, gameState.rocket.y - 30, 'REVIVED! 🛡️', '#00ff88');
    
    sceneRef.tweens.add({
        targets: gameState.rocket, alpha: 0.5, duration: 100, yoyo: true, repeat: 20, // 2 seconds
        onComplete: () => { gameState.rocket.alpha = 1; gameState.isInvincible = false; }
    });

    gameState.rocket.setVelocity(0, 0);
    // Move rocket slightly left to give breathing room
    gameState.rocket.setX(Math.max(50, gameState.rocket.x - 50));
    gameState.rocket.setY(300); // Center height
    
    // Restart engine sounds
    AudioEngine.startEngineHum();
    AudioEngine.startAmbient();
};

window.giveUpRevive = function() {
    gameState.isReviving = false;
    gameState.revivesUsed = 3;
    document.getElementById('reviveModal')?.classList.add('hidden');
    sceneRef.physics.world.resume();
    gameOver();
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
    meteor.setScale(0.35).body.allowGravity = false;
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

// ====================================
// THREE.JS GLB RENDER BRIDGE
// ====================================
const ThreeGLBBridge = {
    renderer: null,
    scenes: {}, // key -> { renderer, scene, camera, getMesh, webglCanvas, canvas2D, ctx2d, phaserTexture, rotateSpeed, size }
    sceneRef: null,
    
    init(scene) {
        this.sceneRef = scene;
        if (typeof THREE === 'undefined') {
            console.warn('THREE is not defined. Skipping 3D assets load.');
            return;
        }
        
        console.log('=== INITIALIZING 3D GLB ASSETS ===');

        // Initialize shared renderer once to avoid too many WebGL contexts!
        if (!this.renderer) {
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = 512;
            tempCanvas.height = 512;
            this.renderer = new THREE.WebGLRenderer({
                canvas: tempCanvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true
            });
            this.renderer.setPixelRatio(2);
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }

        // Helper to create metallic color materials
        const getMetallicMaterial = (hexColor) => {
            return new THREE.MeshStandardMaterial({
                color: new THREE.Color(hexColor),
                roughness: 0.18,
                metalness: 0.85,
                flatShading: false
            });
        };

        // Pioneer Rocket
        this.register3DSprite('rocket_pioneer', '3d_assests/Meshy_AI_a_rocket_for_game_pla_0630205609_generate.glb', 256, (mesh) => {
            mesh.rotation.set(Math.PI / 4, 0, -Math.PI / 2); // Tilt to point right
            mesh.scale.set(0.9, 0.9, 0.9);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const colors = [];
                    const colorBody = new THREE.Color('#dcdde1'); // Silver
                    const colorAccent = new THREE.Color('#ff3838'); // Red Accent
                    for (let i = 0; i < pos.count; i++) {
                        let y = pos.getY(i);
                        if (y > 0.48 || y < -0.38) {
                            colors.push(colorAccent.r, colorAccent.g, colorAccent.b);
                        } else {
                            colors.push(colorBody.r, colorBody.g, colorBody.b);
                        }
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshStandardMaterial({
                        vertexColors: true, roughness: 0.2, metalness: 0.8, flatShading: false
                    });
                }
            });
        });

        // Red Fury Rocket
        this.register3DSprite('rocket_red_fury', '3d_assests/Meshy_AI_Red_Rocket_0701105024_generate.glb', 256, (mesh) => {
            mesh.rotation.set(Math.PI / 4, 0, -Math.PI / 2); // Tilt to point right
            mesh.scale.set(0.95, 0.95, 0.95);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const colors = [];
                    const colorBody = new THREE.Color('#a4b0be'); // Silver Grey body
                    const colorAccent = new THREE.Color('#ea2027'); // Crimson Red fins/nose
                    for (let i = 0; i < pos.count; i++) {
                        let y = pos.getY(i);
                        if (y > 0.48 || y < -0.38) {
                            colors.push(colorAccent.r, colorAccent.g, colorAccent.b);
                        } else {
                            colors.push(colorBody.r, colorBody.g, colorBody.b);
                        }
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshStandardMaterial({
                        vertexColors: true, roughness: 0.15, metalness: 0.85, flatShading: false
                    });
                }
            });
        });

        // Cosmic Pink Rocket (Emerald Shield)
        this.register3DSprite('rocket_cosmic_pink', '3d_assests/Meshy_AI_Cosmic_Pink_Rocket_0701105044_generate.glb', 256, (mesh) => {
            mesh.rotation.set(Math.PI / 4, 0, 0); // Correct rotation since model was created horizontal (along X) in GLB
            mesh.scale.set(0.92, 0.92, 0.92);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const colors = [];
                    const colorBody = new THREE.Color('#a0a5ab'); // Sleek metallic silver
                    const colorAccent = new THREE.Color('#ff5bbe'); // Vibrant pink fins/nose
                    for (let i = 0; i < pos.count; i++) {
                        let xVal = pos.getX(i);
                        if (xVal > 0.4 || xVal < -0.32) {
                            colors.push(colorAccent.r, colorAccent.g, colorAccent.b);
                        } else {
                            colors.push(colorBody.r, colorBody.g, colorBody.b);
                        }
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshStandardMaterial({
                        vertexColors: true, roughness: 0.18, metalness: 0.82, flatShading: false
                    });
                }
            });
        });

        // Asteroids (loaded from local GLB)
        this.register3DSprite('asteroid', '3d_assests/Meshy_AI_Emerald_Ember_Asteroi_0630205214_generate.glb', 192, (mesh) => {
            mesh.scale.set(0.55, 0.55, 0.55);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    if (child.geometry.attributes.color) child.material.vertexColors = true;
                }
            });
        }, { y: 0.015, x: 0.01 });

        // Planets (loaded from local GLB) — Detailed 3D rotating sprites (no overexposure, sharp gas-giant bands)
        this.register3DSprite('planet1', '3d_assests/Meshy_AI_Rings_of_Saturn_0630205109_generate.glb', 512, (mesh) => {
            mesh.scale.set(0.84, 0.84, 0.84); // Scaled slightly down so rings NEVER clip on canvas edges!
            mesh.rotation.set(0.3, 0.5, -0.25);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const norm = geom.attributes.normal;
                    const colors = [];
                    const colorRing1 = new THREE.Color('#ffd700'); // Gold
                    const colorRing2 = new THREE.Color('#00e5ff'); // Cyan
                    const colorRing3 = new THREE.Color('#ff79c6'); // Pink
                    for (let i = 0; i < pos.count; i++) {
                        let x = pos.getX(i);
                        let y = pos.getY(i);
                        let z = pos.getZ(i);
                        let nx = norm.getX(i);
                        let ny = norm.getY(i);
                        let nz = norm.getZ(i);
                        
                        // Fake diffuse shading based on vertex normal (simulates top-right-front light source)
                        let dot = nx * 0.3 + ny * 0.5 + nz * 0.82;
                        let intensity = 0.52 + 0.48 * Math.max(-0.2, dot);
                        
                        let dist = Math.sqrt(x*x + y*y + z*z);
                        if (dist < 0.56) {
                            // Procedural gas bands on planet body
                            let band = Math.sin(y * 22.0);
                            let colorBody = new THREE.Color('#e056fd');
                            if (band > 0.35) {
                                colorBody.set('#f386ff');
                            } else if (band < -0.35) {
                                colorBody.set('#ac19d3');
                            }
                            colors.push(colorBody.r * intensity, colorBody.g * intensity, colorBody.b * intensity);
                        } else if (dist < 0.72) {
                            colors.push(colorRing1.r * intensity, colorRing1.g * intensity, colorRing1.b * intensity);
                        } else if (dist < 0.88) {
                            colors.push(colorRing2.r * intensity, colorRing2.g * intensity, colorRing2.b * intensity);
                        } else {
                            colors.push(colorRing3.r * intensity, colorRing3.g * intensity, colorRing3.b * intensity);
                        }
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshBasicMaterial({
                        vertexColors: true
                    });
                }
            });
        }, { y: 0.006, x: 0 });

        this.register3DSprite('planet2', '3d_assests/Meshy_AI_Striped_Majesty_of_Ju_0630205117_generate.glb', 512, (mesh) => {
            mesh.scale.set(0.85, 0.85, 0.85);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const norm = geom.attributes.normal;
                    const colors = [];
                    for (let i = 0; i < pos.count; i++) {
                        let x = pos.getX(i);
                        let y = pos.getY(i);
                        let z = pos.getZ(i);
                        let nx = norm.getX(i);
                        let ny = norm.getY(i);
                        let nz = norm.getZ(i);
                        
                        // Fake diffuse shading
                        let dot = nx * 0.3 + ny * 0.5 + nz * 0.82;
                        let intensity = 0.52 + 0.48 * Math.max(-0.2, dot);
                        
                        let band = Math.sin(y * 18.0) * Math.cos(x * 2.0);
                        let colorBody = new THREE.Color('#fd79a8');
                        if (band > 0.4) {
                            colorBody.set('#ffa6c1');
                        } else if (band < -0.4) {
                            colorBody.set('#cd3667');
                        }
                        colors.push(colorBody.r * intensity, colorBody.g * intensity, colorBody.b * intensity);
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshBasicMaterial({
                        vertexColors: true
                    });
                }
            });
        }, { y: 0.005, x: 0 });

        this.register3DSprite('planet3', '3d_assests/Meshy_AI_Rings_of_Saturn_0630205109_generate.glb', 512, (mesh) => {
            mesh.scale.set(0.82, 0.82, 0.82); // Scaled slightly down so rings NEVER clip on canvas edges!
            mesh.rotation.set(0.4, 0.3, 0.2);
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    const geom = child.geometry;
                    const pos = geom.attributes.position;
                    const norm = geom.attributes.normal;
                    const colors = [];
                    const colorRing1 = new THREE.Color('#a29bfe');
                    const colorRing2 = new THREE.Color('#ff6bcb');
                    for (let i = 0; i < pos.count; i++) {
                        let x = pos.getX(i);
                        let y = pos.getY(i);
                        let z = pos.getZ(i);
                        let nx = norm.getX(i);
                        let ny = norm.getY(i);
                        let nz = norm.getZ(i);
                        
                        // Fake diffuse shading
                        let dot = nx * 0.3 + ny * 0.5 + nz * 0.82;
                        let intensity = 0.52 + 0.48 * Math.max(-0.2, dot);
                        
                        let dist = Math.sqrt(x*x + y*y + z*z);
                        if (dist < 0.56) {
                            let band = Math.sin(y * 28.0);
                            let colorBody = new THREE.Color('#ff79c6');
                            if (band > 0.35) {
                                colorBody.set('#ffabde');
                            } else if (band < -0.35) {
                                colorBody.set('#e04193');
                            }
                            colors.push(colorBody.r * intensity, colorBody.g * intensity, colorBody.b * intensity);
                        } else if (dist < 0.75) {
                            colors.push(colorRing1.r * intensity, colorRing1.g * intensity, colorRing1.b * intensity);
                        } else {
                            colors.push(colorRing2.r * intensity, colorRing2.g * intensity, colorRing2.b * intensity);
                        }
                    }
                    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                    child.material = new THREE.MeshBasicMaterial({
                        vertexColors: true
                    });
                }
            });
        }, { y: -0.005, x: 0 });
    },

    register3DSprite(key, glbUrl, size = 128, setupCb = null, rotateSpeed = null) {
        let canvas2D = document.createElement('canvas');
        canvas2D.width = size;
        canvas2D.height = size;
        let ctx2d = canvas2D.getContext('2d');

        let scene = new THREE.Scene();

        let camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 5);

        // Balanced lighting — not too strong, shows colors clearly
        let ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        let dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(3, 5, 5);
        scene.add(dirLight);
        
        let fillLight = new THREE.DirectionalLight(0xaaddff, 0.8);
        fillLight.position.set(-4, -3, 4);
        scene.add(fillLight);

        let rimLight = new THREE.DirectionalLight(0xffaaff, 0.5);
        rimLight.position.set(0, 0, -5);
        scene.add(rimLight);

        let loader = new THREE.GLTFLoader();
        let mesh = null;

        loader.load(glbUrl, (gltf) => {
            mesh = gltf.scene;

            if (setupCb) setupCb(mesh);

            mesh.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(mesh);
            const center = box.getCenter(new THREE.Vector3());
            mesh.position.sub(center);
            mesh.updateMatrixWorld(true);

            const sizeVec = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
            const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
            camera.position.z = maxDim * 1.15;

            scene.add(mesh);

            console.log('Successfully loaded 3D GLB for: ' + key);

            if (key.startsWith('rocket_') && this.sceneRef) {
                if (gameState.rocket && 'rocket_' + gameState.selectedRocket === key) {
                    gameState.rocket.setTexture(key);
                    applyRocketCollisionProfile();
                }
            }
        }, undefined, (error) => {
            console.error('Error loading 3D asset ' + key + ':', error);
        });

        if (this.sceneRef.textures.exists(key)) {
            this.sceneRef.textures.remove(key);
        }

        let phaserTexture = this.sceneRef.textures.addCanvas(key, canvas2D);

        this.scenes[key] = {
            scene,
            camera,
            getMesh: () => mesh,
            canvas2D,
            ctx2d,
            phaserTexture,
            rotateSpeed,
            size
        };
    },

    update() {
        if (!this.renderer) return;
        for (let key in this.scenes) {
            let s = this.scenes[key];
            let mesh = s.getMesh();
            if (mesh) {
                if (s.rotateSpeed) {
                    if (s.rotateSpeed.y) mesh.rotation.y += s.rotateSpeed.y;
                    if (s.rotateSpeed.x) mesh.rotation.x += s.rotateSpeed.x;
                }
            }
            // Resize and render using shared WebGLRenderer!
            this.renderer.setSize(s.size, s.size);
            this.renderer.render(s.scene, s.camera);
            
            // Draw result onto the 2D canvas of the sprite texture
            s.ctx2d.clearRect(0, 0, s.size, s.size);
            s.ctx2d.drawImage(this.renderer.domElement, 0, 0, s.size, s.size);
            s.phaserTexture.refresh();
        }
    }
};


const game = new Phaser.Game(config);


window.refreshTheme = function() {
    if (typeof bgGraphics !== 'undefined' && bgGraphics && typeof ZONES !== 'undefined') {
        const zone0 = ZONES[0];
        bgGraphics.clear();
        // disabled gradient
        // disabled rect fill
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

// Add laser fire sweep sound dynamically to AudioEngine
AudioEngine.laserFire = function() {
    this._sweep(900, 300, 'triangle', 0.05, 0.15);
};

// ====================================
// WEAPONS SYSTEM: LASERS & PROJECTILES
// ====================================

function createLaserTexture(scene) {
    const key = 'laserBeam';
    if (scene.textures.exists(key)) return;
    const w = 55, h = 10;
    const canvas = scene.textures.createCanvas(key, w, h);
    const ctx = canvas.context;
    ctx.clearRect(0, 0, w, h);
    let grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, '#ff0055');
    grad.addColorStop(1, 'rgba(255, 0, 85, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    canvas.refresh();
}

function createUfoProjectileTexture(scene) {
    const key = 'plasmaBall';
    if (scene.textures.exists(key)) return;
    const size = 24;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.context;
    ctx.clearRect(0, 0, size, size);
    let grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00ffff');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2); ctx.fill();
    canvas.refresh();
}

function fireLaser() {
    if (gameState.isGameOver || !gameState.isPlaying) return;
    
    // Check ammo
    if (gameState.ammo <= 0) {
        let now = Date.now();
        if (!gameState.lastEmptyTime || now - gameState.lastEmptyTime > 800) {
            gameState.lastEmptyTime = now;
            AudioEngine._sweep(300, 100, 'sawtooth', 0.05, 0.08); // low-pitched click sound
            showFloatingText(gameState.rocket.x, gameState.rocket.y - 30, 'NO AMMO! ⚡', '#ff0055');
        }
        return;
    }
    
    // 400ms cooldown to keep firing arcadey but fair
    let now = Date.now();
    if (gameState.lastLaserTime && now - gameState.lastLaserTime < 400) return;
    gameState.lastLaserTime = now;
    
    gameState.ammo--;
    updateAmmoDisplay();
    
    gameState.fuel = Math.max(0, gameState.fuel - 10);
    drawFuelBar(gameState.fuel);
    
    AudioEngine.laserFire();
    
    // Fire laser depending on selected rocket specs
    const laserSpeed = gameState.selectedRocket === 'red_fury' ? 1450 : 950;
    let laserColor = 0xffffff;
    if (gameState.selectedRocket === 'red_fury') laserColor = 0xff2222;
    else if (gameState.selectedRocket === 'cosmic_pink') laserColor = 0xff00ff;
    else if (gameState.selectedRocket === 'rocket_rider') laserColor = 0x00ffff;
    else if (gameState.selectedRocket === 'jetpack_exec') laserColor = 0xffd700;

    if (gameState.selectedRocket === 'jetpack_exec') {
        const velocitiesY = [0, -180, 180];
        velocitiesY.forEach(vy => {
            const laser = gameState.lasers.create(gameState.rocket.x + 45, gameState.rocket.y, 'laserBeam');
            laser.body.allowGravity = false;
            laser.body.setVelocity(laserSpeed, vy);
            laser.setDepth(8);
            laser.setTint(0xffd700);
            if (vy < 0) laser.setAngle(-12);
            if (vy > 0) laser.setAngle(12);
        });
    } else {
        const laser = gameState.lasers.create(gameState.rocket.x + 45, gameState.rocket.y, 'laserBeam');
        laser.body.allowGravity = false;
        laser.body.setVelocityX(laserSpeed);
        laser.setDepth(8);
        if (laserColor !== 0xffffff) {
            laser.setTint(laserColor);
        }
    }
}

function shootPlayer(ufo) {
    if (gameState.isGameOver || !gameState.isPlaying) return;
    
    const proj = gameState.ufoProjectiles.create(ufo.x - 30, ufo.y, 'plasmaBall');
    proj.body.allowGravity = false;
    proj.setDepth(7);
    proj.body.setSize(16, 16);
    
    // Track player and aim directly towards them
    const angle = Phaser.Math.Angle.Between(ufo.x, ufo.y, gameState.rocket.x, gameState.rocket.y);
    const projSpeed = gameState.obstacleSpeed * 1.25;
    proj.body.setVelocity(Math.cos(angle) * projSpeed, Math.sin(angle) * projSpeed);
    
    sceneRef.tweens.add({
        targets: proj,
        angle: 360,
        duration: 800,
        repeat: -1
    });
}

function hitUFO(laser, ufo) {
    laser.destroy();
    
    // Sound & VFX
    AudioEngine.explosion();
    createExplosionParticles(ufo.x, ufo.y, 0x00ffff, 24);
    
    // Spawn rewarding coins!
    spawnCoinsAtPosition(ufo.x, ufo.y);
    
    // Award score points
    gameState.score += 15;
    updateScoreDisplay();
    showFloatingText(ufo.x, ufo.y - 35, '+15 PTS 👾', '#00ffff');
    
    ufo.destroy();
}

function hitFlyingAsteroid(laser, asteroid) {
    laser.destroy();
    
    AudioEngine.explosion();
    createExplosionParticles(asteroid.x, asteroid.y, 0x718096, 12);
    
    gameState.score += 5;
    updateScoreDisplay();
    showFloatingText(asteroid.x, asteroid.y - 30, '+5 PTS ☄️', '#ffd700');
    
    asteroid.destroy();
}

function hitPlanetObstacle(laser, planet) {
    laser.destroy();
    
    if (!planet.active) return;
    
    if (typeof planet.health === 'undefined') {
        planet.health = 3;
    }
    
    planet.health--;
    
    // Impact dust/flare particles
    createExplosionParticles(laser.x, laser.y, 0xff0055, 6);
    
    if (planet.health > 0) {
        // Flash planet red
        planet.setTint(0xff5555);
        sceneRef.time.delayedCall(120, () => {
            if (planet && planet.active) planet.clearTint();
        });
        
        // Wobble planet slightly
        sceneRef.tweens.add({
            targets: planet,
            x: planet.x + Phaser.Math.Between(-3, 3),
            y: planet.y + Phaser.Math.Between(-3, 3),
            duration: 60,
            yoyo: true,
            repeat: 1
        });
        
        // Impact sound
        AudioEngine._sweep(350, 180, 'triangle', 0.12, 0.08);
        
        // Float current health
        showFloatingText(planet.x, planet.y - 40, `HP: ${planet.health} ❤️`, '#ff4757');
    } else {
        // Destroyed! Trigger explosion particles
        createExplosionParticles(planet.x, planet.y, 0xff5252, 28);
        AudioEngine.explosion();
        
        gameState.fuel = 100;
        drawFuelBar(gameState.fuel);
        
        // Award Armor (Shield)
        gameState.shieldEndTime = Date.now() + 5000;
        if (typeof shieldEffect !== 'undefined' && shieldEffect) {
            shieldEffect.setVisible(true);
        }
        if (AudioEngine.shieldActivate) AudioEngine.shieldActivate();
        
        // Award 50 Points!
        gameState.score += 50;
        updateScoreDisplay();
        
        // Float reward text
        showFloatingText(planet.x, planet.y - 40, 'PLANET DESTROYED! 💥\n+ARMOR 🛡️ +FULL TANK ⛽  +50 PTS', '#2ed573');
        
        planet.destroy();
    }
}

function hitPlayerWithProjectile(rocket, projectile) {
    projectile.destroy();
    
    if (gameState.hasShield) {
        AudioEngine.shieldHit();
        showFloatingText(rocket.x, rocket.y - 40, 'SHIELD ABSORBED! 🛡️', '#00ffff');
        return;
    }
    
    onCollision(rocket, projectile);
}

function createExplosionParticles(x, y, tintColor, count = 18) {
    const emitter = sceneRef.add.particles(x, y, 'flare', {
        speed: { min: 80, max: 240 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: tintColor,
        lifespan: 450,
        blendMode: 'ADD',
        maxParticles: count
    });
    emitter.setDepth(15);
}
