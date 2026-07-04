const BIOME_ENGINE = {
    0: {
        id: "SPACE", label: "COSMIC NEBULA", level: 1,
        bg: "space_bg", road: "asteroid_belt",
        obstacle: "space_junk", hazard: "comet", reward: "space_crystal",
        rewardValue: 5, climateEffect: "stardust",
        speedMin: 100, speedMax: 180,
        spawnDelay: { min: 1800, max: 3000 },
        hazardCount: 1,
        bgColor: 0x0a0016
    },
    30: {
        id: "SNOW", label: "GLACIAL TUNDRA", level: 2,
        bg: "snow_bg", road: "ice_floe",
        obstacle: "glacier_rock", hazard: "snowmobile", reward: "frozen_rune",
        rewardValue: 10, climateEffect: "blizzard",
        speedMin: 160, speedMax: 280,
        spawnDelay: { min: 1400, max: 2200 },
        hazardCount: 1,
        bgColor: 0xd6eaf8
    },
    60: {
        id: "CYBERPUNK", label: "NEON GRID", level: 3,
        bg: "neon_bg", road: "laser_highway",
        obstacle: "holo_barrier", hazard: "hover_bike", reward: "data_chip",
        rewardValue: 20, climateEffect: "digital_rain",
        speedMin: 250, speedMax: 400,
        spawnDelay: { min: 1000, max: 1800 },
        hazardCount: 2,
        bgColor: 0x020208
    }
};

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.saveData = this.registry.get('saveData');
        this.score = 0;
        this.GRID = 64;
        this.isMoving = false;
        this.isDead = false;
        this.highestRow = 0;
        this.laneData = {};           // tracks lane metadata keyed by rowIndex
        this.laneTimers = [];         // all active spawner timers

        this.currentBiome = BIOME_ENGINE[0];

        // World camera - follows player vertically
        this.cameras.main.setBackgroundColor(this.currentBiome.bgColor);

        // Scrolling background
        this.bg = this.add.tileSprite(400, 300, 800, 600, this.currentBiome.bg).setScrollFactor(0).setDepth(-2);

        // Physics groups
        this.hazardsGroup = this.physics.add.group();
        this.rewardsGroup = this.physics.add.group();
        this.obstaclesGroup = this.physics.add.staticGroup();

        // Generate initial 20 rows
        for (let row = 0; row <= 20; row++) {
            this.buildRow(row);
        }

        // Player — use an Image rendered into a fixed 56x56 Physics Image
        // so ANY source image size is correctly clipped and centred
        const equipped = this.saveData.equipped_character || 'space_explorer';
        const CHAR_SIZE = 56;
        const charRT = this.add.renderTexture(0, 0, CHAR_SIZE, CHAR_SIZE);
        const tex  = this.textures.get(equipped).get();
        const sc   = Math.min(CHAR_SIZE / tex.realWidth, CHAR_SIZE / tex.realHeight);
        const cw   = tex.realWidth * sc;
        const ch   = tex.realHeight * sc;
        charRT.draw(equipped, (CHAR_SIZE - cw) / 2, (CHAR_SIZE - ch) / 2, 1, 0xffffff);
        charRT.saveTexture('player_tex');
        charRT.destroy();

        this.player = this.physics.add.sprite(400, this.rowToY(0), 'player_tex');
        this.player.setDepth(20);
        this.player.setOrigin(0.5, 0.5);
        this.player.body.setSize(40, 40);
        this.player.setCollideWorldBounds(false);

        // Camera follows player vertically only
        this.cameras.main.startFollow(this.player, false, 0, 0.08, 0, 150);

        // Simple AudioContext SoundManager for retro beeps
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
        this.playSound = (type) => {
            if (this.audio.state === 'suspended') this.audio.resume();
            const osc = this.audio.createOscillator();
            const gain = this.audio.createGain();
            osc.connect(gain);
            gain.connect(this.audio.destination);
            
            const now = this.audio.currentTime;
            if (type === 'jump') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'coin') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1200, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'crash') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'win') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(600, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            }
        };

        // Colliders
        this.physics.add.overlap(this.player, this.rewardsGroup, this.collectReward, null, this);
        this.physics.add.overlap(this.player, this.hazardsGroup, this.playerHit, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Launch UI overlay
        this.scene.launch('UIScene');

        // Climate particles
        this.setupParticles(this.currentBiome);

        // World bounds (very wide so player can move freely)
        this.physics.world.setBounds(32, -100000, 736, 200000);
    }

    rowToY(row) {
        return 500 - (row * this.GRID);
    }

    buildRow(row) {
        if (this.laneData[row]) return; // already built
        if (this.consecHazards === undefined) this.consecHazards = 0;

        const y = this.rowToY(row);
        let type;

        if (row <= 2) {
            type = 'safe';
            this.consecHazards = 0;
        } else if (this.consecHazards >= 2) {
            // Force a safe median every 2 road lanes max
            type = 'safe';
            this.consecHazards = 0;
        } else {
            // 50/50 chance for road or safe
            type = Phaser.Math.Between(0, 1) === 0 ? 'safe' : 'hazard';
            if (type === 'hazard') this.consecHazards++;
            else this.consecHazards = 0;
        }

        this.laneData[row] = { type, y, spawnerTimer: null };

        if (type === 'hazard') {
            this.buildHazardLane(row, y);
        } else {
            this.buildSafeLane(row, y);
        }
    }

    buildSafeLane(row, y) {
        // Ground tile
        const tile = this.add.tileSprite(400, y, 800, this.GRID, 'safe_ground_texture').setDepth(0);

        // Random static obstacles (avoid center x=400)
        if (row > 2 && Phaser.Math.Between(0, 9) < 4) {
            const numObs = Phaser.Math.Between(1, 2);
            const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            Phaser.Utils.Array.Shuffle(slots);
            for (let i = 0; i < numObs; i++) {
                const obsX = slots[i] * this.GRID + 32;
                const obs = this.obstaclesGroup.create(obsX, y, this.currentBiome.obstacle);
                obs.setDisplaySize(44, 44).setDepth(5).refreshBody();
            }
        }

        // Coin line (3-4 coins in a row) — 50% chance
        if (row > 2 && Phaser.Math.Between(0, 9) < 5) {
            const lineLen = Phaser.Math.Between(3, 5);
            const startX = Phaser.Math.Between(1, 8) * this.GRID + 32;
            for (let c = 0; c < lineLen; c++) {
                const cx = startX + c * (this.GRID * 0.5);
                if (cx > 60 && cx < 740) {
                    const coin = this.rewardsGroup.create(cx, y, this.currentBiome.reward);
                    coin.setDisplaySize(28, 28).setDepth(6);
                    this.tweens.add({
                        targets: coin,
                        y: y - 10,
                        yoyo: true, repeat: -1,
                        duration: 500 + Math.random() * 300,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        }
    }

    buildHazardLane(row, y) {
        // Road tile
        this.add.tileSprite(400, y, 800, this.GRID, this.currentBiome.road).setDepth(0);

        // Continuous hazard spawner for this lane
        const direction = Phaser.Math.RND.sign();
        const spawnHazard = () => {
            if (this.isDead) return;
            const spx = direction === 1 ? -80 : 880;
            const haz = this.hazardsGroup.create(spx, y, this.currentBiome.hazard);
            const speed = Phaser.Math.Between(this.currentBiome.speedMin, this.currentBiome.speedMax);
            haz.setVelocityX(speed * direction);
            haz.setFlipX(direction === -1);
            haz.setDisplaySize(88, 44).setDepth(8);
            haz.body.setAllowGravity(false);
        };

        // Fire immediately then on interval
        spawnHazard();

        const delay = Phaser.Math.Between(this.currentBiome.spawnDelay.min, this.currentBiome.spawnDelay.max);
        const timer = this.time.addEvent({
            delay,
            callback: spawnHazard,
            loop: true
        });

        this.laneData[row].spawnerTimer = timer;
        this.laneTimers.push(timer);

        // Second lane in same direction (higher biomes get more traffic)
        if (this.currentBiome.hazardCount >= 2) {
            const delay2 = delay * 0.5;
            const dir2 = Phaser.Math.RND.sign();
            const spawnHazard2 = () => {
                if (this.isDead) return;
                const spx2 = dir2 === 1 ? -80 : 880;
                const haz2 = this.hazardsGroup.create(spx2, y, this.currentBiome.hazard);
                const speed2 = Phaser.Math.Between(this.currentBiome.speedMin, this.currentBiome.speedMax);
                haz2.setVelocityX(speed2 * dir2);
                haz2.setFlipX(dir2 === -1);
                haz2.setDisplaySize(88, 44).setDepth(8);
                haz2.body.setAllowGravity(false);
            };

            this.time.delayedCall(delay * 0.6, spawnHazard2);
            const t2 = this.time.addEvent({ delay: delay2, callback: spawnHazard2, loop: true });
            this.laneTimers.push(t2);
        }
    }

    update() {
        if (this.isDead) return;

        // Force camera to never move horizontally to prevent road edge bugs
        this.cameras.main.scrollX = 0;

        // Garbage collect hazards that left the screen
        this.hazardsGroup.getChildren().forEach(h => {
            if (h.x < -200 || h.x > 1000) h.destroy();
        });

        // Scroll background slowly
        this.bg.tilePositionY -= 0.3;

        this.handleMovement();

        // Generate more rows as player advances
        const playerRow = Math.floor((500 - this.player.y) / this.GRID);
        for (let r = playerRow - 2; r <= playerRow + 20; r++) {
            if (r >= 0 && !this.laneData[r]) this.buildRow(r);
        }
    }

    handleMovement() {
        if (this.isMoving) return;

        let dx = 0, dy = 0;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up))    dy = -this.GRID;
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) dy = this.GRID;
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) dx = -this.GRID;
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) dx = this.GRID;

        if ((dx === 0 && dy === 0)) return;

        // Clamp to world bounds
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (nx < 48 || nx > 752) return;

        // Check static obstacle collision
        let blocked = false;
        this.obstaclesGroup.getChildren().forEach(obs => {
            if (Math.abs(obs.x - nx) < 30 && Math.abs(obs.y - ny) < 30) blocked = true;
        });
        if (blocked) return;

        this.isMoving = true;
        this.playSound('jump');
        
        let jumpDuration = 120;
        if (this.saveData.equipped_character === 'cyber_ninja') jumpDuration = 60; // Ninja is 2x fast
        else if (this.saveData.equipped_character === 'space_chicken') jumpDuration = 90; // Chicken is quick

        // Movement tween
        this.tweens.add({
            targets: this.player,
            x: nx, y: ny,
            duration: jumpDuration,
            ease: 'Quad.easeOut',
            onComplete: () => { this.isMoving = false; }
        });

        // Squash & stretch juice
        this.tweens.add({
            targets: this.player,
            scaleX: 0.75, scaleY: 1.25,
            duration: 60, yoyo: true
        });

        // Score: only moving up counts
        if (dy < 0) {
            const newRow = Math.floor((500 - ny) / this.GRID);
            if (newRow > this.highestRow) {
                this.highestRow = newRow;
                this.updateScore(1);
                
                // Win Condition!
                if (this.score === 100) {
                    this.triggerWin();
                } else {
                    this.checkBiomeTransition();
                }
            }
        }
    }

    triggerWin() {
        if (this.isDead) return;
        this.isDead = true;
        this.physics.pause();
        this.playSound('win');
        
        // Massive coin bonus
        this.saveData.coins += 500;
        this.registry.set('saveData', this.saveData);
        localStorage.setItem('infiniteCrosserSave', JSON.stringify(this.saveData));
        this.events.emit('rewardCollected', this.saveData.coins, 500);

        const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff, 1).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: flash, alpha: 0, duration: 800 });

        const winText = this.add.text(400, 250, 'YOU SURVIVED\nTHE NEON GRID!', {
            font: 'bold 40px Courier', fill: '#00ffff', align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        
        const bonusText = this.add.text(400, 330, '+500 COIN BONUS', {
            font: 'bold 24px Courier', fill: '#ffeb3b'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        const restartText = this.add.text(400, 400, 'Tap to return...', {
            font: '20px Courier', fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.time.delayedCall(2000, () => {
            this.input.on('pointerdown', () => {
                this.laneTimers.forEach(t => { if (t) t.remove(); });
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
        });
    }

    updateScore(amount) {
        this.score += amount;
        this.events.emit('scoreChanged', this.score);

        if (this.score > this.saveData.highScore) {
            this.saveData.highScore = this.score;
            this.registry.set('saveData', this.saveData);
            localStorage.setItem('infiniteCrosserSave', JSON.stringify(this.saveData));
        }
    }

    checkBiomeTransition() {
        let nextBiome = BIOME_ENGINE[0];
        if (this.score >= 60) nextBiome = BIOME_ENGINE[60];
        else if (this.score >= 30) nextBiome = BIOME_ENGINE[30];

        if (nextBiome !== this.currentBiome) {
            this.currentBiome = nextBiome;
            this.bg.setTexture(this.currentBiome.bg);
            this.cameras.main.setBackgroundColor(this.currentBiome.bgColor);

            // Rebuild particles
            if (this.climateEmitter) this.climateEmitter.destroy();
            this.setupParticles(this.currentBiome);

            // Level banner
            this.showLevelBanner(this.currentBiome);

            // Rebuild future rows with new biome textures
            this.events.emit('biomeChanged', this.currentBiome.id);
        }
    }

    setupParticles(biome) {
        let cfg = { x: { min: 0, max: 800 }, y: 0, lifespan: 2500, quantity: 1 };

        if (biome.id === 'SPACE') {
            cfg = { ...cfg, speedY: { min: 20, max: 80 }, alpha: { start: 0.9, end: 0 }, scale: { start: 0.6, end: 0.1 }, quantity: 2 };
        } else if (biome.id === 'SNOW') {
            cfg = { x: { min: -50, max: 900 }, y: 0, lifespan: 3000,
                    speedX: { min: -80, max: -140 }, speedY: { min: 100, max: 220 },
                    scale: { start: 0.4, end: 0.1 }, alpha: { start: 0.8, end: 0 }, quantity: 3 };
        } else if (biome.id === 'CYBERPUNK') {
            cfg = { x: { min: 0, max: 800 }, y: { min: -20, max: 0 }, lifespan: 1200,
                    speedY: 700, scaleY: { start: 1.5, end: 0.2 }, scaleX: 0.15,
                    alpha: { start: 0.7, end: 0 }, quantity: 5 };
        }

        this.climateEmitter = this.add.particles(0, 0, biome.climateEffect, cfg);
        this.climateEmitter.setDepth(-1);
        this.climateEmitter.setScrollFactor(0);
    }

    showLevelBanner(biome) {
        const cam = this.cameras.main;

        const bannerBg = this.add.rectangle(400, 300, 600, 80, 0x000000, 0.85).setScrollFactor(0).setDepth(50);
        const bannerLine = this.add.text(400, 285, `LEVEL ${biome.level}`, {
            font: 'bold 20px Courier', fill: '#00ffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        const bannerTitle = this.add.text(400, 315, biome.label, {
            font: 'bold 30px Courier', fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

        // Slide in
        bannerBg.setAlpha(0); bannerLine.setAlpha(0); bannerTitle.setAlpha(0);
        this.tweens.add({ targets: [bannerBg, bannerLine, bannerTitle], alpha: 1, duration: 300, ease: 'Quad.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({ targets: [bannerBg, bannerLine, bannerTitle], alpha: 0, duration: 400,
                        onComplete: () => { bannerBg.destroy(); bannerLine.destroy(); bannerTitle.destroy(); }
                    });
                });
            }
        });
    }

    collectReward(player, reward) {
        this.playSound('coin');
        // Pop effect
        this.tweens.add({
            targets: reward,
            scaleX: 2, scaleY: 2, alpha: 0,
            duration: 200,
            onComplete: () => reward.destroy()
        });

        let value = this.currentBiome.rewardValue;
        if (this.saveData.equipped_character === 'cosmic_unicorn') {
            value *= 2; // Unicorn gives 2x Coins
        }

        this.saveData.coins += value;
        this.registry.set('saveData', this.saveData);
        localStorage.setItem('infiniteCrosserSave', JSON.stringify(this.saveData));
        this.events.emit('rewardCollected', this.saveData.coins, value);
    }

    playerHit(player, hazard) {
        if (this.isDead) return;
        this.isDead = true;
        this.physics.pause();
        this.playSound('crash');

        this.player.setTint(0xff0000);
        this.cameras.main.shake(400, 0.025);

        // Death explosion flash
        const flash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.4).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: flash, alpha: 0, duration: 400 });

        // Score summary text
        const deathText = this.add.text(400, 280, `SCORE: ${this.score}`, {
            font: 'bold 36px Courier', fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        const restartText = this.add.text(400, 330, 'Tap to return...', {
            font: '20px Courier', fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.time.delayedCall(2000, () => {
            this.input.on('pointerdown', () => {
                this.laneTimers.forEach(t => { if (t) t.remove(); });
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
            this.cursors.up.on('down', () => {
                this.laneTimers.forEach(t => { if (t) t.remove(); });
                this.scene.stop('UIScene');
                this.scene.start('MenuScene');
            });
        });
    }
}
