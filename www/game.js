/**
 * SPACE ROCKET - Addictive Space Survival Game
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
        mode: Phaser.Scale.RESIZE, // Resizes game to fit window
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
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
    // Physics
    THRUST_POWER: -350,
    MAX_VELOCITY: 400,

    // Obstacles
    OBSTACLE_SPEED: 200,        // Slower start
    OBSTACLE_SPAWN_RATE: 2500,  // Wider gaps
    GAP_SIZE: 170,              // Slightly wider gaps
    MIN_GAP_Y: 100,
    MAX_GAP_Y: 400,

    // Difficulty
    SPEED_INCREASE: 5,          // Slower ramping initially
    SPAWN_DECREASE: 30,
    MIN_SPAWN_RATE: 900,

    // Scoring
    POINTS_PER_PASS: 1,
    NEAR_MISS_BONUS: 5,
    NEAR_MISS_DISTANCE: 30,

    // Powerups
    STARS_FOR_SHIELD: 3,
    SHIELD_DURATION: 5000, // 5 seconds
    SLOWMO_DURATION: 3500,
    MAGNET_DURATION: 8000,
    MAGNET_RADIUS: 260,

    // Combo
    COMBO_TIMEOUT: 3000,           // ms before combo resets
    NEAR_MISS_THRESHOLD: 55,       // px vertical distance for near miss
    COMBO_TIERS: [
        { count: 3,  mult: 2, label: 'x2 COMBO',       color: '#00ffea' },
        { count: 6,  mult: 3, label: 'x3 FIRE',        color: '#ff9e1f' },
        { count: 10, mult: 5, label: 'x5 INFERNO',     color: '#ff3366' },
        { count: 15, mult: 8, label: 'x8 GODMODE',     color: '#ff00ff' }
    ]
};

// Persistent unlock thresholds for rocket skins
const SKINS = [
    { id: 'classic',  name: 'Classic',    score: 0,   accent: 0xff3366 },
    { id: 'emerald',  name: 'Emerald',    score: 25,  accent: 0x2ecc71 },
    { id: 'phoenix',  name: 'Phoenix',    score: 75,  accent: 0xff6b00 },
    { id: 'void',     name: 'Void',       score: 150, accent: 0x8b5cf6 },
    { id: 'celestial',name: 'Celestial',  score: 300, accent: 0xffd700 }
];

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
// COLORS (Professional Space Theme)
// ====================================
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
// AUDIO ENGINE (Web Audio API - No Files)
// ====================================
const AudioEngine = {
    ctx: null,
    muted: false,

    init() {
        this.muted = localStorage.getItem('wilifunkMuted') === 'true';
        // AudioContext created on first user gesture to satisfy browser policy
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

    // Utility: play a single tone
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

    // Utility: frequency sweep
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

    // 1. Thrust — punchy rocket burst (3 layers)
    thrust() {
        if (this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        // Layer 1: Deep low thump (kick-like body)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1); gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(160, now);
        osc1.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc1.start(now); osc1.stop(now + 0.12);

        // Layer 2: Mid whoosh sweep (thrust feel)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(90, now);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc2.start(now); osc2.stop(now + 0.1);

        // Layer 3: High fizz (air burst sparkle)
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

    // 2. Star collect — bright ascending chime
    starCollect() {
        [523, 659, 784].forEach((f, i) => this._tone(f, 'sine', 0.15, 0.12, i * 0.07));
    },

    // 3. Shield activate — rising power-up fanfare
    shieldActivate() {
        this._sweep(300, 900, 'sine', 0.2, 0.3);
        this._sweep(600, 1200, 'triangle', 0.1, 0.25, 0.1);
        [1047, 1319, 1568].forEach((f, i) => this._tone(f, 'sine', 0.12, 0.15, 0.3 + i * 0.08));
    },

    // 4. Shield absorb hit — thuddy crunch then recovery ping
    shieldHit() {
        this._sweep(400, 80, 'sawtooth', 0.25, 0.15);
        this._tone(880, 'sine', 0.12, 0.1, 0.2);
    },

    // 5. Explosion — noise burst (simulated with rapid random sawtooth)
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
        // Low rumble
        this._sweep(80, 20, 'sine', 0.3, 0.5);
    },

    // 6. Badge unlock — triumphant 3-note fanfare
    badgeUnlock() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._tone(f, 'triangle', 0.18, 0.2, i * 0.12));
        this._tone(1047, 'sine', 0.1, 0.4, 0.5);
    },

    // 7. Black hole proximity rumble — deep pulsing tone
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

    // 8. Meteor shower warning — descending siren
    meteorWarning() {
        for (let i = 0; i < 3; i++) {
            this._sweep(1200, 600, 'sawtooth', 0.15, 0.4, i * 0.45);
        }
    },

    // 9. Near-miss whoosh
    nearMiss() {
        this._sweep(600, 150, 'sine', 0.18, 0.15);
    },

    // ==== CONTINUOUS SOUNDS ====
    // Nodes kept alive so we can stop them
    _ambientNodes: null,
    _engineNodes: null,

    // 10. Calm space wind ambient (white noise + lowpass + slow LFO breathing)
    startAmbient() {
        if (this.muted || this._ambientNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        // White noise buffer (2 seconds, looped)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter — keeps only low, airy frequencies → removes harshness
        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 380;   // soft, muffled air
        windFilter.Q.value = 0.8;

        // Gain — fades in gently
        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(0.12, now + 3); // calm fade-in

        // Very slow LFO — makes the wind "breathe" in and out (gusts)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;   // one full breath every ~10 seconds
        lfoGain.gain.value = 120;    // sweeps filter ±120 Hz
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
        // Stop nodes after fade
        setTimeout(() => {
            try { n.noise.stop(); } catch (e) { }
            try { n.lfo.stop(); } catch (e) { }
        }, 1600);
        this._ambientNodes = null;
    },

    // 11. Rocket engine hum (continuous while playing)
    startEngineHum() {
        if (this.muted || this._engineNodes) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        // Core engine tone
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 85;        // deep engine rumble pitch
        filter.type = 'lowpass';
        filter.frequency.value = 320;    // muffle high harmonics
        filter.Q.value = 2;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 1.2);  // gentle ramp-up
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start(now);

        // Sub pulse (engine beat/throb)
        const oscSub = ctx.createOscillator();
        const lfoSub = ctx.createOscillator();
        const lfoGainSub = ctx.createGain();
        const gainSub = ctx.createGain();
        oscSub.type = 'sine';
        oscSub.frequency.value = 42;
        lfoSub.type = 'sine';
        lfoSub.frequency.value = 7;     // engine throb rate
        lfoGainSub.gain.value = 0.06;
        lfoSub.connect(lfoGainSub);
        lfoGainSub.connect(gainSub.gain);
        gainSub.gain.setValueAtTime(0, now);
        gainSub.gain.linearRampToValueAtTime(0.1, now + 1.2);
        oscSub.connect(gainSub); gainSub.connect(ctx.destination);
        oscSub.start(now); lfoSub.start(now);

        this._engineNodes = { osc, filter, gain, oscSub, gainSub, lfoSub };
    },

    // Briefly rev the engine on thrust
    engineRev() {
        if (!this._engineNodes || this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._engineNodes;
        // Pitch kick up then settle
        n.osc.frequency.cancelScheduledValues(now);
        n.osc.frequency.setValueAtTime(n.osc.frequency.value, now);
        n.osc.frequency.linearRampToValueAtTime(160, now + 0.06);
        n.osc.frequency.linearRampToValueAtTime(85, now + 0.25);
        // Volume swell
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

    // 12. Coin collect — short bright pluck
    coinCollect() {
        this._tone(988, 'triangle', 0.14, 0.08);
        this._tone(1318, 'sine', 0.10, 0.14, 0.05);
    },

    // 13. Combo tick — ascending pip, brighter by tier
    comboTick(tier) {
        const base = 440 + tier * 220;
        this._tone(base, 'triangle', 0.13, 0.08);
        this._tone(base * 1.5, 'sine', 0.08, 0.12, 0.04);
    },

    // 14. Slow-mo activate — pitched-down time warp
    slowMoActivate() {
        this._sweep(880, 180, 'sine', 0.22, 0.5);
        this._sweep(440, 120, 'triangle', 0.15, 0.55, 0.05);
    },

    slowMoEnd() {
        this._sweep(180, 880, 'sine', 0.18, 0.35);
    },

    // 15. Magnet activate — electric hum
    magnetActivate() {
        this._sweep(220, 660, 'square', 0.12, 0.25);
        this._tone(880, 'triangle', 0.10, 0.2, 0.1);
    },

    // 16. Soft UI ping (tutorial / button)
    uiPing() {
        this._tone(880, 'sine', 0.10, 0.1);
    },

    // Shift ambient wind character per zone (gentler / more intense filter sweep)
    shiftAmbient(zoneIndex) {
        if (!this._ambientNodes || this.muted) return;
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const n = this._ambientNodes;
        // Zone-based filter cutoff targets (higher = breezier, lower = muffled/tense)
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

// Initialize audio engine (sets mute state from localStorage)
AudioEngine.init();

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
    // Powerups
    collectedStars: 0,
    hasShield: false,
    shieldEndTime: 0,
    isInvincible: false,
    // Persistence
    unlockedBadges: [],
    blackHoles: null,
    blackHoleTimer: null,
    meteorTimer: null,
    lastSpawnX: 0,
    // Zones
    currentZone: 0,

    // Combo
    combo: 0,
    maxCombo: 0,
    comboMult: 1,
    comboTier: -1,
    lastScoreTime: 0,

    // Slowmo + Magnet power-ups
    crystals: null,
    coins: null,
    magnets: null,
    slowMoActive: false,
    slowMoEndTime: 0,
    timeScaleTarget: 1,
    timeScaleCurrent: 1,
    magnetActive: false,
    magnetEndTime: 0,

    // Currency + meta stats
    sessionCoins: 0,
    totalCoins: 0,
    gamesPlayed: 0,
    nearMisses: 0,
    sessionStartTime: 0,
    sessionDurationMs: 0,

    // Visuals
    shootingStars: [],
    isPaused: false,

    // Skin
    currentSkin: 'classic',
    unlockedSkins: ['classic']
};

let sceneRef;
let scoreText;
let highScoreText;
let starText;
let badgeText;
let meteorText;
let shieldEffect;
let bgGraphics;      // Zone background — redrawn on zone change
let zoneBannerText;  // Zone transition banner

// Enhanced HUD
let comboText;
let comboBarBg;
let comboBarFill;
let shieldBarBg;
let shieldBarFill;
let slowMoBarBg;
let slowMoBarFill;
let magnetBarBg;
let magnetBarFill;
let zoneProgressBg;
let zoneProgressFill;
let zoneProgressLabel;
let coinText;
let magnetRing;       // visible aura when magnet active

// ====================================
// PRELOAD - Create Graphics
// ====================================
function preload() {
    sceneRef = this;

    // Load high score, badges & intensity
    gameState.highScore = parseInt(localStorage.getItem('spaceRocketHighScore') || '0');
    gameState.unlockedBadges = JSON.parse(localStorage.getItem('spaceRocketBadges') || '[]');
    gameState.intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');

    // Persistent meta
    gameState.totalCoins = parseInt(localStorage.getItem('spaceRocketCoins') || '0');
    gameState.gamesPlayed = parseInt(localStorage.getItem('spaceRocketGames') || '0');
    gameState.maxCombo = parseInt(localStorage.getItem('spaceRocketMaxCombo') || '0');
    gameState.totalTimeMs = parseInt(localStorage.getItem('spaceRocketTotalTime') || '0');
    try {
        gameState.unlockedSkins = JSON.parse(localStorage.getItem('spaceRocketSkins') || '["classic"]');
    } catch (e) { gameState.unlockedSkins = ['classic']; }
    gameState.currentSkin = localStorage.getItem('spaceRocketActiveSkin') || 'classic';

    updateHomeBadges();
    if (typeof updateHomeStats === 'function') updateHomeStats();

    // Create rocket sprites (one texture per skin)
    SKINS.forEach(s => createRocketTexture(this, s.id, s.accent));

    // Create flame texture
    createFlameTexture(this);

    // Create obstacle textures
    createMountainTexture(this);
    createPlanetTexture(this);
    createAsteroidTexture(this);
    createUFOTexture(this);
    createStarItemTexture(this);
    createBlackHoleTexture(this);
    createCoinTexture(this);
    createCrystalTexture(this);
    createMagnetTexture(this);
}

function createRocketTexture(scene, skinId = 'classic', accent = 0xff3366) {
    const gfx = scene.add.graphics();
    const textureKey = skinId === 'classic' ? 'rocket' : `rocket_${skinId}`;

    // -- Dimensions: 64x50 --

    // 1. Rear Thrusters
    gfx.fillStyle(0x2d3436, 1);
    gfx.fillRoundedRect(0, 10, 15, 10, 2);
    gfx.fillRoundedRect(0, 30, 15, 10, 2);

    // Engine Glow Cores — tinted by accent
    gfx.fillStyle(accent, 0.85);
    gfx.fillCircle(2, 15, 3);
    gfx.fillCircle(2, 35, 3);

    // 2. Wings
    gfx.fillStyle(0xa4b0be, 1);
    gfx.beginPath();
    gfx.moveTo(20, 25);
    gfx.lineTo(5, 5);
    gfx.lineTo(40, 25);
    gfx.lineTo(5, 45);
    gfx.closePath();
    gfx.fillPath();

    // Wing Accents — accent-tinted trim
    gfx.lineStyle(2, accent, 1);
    gfx.beginPath();
    gfx.moveTo(10, 10);
    gfx.lineTo(30, 25);
    gfx.lineTo(10, 40);
    gfx.strokePath();

    // 3. Main Fuselage
    gfx.fillStyle(0xffffff, 1);
    gfx.beginPath();
    gfx.moveTo(10, 20);
    gfx.lineTo(60, 25);
    gfx.lineTo(10, 30);
    gfx.lineTo(8, 25);
    gfx.closePath();
    gfx.fillPath();

    // 4. Cockpit — tinted with accent darker variant
    gfx.fillStyle(0x0984e3, 1);
    gfx.fillEllipse(35, 25, 10, 4);
    gfx.fillStyle(0x74b9ff, 0.9);
    gfx.fillEllipse(36, 24, 4, 1);

    // 5. Nose accent stripe
    gfx.fillStyle(accent, 1);
    gfx.fillTriangle(50, 23, 60, 25, 50, 27);

    // 6. Vertical Stabilizer
    gfx.fillStyle(0x747d8c, 1);
    gfx.beginPath();
    gfx.moveTo(15, 25);
    gfx.lineTo(5, 15);
    gfx.lineTo(25, 25);
    gfx.closePath();
    gfx.fillPath();

    gfx.generateTexture(textureKey, 64, 50);
    gfx.destroy();
}

function createFlameTexture(scene) {
    const gfx = scene.add.graphics();

    // Soft glowing particle
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(4, 4, 4);

    gfx.generateTexture('flare', 8, 8);
    gfx.destroy();
}

function createMountainTexture(scene) {
    const gfx = scene.add.graphics();

    // Rock/Mountain texture
    gfx.fillStyle(0x4a5568, 1);

    // Draw a jagged mountain shape
    gfx.beginPath();
    gfx.moveTo(0, 400);
    gfx.lineTo(0, 0); // Top left (base)
    // Jagged edge on the "danger" side
    for (let i = 0; i <= 400; i += 40) {
        gfx.lineTo(60 + Phaser.Math.Between(-10, 10), i);
    }
    gfx.lineTo(0, 400); // Bottom left
    gfx.closePath();
    gfx.fillPath();

    // Highlights
    gfx.lineStyle(2, 0x718096, 0.5);
    gfx.strokePath();

    gfx.generateTexture('mountain', 70, 400);
    gfx.destroy();
}

function createGiantMarsTexture(scene) {
    const gfx = scene.add.graphics();
    const size = 600;

    // Base Mars Sphere (Huge)
    gfx.fillStyle(0xc0392b, 1);
    gfx.fillCircle(size / 2, size / 2, size / 2);

    // Surface details (Craters/Canyons)
    gfx.fillStyle(0xa93226, 1); // Darker red
    gfx.fillCircle(size * 0.3, size * 0.3, size * 0.1);
    gfx.fillCircle(size * 0.7, size * 0.6, size * 0.15);

    // "Polar Ice" or lighter patch
    gfx.fillStyle(0xe67e22, 0.8);
    gfx.fillCircle(size * 0.5, size * 0.1, size * 0.1);

    gfx.generateTexture('giant_mars', size, size);
    gfx.destroy();
}

function createGiantMoonTexture(scene) {
    const gfx = scene.add.graphics();
    const size = 600;

    // Base Moon Sphere
    gfx.fillStyle(0x95a5a6, 1);
    gfx.fillCircle(size / 2, size / 2, size / 2);

    // Craters
    gfx.fillStyle(0x7f8c8d, 1);
    gfx.fillCircle(size * 0.2, size * 0.4, size * 0.08);
    gfx.fillCircle(size * 0.8, size * 0.2, size * 0.12);
    gfx.fillCircle(size * 0.5, size * 0.8, size * 0.1);

    gfx.generateTexture('giant_moon', size, size);
    gfx.destroy();
}

function createPlanetTexture(scene) {
    const gfx = scene.add.graphics();

    // Planet body
    const color = Phaser.Math.RND.pick([0xff6b6b, 0x4ecdc4, 0xffe66d, 0x6b46c1]);
    gfx.fillStyle(color, 1);
    gfx.fillCircle(100, 100, 100);

    // Craters
    gfx.fillStyle(0x000000, 0.2);
    gfx.fillCircle(60, 60, 20);
    gfx.fillCircle(140, 120, 30);
    gfx.fillCircle(50, 150, 15);

    // Atmosphere glow
    gfx.lineStyle(4, 0xffffff, 0.2);
    gfx.strokeCircle(100, 100, 100);

    gfx.generateTexture('planet', 200, 200);
    gfx.destroy();
}

function createAsteroidTexture(scene) {
    const gfx = scene.add.graphics();

    // Jagged Rock shape
    gfx.fillStyle(0x888888, 1);
    gfx.beginPath();
    gfx.moveTo(20, 0);
    gfx.lineTo(40, 10);
    gfx.lineTo(50, 30);
    gfx.lineTo(40, 50);
    gfx.lineTo(20, 55);
    gfx.lineTo(0, 40);
    gfx.lineTo(-10, 20);
    gfx.lineTo(0, 0);
    gfx.closePath();
    gfx.fillPath();

    // Craters
    gfx.fillStyle(0x666666, 1);
    gfx.fillCircle(15, 15, 5);
    gfx.fillCircle(35, 35, 8);
    gfx.fillCircle(25, 45, 4);

    gfx.generateTexture('asteroid', 60, 60);
    gfx.destroy();
}

function createUFOTexture(scene) {
    const gfx = scene.add.graphics();

    // Dome
    gfx.fillStyle(0x00ffff, 0.8);
    gfx.fillEllipse(25, 15, 15, 10);

    // Body (Saucer)
    gfx.fillStyle(0x999999, 1);
    gfx.fillEllipse(25, 25, 25, 8);

    // Lights
    gfx.fillStyle(0xff0000, 1);
    gfx.fillCircle(10, 25, 2);
    gfx.fillCircle(40, 25, 2);
    gfx.fillCircle(25, 28, 2);

    gfx.generateTexture('ufo', 50, 40);
    gfx.destroy();
}

function createStarItemTexture(scene) {
    const gfx = scene.add.graphics();

    // Gold Star
    gfx.fillStyle(0xffd700, 1);
    const points = 5;
    const outerRadius = 15;
    const innerRadius = 7;
    let angle = -Math.PI / 2;
    const step = Math.PI / points;

    gfx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        gfx.lineTo(20 + Math.cos(angle) * r, 20 + Math.sin(angle) * r);
        angle += step;
    }
    gfx.closePath();
    gfx.fillPath();

    // Shine
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillCircle(15, 15, 3);

    gfx.generateTexture('starItem', 40, 40);
    gfx.destroy();
}

function createCoinTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xffb800, 1);
    gfx.fillCircle(14, 14, 12);
    gfx.fillStyle(0xffe680, 1);
    gfx.fillCircle(14, 14, 9);
    gfx.fillStyle(0xffb800, 1);
    gfx.fillRect(11, 7, 6, 14);
    gfx.generateTexture('coin', 28, 28);
    gfx.destroy();
}

function createCrystalTexture(scene) {
    const gfx = scene.add.graphics();
    // diamond-shaped time crystal
    gfx.fillStyle(0x4dd0ff, 0.85);
    gfx.beginPath();
    gfx.moveTo(18, 0);
    gfx.lineTo(36, 22);
    gfx.lineTo(18, 44);
    gfx.lineTo(0, 22);
    gfx.closePath();
    gfx.fillPath();
    gfx.fillStyle(0xb8f0ff, 0.95);
    gfx.beginPath();
    gfx.moveTo(18, 6);
    gfx.lineTo(28, 22);
    gfx.lineTo(18, 38);
    gfx.lineTo(8, 22);
    gfx.closePath();
    gfx.fillPath();
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(18, 16, 3);
    gfx.generateTexture('crystal', 36, 44);
    gfx.destroy();
}

function createMagnetTexture(scene) {
    const gfx = scene.add.graphics();
    // horseshoe magnet
    gfx.fillStyle(0xff2e4d, 1);
    gfx.fillRect(4, 4, 10, 24);
    gfx.fillRect(22, 4, 10, 24);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(4, 24, 10, 6);
    gfx.fillRect(22, 24, 10, 6);
    gfx.fillStyle(0xff2e4d, 1);
    gfx.fillRect(4, 4, 28, 6);
    gfx.lineStyle(2, 0x000000, 0.6);
    gfx.strokeRect(4, 4, 10, 26);
    gfx.strokeRect(22, 4, 10, 26);
    gfx.generateTexture('magnet', 36, 34);
    gfx.destroy();
}

// ====================================
// CREATE - Setup Game Scene
// ====================================

function createSpaceBackground(scene) {
    // Gradient background — stored globally so zones can redraw it
    bgGraphics = scene.add.graphics();
    const zone = ZONES[gameState.currentZone];
    bgGraphics.fillGradientStyle(zone.bgTop, zone.bgTop, zone.bgBot, zone.bgBot, 1);
    bgGraphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
    bgGraphics.setScrollFactor(0);
    bgGraphics.setDepth(-100);

    // Star layers (parallax)
    for (let layer = 0; layer < 3; layer++) {
        const count = 30 + layer * 20;
        const speed = 0.2 + layer * 0.3;
        const size = 1 + layer * 0.5;

        for (let i = 0; i < count; i++) {
            const star = scene.add.circle(
                Phaser.Math.Between(0, scene.scale.width + 50),
                Phaser.Math.Between(0, scene.scale.height),
                Phaser.Math.FloatBetween(size * 0.5, size),
                COLORS.STAR,
                Phaser.Math.FloatBetween(0.3, 0.8)
            );
            star.setDepth(-50 + layer);
            star.scrollSpeed = speed;
            gameState.stars.push(star);

            // Twinkle animation
            scene.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    // Distant nebula
    const nebula = scene.add.ellipse(600, 300, 300, 200, zone.nebulaColor, 0.1);
    nebula.setDepth(-80);
    gameState.stars.push({ ...nebula, scrollSpeed: 0.05 });

    // Periodic shooting star
    scene.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => {
            if (gameState.isPaused) return;
            const y0 = Phaser.Math.Between(20, scene.scale.height * 0.6);
            const line = scene.add.graphics();
            line.lineStyle(2, 0xffffff, 0.85);
            line.setDepth(-40);
            const len = Phaser.Math.Between(40, 80);
            line.beginPath();
            line.moveTo(0, 0);
            line.lineTo(len, -len * 0.3);
            line.strokePath();
            line.x = scene.scale.width + 50;
            line.y = y0;
            scene.tweens.add({
                targets: line,
                x: -100,
                y: y0 + 80,
                alpha: 0,
                duration: Phaser.Math.Between(700, 1100),
                ease: 'Quad.easeIn',
                onComplete: () => line.destroy()
            });
        }
    });
}

function create() {
    // Create space background
    createSpaceBackground(this);

    // Create Biome Textures
    createGiantMarsTexture(this);
    createGiantMoonTexture(this);

    // Create obstacle group
    gameState.obstacles = this.physics.add.group();
    gameState.flyingObstacles = this.physics.add.group();
    gameState.ufos = this.physics.add.group();
    gameState.starItems = this.physics.add.group();
    gameState.blackHoles = this.physics.add.group();
    gameState.crystals = this.physics.add.group();
    gameState.coins = this.physics.add.group();
    gameState.magnets = this.physics.add.group();

    // Create rocket
    createRocket(this);

    // COLLISION DETECTION
    this.physics.add.overlap(gameState.rocket, gameState.obstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.flyingObstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.ufos, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.crystals, collectCrystal, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.coins, collectCoin, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.magnets, collectMagnet, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.blackHoles, (rocket, hole) => {
        onCollision(rocket, hole);
    }, null, this);

    // Create UI
    createUI(this);

    // Listen for resize to reposition centering text
    this.scale.on('resize', () => {
        if (badgeText) badgeText.x = this.scale.width / 2;
        if (meteorText) {
            meteorText.x = this.scale.width / 2;
            meteorText.setFontSize(Math.min(40, this.scale.width * 0.08));
        }
    });

    // Input handling
    this.input.on('pointerdown', thrust);
    this.input.keyboard.on('keydown-SPACE', thrust);

    function createRocket(scene, y = 300) {
        // Rocket sprite (uses active skin)
        const skin = SKINS.find(s => s.id === gameState.currentSkin) || SKINS[0];
        const texKey = skin.id === 'classic' ? 'rocket' : `rocket_${skin.id}`;
        gameState.rocket = scene.physics.add.sprite(150, y, texKey);
        gameState.rocket.setDepth(10);
        gameState.rocket.body.setSize(25, 20);

        gameState.rocket.body.setOffset(5, 7);
        gameState.rocket.setMaxVelocity(GAME.MAX_VELOCITY, GAME.MAX_VELOCITY);

        // Disable gravity until game starts
        gameState.rocket.body.allowGravity = false;

        // Particle Emitter for Exhaust
        gameState.exhaust = scene.add.particles(0, 0, 'flare', {
            speed: { min: 100, max: 200 },
            angle: { min: 170, max: 190 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x00d2ff, 0x0077ff, 0x0000ff],
            lifespan: 300,
            blendMode: 'ADD',
            frequency: 10,
            quantity: 2,
            follow: gameState.rocket,
            followOffset: { x: -25, y: 7 }
        });

        gameState.exhaust.setDepth(9);

        // Shield Effect
        shieldEffect = scene.add.ellipse(0, 0, 60, 60, 0x00ffff, 0.3);
        shieldEffect.setStrokeStyle(2, 0x00ffff, 0.8);
        shieldEffect.setVisible(false);
        shieldEffect.setDepth(11);

        // Magnet aura ring
        magnetRing = scene.add.circle(0, 0, GAME.MAGNET_RADIUS, 0xff2e4d, 0.06);
        magnetRing.setStrokeStyle(2, 0xff2e4d, 0.5);
        magnetRing.setVisible(false);
        magnetRing.setDepth(9);
    }

    function createUI(scene) {
        const centerX = scene.scale.width / 2;
        const mobileScale = Math.min(1, scene.scale.width / 800);

        // Score
        scoreText = scene.add.text(20, 20, 'SCORE: 0', {
            fontSize: (28 * mobileScale) + 'px',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        scoreText.setDepth(100);
        scoreText.setScrollFactor(0);

        // High score
        highScoreText = scene.add.text(20, 55, 'BEST: ' + gameState.highScore, {
            fontSize: (16 * mobileScale) + 'px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        highScoreText.setDepth(100);
        highScoreText.setScrollFactor(0);

        // Star Count
        starText = scene.add.text(20, 80, 'STARS: 0/3', {
            fontSize: (18 * mobileScale) + 'px',
            fontFamily: 'Courier New',
            color: '#ffd700',
            fontWeight: 'bold'
        });
        starText.setDepth(100);

        // Badge Notification
        badgeText = scene.add.text(centerX, 150, '', {
            fontSize: Math.min(32, scene.scale.width * 0.06) + 'px',
            fontFamily: 'Impact',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        badgeText.setOrigin(0.5);
        badgeText.setDepth(200);
        badgeText.setAlpha(0);

        // Meteor Warning
        meteorText = scene.add.text(centerX, 300, 'METEOR SHOWER DETECTED!', {
            fontSize: Math.min(40, scene.scale.width * 0.08) + 'px',
            fontFamily: 'Impact',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 5,
            align: 'center'
        });
        meteorText.setOrigin(0.5);
        meteorText.setDepth(200);
        meteorText.setVisible(false);

        // Zone Banner
        zoneBannerText = scene.add.text(centerX, scene.scale.height / 2 - 60, '', {
            fontSize: Math.min(36, scene.scale.width * 0.065) + 'px',
            fontFamily: 'Impact',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        });
        zoneBannerText.setOrigin(0.5);
        zoneBannerText.setDepth(250);
        zoneBannerText.setAlpha(0);

        // --- Combo meter (top-center) ---
        comboText = scene.add.text(centerX, 30, '', {
            fontSize: Math.min(34, scene.scale.width * 0.06) + 'px',
            fontFamily: 'Impact',
            color: '#ffdd59',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        comboText.setOrigin(0.5, 0);
        comboText.setDepth(120);
        comboText.setAlpha(0);
        comboText.setScrollFactor(0);

        comboBarBg = scene.add.rectangle(centerX, 70, 180, 6, 0x222222, 0.7);
        comboBarBg.setDepth(119).setScrollFactor(0).setVisible(false);
        comboBarFill = scene.add.rectangle(centerX - 90, 70, 180, 6, 0xffdd59, 1);
        comboBarFill.setOrigin(0, 0.5);
        comboBarFill.setDepth(120).setScrollFactor(0).setVisible(false);

        // --- Power-up timer bars (top-right, stacked under the pause/mute) ---
        const barX = scene.scale.width - 170;
        const barW = 150;
        shieldBarBg = scene.add.rectangle(barX, 115, barW, 8, 0x222222, 0.7);
        shieldBarBg.setOrigin(0, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);
        shieldBarFill = scene.add.rectangle(barX, 115, barW, 8, 0x00ffff, 1);
        shieldBarFill.setOrigin(0, 0.5).setDepth(101).setScrollFactor(0).setVisible(false);

        slowMoBarBg = scene.add.rectangle(barX, 135, barW, 8, 0x222222, 0.7);
        slowMoBarBg.setOrigin(0, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);
        slowMoBarFill = scene.add.rectangle(barX, 135, barW, 8, 0x4dd0ff, 1);
        slowMoBarFill.setOrigin(0, 0.5).setDepth(101).setScrollFactor(0).setVisible(false);

        magnetBarBg = scene.add.rectangle(barX, 155, barW, 8, 0x222222, 0.7);
        magnetBarBg.setOrigin(0, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);
        magnetBarFill = scene.add.rectangle(barX, 155, barW, 8, 0xff2e4d, 1);
        magnetBarFill.setOrigin(0, 0.5).setDepth(101).setScrollFactor(0).setVisible(false);

        // --- Zone progress bar (bottom-center) ---
        const progW = Math.min(360, scene.scale.width * 0.6);
        const progY = scene.scale.height - 22;
        zoneProgressBg = scene.add.rectangle(centerX, progY, progW, 6, 0x222222, 0.6);
        zoneProgressBg.setDepth(100).setScrollFactor(0);
        zoneProgressFill = scene.add.rectangle(centerX - progW / 2, progY, 0, 6, 0x00d4ff, 1);
        zoneProgressFill.setOrigin(0, 0.5).setDepth(101).setScrollFactor(0);

        zoneProgressLabel = scene.add.text(centerX, progY - 16, 'DEEP SPACE', {
            fontSize: '11px',
            fontFamily: 'Courier New',
            color: '#8899aa',
            align: 'center'
        });
        zoneProgressLabel.setOrigin(0.5).setDepth(101).setScrollFactor(0);

        // --- Coin counter (under stars) ---
        coinText = scene.add.text(20, 105, 'COINS: 0', {
            fontSize: (16 * mobileScale) + 'px',
            fontFamily: 'Courier New',
            color: '#ffb800',
            fontWeight: 'bold'
        });
        coinText.setDepth(100).setScrollFactor(0);
    }
}

// ====================================
// ZONE SYSTEM
// ====================================
function checkZone(score) {
    // Find the highest zone whose minScore we've reached
    let newZone = 0;
    for (let i = ZONES.length - 1; i >= 0; i--) {
        if (score >= ZONES[i].minScore) { newZone = i; break; }
    }
    if (newZone !== gameState.currentZone) {
        gameState.currentZone = newZone;
        transitionToZone(newZone);
    }
}

function transitionToZone(index) {
    const zone = ZONES[index];

    // 1. Flash + redraw background
    sceneRef.cameras.main.flash(300, 255, 255, 255, false);
    if (bgGraphics) {
        bgGraphics.clear();
        bgGraphics.fillGradientStyle(zone.bgTop, zone.bgTop, zone.bgBot, zone.bgBot, 1);
        bgGraphics.fillRect(0, 0, sceneRef.scale.width, sceneRef.scale.height);
    }

    // 2. Zone name banner — fly in and fade out
    if (zoneBannerText) {
        zoneBannerText.setText(zone.label);
        zoneBannerText.setAlpha(1);
        zoneBannerText.setScale(1.4);
        zoneBannerText.y = sceneRef.scale.height / 2 - 60;
        sceneRef.tweens.add({
            targets: zoneBannerText,
            alpha: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 2500,
            ease: 'Power2'
        });
    }

    // 3. Adjust asteroid + UFO timers
    if (gameState.asteroidTimer) {
        gameState.asteroidTimer.remove();
        gameState.asteroidTimer = sceneRef.time.addEvent({
            delay: zone.asteroidRate,
            callback: spawnFlyingAsteroid,
            loop: true
        });
    }
    if (gameState.ufoTimer) {
        gameState.ufoTimer.remove();
        gameState.ufoTimer = sceneRef.time.addEvent({
            delay: zone.ufoRate,
            callback: spawnUFO,
            loop: true
        });
    }

    // 4. Shift ambient audio
    AudioEngine.shiftAmbient(index);
}

// ====================================
// UPDATE - Game Loop
// ====================================
function update() {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const now = Date.now();

    // Time-scale lerp (for slow-mo)
    gameState.timeScaleCurrent += (gameState.timeScaleTarget - gameState.timeScaleCurrent) * 0.08;

    // Combo decay check
    if (gameState.combo > 0 && now - gameState.lastScoreTime > GAME.COMBO_TIMEOUT) {
        resetCombo();
    }

    // Shield Logic
    if (gameState.hasShield) {
        shieldEffect.setVisible(true);
        shieldEffect.setPosition(gameState.rocket.x, gameState.rocket.y);

        const remaining = gameState.shieldEndTime - now;
        if (remaining <= 0) {
            deactivateShield();
        } else if (remaining < 1500) {
            shieldEffect.setVisible(Math.floor(now / 100) % 2 === 0);
        }
    } else {
        shieldEffect.setVisible(false);
    }

    // Slow-mo Logic
    if (gameState.slowMoActive) {
        if (now >= gameState.slowMoEndTime) {
            deactivateSlowMo();
        }
    }

    // Magnet Logic
    if (gameState.magnetActive) {
        magnetRing.setVisible(true);
        magnetRing.setPosition(gameState.rocket.x, gameState.rocket.y);
        magnetRing.rotation += 0.02;
        if (now >= gameState.magnetEndTime) {
            deactivateMagnet();
        } else {
            // Attract pickups within radius
            [gameState.starItems, gameState.coins, gameState.crystals].forEach(group => {
                group.getChildren().forEach(pickup => {
                    const dx = gameState.rocket.x - pickup.x;
                    const dy = gameState.rocket.y - pickup.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < GAME.MAGNET_RADIUS) {
                        pickup.x += (dx / d) * 6;
                        pickup.y += (dy / d) * 6;
                    }
                });
            });
        }
    } else {
        magnetRing.setVisible(false);
    }

    updateHUDBars();

    // Rocket Rotation
    const velocityY = gameState.rocket.body.velocity.y;
    gameState.rocket.angle = Phaser.Math.Clamp(velocityY * 0.1, -30, 45);

    // Check boundaries
    if (gameState.isPlaying && !gameState.isGameOver) {
        if (gameState.rocket.y < -40 || gameState.rocket.y >= 760) {
            gameOver();
        }
    }

    const ts = gameState.timeScaleCurrent;

    // Scroll stars
    gameState.stars.forEach(star => {
        if (star.scrollSpeed) {
            star.x -= gameState.obstacleSpeed * star.scrollSpeed * 0.016 * ts;
            if (star.x < -100) {
                star.x = 900;
            }
        }
    });

    gameState.lastSpawnX -= gameState.obstacleSpeed * 0.016 * ts;

    // Apply time-scale to every physics group with velocity
    applyTimeScaleToGroups(ts);

    // Check obstacle passing + near-miss detection
    gameState.obstacles.getChildren().forEach(obstacle => {
        if (!obstacle.scored && obstacle.x < gameState.rocket.x - 30) {
            if (obstacle.isTop) {
                // Near-miss if rocket came close vertically
                const dy = Math.abs(obstacle.y - gameState.rocket.y);
                const wasNear = obstacle.closestDy !== undefined && obstacle.closestDy < GAME.NEAR_MISS_THRESHOLD * 2;
                if (wasNear && obstacle.closestDy > 15) {
                    registerNearMiss();
                }
                addScore(GAME.POINTS_PER_PASS);
            }
            obstacle.scored = true;
        } else if (!obstacle.scored && obstacle.x > gameState.rocket.x - 30 && obstacle.x < gameState.rocket.x + 60) {
            const dy = Math.abs(obstacle.y - gameState.rocket.y);
            if (obstacle.closestDy === undefined || dy < obstacle.closestDy) {
                obstacle.closestDy = dy;
            }
        }
        if (obstacle.x < -100) {
            obstacle.destroy();
        }
    });

    // Update flying asteroids
    gameState.flyingObstacles.getChildren().forEach(asteroid => {
        asteroid.rotation += 0.02 * ts;
        if (!asteroid.scored && asteroid.x < gameState.rocket.x - 30) {
            addScore(GAME.POINTS_PER_PASS);
            asteroid.scored = true;
        }
        if (asteroid.x < -100) {
            asteroid.destroy();
        }
    });

    // Update UFOs
    gameState.ufos.getChildren().forEach(ufo => {
        if (ufo.isDummy) {
            ufo.x -= gameState.obstacleSpeed * 2.5 * 0.016 * ts;
        } else {
            ufo.x -= gameState.obstacleSpeed * 1.2 * 0.016 * ts;
            ufo.sineOffset += 0.05 * ts;
            ufo.y = ufo.startY + Math.sin(ufo.sineOffset) * 100;
        }
        if (ufo.x < -100) ufo.destroy();
    });

    // Remove stars, coins, crystals, magnets that scroll off
    [gameState.starItems, gameState.coins, gameState.crystals, gameState.magnets].forEach(group => {
        if (!group) return;
        group.getChildren().forEach(item => {
            if (item.x < -100) item.destroy();
        });
    });

    // Update Black Holes
    gameState.blackHoles.getChildren().forEach(hole => {
        hole.x -= gameState.obstacleSpeed * 0.016 * ts;
        hole.rotation -= 0.05 * ts;

        if (Math.random() > 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(30, 60);
            const p = sceneRef.add.circle(hole.x + Math.cos(angle) * dist, hole.y + Math.sin(angle) * dist, 2, 0x8b5cf6, 1);
            sceneRef.tweens.add({
                targets: p,
                x: hole.x,
                y: hole.y,
                alpha: 0,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        hole.setVelocityX(-gameState.obstacleSpeed * 0.8 * ts);

        const dx = hole.x - gameState.rocket.x;
        const dy = hole.y - gameState.rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 350) {
            const force = (350 - dist) * 0.08;
            const angle = Math.atan2(dy, dx);
            gameState.rocket.body.velocity.y += Math.sin(angle) * force;

            // Audio: proximity rumble, throttled to avoid spam
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
            scheduleNextBlackHole();
        }
    });
}

// ====================================
// GAME ACTIONS
// ====================================
function thrust() {
    if (gameState.isGameOver) return;
    if (!gameState.isPlaying) {
        startGame();
        return;
    }
    AudioEngine.thrust();
    AudioEngine.engineRev();
    gameState.rocket.setVelocityY(GAME.THRUST_POWER);
    if (gameState.exhaust) {
        gameState.exhaust.emitParticle(5);
    }
    createThrustParticles();
}

function createThrustParticles() {
    for (let i = 0; i < 3; i++) {
        const particle = sceneRef.add.circle(
            gameState.rocket.x - 25,
            gameState.rocket.y + Phaser.Math.Between(-5, 5),
            Phaser.Math.Between(2, 4),
            COLORS.FLAME_OUTER,
            0.8
        );
        particle.setDepth(8);
        sceneRef.tweens.add({
            targets: particle,
            x: particle.x - 40,
            alpha: 0,
            scale: 0.3,
            duration: 200,
            onComplete: () => particle.destroy()
        });
    }
}

function startGame() {
    gameState.isPlaying = true;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.sessionCoins = 0;
    gameState.nearMisses = 0;
    gameState.sessionStartTime = Date.now();

    // Reset combo + power-up state
    gameState.combo = 0;
    gameState.comboMult = 1;
    gameState.comboTier = -1;
    gameState.slowMoActive = false;
    gameState.magnetActive = false;
    gameState.timeScaleTarget = 1;
    gameState.timeScaleCurrent = 1;

    if (coinText) coinText.setText('COINS: 0');
    if (comboText) comboText.setAlpha(0);
    if (comboBarBg) comboBarBg.setVisible(false);
    if (comboBarFill) comboBarFill.setVisible(false);

    const intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');
    gameState.intensity = intensity;

    gameState.obstacleSpeed = 100 + (intensity * 6);
    gameState.spawnRate = 4000 - (intensity * 60);

    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;
    starText.setText('STARS: 0/' + GAME.STARS_FOR_SHIELD);
    starText.setColor('#ffd700');

    gameState.rocket.body.allowGravity = true;
    gameState.rocket.setVelocity(0, 0);

    // Hide tutorial hint once the game actually starts
    document.getElementById('tutorialHint')?.classList.add('hidden');

    gameState.obstacleTimer = sceneRef.time.addEvent({
        delay: gameState.spawnRate,
        callback: spawnObstacle,
        loop: true
    });

    gameState.asteroidTimer = sceneRef.time.addEvent({
        delay: 800,
        callback: spawnFlyingAsteroid,
        loop: true
    });

    gameState.ufoTimer = sceneRef.time.addEvent({
        delay: 8000,
        callback: spawnUFO,
        loop: true
    });

    scheduleNextBlackHole();

    gameState.meteorTimer = sceneRef.time.addEvent({
        delay: 20000,
        callback: triggerMeteorShower,
        loop: true
    });

    gameState.starTimer = sceneRef.time.addEvent({
        delay: 2000,
        callback: spawnStar,
        loop: true
    });

    gameState.coinTimer = sceneRef.time.addEvent({
        delay: 3500,
        callback: spawnCoin,
        loop: true
    });

    gameState.crystalTimer = sceneRef.time.addEvent({
        delay: 14000,
        callback: spawnCrystal,
        loop: true
    });

    gameState.magnetTimer = sceneRef.time.addEvent({
        delay: 22000,
        callback: spawnMagnet,
        loop: true
    });

    gameState.difficultyTimer = sceneRef.time.addEvent({
        delay: 5000,
        callback: increaseDifficulty,
        loop: true
    });

    updateScoreDisplay();

    AudioEngine.startAmbient();
    AudioEngine.startEngineHum();

    document.getElementById('homeMenu')?.classList.add('hidden');
    document.getElementById('gameUI')?.classList.remove('hidden');
}

// ====================================
// COLLISION HANDLERS
// ====================================
function onCollision(rocket, obstacle) {
    if (gameState.isGameOver || gameState.isInvincible || obstacle.isDummy) return;

    resetCombo();

    if (gameState.hasShield) {
        gameState.hasShield = false;
        gameState.shieldEndTime = 0;
        deactivateShield();
        gameState.isInvincible = true;
        AudioEngine.shieldHit();
        sceneRef.tweens.add({
            targets: gameState.rocket,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 10,
            onComplete: () => {
                gameState.rocket.alpha = 1;
                gameState.isInvincible = false;
            }
        });
        gameState.rocket.setVelocityX(-200);
        sceneRef.time.delayedCall(200, () => {
            if (!gameState.isGameOver) gameState.rocket.setVelocityX(0);
        });
        sceneRef.cameras.main.shake(200, 0.01);
        return;
    }

    gameOver();
}

function collectStar(rocket, star) {
    const x = star.x, y = star.y;
    star.destroy();
    AudioEngine.starCollect();
    gameState.combo += 1;
    gameState.lastScoreTime = Date.now();
    updateComboTier();
    showFloatText(x, y, '⭐', '#ffd700', 22);

    if (gameState.hasShield) return;
    gameState.collectedStars++;
    starText.setText(`STARS: ${gameState.collectedStars}/${GAME.STARS_FOR_SHIELD}`);
    sceneRef.tweens.add({
        targets: starText,
        scale: { from: 1.5, to: 1 },
        duration: 200
    });
    if (gameState.collectedStars >= GAME.STARS_FOR_SHIELD) {
        activateShield();
    }
}

function collectCoin(rocket, coin) {
    const x = coin.x, y = coin.y;
    coin.destroy();
    AudioEngine.coinCollect();
    gameState.sessionCoins++;
    gameState.totalCoins++;
    localStorage.setItem('spaceRocketCoins', gameState.totalCoins.toString());
    if (coinText) coinText.setText(`COINS: ${gameState.sessionCoins}`);
    showFloatText(x, y, '+1', '#ffb800', 16);
}

function collectCrystal(rocket, crystal) {
    const x = crystal.x, y = crystal.y;
    crystal.destroy();
    activateSlowMo();
    showFloatText(x, y, 'SLOW-MO!', '#4dd0ff', 22);
    createShockwave(x, y, '#4dd0ff');
}

function collectMagnet(rocket, magnet) {
    const x = magnet.x, y = magnet.y;
    magnet.destroy();
    activateMagnet();
    showFloatText(x, y, 'MAGNET!', '#ff2e4d', 22);
    createShockwave(x, y, '#ff2e4d');
}

function activateSlowMo() {
    gameState.slowMoActive = true;
    gameState.slowMoEndTime = Date.now() + GAME.SLOWMO_DURATION;
    gameState.timeScaleTarget = 0.45;
    AudioEngine.slowMoActivate();
    sceneRef.cameras.main.flash(150, 80, 180, 255);
}

function deactivateSlowMo() {
    gameState.slowMoActive = false;
    gameState.timeScaleTarget = 1;
    AudioEngine.slowMoEnd();
}

function activateMagnet() {
    gameState.magnetActive = true;
    gameState.magnetEndTime = Date.now() + GAME.MAGNET_DURATION;
    AudioEngine.magnetActivate();
    sceneRef.cameras.main.flash(150, 255, 50, 100);
}

function deactivateMagnet() {
    gameState.magnetActive = false;
    magnetRing.setVisible(false);
}

function activateShield() {
    gameState.hasShield = true;
    gameState.collectedStars = 0;
    gameState.shieldEndTime = Date.now() + GAME.SHIELD_DURATION;
    starText.setText('SHIELD ACTIVE!');
    starText.setColor('#00ffff');
    AudioEngine.shieldActivate();
    sceneRef.cameras.main.flash(200, 0, 255, 255);
}

function deactivateShield() {
    gameState.hasShield = false;
    starText.setText('STARS: 0/' + GAME.STARS_FOR_SHIELD);
    starText.setColor('#ffd700');
}

// ====================================
// SPAWNING
// ====================================
function spawnObstacle() {
    if (gameState.isGameOver || gameState.lastSpawnX > sceneRef.scale.width - 300) return;
    gameState.lastSpawnX = sceneRef.scale.width + 100;
    const type = Phaser.Math.Between(0, 100);
    if (type > 40) {
        spawnGiantCanyon();
    } else {
        spawnClassicPlanets();
    }
}

function spawnClassicPlanets() {
    const gapY = Phaser.Math.Between(GAME.MIN_GAP_Y, GAME.MAX_GAP_Y);
    const gapHeight = GAME.GAP_SIZE + Phaser.Math.Between(0, 50);
    const spawnX = sceneRef.scale.width + 100;
    const spawnBoth = Math.random() > 0.2;
    const spawnTop = spawnBoth || Math.random() > 0.5;
    const spawnBot = spawnBoth || !spawnTop;

    if (spawnTop) {
        const topScale = Phaser.Math.FloatBetween(0.6, 1.0);
        const topPlanet = gameState.obstacles.create(spawnX + Phaser.Math.Between(-50, 50), gapY - 100, 'planet');
        topPlanet.setScale(topScale);
        topPlanet.body.setCircle(80 * topScale);
        topPlanet.body.allowGravity = false;
        topPlanet.body.setVelocityX(-gameState.obstacleSpeed);
        topPlanet.body.setImmovable(true);
        topPlanet.isTop = true;
        topPlanet.scored = false;
    }

    if (spawnBot) {
        const botScale = Phaser.Math.FloatBetween(0.6, 1.0);
        const bottomPlanet = gameState.obstacles.create(spawnX + Phaser.Math.Between(-50, 50), gapY + gapHeight + 100, 'planet');
        bottomPlanet.setScale(botScale);
        bottomPlanet.body.setCircle(80 * botScale);
        bottomPlanet.body.allowGravity = false;
        bottomPlanet.body.setVelocityX(-gameState.obstacleSpeed);
        bottomPlanet.body.setImmovable(true);
        bottomPlanet.scored = false;
    }
}

function spawnGiantCanyon() {
    const gapY = Phaser.Math.Between(GAME.MIN_GAP_Y, GAME.MAX_GAP_Y);
    const gapHeight = GAME.GAP_SIZE + 100;
    const spawnX = sceneRef.scale.width + 300;
    const texture = Phaser.Math.RND.pick(['giant_mars', 'giant_moon']);
    const spawnBoth = Math.random() > 0.3;
    const spawnTop = spawnBoth || Math.random() > 0.5;
    const spawnBot = spawnBoth || !spawnTop;

    if (spawnTop) {
        const topScale = Phaser.Math.FloatBetween(0.9, 1.2);
        const topBody = gameState.obstacles.create(spawnX + Phaser.Math.Between(-100, 100), gapY - 350, texture);
        topBody.setScale(topScale);
        topBody.body.setCircle(240 * topScale);
        topBody.body.allowGravity = false;
        topBody.body.setVelocityX(-gameState.obstacleSpeed);
        topBody.body.setImmovable(true);
        topBody.isTop = true;
        topBody.scored = false;
    }

    if (spawnBot) {
        const botScale = Phaser.Math.FloatBetween(0.9, 1.2);
        const bottomBody = gameState.obstacles.create(spawnX + Phaser.Math.Between(-100, 100), gapY + gapHeight + 350, texture);
        bottomBody.setScale(botScale);
        bottomBody.body.setCircle(240 * botScale);
        bottomBody.body.allowGravity = false;
        bottomBody.body.setVelocityX(-gameState.obstacleSpeed);
        bottomBody.body.setImmovable(true);
        bottomBody.scored = false;
    }
}

function spawnFlyingAsteroid() {
    if (gameState.isGameOver) return;
    const asteroid = gameState.flyingObstacles.create(sceneRef.scale.width + 100, Phaser.Math.Between(50, sceneRef.scale.height - 50), 'asteroid');
    asteroid.body.allowGravity = false;
    asteroid.body.setVelocityX(-(gameState.obstacleSpeed * 1.5));
    asteroid.setDepth(6);
    asteroid.scored = false;
}

function spawnUFO() {
    if (gameState.isGameOver || gameState.score < 2) return;
    const ufo = gameState.ufos.create(sceneRef.scale.width + 100, Phaser.Math.Between(150, sceneRef.scale.height - 150), 'ufo');
    ufo.isDummy = true;
    ufo.setTint(0x888888);
    ufo.body.allowGravity = false;
    ufo.body.setVelocityX(-gameState.obstacleSpeed * 2.5);
    ufo.setDepth(6);
}

function createBlackHoleTexture(scene) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(40, 40, 30);
    gfx.lineStyle(4, 0x8b5cf6, 0.8);
    gfx.strokeCircle(40, 40, 35);
    gfx.lineStyle(2, 0xec4899, 0.6);
    gfx.strokeCircle(40, 40, 38);
    gfx.generateTexture('blackhole', 80, 80);
    gfx.destroy();
}

function scheduleNextBlackHole() {
    if (!gameState.isGameOver) sceneRef.time.delayedCall(Phaser.Math.Between(3000, 5000), spawnBlackHole);
}

function spawnBlackHole() {
    if (gameState.isGameOver || gameState.score < 5 || gameState.blackHoles.getLength() > 0) {
        if (!gameState.isGameOver) scheduleNextBlackHole();
        return;
    }
    const hole = gameState.blackHoles.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'blackhole');
    hole.setCircle(30, 10, 10);
    hole.body.allowGravity = false;
    hole.setDepth(5);
}

function spawnStar() {
    if (gameState.isGameOver || Phaser.Math.Between(0, 100) > 30) return;
    const star = gameState.starItems.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'starItem');
    star.body.allowGravity = false;
    star.body.setVelocityX(-gameState.obstacleSpeed);
    star.setDepth(7);
    sceneRef.tweens.add({ targets: star, angle: 360, duration: 2000, repeat: -1 });
}

function spawnCoin() {
    if (gameState.isGameOver) return;
    // spawn a cluster of 3–5 coins in an arc
    const y = Phaser.Math.Between(100, sceneRef.scale.height - 100);
    const count = Phaser.Math.Between(3, 5);
    for (let i = 0; i < count; i++) {
        const coin = gameState.coins.create(sceneRef.scale.width + 100 + i * 30, y + Math.sin(i * 0.6) * 40, 'coin');
        coin.body.allowGravity = false;
        coin.body.setVelocityX(-gameState.obstacleSpeed);
        coin.setDepth(7);
        sceneRef.tweens.add({ targets: coin, scale: { from: 0.85, to: 1.1 }, duration: 600, yoyo: true, repeat: -1 });
    }
}

function spawnCrystal() {
    if (gameState.isGameOver || gameState.score < 8) return;
    const crystal = gameState.crystals.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'crystal');
    crystal.body.allowGravity = false;
    crystal.body.setVelocityX(-gameState.obstacleSpeed);
    crystal.setDepth(7);
    sceneRef.tweens.add({ targets: crystal, angle: 360, duration: 2500, repeat: -1 });
    sceneRef.tweens.add({ targets: crystal, scale: { from: 0.9, to: 1.15 }, duration: 500, yoyo: true, repeat: -1 });
}

function spawnMagnet() {
    if (gameState.isGameOver || gameState.score < 15) return;
    const magnet = gameState.magnets.create(sceneRef.scale.width + 100, Phaser.Math.Between(100, sceneRef.scale.height - 100), 'magnet');
    magnet.body.allowGravity = false;
    magnet.body.setVelocityX(-gameState.obstacleSpeed);
    magnet.setDepth(7);
    sceneRef.tweens.add({ targets: magnet, y: magnet.y - 20, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// ====================================
// DIFFICULTY & SCORING
// ====================================
function increaseDifficulty() {
    if (gameState.isGameOver) return;
    let multiplier = gameState.score < 20 ? 0.5 : 1.0 + (gameState.unlockedBadges.length * 0.2);
    gameState.obstacleSpeed += GAME.SPEED_INCREASE * multiplier;
    gameState.obstacles.getChildren().forEach(o => o.body.setVelocityX(-gameState.obstacleSpeed));

    if (gameState.spawnRate > GAME.MIN_SPAWN_RATE) {
        gameState.spawnRate -= GAME.SPAWN_DECREASE * multiplier;
        gameState.obstacleTimer.remove();
        gameState.obstacleTimer = sceneRef.time.addEvent({
            delay: gameState.spawnRate,
            callback: spawnObstacle,
            loop: true
        });
    }
}

function addScore(points) {
    // Bump combo and compute multiplier
    gameState.combo += 1;
    gameState.lastScoreTime = Date.now();
    updateComboTier();

    const gained = points * gameState.comboMult;
    gameState.score += gained;

    if (gameState.comboMult > 1) {
        showFloatText(gameState.rocket.x + 40, gameState.rocket.y - 20, `+${gained}`, '#ffdd59');
    }

    updateScoreDisplay();
    checkZone(gameState.score);
    sceneRef.tweens.add({ targets: scoreText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    if (gameState.score > 0 && gameState.score % 5 === 0) increaseDifficulty();
}

function registerNearMiss() {
    gameState.nearMisses++;
    gameState.combo += 1;
    gameState.lastScoreTime = Date.now();
    updateComboTier();
    const bonus = GAME.NEAR_MISS_BONUS * gameState.comboMult;
    gameState.score += bonus;
    showFloatText(gameState.rocket.x + 30, gameState.rocket.y + 20, `NEAR MISS +${bonus}`, '#ff66aa');
    AudioEngine.nearMiss();
    updateScoreDisplay();
    sceneRef.cameras.main.shake(80, 0.003);
}

function updateComboTier() {
    let tierIdx = -1;
    let mult = 1;
    let tierLabel = '';
    let tierColor = '#ffdd59';
    for (let i = GAME.COMBO_TIERS.length - 1; i >= 0; i--) {
        if (gameState.combo >= GAME.COMBO_TIERS[i].count) {
            tierIdx = i;
            mult = GAME.COMBO_TIERS[i].mult;
            tierLabel = GAME.COMBO_TIERS[i].label;
            tierColor = GAME.COMBO_TIERS[i].color;
            break;
        }
    }
    gameState.comboMult = mult;

    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }

    if (tierIdx > gameState.comboTier && tierIdx >= 0) {
        gameState.comboTier = tierIdx;
        AudioEngine.comboTick(tierIdx + 1);
        createShockwave(gameState.rocket.x, gameState.rocket.y, tierColor);
        showFloatText(sceneRef.scale.width / 2, 90, tierLabel, tierColor, 34);
    }

    if (gameState.combo >= 3) {
        comboText.setText(`x${mult}  ·  ${gameState.combo} STREAK`);
        comboText.setColor(tierColor);
        comboText.setAlpha(1);
        comboBarBg.setVisible(true);
        comboBarFill.setVisible(true);
    } else {
        comboText.setAlpha(0);
        comboBarBg.setVisible(false);
        comboBarFill.setVisible(false);
    }
}

function resetCombo() {
    if (gameState.combo >= 5) {
        showFloatText(sceneRef.scale.width / 2, 120, 'COMBO LOST', '#888', 18);
    }
    gameState.combo = 0;
    gameState.comboMult = 1;
    gameState.comboTier = -1;
    comboText.setAlpha(0);
    comboBarBg.setVisible(false);
    comboBarFill.setVisible(false);
}

function updateScoreDisplay() {
    scoreText.setText('SCORE: ' + gameState.score);
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreText.setText('BEST: ' + gameState.highScore);
        highScoreText.setColor('#00ff88');
    }
    const badge = BADGES.find(b => b.score === gameState.score);
    if (badge && !gameState.unlockedBadges.find(ub => ub.name === badge.name)) {
        gameState.unlockedBadges.push(badge);
        localStorage.setItem('spaceRocketBadges', JSON.stringify(gameState.unlockedBadges));
        showBadge(badge);
        updateHomeBadges();
    }
}

function updateHomeBadges() {
    const container = document.getElementById('badgeContainer');
    if (!container) return;
    container.innerHTML = BADGES.map(b => {
        const isUnlocked = gameState.unlockedBadges.find(ub => ub.name === b.name);
        return isUnlocked ?
            `<div class="badge-item"><span class="badge-icon">${b.icon}</span><div>${b.name}</div></div>` :
            `<div class="badge-item locked" style="opacity: 0.5; filter: grayscale(1);"><span class="badge-icon">🔒</span><div>${b.name}</div><div style="font-size: 10px; color: #888;">Score: ${b.score}</div></div>`;
    }).join('');
}

function showBadge(badge) {
    badgeText.setText(`${badge.icon}\n${badge.name}\nUNLOCKED!`);
    badgeText.setAlpha(1);
    AudioEngine.badgeUnlock();
    sceneRef.tweens.add({ targets: badgeText, y: 100, alpha: 0, duration: 3000, ease: 'Power2' });
}

// ====================================
// GAME OVER & RESET
// ====================================
function gameOver() {
    gameState.isGameOver = true;
    gameState.isPlaying = false;
    gameState.sessionDurationMs = Date.now() - gameState.sessionStartTime;

    if (gameState.obstacleTimer) gameState.obstacleTimer.remove();
    if (gameState.asteroidTimer) gameState.asteroidTimer.remove();
    if (gameState.starTimer) gameState.starTimer.remove();
    if (gameState.coinTimer) gameState.coinTimer.remove();
    if (gameState.crystalTimer) gameState.crystalTimer.remove();
    if (gameState.magnetTimer) gameState.magnetTimer.remove();
    if (gameState.difficultyTimer) gameState.difficultyTimer.remove();
    if (gameState.ufoTimer) gameState.ufoTimer.remove();
    if (gameState.meteorTimer) gameState.meteorTimer.remove();

    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.body.allowGravity = false;
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();
    AudioEngine.explosion();
    createExplosion();

    // Persist meta stats
    gameState.gamesPlayed++;
    gameState.totalTimeMs = (gameState.totalTimeMs || 0) + gameState.sessionDurationMs;
    if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    localStorage.setItem('spaceRocketHighScore', gameState.highScore.toString());
    localStorage.setItem('spaceRocketGames', gameState.gamesPlayed.toString());
    localStorage.setItem('spaceRocketMaxCombo', gameState.maxCombo.toString());
    localStorage.setItem('spaceRocketTotalTime', gameState.totalTimeMs.toString());

    // Unlock skins based on this session's score
    unlockSkinsForScore(gameState.score);

    sceneRef.cameras.main.shake(300, 0.02);
    sceneRef.cameras.main.flash(200, 255, 100, 100);

    if (typeof window.showGameOver === 'function') {
        window.showGameOver(gameState.score, gameState.highScore, {
            zone: ZONES[gameState.currentZone]?.label || 'DEEP SPACE',
            maxCombo: gameState.maxCombo,
            coinsCollected: gameState.sessionCoins,
            nearMisses: gameState.nearMisses,
            durationMs: gameState.sessionDurationMs,
            totalCoins: gameState.totalCoins
        });
    }
    if (typeof updateHomeStats === 'function') updateHomeStats();
}

function unlockSkinsForScore(score) {
    let unlockedNew = null;
    SKINS.forEach(s => {
        if (s.score > 0 && score >= s.score && !gameState.unlockedSkins.includes(s.id)) {
            gameState.unlockedSkins.push(s.id);
            unlockedNew = s;
        }
    });
    if (unlockedNew) {
        localStorage.setItem('spaceRocketSkins', JSON.stringify(gameState.unlockedSkins));
        if (typeof updateSkinSelector === 'function') updateSkinSelector();
    }
    return unlockedNew;
}

function createExplosion() {
    const { x, y } = gameState.rocket;
    gameState.rocket.setVisible(false);
    if (gameState.exhaust) gameState.exhaust.setVisible(false);
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const color = Phaser.Math.RND.pick([0xff6600, 0xffff00, 0xff3366, 0xffffff]);
        const p = sceneRef.add.circle(x, y, Phaser.Math.Between(3, 8), color, 1);
        p.setDepth(50);
        sceneRef.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * Phaser.Math.Between(50, 150),
            y: y + Math.sin(angle) * Phaser.Math.Between(50, 150),
            alpha: 0, scale: 0.2, duration: 500, ease: 'Power2',
            onComplete: () => p.destroy()
        });
    }
}

function restartGame(scene) {
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();

    gameState.isGameOver = false;
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.obstacleSpeed = GAME.OBSTACLE_SPEED;
    gameState.spawnRate = GAME.OBSTACLE_SPAWN_RATE;
    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;
    gameState.currentZone = 0;

    // Reset combo + power-ups
    gameState.combo = 0;
    gameState.comboMult = 1;
    gameState.comboTier = -1;
    gameState.slowMoActive = false;
    gameState.magnetActive = false;
    gameState.timeScaleTarget = 1;
    gameState.timeScaleCurrent = 1;
    gameState.sessionCoins = 0;

    // Reset background to Zone 1
    if (bgGraphics) {
        const zone0 = ZONES[0];
        bgGraphics.clear();
        bgGraphics.fillGradientStyle(zone0.bgTop, zone0.bgTop, zone0.bgBot, zone0.bgBot, 1);
        bgGraphics.fillRect(0, 0, sceneRef.scale.width, sceneRef.scale.height);
    }
    if (zoneBannerText) zoneBannerText.setAlpha(0);

    gameState.obstacles.clear(true, true);
    gameState.flyingObstacles.clear(true, true);
    gameState.ufos.clear(true, true);
    gameState.starItems.clear(true, true);
    gameState.blackHoles.clear(true, true);
    if (gameState.coins) gameState.coins.clear(true, true);
    if (gameState.crystals) gameState.crystals.clear(true, true);
    if (gameState.magnets) gameState.magnets.clear(true, true);

    // Swap rocket texture if the player switched skin
    const skin = SKINS.find(s => s.id === gameState.currentSkin) || SKINS[0];
    const texKey = skin.id === 'classic' ? 'rocket' : `rocket_${skin.id}`;
    if (gameState.rocket.texture.key !== texKey) gameState.rocket.setTexture(texKey);

    gameState.rocket.setPosition(150, 300).setVelocity(0, 0).setAngle(0).setVisible(true);
    gameState.rocket.alpha = 1;
    gameState.rocket.body.allowGravity = false;
    if (gameState.exhaust) gameState.exhaust.setVisible(true);

    updateScoreDisplay();
    highScoreText.setColor('#888888');
    starText.setText('STARS: 0/3').setColor('#ffd700');
    badgeText.setAlpha(0);
    if (comboText) comboText.setAlpha(0);
    if (comboBarBg) comboBarBg.setVisible(false);
    if (comboBarFill) comboBarFill.setVisible(false);
    if (shieldBarBg) shieldBarBg.setVisible(false);
    if (shieldBarFill) shieldBarFill.setVisible(false);
    if (slowMoBarBg) slowMoBarBg.setVisible(false);
    if (slowMoBarFill) slowMoBarFill.setVisible(false);
    if (magnetBarBg) magnetBarBg.setVisible(false);
    if (magnetBarFill) magnetBarFill.setVisible(false);
    if (coinText) coinText.setText('COINS: 0');
    if (magnetRing) magnetRing.setVisible(false);
    if (typeof meteorText !== 'undefined') meteorText.setVisible(false);

    document.getElementById('gameOverOverlay')?.classList.add('hidden');
    document.getElementById('winScreen')?.classList.add('hidden');
}

function triggerMeteorShower() {
    if (gameState.isGameOver || gameState.score < 10) return;
    AudioEngine.meteorWarning();
    if (typeof meteorText !== 'undefined') {
        meteorText.setVisible(true).setAlpha(1);
        sceneRef.tweens.add({ targets: meteorText, alpha: 0, duration: 200, yoyo: true, repeat: 5, onComplete: () => meteorText.setVisible(false) });
    }
    for (let i = 0; i < 15; i++) sceneRef.time.delayedCall(i * 200 + 1000, spawnMeteor);
}

function spawnMeteor() {
    if (gameState.isGameOver) return;
    const meteor = gameState.flyingObstacles.create(900, Phaser.Math.Between(0, 600), 'asteroid');
    meteor.setScale(0.7).body.allowGravity = false;
    const angle = Phaser.Math.Between(160, 200) * (Math.PI / 180);
    meteor.body.setVelocity(Math.cos(angle) * gameState.obstacleSpeed * 2.5);
    meteor.setDepth(6);
    meteor.scored = false;
}

// ====================================
// HELPERS — float text, shockwave, HUD bars, pause/resume, time scale
// ====================================
function showFloatText(x, y, text, color = '#ffffff', size = 24) {
    if (!sceneRef) return;
    const t = sceneRef.add.text(x, y, text, {
        fontSize: size + 'px',
        fontFamily: 'Impact',
        color: color,
        stroke: '#000',
        strokeThickness: 3
    });
    t.setOrigin(0.5);
    t.setDepth(300);
    sceneRef.tweens.add({
        targets: t,
        y: y - 60,
        alpha: 0,
        scale: 1.2,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => t.destroy()
    });
}

function createShockwave(x, y, colorHex = '#ffffff') {
    if (!sceneRef) return;
    const tint = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const ring = sceneRef.add.circle(x, y, 10, tint, 0);
    ring.setStrokeStyle(3, tint, 1);
    ring.setDepth(280);
    sceneRef.tweens.add({
        targets: ring,
        radius: 120,
        alpha: 0,
        scale: 3,
        duration: 550,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
    });
}

function applyTimeScaleToGroups(ts) {
    const base = gameState.obstacleSpeed;
    gameState.obstacles.getChildren().forEach(o => o.body && o.body.setVelocityX(-base * ts));
    gameState.flyingObstacles.getChildren().forEach(o => {
        if (o.body && o._baseVx === undefined) o._baseVx = o.body.velocity.x;
        if (o.body && o._baseVx) o.body.setVelocityX(o._baseVx * ts);
    });
    gameState.starItems.getChildren().forEach(o => o.body && o.body.setVelocityX(-base * ts));
    if (gameState.coins) gameState.coins.getChildren().forEach(o => o.body && o.body.setVelocityX(-base * ts));
    if (gameState.crystals) gameState.crystals.getChildren().forEach(o => o.body && o.body.setVelocityX(-base * ts));
    if (gameState.magnets) gameState.magnets.getChildren().forEach(o => o.body && o.body.setVelocityX(-base * ts));
}

function updateHUDBars() {
    const now = Date.now();

    // Shield bar
    if (gameState.hasShield) {
        const rem = Math.max(0, gameState.shieldEndTime - now);
        const pct = rem / GAME.SHIELD_DURATION;
        shieldBarBg.setVisible(true);
        shieldBarFill.setVisible(true);
        shieldBarFill.width = 150 * pct;
    } else {
        shieldBarBg.setVisible(false);
        shieldBarFill.setVisible(false);
    }

    // Slow-mo bar
    if (gameState.slowMoActive) {
        const rem = Math.max(0, gameState.slowMoEndTime - now);
        const pct = rem / GAME.SLOWMO_DURATION;
        slowMoBarBg.setVisible(true);
        slowMoBarFill.setVisible(true);
        slowMoBarFill.width = 150 * pct;
    } else {
        slowMoBarBg.setVisible(false);
        slowMoBarFill.setVisible(false);
    }

    // Magnet bar
    if (gameState.magnetActive) {
        const rem = Math.max(0, gameState.magnetEndTime - now);
        const pct = rem / GAME.MAGNET_DURATION;
        magnetBarBg.setVisible(true);
        magnetBarFill.setVisible(true);
        magnetBarFill.width = 150 * pct;
    } else {
        magnetBarBg.setVisible(false);
        magnetBarFill.setVisible(false);
    }

    // Combo bar — time remaining on current combo
    if (gameState.combo >= 3) {
        const rem = Math.max(0, GAME.COMBO_TIMEOUT - (now - gameState.lastScoreTime));
        comboBarFill.width = 180 * (rem / GAME.COMBO_TIMEOUT);
    }

    // Zone progress
    const curZoneIdx = gameState.currentZone;
    const curMin = ZONES[curZoneIdx].minScore;
    const nextMin = ZONES[curZoneIdx + 1]?.minScore ?? curMin + 100;
    const range = Math.max(1, nextMin - curMin);
    const pct = Math.min(1, (gameState.score - curMin) / range);
    const maxW = Math.min(360, sceneRef.scale.width * 0.6);
    zoneProgressFill.width = maxW * pct;
    if (zoneProgressLabel) {
        const next = ZONES[curZoneIdx + 1];
        const cur = ZONES[curZoneIdx];
        zoneProgressLabel.setText(next
            ? `${cur.name}  →  ${next.name}  (${gameState.score}/${nextMin})`
            : `${cur.name}  •  MAX ZONE`);
    }
}

function pauseGame() {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    gameState.isPaused = true;
    sceneRef.physics.pause();
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();
    document.getElementById('pauseOverlay')?.classList.remove('hidden');
}

function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    sceneRef.physics.resume();
    AudioEngine.startAmbient();
    AudioEngine.startEngineHum();
    document.getElementById('pauseOverlay')?.classList.add('hidden');
}

function updateHomeStats() {
    const el = document.getElementById('homeStats');
    if (!el) return;
    const totalMin = Math.floor((gameState.totalTimeMs || 0) / 60000);
    el.innerHTML = `
        <div class="stat-item"><div class="stat-val">${gameState.highScore}</div><div class="stat-lbl">BEST</div></div>
        <div class="stat-item"><div class="stat-val">${gameState.gamesPlayed || 0}</div><div class="stat-lbl">RUNS</div></div>
        <div class="stat-item"><div class="stat-val">${gameState.maxCombo || 0}</div><div class="stat-lbl">MAX COMBO</div></div>
        <div class="stat-item"><div class="stat-val">🪙 ${gameState.totalCoins || 0}</div><div class="stat-lbl">COINS</div></div>
        <div class="stat-item"><div class="stat-val">${totalMin}m</div><div class="stat-lbl">FLIGHT TIME</div></div>
    `;
}

function updateSkinSelector() {
    const el = document.getElementById('skinSelector');
    if (!el) return;
    el.innerHTML = SKINS.map(s => {
        const unlocked = gameState.unlockedSkins.includes(s.id);
        const active = gameState.currentSkin === s.id;
        const locked = !unlocked;
        return `<div class="skin-chip ${active ? 'active' : ''} ${locked ? 'locked' : ''}" data-skin="${s.id}"
            style="--accent: #${s.accent.toString(16).padStart(6, '0')}">
            <div class="skin-swatch"></div>
            <div class="skin-name">${s.name}</div>
            <div class="skin-req">${locked ? `🔒 Score ${s.score}` : (active ? 'EQUIPPED' : 'TAP TO EQUIP')}</div>
        </div>`;
    }).join('');
    el.querySelectorAll('.skin-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.getAttribute('data-skin');
            if (!gameState.unlockedSkins.includes(id)) return;
            gameState.currentSkin = id;
            localStorage.setItem('spaceRocketActiveSkin', id);
            updateSkinSelector();
            // Swap in-scene texture immediately
            if (gameState.rocket && sceneRef) {
                const texKey = id === 'classic' ? 'rocket' : `rocket_${id}`;
                gameState.rocket.setTexture(texKey);
            }
            AudioEngine.uiPing();
        });
    });
}

// Expose to HTML
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.updateHomeStats = updateHomeStats;
window.updateSkinSelector = updateSkinSelector;

const game = new Phaser.Game(config);
