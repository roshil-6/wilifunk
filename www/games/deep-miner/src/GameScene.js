class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.createGraphics();

        this.cameras.main.setBackgroundColor('#221100');

        this.map = {};
        this.score = 0;
        this.depth = 0;
        this.oxygen = 100;
        this.isDead = false;

        this.px = 4;
        this.py = 0;

        this.createParticles();

        this.playerSprite = this.add.sprite(this.px * 40 + 20, this.py * 40 + 20, 'player').setDepth(10);
        
        // Player breathing animation
        this.tweens.add({
            targets: this.playerSprite,
            scaleY: 0.95,
            scaleX: 1.02,
            yoyo: true,
            repeat: -1,
            duration: 500
        });

        // Camera follows the player
        this.cameras.main.startFollow(this.playerSprite, true, 1, 0.1);

        this.generateRows(0, 30);
        
        // Starting area setup to introduce elements
        this.spawnCell(4, 3, 1); // Dirt
        this.spawnCell(4, 4, 6); // Oxygen
        this.spawnCell(5, 4, 3); // Ruby

        // Fog of war
        this.fog = this.add.renderTexture(0, 0, 400, 700).setDepth(20).setScrollFactor(0);

        // UI
        this.add.rectangle(0, 0, 400, 40, 0x000000, 0.8).setOrigin(0, 0).setDepth(29).setScrollFactor(0);
        this.add.text(10, 10, 'O2', {fontSize: '16px', fill: '#00ffff', fontStyle: 'bold'}).setOrigin(0, 0).setDepth(30).setScrollFactor(0);
        this.oxyBarBg = this.add.rectangle(40, 13, 100, 12, 0x555555).setOrigin(0, 0).setDepth(30).setScrollFactor(0);
        this.oxyBar = this.add.rectangle(40, 13, 100, 12, 0x00ffff).setOrigin(0, 0).setDepth(30).setScrollFactor(0);
        
        this.depthText = this.add.text(200, 10, 'Depth: 0', {fontSize: '16px', fill: '#ffffff'}).setOrigin(0.5, 0).setDepth(30).setScrollFactor(0);
        this.scoreText = this.add.text(390, 10, 'Score: 0', {fontSize: '16px', fill: '#ffd700', fontStyle: 'bold'}).setOrigin(1, 0).setDepth(30).setScrollFactor(0);

        this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
        this.wasd = this.input.keyboard ? {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        } : null;
        this.inputTimer = 0;

        this.createMobileControls();
    }

    createParticles() {
        this.dirtEmitter = this.add.particles(0, 0, 'dirt', {
            lifespan: 300,
            speed: { min: 50, max: 100 },
            scale: { start: 0.25, end: 0 },
            alpha: { start: 1, end: 0 },
            emitting: false
        }).setDepth(15);
        
        this.gemEmitter = this.add.particles(0, 0, 'diamond', {
            lifespan: 400,
            speed: { min: 80, max: 150 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            emitting: false
        }).setDepth(15);
    }

    spawnCell(x, y, type) {
        let key = x + ',' + y;
        if (this.map[key] && this.map[key].sprite) {
            this.map[key].sprite.destroy();
        }
        
        if (type === 0) {
            this.map[key] = { type: 0 };
            return;
        }
        
        let spriteKey = ['empty', 'dirt', 'rock', 'ruby', 'emerald', 'diamond', 'oxygen'][type];
        let sprite = this.add.sprite(x * 40 + 20, y * 40 + 20, spriteKey);
        
        // Gentle glow and pulse for items
        if (type === 6) { 
            this.tweens.add({ targets: sprite, scaleX: 1.15, scaleY: 1.15, alpha: 0.8, yoyo: true, repeat: -1, duration: 600 });
        } else if (type >= 3 && type <= 5) {
            this.tweens.add({ targets: sprite, scaleX: 1.05, scaleY: 1.05, yoyo: true, repeat: -1, duration: 1000 + Math.random() * 500 });
        }
        
        this.map[key] = { type, sprite };
    }

    generateRows(startY, endY) {
        for (let y = startY; y <= endY; y++) {
            for (let x = 0; x < 10; x++) {
                let key = x + ',' + y;
                if (this.map[key]) continue;

                if (y < 2) { // Give a small clear space to start
                    this.map[key] = { type: 0 };
                    continue;
                }

                let rand = Math.random();
                let type = 0;
                if (rand < 0.15) type = 2; // rock (15%)
                else if (rand < 0.25) {
                    // gems (10%)
                    let gRand = Math.random();
                    if (gRand < 0.7) type = 3; // ruby (7%)
                    else if (gRand < 0.9) type = 4; // emerald (2%)
                    else type = 5; // diamond (1%)
                }
                else if (rand < 0.30) type = 6; // oxygen (5%)
                else type = 1; // dirt (70%)

                this.spawnCell(x, y, type);
            }
        }
    }

    createMobileControls() {
        this.mobileInput = null;
        if (window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            let padX = 300;
            let padY = 580;
            let offset = 65;

            let createBtn = (x, y, dir) => {
                let btn = this.add.rectangle(x, y, 60, 60, 0xffffff, 0.15)
                    .setInteractive()
                    .setScrollFactor(0)
                    .setDepth(40);
                
                let text = '▲';
                if (dir === 'down') text = '▼';
                else if (dir === 'left') text = '◀';
                else if (dir === 'right') text = '▶';
                
                this.add.text(x, y, text, {fontSize: '24px', fill: '#ffffff'})
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(41);

                btn.on('pointerdown', () => this.mobileInput = dir);
                btn.on('pointerover', (pointer) => { if (pointer.isDown) this.mobileInput = dir; });
                btn.on('pointerup', () => { if (this.mobileInput === dir) this.mobileInput = null; });
                btn.on('pointerout', () => { if (this.mobileInput === dir) this.mobileInput = null; });
            };

            createBtn(padX, padY - offset, 'up');
            createBtn(padX, padY + offset, 'down');
            createBtn(padX - offset, padY, 'left');
            createBtn(padX + offset, padY, 'right');
        }
    }

    update(time, delta) {
        if (this.isDead) return;

        this.cameras.main.scrollX = 0; // Lock camera X strictly

        // Deplete oxygen (2.5 units per second)
        this.oxygen -= (2.5 * delta / 1000);
        if (this.oxygen <= 0) {
            this.oxygen = 0;
            this.gameOver();
        }
        
        this.oxyBar.width = Math.max(0, this.oxygen);
        this.oxyBar.fillColor = this.oxygen < 25 ? 0xff0000 : 0x00ffff; // turn red when low

        // Movement with limited rate to make it step-based
        if (time > this.inputTimer) {
            let dx = 0;
            let dy = 0;
            if ((this.cursors && this.cursors.left.isDown) || (this.wasd && this.wasd.left.isDown) || this.mobileInput === 'left') dx = -1;
            else if ((this.cursors && this.cursors.right.isDown) || (this.wasd && this.wasd.right.isDown) || this.mobileInput === 'right') dx = 1;
            else if ((this.cursors && this.cursors.up.isDown) || (this.wasd && this.wasd.up.isDown) || this.mobileInput === 'up') dy = -1;
            else if ((this.cursors && this.cursors.down.isDown) || (this.wasd && this.wasd.down.isDown) || this.mobileInput === 'down') dy = 1;

            if (dx !== 0 || dy !== 0) {
                this.movePlayer(dx, dy);
                this.inputTimer = time + 150;
            }
        }

        // Render Fog of war
        this.fog.clear();
        this.fog.fill(0x000000, 0.95);
        let screenX = this.playerSprite.x - this.cameras.main.scrollX;
        let screenY = this.playerSprite.y - this.cameras.main.scrollY;
        // The hole texture is 320x320, we draw it offset by half its size to center it on the player
        this.fog.erase('hole', screenX - 160, screenY - 160);
    }

    movePlayer(dx, dy) {
        let nx = this.px + dx;
        let ny = this.py + dy;

        // Strict bounds checking
        if (nx < 0 || nx > 9 || ny < 0) return;

        let key = nx + ',' + ny;
        let cell = this.map[key];

        if (!cell) {
            this.generateRows(ny, ny + 20);
            cell = this.map[key];
        }

        // Check if movement is valid
        if (cell.type === 2) return; // rock is solid

        // Interactions based on cell type
        if (cell.type === 3) { // ruby
            this.score += 50;
            this.destroyCell(cell);
        } else if (cell.type === 4) { // emerald
            this.score += 100;
            this.destroyCell(cell);
        } else if (cell.type === 5) { // diamond
            this.score += 200;
            this.destroyCell(cell);
        } else if (cell.type === 6) { // oxygen
            this.oxygen = Math.min(100, this.oxygen + 50);
            this.destroyCell(cell);
        } else if (cell.type === 1) { // dirt
            this.destroyCell(cell);
        }

        this.px = nx;
        this.py = ny;
        
        // Smoothly move the player sprite visually
        this.tweens.add({
            targets: this.playerSprite,
            x: this.px * 40 + 20,
            y: this.py * 40 + 20,
            duration: 100
        });

        // Record depth and manage world generation
        if (this.py > this.depth) {
            this.depth = this.py;
            this.depthText.setText('Depth: ' + this.depth);
            this.generateRows(this.depth + 20, this.depth + 25);
            this.cleanupRows(this.depth - 50); // Keep memory usage low
        }
        
        this.scoreText.setText('Score: ' + this.score);
    }

    destroyCell(cell) {
        if (cell.sprite) {
            if (cell.type === 1) {
                this.dirtEmitter.emitParticleAt(cell.sprite.x, cell.sprite.y, 5);
            } else if (cell.type >= 3 && cell.type <= 6) {
                this.gemEmitter.setTexture(cell.sprite.texture.key);
                this.gemEmitter.emitParticleAt(cell.sprite.x, cell.sprite.y, 10);
            }
            cell.sprite.destroy();
        }
        cell.type = 0; // Transforms to empty space
        cell.sprite = null;
    }

    cleanupRows(upToY) {
        for (let key in this.map) {
            let parts = key.split(',');
            let y = parseInt(parts[1]);
            if (y < upToY) {
                if (this.map[key].sprite) {
                    this.map[key].sprite.destroy();
                }
                delete this.map[key];
            }
        }
    }

    gameOver() {
        this.isDead = true;
        
        this.add.rectangle(0, 0, 400, 700, 0x000000, 0.8)
            .setOrigin(0,0).setDepth(100).setScrollFactor(0);
            
        this.add.text(200, 300, 'OUT OF OXYGEN', {
            fontSize: '40px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.add.text(200, 350, 'Depth: ' + this.depth + '\nScore: ' + this.score, {
            fontSize: '24px', fill: '#ffffff', align: 'center', lineSpacing: 10
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        let restartBtn = this.add.rectangle(200, 450, 200, 60, 0x0088ff)
            .setOrigin(0.5).setDepth(101).setScrollFactor(0).setInteractive();
            
        this.add.text(200, 450, 'RESTART', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
        
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    createGraphics() {
        if (this.textures.exists('dirt')) return;
        
        let g = this.make.graphics();
        
        // dirt (Brown box with details)
        g.fillStyle(0x3e2723);
        g.fillRect(0, 0, 40, 40);
        g.fillStyle(0x271916);
        g.fillRect(0, 0, 40, 2);
        g.fillRect(0, 0, 2, 40);
        g.fillRect(20, 10, 4, 4);
        g.fillRect(10, 30, 4, 4);
        g.fillRect(30, 20, 4, 4);
        g.generateTexture('dirt', 40, 40);
        g.clear();

        // rock (Grey block)
        g.fillStyle(0x424242);
        g.fillRect(0, 0, 40, 40);
        g.fillStyle(0x212121);
        g.fillRect(4, 4, 32, 32);
        g.fillStyle(0x616161);
        g.beginPath(); g.moveTo(4,4); g.lineTo(36,4); g.lineTo(4,36); g.closePath(); g.fillPath();
        g.generateTexture('rock', 40, 40);
        g.clear();

        // ruby (Red gem)
        g.fillStyle(0xff0000, 0.4);
        g.fillCircle(20, 20, 16); // ambient glow
        g.fillStyle(0xff0000, 1);
        g.fillCircle(20, 20, 10); // core
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(16, 16, 3); // shine
        g.generateTexture('ruby', 40, 40);
        g.clear();

        // emerald (Green gem)
        g.fillStyle(0x00ff00, 0.4);
        g.fillCircle(20, 20, 16);
        g.fillStyle(0x00ff00, 1);
        g.beginPath();
        g.moveTo(20, 8); g.lineTo(30, 20); g.lineTo(20, 32); g.lineTo(10, 20); g.closePath();
        g.fillPath();
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(20, 14, 2);
        g.generateTexture('emerald', 40, 40);
        g.clear();

        // diamond (Blue gem)
        g.fillStyle(0x0088ff, 0.4);
        g.fillCircle(20, 20, 16);
        g.fillStyle(0x00aaff, 1);
        g.beginPath();
        g.moveTo(20, 6); g.lineTo(34, 14); g.lineTo(20, 34); g.lineTo(6, 14); g.closePath();
        g.fillPath();
        g.fillStyle(0xffffff, 0.8);
        g.beginPath(); g.moveTo(20,6); g.lineTo(26,14); g.lineTo(20,16); g.closePath(); g.fillPath();
        g.generateTexture('diamond', 40, 40);
        g.clear();

        // oxygen (Cyan crystal)
        g.fillStyle(0x00ffff, 0.4);
        g.fillCircle(20, 20, 18);
        g.fillStyle(0x00ffff, 1);
        g.fillRect(14, 14, 12, 12);
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(16, 16, 4, 4);
        g.generateTexture('oxygen', 40, 40);
        g.clear();

        // player (Miner avatar)
        g.fillStyle(0xffb74d); // skin tone
        g.fillCircle(20, 20, 14);
        g.fillStyle(0xfbc02d); // yellow hard hat
        g.beginPath();
        g.arc(20, 18, 14, Math.PI, 0, false);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xffffff); // helmet light
        g.fillCircle(20, 8, 6);
        g.fillStyle(0xffeb3b, 0.5); // lamp glow
        g.fillCircle(20, 8, 10);
        g.generateTexture('player', 40, 40);
        g.clear();

        // hole mask for fog of war (4 concentric circles to create soft brush)
        g.fillStyle(0xffffff, 0.25);
        g.fillCircle(160, 160, 160);
        g.fillCircle(160, 160, 120);
        g.fillCircle(160, 160, 80);
        g.fillCircle(160, 160, 40);
        g.generateTexture('hole', 320, 320);
        g.clear();
    }
}
