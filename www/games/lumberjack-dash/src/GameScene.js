class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.score = 0;
        this.gameOver = false;
        this.timeLeft = 100; // max 100
        this.timeDepletionRate = 15; // percent per second
        this.timeBonusPerChop = 2.5;

        this.side = 'LEFT'; 
        this.treeHeight = 100;
        this.trunkWidth = 80;
        this.centerX = 200;
        
        this.treePieces = [];

        this.createTextures();

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a2a1a, 0x0a2a1a, 0x05150d, 0x05150d, 1);
        bg.fillRect(0, 0, 400, 700);

        this.drawBgTrees();

        this.createParticles();

        for(let i=0; i<8; i++) {
            this.addTreePiece(i, i < 2 ? 'NONE' : this.getRandomBranch());
        }

        this.player = this.add.sprite(this.getPlayerX(), 550, 'player_right').setOrigin(0.5, 1);
        this.player.scaleX = 1;
        
        this.add.rectangle(200, 40, 304, 24, 0xffffff).setOrigin(0.5);
        this.add.rectangle(200, 40, 300, 20, 0x000000).setOrigin(0.5);
        this.timerBar = this.add.rectangle(50, 40, 300, 20, 0xff0000).setOrigin(0, 0.5);

        this.scoreText = this.add.text(200, 100, '0', {
            fontFamily: 'Courier, monospace',
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-LEFT', () => this.chop('LEFT'));
        this.input.keyboard.on('keydown-A', () => this.chop('LEFT'));
        this.input.keyboard.on('keydown-RIGHT', () => this.chop('RIGHT'));
        this.input.keyboard.on('keydown-D', () => this.chop('RIGHT'));
        
        this.add.rectangle(100, 350, 200, 700, 0x000000, 0).setInteractive().on('pointerdown', () => this.chop('LEFT'));
        this.add.rectangle(300, 350, 200, 700, 0x000000, 0).setInteractive().on('pointerdown', () => this.chop('RIGHT'));

        this.chopLeftHandler = () => this.chop('LEFT');
        this.chopRightHandler = () => this.chop('RIGHT');
        window.addEventListener('chop-left', this.chopLeftHandler);
        window.addEventListener('chop-right', this.chopRightHandler);

        this.events.on('shutdown', () => {
            window.removeEventListener('chop-left', this.chopLeftHandler);
            window.removeEventListener('chop-right', this.chopRightHandler);
        });
    }

    drawBgTrees() {
        const bg = this.add.graphics();
        bg.fillStyle(0x082014, 1);
        for(let i=0; i<5; i++) {
            const x = Phaser.Math.Between(0, 400);
            const w = Phaser.Math.Between(15, 25);
            const h = Phaser.Math.Between(200, 400);
            bg.fillRect(x - w/2, 700 - h, w, h);
            
            bg.fillStyle(0x0a301a, 1);
            bg.fillTriangle(x, 700 - h - 50, x - w*2, 700 - h + 100, x + w*2, 700 - h + 100);
            bg.fillTriangle(x, 700 - h - 120, x - w*1.5, 700 - h + 20, x + w*1.5, 700 - h + 20);
            bg.fillStyle(0x082014, 1);
        }
    }

    createTextures() {
        const g = this.add.graphics();

        g.fillStyle(0x6b4226);
        g.fillRect(0, 0, this.trunkWidth, this.treeHeight);
        g.fillStyle(0x4a2e1b);
        g.fillRect(10, 0, 5, 100);
        g.fillRect(30, 0, 8, 100);
        g.fillRect(50, 0, 4, 100);
        g.generateTexture('trunk', this.trunkWidth, this.treeHeight);
        g.clear();

        g.fillStyle(0x6b4226);
        g.fillRect(0, 30, 100, 40);
        g.fillStyle(0x2d5a27);
        g.fillCircle(80, 50, 30);
        g.fillCircle(60, 30, 25);
        g.fillCircle(90, 40, 20);
        g.generateTexture('branch', 100, 100);
        g.clear();

        g.fillStyle(0xff0000); 
        g.fillRect(10, 40, 40, 40);
        g.fillStyle(0xffd3b6); 
        g.fillRect(15, 10, 30, 30);
        g.fillStyle(0x000000); 
        g.fillRect(10, 0, 40, 15);
        g.fillStyle(0x1a1a1a); 
        g.fillRect(15, 80, 30, 20);
        g.fillStyle(0x8b4513); 
        g.fillRect(45, 50, 40, 8);
        g.fillStyle(0xcccccc); 
        g.fillRect(75, 40, 10, 28);
        g.generateTexture('player_right', 90, 100);
        g.clear();

        g.fillStyle(0x2d5a27);
        g.fillRect(0, 0, 10, 10);
        g.generateTexture('leaf', 10, 10);
        g.clear();
        
        g.destroy();
    }

    createParticles() {
        this.leafParticles = this.add.particles(0, 0, 'leaf', {
            scale: { start: 1, end: 0 },
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            gravityY: 500,
            lifespan: 800,
            tint: 0x2d5a27,
            emitting: false
        });
        
        this.woodParticles = this.add.particles(0, 0, 'leaf', {
            scale: { start: 1.5, end: 0 },
            speed: { min: 150, max: 400 },
            angle: { min: 0, max: 360 },
            gravityY: 600,
            lifespan: 600,
            tint: 0xdeb887,
            emitting: false
        });
    }

    getRandomBranch() {
        const rand = Phaser.Math.FloatBetween(0, 1);
        let branchChance = 0.3 + (this.score * 0.002);
        if (branchChance > 0.45) branchChance = 0.45;

        if (rand < branchChance) return 'LEFT';
        else if (rand < branchChance * 2) return 'RIGHT';
        return 'NONE';
    }

    addTreePiece(index, branchSide) {
        const y = 550 - (index * this.treeHeight);
        const container = this.add.container(this.centerX, y);
        
        const trunk = this.add.image(0, 0, 'trunk').setOrigin(0.5, 1);
        container.add(trunk);

        if (branchSide === 'LEFT') {
            const branch = this.add.image(-this.trunkWidth/2, 0, 'branch').setOrigin(0, 1);
            branch.scaleX = -1;
            container.add(branch);
        } else if (branchSide === 'RIGHT') {
            const branch = this.add.image(this.trunkWidth/2, 0, 'branch').setOrigin(0, 1);
            container.add(branch);
        }

        container.branchSide = branchSide;
        this.treePieces.push(container);
    }

    getPlayerX() {
        return this.side === 'LEFT' ? this.centerX - this.trunkWidth/2 - 45 : this.centerX + this.trunkWidth/2 + 45;
    }

    chop(side) {
        if (this.gameOver) return;

        this.side = side;
        this.player.scaleX = side === 'LEFT' ? 1 : -1;
        this.player.x = this.getPlayerX();
        
        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            x: side === 'LEFT' ? this.player.x + 10 : this.player.x - 10,
            duration: 50,
            yoyo: true
        });

        if (this.treePieces[0].branchSide === this.side) {
            this.die();
            return;
        }

        this.score++;
        this.scoreText.setText(this.score);

        this.timeLeft += this.timeBonusPerChop;
        if (this.timeLeft > 100) this.timeLeft = 100;

        this.timeDepletionRate = 15 + (this.score * 0.2);
        
        this.woodParticles.emitParticleAt(
            this.side === 'LEFT' ? this.centerX - this.trunkWidth/2 : this.centerX + this.trunkWidth/2,
            500,
            8
        );
        this.leafParticles.emitParticleAt(
            this.centerX,
            450,
            4
        );

        const bottomPiece = this.treePieces.shift();
        
        this.tweens.add({
            targets: bottomPiece,
            x: side === 'LEFT' ? bottomPiece.x + 300 : bottomPiece.x - 300,
            y: bottomPiece.y - 100,
            angle: side === 'LEFT' ? 180 : -180,
            alpha: 0,
            duration: 300,
            onComplete: () => bottomPiece.destroy()
        });

        this.treePieces.forEach(piece => {
            piece.y += this.treeHeight;
        });

        const topPiece = this.treePieces[this.treePieces.length - 1];
        const newY = topPiece.y - this.treeHeight;
        
        const container = this.add.container(this.centerX, newY);
        const trunk = this.add.image(0, 0, 'trunk').setOrigin(0.5, 1);
        container.add(trunk);

        let newBranch = this.getRandomBranch();
        if (newBranch === 'LEFT') {
            const branch = this.add.image(-this.trunkWidth/2, 0, 'branch').setOrigin(0, 1);
            branch.scaleX = -1;
            container.add(branch);
        } else if (newBranch === 'RIGHT') {
            const branch = this.add.image(this.trunkWidth/2, 0, 'branch').setOrigin(0, 1);
            container.add(branch);
        }

        container.branchSide = newBranch;
        this.treePieces.push(container);

        if (this.treePieces[0].branchSide === this.side) {
            this.die();
        }
    }

    die() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.shake(200, 0.02);
        
        this.tweens.killTweensOf(this.player);
        this.tweens.add({
            targets: this.player,
            scaleY: 0.1,
            y: 550,
            duration: 100,
            ease: 'Power2'
        });
        
        const highScore = localStorage.getItem('lumberjack_highscore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('lumberjack_highscore', this.score);
        }

        this.time.delayedCall(300, () => {
            this.add.rectangle(200, 350, 400, 700, 0x000000, 0.6);

            this.add.text(200, 300, 'GAME OVER', {
                fontFamily: 'Courier, monospace',
                fontSize: '48px',
                color: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            this.add.text(200, 380, 'TAP TO RESTART', {
                fontFamily: 'Courier, monospace',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            const restart = () => {
                this.input.off('pointerdown', restart);
                window.removeEventListener('chop-left', restart);
                window.removeEventListener('chop-right', restart);
                this.scene.start('GameScene');
            };
            
            this.time.delayedCall(200, () => {
                this.input.once('pointerdown', restart);
                window.addEventListener('chop-left', restart);
                window.addEventListener('chop-right', restart);
                
                this.events.once('shutdown', () => {
                    window.removeEventListener('chop-left', restart);
                    window.removeEventListener('chop-right', restart);
                });
            });
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        this.timeLeft -= (this.timeDepletionRate * delta) / 1000;
        
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.die();
        }

        this.timerBar.width = (this.timeLeft / 100) * 300;
        
        if (this.timeLeft < 25) {
            this.timerBar.fillColor = 0xff0000;
        } else if (this.timeLeft < 50) {
            this.timerBar.fillColor = 0xff9900;
        } else {
            this.timerBar.fillColor = 0x00ff00;
        }
    }
}
