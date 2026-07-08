class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gridSize = 20;
        this.cols = 20;
        this.rows = 30;
        this.yOffset = 100;
        this.words = ['FIRE', 'STAR', 'MOON', 'GAME', 'GOLD', 'NEON', 'JUMP', 'CODE', 'HERO', 'NOVA', 'BOLT', 'FLUX'];
        this.colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800];
    }

    create() {
        // State
        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.moveInterval = 150;
        this.moveTimer = 0;
        this.letters = [];
        this.snake = [
            { x: 10, y: 15 },
            { x: 9, y: 15 },
            { x: 8, y: 15 }
        ];
        this.queuedDir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.wordProgress = 0;

        // Background Grid
        const gridGrp = this.add.graphics();
        gridGrp.lineStyle(1, 0x111133, 0.5);
        for (let i = 0; i <= this.cols; i++) {
            gridGrp.moveTo(i * this.gridSize, this.yOffset);
            gridGrp.lineTo(i * this.gridSize, this.yOffset + this.rows * this.gridSize);
        }
        for (let j = 0; j <= this.rows; j++) {
            gridGrp.moveTo(0, this.yOffset + j * this.gridSize);
            gridGrp.lineTo(this.cols * this.gridSize, this.yOffset + j * this.gridSize);
        }
        gridGrp.strokePath();

        // UI
        this.scoreText = this.add.text(10, 10, 'SCORE: 0', { fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold' });
        this.levelText = this.add.text(390, 10, 'LEVEL: 1', { fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0);

        this.wordContainer = this.add.container(200, 50);

        this.snakeGraphics = this.add.graphics();
        this.snakeGraphics.setDepth(50);

        this.pickNewWord();

        for (let i = 0; i < 7; i++) {
            this.spawnSingleLetter();
        }
        this.checkNeededLetter();

        // Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.setupSwipe();
        this.createMobileControls();

        this.drawSnake();
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Keyboard Input
        if (this.cursors.left.isDown && this.nextDir.x === 0) this.queuedDir = { x: -1, y: 0 };
        else if (this.cursors.right.isDown && this.nextDir.x === 0) this.queuedDir = { x: 1, y: 0 };
        else if (this.cursors.up.isDown && this.nextDir.y === 0) this.queuedDir = { x: 0, y: -1 };
        else if (this.cursors.down.isDown && this.nextDir.y === 0) this.queuedDir = { x: 0, y: 1 };

        this.moveTimer += delta;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer -= this.moveInterval;
            this.moveSnake();
        }
    }

    pickNewWord() {
        this.targetWord = Phaser.Utils.Array.GetRandom(this.words);
        this.wordProgress = 0;
        this.updateWordDisplay();
        this.checkNeededLetter();
    }

    updateWordDisplay() {
        this.wordContainer.removeAll(true);
        let totalWidth = this.targetWord.length * 30;
        let startX = -totalWidth / 2 + 15;
        
        for (let i = 0; i < this.targetWord.length; i++) {
            let isFound = i < this.wordProgress;
            let color = isFound ? '#00ff00' : '#555555';
            let t = this.add.text(startX + i * 30, 0, this.targetWord[i], {
                fontSize: '28px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: color,
                shadow: isFound ? { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 10, fill: true } : {}
            }).setOrigin(0.5);
            this.wordContainer.add(t);
        }
    }

    moveSnake() {
        this.nextDir = { x: this.queuedDir.x, y: this.queuedDir.y };
        
        let head = this.snake[0];
        let nx = head.x + this.nextDir.x;
        let ny = head.y + this.nextDir.y;

        // Walls Check
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) {
            this.gameOver();
            return;
        }

        // Self Check
        for (let i = 0; i < this.snake.length - 1; i++) {
            if (nx === this.snake[i].x && ny === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        let newHead = { x: nx, y: ny };
        this.snake.unshift(newHead);

        // Letter Check
        let eatenIdx = this.letters.findIndex(l => l.x === nx && l.y === ny);
        let grew = false;
        let shrank = false;

        if (eatenIdx !== -1) {
            let eaten = this.letters[eatenIdx];
            let neededChar = this.targetWord[this.wordProgress];

            if (eaten.char === neededChar) {
                this.score += 100;
                this.wordProgress++;
                grew = true;
                this.createParticleBurst(nx, ny, 0x00ff00);

                if (this.wordProgress === this.targetWord.length) {
                    this.score += 500;
                    this.level++;
                    this.levelText.setText('LEVEL: ' + this.level);
                    this.moveInterval = Math.max(80, this.moveInterval - 5);
                    this.pickNewWord();
                } else {
                    this.updateWordDisplay();
                }
            } else {
                this.score = Math.max(0, this.score - 50);
                shrank = true;
                this.createParticleBurst(nx, ny, 0xff0000);
            }

            eaten.bg.destroy();
            eaten.text.destroy();
            this.letters.splice(eatenIdx, 1);
        }

        if (!grew) {
            this.snake.pop(); // Normal move
        }

        if (shrank) {
            if (this.snake.length > 2) {
                this.snake.pop(); // Penalty shrink
            } else {
                this.gameOver();
                return;
            }
        }

        let spawnAttempts = 0;
        while(this.letters.length < 7 && spawnAttempts < 20) {
            this.spawnSingleLetter();
            spawnAttempts++;
        }
        this.checkNeededLetter();

        this.scoreText.setText('SCORE: ' + this.score);
        this.drawSnake();
    }

    drawSnake() {
        this.snakeGraphics.clear();
        
        for (let i = this.snake.length - 1; i >= 1; i--) {
            let segment = this.snake[i];
            let ratio = i / (this.snake.length - 1);
            let c = Phaser.Display.Color.GetColor(0, Math.floor(255 - ratio * 155), 0);
            this.snakeGraphics.fillStyle(c, 1);
            this.snakeGraphics.fillRoundedRect(segment.x * this.gridSize + 1, this.yOffset + segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2, 4);
        }

        let head = this.snake[0];
        this.snakeGraphics.fillStyle(0x00ff00, 1);
        this.snakeGraphics.fillRoundedRect(head.x * this.gridSize, this.yOffset + head.y * this.gridSize, this.gridSize, this.gridSize, 6);
        
        this.snakeGraphics.fillStyle(0x00ff00, 0.4);
        this.snakeGraphics.fillRoundedRect(head.x * this.gridSize - 2, this.yOffset + head.y * this.gridSize - 2, this.gridSize + 4, this.gridSize + 4, 8);
    }

    spawnSingleLetter() {
        let pos = this.getFreePos();
        if (!pos) return;

        let char = Phaser.Utils.Array.GetRandom("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
        let color = Phaser.Utils.Array.GetRandom(this.colors);

        let bg = this.add.graphics();
        bg.fillStyle(color, 0.8);
        bg.fillRoundedRect(0, 0, this.gridSize - 2, this.gridSize - 2, 4);
        bg.setPosition(pos.x * this.gridSize + 1, this.yOffset + pos.y * this.gridSize + 1);
        bg.setDepth(10);

        let text = this.add.text(pos.x * this.gridSize + this.gridSize / 2, this.yOffset + pos.y * this.gridSize + this.gridSize / 2, char, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setDepth(11);

        this.letters.push({ x: pos.x, y: pos.y, char: char, bg: bg, text: text });
    }

    checkNeededLetter() {
        if (this.wordProgress >= this.targetWord.length) return;
        let neededChar = this.targetWord[this.wordProgress];
        let hasNeeded = this.letters.some(l => l.char === neededChar);
        if (!hasNeeded && this.letters.length > 0) {
            let l = Phaser.Utils.Array.GetRandom(this.letters);
            l.char = neededChar;
            l.text.setText(neededChar);
        }
    }

    getFreePos() {
        let maxAttempts = 100;
        while(maxAttempts > 0) {
            let rx = Phaser.Math.Between(0, this.cols - 1);
            let ry = Phaser.Math.Between(0, this.rows - 1);
            
            let onSnake = this.snake.some(s => s.x === rx && s.y === ry);
            let onLetter = this.letters.some(l => l.x === rx && l.y === ry);
            
            // avoid spawning right in front of head to prevent unfair death or forced bad eat
            let inFront = false;
            let h = this.snake[0];
            if (h.x + this.nextDir.x === rx && h.y + this.nextDir.y === ry) inFront = true;
            if (h.x + this.nextDir.x*2 === rx && h.y + this.nextDir.y*2 === ry) inFront = true;

            if (!onSnake && !onLetter && !inFront) {
                return { x: rx, y: ry };
            }
            maxAttempts--;
        }
        return null;
    }

    createParticleBurst(x, y, color) {
        let px = x * this.gridSize + this.gridSize / 2;
        let py = this.yOffset + y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 12; i++) {
            let p = this.add.graphics();
            p.fillStyle(color, 1);
            p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
            p.setPosition(px, py);
            p.setDepth(60);
            
            let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            let speed = Phaser.Math.FloatBetween(50, 150);
            
            this.tweens.add({
                targets: p,
                x: px + Math.cos(angle) * speed,
                y: py + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.1,
                duration: Phaser.Math.Between(400, 800),
                ease: 'Power2',
                onComplete: () => { p.destroy(); }
            });
        }
    }

    setupSwipe() {
        this.input.on('pointerup', (pointer) => {
            if (this.isGameOver) return;
            let dx = pointer.upX - pointer.downX;
            let dy = pointer.upY - pointer.downY;
            
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.nextDir.x === 0) this.queuedDir = {x: 1, y: 0};
                else if (dx < 0 && this.nextDir.x === 0) this.queuedDir = {x: -1, y: 0};
            } else {
                if (dy > 0 && this.nextDir.y === 0) this.queuedDir = {x: 0, y: 1};
                else if (dy < 0 && this.nextDir.y === 0) this.queuedDir = {x: 0, y: -1};
            }
        });
    }

    createMobileControls() {
        const isMobile = window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobile) return;

        const btnSize = 60;
        const padding = 15;
        const cx = 200;
        const cy = 600;
        
        const createBtn = (x, y, label, dx, dy) => {
            let btn = this.add.graphics();
            btn.fillStyle(0xffffff, 0.1);
            btn.fillRoundedRect(x - btnSize/2, y - btnSize/2, btnSize, btnSize, 10);
            btn.setDepth(100);
            
            let text = this.add.text(x, y, label, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
            text.setDepth(101);
            
            let zone = this.add.zone(x, y, btnSize, btnSize).setInteractive();
            zone.setDepth(102);
            
            zone.on('pointerdown', () => {
                if (this.isGameOver) return;
                btn.clear();
                btn.fillStyle(0xffffff, 0.3);
                btn.fillRoundedRect(x - btnSize/2, y - btnSize/2, btnSize, btnSize, 10);
                
                if (dx !== 0 && this.nextDir.x === 0) this.queuedDir = {x: dx, y: 0};
                if (dy !== 0 && this.nextDir.y === 0) this.queuedDir = {x: 0, y: dy};
            });
            zone.on('pointerup', () => {
                btn.clear();
                btn.fillStyle(0xffffff, 0.1);
                btn.fillRoundedRect(x - btnSize/2, y - btnSize/2, btnSize, btnSize, 10);
            });
            zone.on('pointerout', () => {
                btn.clear();
                btn.fillStyle(0xffffff, 0.1);
                btn.fillRoundedRect(x - btnSize/2, y - btnSize/2, btnSize, btnSize, 10);
            });
        };

        createBtn(cx, cy - btnSize - padding, '↑', 0, -1);
        createBtn(cx, cy + btnSize + padding, '↓', 0, 1);
        createBtn(cx - btnSize - padding, cy, '←', -1, 0);
        createBtn(cx + btnSize + padding, cy, '→', 1, 0);
    }

    gameOver() {
        this.isGameOver = true;
        
        let rect = this.add.rectangle(200, 350, 400, 700, 0xff0000, 0.3);
        rect.setDepth(150);
        this.tweens.add({
            targets: rect,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 1
        });

        let goContainer = this.add.container(200, 350);
        goContainer.setDepth(200);

        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.lineStyle(3, 0xff0000, 1);
        bg.fillRoundedRect(-150, -120, 300, 240, 15);
        bg.strokeRoundedRect(-150, -120, 300, 240, 15);

        let title = this.add.text(0, -60, 'GAME OVER', {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff0000'
        }).setOrigin(0.5);

        let scoreTxt = this.add.text(0, 0, 'Score: ' + this.score, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        let restartBtn = this.add.container(0, 70);
        let rBg = this.add.graphics();
        rBg.fillStyle(0xff0000, 0.2);
        rBg.lineStyle(2, 0xff0000, 1);
        rBg.fillRoundedRect(-80, -25, 160, 50, 25);
        rBg.strokeRoundedRect(-80, -25, 160, 50, 25);
        let rTxt = this.add.text(0, 0, 'RESTART', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff0000'
        }).setOrigin(0.5);
        restartBtn.add([rBg, rTxt]);
        restartBtn.setSize(160, 50);
        restartBtn.setInteractive({ useHandCursor: true });
        
        restartBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        goContainer.add([bg, title, scoreTxt, restartBtn]);
    }
}
