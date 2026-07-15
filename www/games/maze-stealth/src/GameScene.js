class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // Define levels grid (10x15 logic scale, 60x60 tile size -> 600x900 bounds)
        // P = Player, W = Wall, G = Gold, S = Seeker AI, X = Pressure Plate, D = Door, . = empty
        this.LEVEL_MAPS = [
            // Level 1: Intro to hiding
            [
                "WWWWWWWWWW",
                "W.G....G.W",
                "W.WW..WW.W",
                "W..S.....W",
                "WWWW..WWWW",
                "W.G....G.W",
                "W........W",
                "WWWW..WWWW",
                "W........W",
                "W...WW...W",
                "W...WW...W",
                "W..G..G..W",
                "W........W",
                "W...P....W",
                "WWWWWWWWWW"
            ],
            // Level 2: Pressure Plate & Doors
            [
                "WWWWWWWWWW",
                "W...S....W",
                "W...WW...W",
                "WG..WW..GW",
                "WWWWDDWWWW",
                "W.G....G.W",
                "W........W",
                "WWW....WWW",
                "W........W",
                "W..X..X..W",
                "W.WW..WW.W",
                "W..G..G..W",
                "W........W",
                "W...P....W",
                "WWWWWWWWWW"
            ],
            // Level 3: Tight maze
            [
                "WWWWWWWWWW",
                "W.G.WW.G.W",
                "W...WW...W",
                "WW..WW..WW",
                "WS......SW",
                "WWWW..WWWW",
                "W.G.XX.G.W",
                "W.WWDDWW.W",
                "W.W....W.W",
                "W.W.WW.W.W",
                "W.W.WW.W.W",
                "W.G....G.W",
                "WWWW..WWWW",
                "W...P....W",
                "WWWWWWWWWW"
            ],
            // Level 4: The Vault
            [
                "WWWWWWWWWW",
                "WGGGGGGGGW",
                "WWWWDDWWWW",
                "WS......SW",
                "WWW....WWW",
                "W.X.WW.X.W",
                "W...WW...W",
                "WWWW..WWWW",
                "WS......SW",
                "WWW....WWW",
                "W.X.WW.X.W",
                "W........W",
                "WWWW..WWWW",
                "W...P....W",
                "WWWWWWWWWW"
            ]
        ];
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.tileSize = 60;
        this.enemies = [];
        this.plates = [];
        this.doors = [];
        this.mapGold = 0;
        this.collectedGold = 0;
        this.gameOver = false;
    }

    create() {
        this.physics.world.setBounds(0, 0, 600, 900);
        
        this.wallGroup = this.physics.add.staticGroup();
        this.doorGroup = this.physics.add.staticGroup();
        this.lootGroup = this.physics.add.staticGroup();

        this.parseMap();

        // Camera Setup
        this.cameras.main.setBounds(0, 0, 600, 900);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Inputs
        this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
        this.wasd = this.input.keyboard ? this.input.keyboard.addKeys('W,A,S,D') : null;

        // Collisions
        this.physics.add.collider(this.player, this.wallGroup);
        this.physics.add.collider(this.player, this.doorGroup);
        
        // Loot overlap
        this.physics.add.overlap(this.player, this.lootGroup, (p, item) => {
            if (!item.active) return;
            item.disableBody(true, true);
            this.collectedGold++;
            this.events.emit('scoreGold', { current: this.collectedGold, max: this.mapGold });
            
            // Collect Animation
            const burst = this.add.sprite(item.x, item.y, 'gold');
            this.tweens.add({
                targets: burst,
                scale: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => burst.destroy()
            });

            if (this.collectedGold >= this.mapGold) {
                this.winLevel();
            }
        });
    }

    parseMap() {
        const map = this.LEVEL_MAPS[this.currentLevel - 1];
        
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const char = map[row][col];
                const x = col * this.tileSize + (this.tileSize / 2);
                const y = row * this.tileSize + (this.tileSize / 2);

                if (char === 'W') {
                    const wall = this.wallGroup.create(x, y, 'wall');
                    wall.setDepth(10);
                } else if (char === 'D') {
                    const door = this.doorGroup.create(x, y, 'door');
                    door.setDepth(9);
                    this.doors.push(door);
                } else if (char === 'X') {
                    const plate = this.physics.add.image(x, y, 'plate');
                    plate.setDepth(1);
                    this.plates.push(plate);
                } else if (char === 'G') {
                    const gold = this.lootGroup.create(x, y, 'gold');
                    gold.setDepth(5);
                    this.mapGold++;
                    // Hover tween
                    this.tweens.add({
                        targets: gold,
                        y: y - 5,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.InOut'
                    });
                } else if (char === 'P') {
                    this.player = this.physics.add.sprite(x, y, 'player');
                    this.player.setDepth(20);
                    // Shrink hitbox for tight corners
                    this.player.body.setSize(24, 24, true);
                    this.player.body.setCollideWorldBounds(true);
                } else if (char === 'S') {
                    const enemy = this.physics.add.sprite(x, y, 'enemy');
                    enemy.setDepth(20);
                    enemy.body.setSize(24, 24, true);
                    enemy.body.setCollideWorldBounds(true);
                    
                    // Aura
                    const aura = this.add.sprite(x, y, 'aura');
                    aura.setDepth(2);
                    
                    // Enemy State
                    this.enemies.push({
                        sprite: enemy,
                        aura: aura,
                        state: 'PATROL',
                        startX: x,
                        startY: y,
                        patrolTarget: null,
                        patrolRadius: 180
                    });
                }
            }
        }
    }

    update(time, delta) {
        if (this.gameOver) return;

        this.handlePlayerMovement();
        this.handlePressurePlates();
        this.handleEnemies();
    }

    handlePlayerMovement() {
        const speed = 200;
        let vx = 0;
        let vy = 0;

        if ((this.cursors && this.cursors.left.isDown) || (this.wasd && this.wasd.A.isDown)) vx = -speed;
        if ((this.cursors && this.cursors.right.isDown) || (this.wasd && this.wasd.D.isDown)) vx = speed;
        if ((this.cursors && this.cursors.up.isDown) || (this.wasd && this.wasd.W.isDown)) vy = -speed;
        if ((this.cursors && this.cursors.down.isDown) || (this.wasd && this.wasd.S.isDown)) vy = speed;

        // Mobile Drag/Touch Support
        if (this.input.activePointer.isDown) {
            const ptr = this.input.activePointer;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ptr.worldX, ptr.worldY);
            if (dist > 20) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, ptr.worldX, ptr.worldY);
                this.physics.velocityFromRotation(angle, speed, this.player.body.velocity);
                vx = this.player.body.velocity.x;
                vy = this.player.body.velocity.y;
            }
        } else {
            this.player.body.setVelocity(vx, vy);
        }

        // Tilt animation based on movement
        if (vx < 0) this.player.setAngle(-5);
        else if (vx > 0) this.player.setAngle(5);
        else this.player.setAngle(0);
    }

    handlePressurePlates() {
        this.plates.forEach(plate => {
            if (!plate.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, plate.x, plate.y);
            if (dist < 30) {
                // Step on plate
                plate.setTexture('plate_pressed');
                plate.active = false;
                
                // Open a door
                if (this.doors.length > 0) {
                    const door = this.doors.shift(); // open first available door
                    this.tweens.add({
                        targets: door,
                        scaleX: 0,
                        duration: 300,
                        onComplete: () => door.disableBody(true, true)
                    });
                }
            }
        });
    }

    handleEnemies() {
        this.enemies.forEach(e => {
            const es = e.sprite;
            e.aura.x = es.x;
            e.aura.y = es.y;

            // Collision check with player
            if (Phaser.Math.Distance.Between(es.x, es.y, this.player.x, this.player.y) < 30) {
                this.triggerGameOver();
                return;
            }

            // Raycast Line of Sight
            const distToPlayer = Phaser.Math.Distance.Between(es.x, es.y, this.player.x, this.player.y);
            let hasLineOfSight = false;

            if (distToPlayer < 250) { // Vision range
                const line = new Phaser.Geom.Line(es.x, es.y, this.player.x, this.player.y);
                
                // Check if any wall blocks the line
                let blocked = false;
                const walls = this.wallGroup.getChildren();
                for (let i = 0; i < walls.length; i++) {
                    const rect = walls[i].getBounds();
                    if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) {
                        blocked = true;
                        break;
                    }
                }
                const doors = this.doorGroup.getChildren();
                for (let i = 0; i < doors.length; i++) {
                    if (doors[i].active) {
                        const rect = doors[i].getBounds();
                        if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) {
                            blocked = true;
                            break;
                        }
                    }
                }

                if (!blocked) {
                    hasLineOfSight = true;
                }
            }

            if (hasLineOfSight) {
                e.state = 'CHASE';
                es.setTint(0xff0000);
                e.aura.setTint(0xff0000);
                e.aura.setScale(1.2);
            } else {
                if (e.state === 'CHASE') {
                    // Lost sight, return to patrol
                    e.state = 'PATROL';
                    es.clearTint();
                    e.aura.clearTint();
                    e.aura.setScale(1.0);
                    e.patrolTarget = null; // Re-pick target
                }
            }

            // State Execution
            if (e.state === 'CHASE') {
                const angle = Phaser.Math.Angle.Between(es.x, es.y, this.player.x, this.player.y);
                this.physics.velocityFromRotation(angle, 220, es.body.velocity);
            } else if (e.state === 'PATROL') {
                if (!e.patrolTarget) {
                    // Pick random point near start
                    e.patrolTarget = {
                        x: e.startX + Phaser.Math.Between(-e.patrolRadius, e.patrolRadius),
                        y: e.startY + Phaser.Math.Between(-e.patrolRadius, e.patrolRadius)
                    };
                    // Keep in bounds
                    e.patrolTarget.x = Phaser.Math.Clamp(e.patrolTarget.x, 30, 570);
                    e.patrolTarget.y = Phaser.Math.Clamp(e.patrolTarget.y, 30, 870);
                }

                const distToTarget = Phaser.Math.Distance.Between(es.x, es.y, e.patrolTarget.x, e.patrolTarget.y);
                if (distToTarget < 10) {
                    e.patrolTarget = null;
                    es.body.setVelocity(0, 0);
                } else {
                    const angle = Phaser.Math.Angle.Between(es.x, es.y, e.patrolTarget.x, e.patrolTarget.y);
                    this.physics.velocityFromRotation(angle, 80, es.body.velocity);
                }
            }
        });
    }

    triggerGameOver() {
        this.gameOver = true;
        this.physics.pause();
        this.cameras.main.shake(250, 0.02);
        
        this.tweens.add({
            targets: this.player,
            scale: 0,
            duration: 300
        });

        this.events.emit('levelFailed');
    }

    winLevel() {
        this.gameOver = true;
        this.physics.pause();
        
        // Save Progress
        let ul = this.registry.get('unlockedLevels');
        if (this.currentLevel === ul && ul < 4) {
            this.registry.set('unlockedLevels', ul + 1);
        }
        
        const g = this.registry.get('totalGold');
        this.registry.set('totalGold', g + this.collectedGold);

        const data = {
            unlockedLevels: this.registry.get('unlockedLevels'),
            totalGold: this.registry.get('totalGold')
        };
        localStorage.setItem('mazeStealthData', JSON.stringify(data));

        this.events.emit('levelComplete');
    }
}
