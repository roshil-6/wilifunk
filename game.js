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
    OBSTACLE_SPEED: 300,        // Medium/Hard start
    OBSTACLE_SPAWN_RATE: 1400,  // Faster spawn
    GAP_SIZE: 150,              // Tighter gaps
    MIN_GAP_Y: 100,
    MAX_GAP_Y: 400,

    // Difficulty
    SPEED_INCREASE: 15,         // Ramps up faster
    SPAWN_DECREASE: 60,
    MIN_SPAWN_RATE: 700,

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
    collectedStars: 0,
    hasShield: false,
    shieldEndTime: 0,
    isInvincible: false,
    // Persistence
    collectedStars: 0,
    hasShield: false,
    shieldEndTime: 0,
    isInvincible: false,
    // Persistence
    unlockedBadges: [],
    blackHoles: null,
    blackHoleTimer: null,
    meteorTimer: null
};

let sceneRef;
let scoreText;
let highScoreText;
let starText;
let badgeText;
let shieldEffect;

// ====================================
// PRELOAD - Create Graphics
// ====================================
function preload() {
    sceneRef = this;

    // Load high score & badges
    gameState.highScore = parseInt(localStorage.getItem('spaceRocketHighScore') || '0');
    gameState.unlockedBadges = JSON.parse(localStorage.getItem('spaceRocketBadges') || '[]');
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
    // Gradient background
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, scene.scale.width, scene.scale.height);
    bg.setScrollFactor(0); // Fix to camera
    bg.setDepth(-100);

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
    const nebula = scene.add.ellipse(600, 300, 300, 200, COLORS.NEBULA, 0.1);
    nebula.setDepth(-80);
    gameState.stars.push({ ...nebula, scrollSpeed: 0.05 });

    // Atmospheric Arc Layer (Bottom Boundary)
    const layer = scene.add.graphics();
    layer.fillStyle(0xaaaaaa, 0.35); // Light grey

    // Arc parameters - curve from bottom-left (0,600) to bottom-right (800,600)
    const centerX = scene.scale.width / 2; // 400
    const centerY = scene.scale.height + 100; // 700 (below screen)
    const radius = Math.sqrt(Math.pow(centerX, 2) + Math.pow(100, 2)); // ~412

    // Calculate angles to touch the bottom corners
    const startAngle = Math.PI - Math.atan2(100, centerX); // ~2.9 rad
    const endAngle = Math.atan2(100, centerX); // ~0.24 rad

    layer.beginPath();
    layer.arc(centerX, centerY, radius, startAngle, endAngle, true);
    layer.lineTo(scene.scale.width, scene.scale.height);
    layer.lineTo(0, scene.scale.height);
    layer.closePath();
    layer.fillPath();
    layer.setDepth(-90);
    layer.setScrollFactor(0);

    // Subtle glow on the arc edge
    layer.lineStyle(2, 0xcccccc, 0.3);
    layer.beginPath();
    layer.arc(centerX, centerY, radius, startAngle, endAngle, true);
    layer.strokePath();

    // Store arc parameters for collision detection
    gameState.arcCenterX = centerX;
    gameState.arcCenterY = centerY;
    gameState.arcRadius = radius;

    // Gentle pulsing
    scene.tweens.add({
        targets: layer,
        alpha: 0.4,
        duration: 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

function create() {
    // Create space background
    createSpaceBackground(this);

    // Create Biome Textures
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

    // RESTORE COLLISION DETECTION
    this.physics.add.overlap(gameState.rocket, gameState.obstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.flyingObstacles, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.ufos, onCollision, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.starItems, collectStar, null, this);
    this.physics.add.overlap(gameState.rocket, gameState.blackHoles, (rocket, hole) => {
        // Instant death on center contact or just heavy pull? 
        // Let's make it instant death if too close
        onCollision(rocket, hole);
    }, null, this);

    // Collision for P2 if Multi
    if (gameState.gameMode === 'MULTI' && gameState.rocket2) {
        this.physics.add.overlap(gameState.rocket2, gameState.obstacles, () => handleMultiCrash('P2'), null, this);
    }

    // Create UI
    createUI(this);

    // Input handling
    this.input.on('pointerdown', thrust);
    this.input.keyboard.on('keydown-SPACE', thrust);
    this.input.keyboard.on('keydown-W', thrust); // P2 Control

    // ...

    function createRocket(scene, y = 300) {
        // Rocket sprite
        gameState.rocket = scene.physics.add.sprite(150, y, 'rocket');
        gameState.rocket.setDepth(10);
        gameState.rocket.body.setSize(35, 30);

        gameState.rocket.body.setOffset(5, 7);
        gameState.rocket.setMaxVelocity(GAME.MAX_VELOCITY, GAME.MAX_VELOCITY);

        // -- REALISTIC ENGINE EXHAUST (Particles) --
        // We create an emitter manager directly
        // Note: In Phaser 3.60, syntax is slightly different but this is standard
        gameState.exhaust = scene.add.particles(0, 0, 'flare', {
            speed: { min: 100, max: 200 },
            angle: { min: 170, max: 190 }, // Shoot backwards
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x00d2ff, 0x0077ff, 0x0000ff], // Cyan -> Blue -> Dark Blue
            lifespan: 300,
            blendMode: 'ADD',
            frequency: 10,
            quantity: 2,
            follow: gameState.rocket,
            followOffset: { x: -25, y: 7 } // Position at rear of rocket
        });

        // Twin engine offset (Second Emitter if desired, or just wider spread)
        // We'll stick to one robust emitter for performance/clarity, centered between the twin engines.

        gameState.exhaust.setDepth(9);

        // Shield Effect (Hidden by default)
        shieldEffect = scene.add.ellipse(0, 0, 60, 60, 0x00ffff, 0.3);
        shieldEffect.setStrokeStyle(2, 0x00ffff, 0.8);
        shieldEffect.setVisible(false);
        shieldEffect.setDepth(11);
    }

    function createUI(scene) {
        // Score
        scoreText = scene.add.text(20, 20, 'SCORE: 0', {
            fontSize: '28px',
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
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#888888'
        });
        highScoreText.setDepth(100);
        highScoreText.setScrollFactor(0);

        // Star Count
        starText = scene.add.text(20, 80, 'STARS: 0/3', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#ffd700',
            fontWeight: 'bold'
        });
        starText.setDepth(100);

        // Badge Notification (Centered, hidden)
        badgeText = scene.add.text(400, 150, '', {
            fontSize: '32px',
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
        meteorText = scene.add.text(400, 300, 'METEOR SHOWER DETECTED!', {
            fontSize: '40px',
            fontFamily: 'Impact',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 5,
            align: 'center'
        });
        meteorText.setOrigin(0.5);
        meteorText.setDepth(200);
        meteorText.setVisible(false);
    }
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
            // Flicker near end
            shieldEffect.setVisible(Math.floor(Date.now() / 100) % 2 === 0);
        }
    } else {
        shieldEffect.setVisible(false);
    }

    // Rocket Rotation
    const velocityY = gameState.rocket.body.velocity.y;
    gameState.rocket.angle = Phaser.Math.Clamp(velocityY * 0.1, -30, 45);

    // Update Emitter Angle to match Rocket
    // Particles follow automatically, but we might want to rotate the emission angle
    if (gameState.exhaust) {
        // Emitter follows rocket, but we want particles to shoot opposite to flight
        // Since rocket rotates, we might keep it simple or adjust slightly.
        // For now, standard follow is good enough for a side-scroller.
    }

    // Check boundaries
    // Top: crash if fully off screen
    if (gameState.rocket.y < -40) {
        gameOver();
    }

    // Bottom: crash if rocket goes below the atmospheric arc
    // Calculate the arc's Y position at the rocket's X coordinate
    const dx = gameState.rocket.x - gameState.arcCenterX;
    const dy = Math.sqrt(gameState.arcRadius * gameState.arcRadius - dx * dx);
    const arcY = gameState.arcCenterY - dy;

    // Crash if rocket center is below the arc
    if (gameState.rocket.y > arcY) {
        gameOver();
    }

    // Scroll stars (parallax)
    gameState.stars.forEach(star => {
        if (star.scrollSpeed) {
            star.x -= gameState.obstacleSpeed * star.scrollSpeed * 0.016;
            if (star.x < -50) {
                star.x = 850;
            }
        }
    });

    // Check obstacle passing (scoring)
    gameState.obstacles.getChildren().forEach(obstacle => {
        if (!obstacle.scored && obstacle.x < gameState.rocket.x - 30) {
            if (obstacle.isTop) { // Only score once per pair
                addScore(GAME.POINTS_PER_PASS);
            }
            obstacle.scored = true;
        }

        // Remove off-screen obstacles
        if (obstacle.x < -100) {
            obstacle.destroy();
        }
    });

    // Update flying asteroids
    gameState.flyingObstacles.getChildren().forEach(asteroid => {
        asteroid.rotation += 0.02;
        if (asteroid.x < -100) {
            asteroid.destroy();
        }
    });

    // Update UFOs
    gameState.ufos.getChildren().forEach(ufo => {
        if (ufo.isDummy) {
            // Dummy: Fast Linear Movement
            ufo.x -= gameState.obstacleSpeed * 2.5 * 0.016;
        } else {
            // Real: Sine Wave
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

    // Update Black Holes (Gravity Well)
    gameState.blackHoles.getChildren().forEach(hole => {
        hole.x -= gameState.obstacleSpeed * 0.016;
        hole.rotation -= 0.05; // Spin

        // Visual Vortex Particles
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

        // Initial push
        hole.setVelocityX(-gameState.obstacleSpeed * 0.8); // Slower than obstacles

        // Distance check for gravity
        const dx = hole.x - gameState.rocket.x;
        const dy = hole.y - gameState.rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 350) { // Reduced range
            const force = (350 - dist) * 0.08; // Weak pull
            const angle = Math.atan2(dy, dx);
            // ONLY PULL Y-AXIS to keep camera stable
            // gameState.rocket.body.velocity.x += Math.cos(angle) * force; 
            gameState.rocket.body.velocity.y += Math.sin(angle) * force;
        }

        // Event Horizon (Instant Kill)
        if (dist < 25) {
            gameOver();
        }

        // Cleanup and Schedule Next
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

    // Apply upward thrust
    gameState.rocket.setVelocityY(GAME.THRUST_POWER);

    // Thrust visual effect
    // Thrust visual effect (Particle Boost)
    // Thrust visual effect (Particle Boost)
    if (gameState.exhaust) {
        // Safe boost for Phaser 3.60
        // We can emit a few extra particles
        gameState.exhaust.emitParticle(5);
    }

    // Small particle burst
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
    gameState.obstacleSpeed = GAME.OBSTACLE_SPEED;
    gameState.spawnRate = GAME.OBSTACLE_SPAWN_RATE;
    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;
    starText.setText('STARS: 0/' + GAME.STARS_FOR_SHIELD);
    starText.setColor('#ffd700');

    // Enable gravity
    gameState.rocket.body.allowGravity = true;
    gameState.rocket.setVelocity(0, 0);

    // Start obstacle spawning
    gameState.obstacleTimer = sceneRef.time.addEvent({
        delay: gameState.spawnRate,
        callback: spawnObstacle,
        loop: true
    });

    // Start asteroid spawning (Frequent)
    gameState.asteroidTimer = sceneRef.time.addEvent({
        delay: 800,
        callback: spawnFlyingAsteroid,
        loop: true
    });

    // Start UFO spawning (Rare)
    // Start UFO spawning (Aggressive)
    gameState.ufoTimer = sceneRef.time.addEvent({
        delay: 3000, // Frequent
        callback: spawnUFO,
        loop: true
    });

    // Start Black Hole spawning (Frequent Traps with Breaks)
    scheduleNextBlackHole();

    // Start Meteor Showers
    gameState.meteorTimer = sceneRef.time.addEvent({
        delay: 20000, // Every 20s
        callback: triggerMeteorShower,
        loop: true
    });

    // Start star spawning
    gameState.starTimer = sceneRef.time.addEvent({
        delay: 2000,
        callback: spawnStar,
        loop: true
    });

    // Increase difficulty over time
    gameState.difficultyTimer = sceneRef.time.addEvent({
        delay: 5000,
        callback: increaseDifficulty,
        loop: true
    });

    // Update UI
    updateScore();

    // Hide home menu
    document.getElementById('homeMenu')?.classList.add('hidden');
    document.getElementById('gameUI')?.classList.remove('hidden');
}



function spawnObstacle() {
    if (gameState.isGameOver) return;

    // 50/50 Chance between Classic Planets and Giant Canyon
    if (Phaser.Math.Between(0, 100) > 50) {
        spawnGiantCanyon();
    } else {
        spawnClassicPlanets();
    }
}

function spawnClassicPlanets() {
    const gapY = Phaser.Math.Between(GAME.MIN_GAP_Y, GAME.MAX_GAP_Y);
    const gapHeight = GAME.GAP_SIZE + Phaser.Math.Between(0, 50); // Varied gap
    const spawnX = sceneRef.scale.width + 100;

    // Floating Planets (Classic) - Irregular Placement
    // Top Planet
    const topScale = Phaser.Math.FloatBetween(0.6, 1.0);
    const topOffset = Phaser.Math.Between(-50, 50); // Stagger X
    const topPlanet = gameState.obstacles.create(spawnX + topOffset, gapY - 100, 'planet');
    topPlanet.setOrigin(0.5, 0.5);
    topPlanet.setScale(topScale);
    topPlanet.body.setCircle(95); // Adjust for scale? Phaser arcade physics body doesn't auto-scale radius perfectly with setScale unless updated.
    // Better to use setCircle with scale calculation or just let it be close enough. 
    // Actually, setCircle radius is unscaled. We should ideally scale it.
    topPlanet.body.setCircle(95 * topScale);
    topPlanet.body.allowGravity = false;
    topPlanet.body.setVelocityX(-gameState.obstacleSpeed);
    topPlanet.body.setImmovable(true);
    topPlanet.isTop = true;
    topPlanet.scored = false;

    // Bottom Planet
    const botScale = Phaser.Math.FloatBetween(0.6, 1.0);
    const botOffset = Phaser.Math.Between(-50, 50); // Stagger X
    const bottomPlanet = gameState.obstacles.create(spawnX + botOffset, gapY + gapHeight + 100, 'planet');
    bottomPlanet.setOrigin(0.5, 0.5);
    bottomPlanet.setScale(botScale);
    bottomPlanet.body.setCircle(95 * botScale);
    bottomPlanet.body.allowGravity = false;
    bottomPlanet.body.setVelocityX(-gameState.obstacleSpeed);
    bottomPlanet.body.setImmovable(true);
    bottomPlanet.scored = false;
}

function spawnGiantCanyon() {
    const gapY = Phaser.Math.Between(GAME.MIN_GAP_Y, GAME.MAX_GAP_Y);
    const gapHeight = GAME.GAP_SIZE + 100; // Even wider base gap
    const spawnX = sceneRef.scale.width + 300;

    const texture = Phaser.Math.RND.pick(['giant_mars', 'giant_moon']);

    // Massive Bodies - Broken Alignment
    // Top Body
    const topScale = Phaser.Math.FloatBetween(0.9, 1.2);
    const topX = spawnX + Phaser.Math.Between(-100, 100); // Significant staggered X
    const topBody = gameState.obstacles.create(topX, gapY - 350, texture);
    topBody.setOrigin(0.5, 0.5);
    topBody.setScale(topScale);
    topBody.body.setCircle(280 * topScale);
    topBody.body.allowGravity = false;
    topBody.body.setVelocityX(-gameState.obstacleSpeed);
    topBody.body.setImmovable(true);
    topBody.isTop = true;
    topBody.scored = false;

    // Bottom Body
    const botScale = Phaser.Math.FloatBetween(0.9, 1.2);
    const botX = spawnX + Phaser.Math.Between(-100, 100); // Independent staggered X
    const bottomBody = gameState.obstacles.create(botX, gapY + gapHeight + 350, texture);
    bottomBody.setOrigin(0.5, 0.5);
    bottomBody.setScale(botScale);
    bottomBody.body.setCircle(280 * botScale);
    bottomBody.body.allowGravity = false;
    bottomBody.body.setVelocityX(-gameState.obstacleSpeed);
    bottomBody.body.setImmovable(true);
    bottomBody.scored = false;
}

function spawnFlyingAsteroid() {
    if (gameState.isGameOver) return;

    const y = Phaser.Math.Between(50, sceneRef.scale.height - 50);
    const asteroid = gameState.flyingObstacles.create(sceneRef.scale.width + 100, y, 'asteroid');

    asteroid.setOrigin(0.5, 0.5);
    asteroid.body.allowGravity = false;
    // Faster than normal obstacles
    asteroid.body.setVelocityX(-(gameState.obstacleSpeed * 1.5));
    asteroid.setDepth(6);
}

function spawnUFO() {
    if (gameState.isGameOver) return;

    // Only spawn if score > 2 (Early game)
    if (gameState.score < 2) return;

    const y = Phaser.Math.Between(150, sceneRef.scale.height - 150);
    const ufo = gameState.ufos.create(sceneRef.scale.width + 100, y, 'ufo');

    // 30% Chance of Dummy
    const isDummy = Math.random() < 0.3;

    ufo.setOrigin(0.5, 0.5);
    ufo.body.allowGravity = false;
    ufo.startY = y;
    ufo.sineOffset = 0;
    ufo.setDepth(7);
    ufo.isDummy = isDummy;

    if (isDummy) {
        ufo.setTint(0x00ff00); // Green
    }
}

function createBlackHoleTexture(scene) {
    const gfx = scene.add.graphics();

    // Event Horizon
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(40, 40, 30);

    // Accretion Disk (Swirl)
    gfx.lineStyle(4, 0x8b5cf6, 0.8); // Purple
    gfx.strokeCircle(40, 40, 35);
    gfx.lineStyle(2, 0xec4899, 0.6); // Pink
    gfx.strokeCircle(40, 40, 38);

    gfx.generateTexture('blackhole', 80, 80);
    gfx.destroy();
}

function scheduleNextBlackHole() {
    if (gameState.isGameOver) return;

    // Spawn after a break (e.g., 3-5 seconds)
    sceneRef.time.delayedCall(Phaser.Math.Between(3000, 5000), spawnBlackHole);
}

function spawnBlackHole() {
    if (gameState.isGameOver) return;
    if (gameState.score < 5) {
        scheduleNextBlackHole(); // Try again later
        return;
    }

    // One by One rule (Should be redundant with scheduling, but safe to keep)
    if (gameState.blackHoles.getLength() > 0) return;

    const y = Phaser.Math.Between(100, sceneRef.scale.height - 100);
    const hole = gameState.blackHoles.create(sceneRef.scale.width + 100, y, 'blackhole');

    hole.setCircle(30, 10, 10);
    hole.setOrigin(0.5, 0.5);
    hole.body.allowGravity = false;
    hole.setDepth(5);
}



function spawnStar() {
    if (gameState.isGameOver) return;
    // 30% chance to spawn a star each cycle
    if (Phaser.Math.Between(0, 100) > 30) return;

    const y = Phaser.Math.Between(100, sceneRef.scale.height - 100);
    const star = gameState.starItems.create(sceneRef.scale.width + 100, y, 'starItem');
    star.body.allowGravity = false;
    star.body.setVelocityX(-gameState.obstacleSpeed);
    star.setDepth(7);

    // Spin animation
    sceneRef.tweens.add({
        targets: star,
        angle: 360,
        duration: 2000,
        repeat: -1
    });
}

function collectStar(rocket, star) {
    star.destroy();

    if (gameState.hasShield) return; // Already shielded

    gameState.collectedStars++;
    starText.setText(`STARS: ${gameState.collectedStars}/${GAME.STARS_FOR_SHIELD}`);

    // Visual pop
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

    // Sound effect substitute (visual flash)
    sceneRef.cameras.main.flash(200, 0, 255, 255);
}

function deactivateShield() {
    gameState.hasShield = false;
    starText.setText('STARS: 0/' + GAME.STARS_FOR_SHIELD);
    starText.setColor('#ffd700');
}

function increaseDifficulty() {
    if (gameState.isGameOver) return;

    // Increase speed
    gameState.obstacleSpeed += GAME.SPEED_INCREASE;

    // Update existing obstacles
    gameState.obstacles.getChildren().forEach(obstacle => {
        obstacle.body.setVelocityX(-gameState.obstacleSpeed);
    });

    // Decrease spawn rate (more obstacles)
    if (gameState.spawnRate > GAME.MIN_SPAWN_RATE) {
        gameState.spawnRate -= GAME.SPAWN_DECREASE;

        // Restart timer with new rate
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
    updateScore();

    // Pulse effect
    sceneRef.tweens.add({
        targets: scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true
    });
}

function updateScore() {
    scoreText.setText('SCORE: ' + gameState.score);

    // Update high score if beaten
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreText.setText('BEST: ' + gameState.highScore);
        highScoreText.setColor('#00ff88');
    }

    // Check Badges
    const badge = BADGES.find(b => b.score === gameState.score);
    if (badge) {
        // Check if already unlocked
        const alreadyHas = gameState.unlockedBadges.find(b => b.name === badge.name);
        if (!alreadyHas) {
            gameState.unlockedBadges.push(badge);
            localStorage.setItem('spaceRocketBadges', JSON.stringify(gameState.unlockedBadges));
            showBadge(badge);
            updateHomeBadges();
        }
    }
}

function updateHomeBadges() {
    const container = document.getElementById('badgeContainer');
    if (!container) return;

    container.innerHTML = BADGES.map(b => {
        const isUnlocked = gameState.unlockedBadges.find(ub => ub.name === b.name);
        if (isUnlocked) {
            return `
            <div class="badge-item">
                <span class="badge-icon">${b.icon}</span>
                <div>${b.name}</div>
            </div>`;
        } else {
            return `
            <div class="badge-item locked" style="opacity: 0.5; filter: grayscale(1);">
                <span class="badge-icon">🔒</span>
                <div>${b.name}</div>
                <div style="font-size: 10px; color: #888;">Score: ${b.score}</div>
            </div>`;
        }
    }).join('');
}

function showBadge(badge) {
    badgeText.setText(`${badge.icon}\n${badge.name}\nUNLOCKED!`);
    badgeText.setAlpha(1);
    badgeText.y = 150;

    sceneRef.tweens.add({
        targets: badgeText,
        y: 100,
        alpha: 0,
        duration: 3000,
        ease: 'Power2'
    });
}

// ====================================
// COLLISION & GAME OVER
// ====================================
function onCollision(rocket, obstacle) {
    if (gameState.isGameOver) return;
    if (gameState.isInvincible) return; // Ignore collisions during i-frames

    // Check for Dummy UFO
    if (obstacle.isDummy) {
        return; // Pass through harmlessly
    }

    if (gameState.hasShield) {
        // Shield saves the player
        gameState.hasShield = false;
        gameState.shieldEndTime = 0; // Force end
        deactivateShield();

        // Trigger post-hit invincibility
        gameState.isInvincible = true;
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

        // Push rocket back slightly
        gameState.rocket.setVelocityX(-200);
        sceneRef.time.delayedCall(200, () => {
            if (!gameState.isGameOver) gameState.rocket.setVelocityX(0);
        });

        // Screen shake
        sceneRef.cameras.main.shake(200, 0.01);
        return;
    }

    gameOver();
}

function gameOver() {
    gameState.isGameOver = true;
    gameState.isPlaying = false;

    // Stop timers
    if (gameState.obstacleTimer) gameState.obstacleTimer.remove();
    if (gameState.asteroidTimer) gameState.asteroidTimer.remove();
    if (gameState.starTimer) gameState.starTimer.remove();
    if (gameState.difficultyTimer) gameState.difficultyTimer.remove();

    // Stop rocket
    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.body.allowGravity = false;

    // Explosion effect
    createExplosion();

    // Save high score
    localStorage.setItem('spaceRocketHighScore', gameState.highScore.toString());

    // Camera shake
    sceneRef.cameras.main.shake(300, 0.02);

    // Flash
    sceneRef.cameras.main.flash(200, 255, 100, 100);

    // Show game over UI
    if (typeof window.showGameOver === 'function') {
        window.showGameOver(gameState.score, gameState.highScore);
    }
}

function createExplosion() {
    const x = gameState.rocket.x;
    const y = gameState.rocket.y;

    // Hide rocket
    gameState.rocket.setVisible(false);
    if (gameState.exhaust) gameState.exhaust.setVisible(false);

    // Explosion particles
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = Phaser.Math.Between(50, 150);
        const size = Phaser.Math.Between(3, 8);
        const color = Phaser.Math.RND.pick([0xff6600, 0xffff00, 0xff3366, 0xffffff]);

        const particle = sceneRef.add.circle(x, y, size, color, 1);
        particle.setDepth(50);

        sceneRef.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0.2,
            duration: 500,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }
}

function restartGame(scene) {
    // Reset state
    gameState.isGameOver = false;
    gameState.isPlaying = false;
    gameState.score = 0;
    gameState.obstacleSpeed = GAME.OBSTACLE_SPEED;
    gameState.spawnRate = GAME.OBSTACLE_SPAWN_RATE;
    gameState.collectedStars = 0;
    gameState.hasShield = false;
    gameState.isInvincible = false;

    // Clear obstacles
    gameState.obstacles.clear(true, true);
    gameState.flyingObstacles.clear(true, true);
    gameState.ufos.clear(true, true);
    gameState.starItems.clear(true, true);
    gameState.blackHoles.clear(true, true);

    // Reset rocket
    gameState.rocket.setPosition(150, 300);
    gameState.rocket.setVelocity(0, 0);
    gameState.rocket.setAngle(0);
    gameState.rocket.setVisible(true);
    gameState.rocket.body.allowGravity = false;

    // Reset flame
    // Reset flame
    if (gameState.exhaust) gameState.exhaust.setVisible(true);

    // Reset UI
    updateScore();
    highScoreText.setColor('#888888');
    starText.setText('STARS: 0/3');
    starText.setColor('#ffd700');
    badgeText.setAlpha(0);
    if (typeof meteorText !== 'undefined') meteorText.setVisible(false);

    // Hide overlays
    document.getElementById('gameOverOverlay')?.classList.add('hidden');
    document.getElementById('winScreen')?.classList.add('hidden');
}


function triggerMeteorShower() {
    if (gameState.isGameOver) return;
    if (gameState.score < 10) return;

    // Warning
    if (typeof meteorText !== 'undefined') {
        meteorText.setVisible(true);
        meteorText.setAlpha(1);

        // Flash text
        sceneRef.tweens.add({
            targets: meteorText,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 5,
            onComplete: () => meteorText.setVisible(false)
        });
    }

    // Spawn Barrage
    for (let i = 0; i < 15; i++) {
        sceneRef.time.delayedCall(i * 200 + 1000, spawnMeteor);
    }
}

function spawnMeteor() {
    if (gameState.isGameOver) return;

    const y = Phaser.Math.Between(0, 600);
    const meteor = gameState.flyingObstacles.create(900, y, 'asteroid');

    meteor.setScale(0.7); // Smaller
    meteor.body.allowGravity = false;

    // Angle trajectory slightly
    const angle = Phaser.Math.Between(160, 200) * (Math.PI / 180);
    const speed = gameState.obstacleSpeed * 2.5; // Very fast

    meteor.body.setVelocity(
        Math.cos(angle) * speed,
    );
    meteor.setDepth(6);
}


// ====================================
// INITIALIZE GAME
// ====================================
const game = new Phaser.Game(config);
