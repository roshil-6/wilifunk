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
    SHIELD_DURATION: 5000 // 5 seconds
};

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
    currentZone: 0
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

// ====================================
// PRELOAD - Create Graphics
// ====================================
function preload() {
    sceneRef = this;

    // Load high score, badges & intensity
    gameState.highScore = parseInt(localStorage.getItem('spaceRocketHighScore') || '0');
    gameState.unlockedBadges = JSON.parse(localStorage.getItem('spaceRocketBadges') || '[]');
    gameState.intensity = parseInt(localStorage.getItem('spaceRocketIntensity') || '25');

    updateHomeBadges();

    // Create rocket sprite
    createRocketTexture(this);

    // Create flame texture
    createFlameTexture(this);

    // Create obstacle textures
    createMountainTexture(this);
    createPlanetTexture(this);
    createAsteroidTexture(this);
    createUFOTexture(this);
    createStarItemTexture(this);
    createBlackHoleTexture(this);
}

function createRocketTexture(scene) {
    const gfx = scene.add.graphics();

    // -- Dimensions: 64x40 --

    // 1. Rear Thrusters (Twin Engine Look)
    gfx.fillStyle(0x2d3436, 1); // Dark Metal
    gfx.fillRoundedRect(0, 10, 15, 10, 2); // Top Engine
    gfx.fillRoundedRect(0, 30, 15, 10, 2); // Bottom Engine

    // Engine Glow Cores
    gfx.fillStyle(0x00d2ff, 0.8); // Cyan Glow
    gfx.fillCircle(2, 15, 3);
    gfx.fillCircle(2, 35, 3);

    // 2. Wings (Swept Back Interceptor)
    gfx.fillStyle(0xa4b0be, 1); // Darker Grey Wing
    gfx.beginPath();
    gfx.moveTo(20, 25); // Mid-body
    gfx.lineTo(5, 5);   // Top Wingtip
    gfx.lineTo(40, 25); // Wing/Body Join front
    gfx.lineTo(5, 45);  // Bottom Wingtip
    gfx.closePath();
    gfx.fillPath();

    // Wing Accents (Gold Trim)
    gfx.lineStyle(2, 0xffa502, 1);
    gfx.beginPath();
    gfx.moveTo(10, 10);
    gfx.lineTo(30, 25);
    gfx.lineTo(10, 40);
    gfx.strokePath();

    // 3. Main Fuselage (Sleek Needle)
    gfx.fillStyle(0xffffff, 1); // Titanium White
    gfx.beginPath();
    gfx.moveTo(10, 20); // Rear Top
    gfx.lineTo(60, 25); // Nose Tip (Needle)
    gfx.lineTo(10, 30); // Rear Bottom
    gfx.lineTo(8, 25);  // Rear Center
    gfx.closePath();
    gfx.fillPath();

    // 4. Cockpit (Bubble Canopy)
    gfx.fillStyle(0x0984e3, 1); // Deep Blue
    gfx.fillEllipse(35, 25, 10, 4);

    // Glint
    gfx.fillStyle(0x74b9ff, 0.9);
    gfx.fillEllipse(36, 24, 4, 1);

    // 5. Vertical Stabilizer (Fin)
    gfx.fillStyle(0x747d8c, 1); // Grey Fin
    gfx.beginPath();
    gfx.moveTo(15, 25);
    gfx.lineTo(5, 15); // Top Fin Tip
    gfx.lineTo(25, 25);
    gfx.closePath();
    gfx.fillPath();

    // Generate Texture
    gfx.generateTexture('rocket', 64, 50);
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

    // Create rocket
    createRocket(this);

    // COLLISION DETECTION
    this.physics.add.overlap(gameState.rocket, gameState.obstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.flyingObstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.ufos, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
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
        // Rocket sprite
        gameState.rocket = scene.physics.add.sprite(150, y, 'rocket');
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
    if (!gameState.isPlaying || gameState.isGameOver) return;

    // Shield Logic
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

    // Rocket Rotation
    const velocityY = gameState.rocket.body.velocity.y;
    gameState.rocket.angle = Phaser.Math.Clamp(velocityY * 0.1, -30, 45);

    // Check boundaries
    if (gameState.isPlaying && !gameState.isGameOver) {
        if (gameState.rocket.y < -40 || gameState.rocket.y >= 760) {
            gameOver();
        }
    }

    // Scroll stars
    gameState.stars.forEach(star => {
        if (star.scrollSpeed) {
            star.x -= gameState.obstacleSpeed * star.scrollSpeed * 0.016;
            if (star.x < -100) {
                star.x = 900;
            }
        }
    });

    gameState.lastSpawnX -= gameState.obstacleSpeed * 0.016;

    // Check obstacle passing
    gameState.obstacles.getChildren().forEach(obstacle => {
        if (!obstacle.scored && obstacle.x < gameState.rocket.x - 30) {
            if (obstacle.isTop) {
                addScore(GAME.POINTS_PER_PASS);
            }
            obstacle.scored = true;
        }
        if (obstacle.x < -100) {
            obstacle.destroy();
        }
    });

    // Update flying asteroids
    gameState.flyingObstacles.getChildren().forEach(asteroid => {
        asteroid.rotation += 0.02;
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
            ufo.x -= gameState.obstacleSpeed * 2.5 * 0.016;
        } else {
            ufo.x -= gameState.obstacleSpeed * 1.2 * 0.016;
            ufo.sineOffset += 0.05;
            ufo.y = ufo.startY + Math.sin(ufo.sineOffset) * 100;
        }
        if (ufo.x < -100) ufo.destroy();
    });

    // Remove stars
    gameState.starItems.getChildren().forEach(star => {
        if (star.x < -100) star.destroy();
    });

    // Update Black Holes
    gameState.blackHoles.getChildren().forEach(hole => {
        hole.x -= gameState.obstacleSpeed * 0.016;
        hole.rotation -= 0.05;

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

        hole.setVelocityX(-gameState.obstacleSpeed * 0.8);

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
    gameState.score = 0;

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
    star.destroy();
    AudioEngine.starCollect();
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
    gameState.score += points;
    updateScoreDisplay();
    checkZone(gameState.score);
    sceneRef.tweens.add({ targets: scoreText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    if (gameState.score > 0 && gameState.score % 5 === 0) increaseDifficulty();
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

    if (gameState.obstacleTimer) gameState.obstacleTimer.remove();
    if (gameState.asteroidTimer) gameState.asteroidTimer.remove();
    if (gameState.starTimer) gameState.starTimer.remove();
    if (gameState.difficultyTimer) gameState.difficultyTimer.remove();

    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.body.allowGravity = false;
    AudioEngine.stopEngineHum();
    AudioEngine.stopAmbient();
    AudioEngine.explosion();
    createExplosion();

    localStorage.setItem('spaceRocketHighScore', gameState.highScore.toString());
    sceneRef.cameras.main.shake(300, 0.02);
    sceneRef.cameras.main.flash(200, 255, 100, 100);

    if (typeof window.showGameOver === 'function') {
        window.showGameOver(gameState.score, gameState.highScore);
    }
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
    gameState.score = 0;
    gameState.obstacleSpeed = GAME.OBSTACLE_SPEED;
    gameState.spawnRate = GAME.OBSTACLE_SPAWN_RATE;
    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;
    gameState.currentZone = 0;

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

    gameState.rocket.setPosition(150, 300).setVelocity(0, 0).setAngle(0).setVisible(true);
    gameState.rocket.body.allowGravity = false;
    if (gameState.exhaust) gameState.exhaust.setVisible(true);

    updateScoreDisplay();
    highScoreText.setColor('#888888');
    starText.setText('STARS: 0/3').setColor('#ffd700');
    badgeText.setAlpha(0);
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

const game = new Phaser.Game(config);
