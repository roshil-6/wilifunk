class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.R = 33;
        this.cols = 7;
        this.rows = 9;
        
        this.hexes = [];
        this.hexMap = new Map();
        
        this.score = 0;
        this.timeSurvived = 0;
        this.gameOver = false;
        this.frozen = false;
        
        this.createBackground();
        this.createGrid();
        
        this.player = {
            hex: this.getHex(3, 4), // Middle
            sprite: this.add.graphics()
        };
        this.drawPlayer();
        
        this.createHUD();
        this.createMobileControls();
        
        this.input.on('pointerdown', this.handleTap, this);
        
        // Timers
        this.survivalTimer = this.time.addEvent({
            delay: 1000,
            callback: this.tickSurvival,
            callbackScope: this,
            loop: true
        });
        
        this.dangerInterval = 1500;
        this.dangerCount = 1;
        this.startDangerTimer();
    }

    createBackground() {
        for (let i = 0; i < 100; i++) {
            let x = Phaser.Math.Between(0, 400);
            let y = Phaser.Math.Between(0, 700);
            let alpha = Phaser.Math.FloatBetween(0.2, 0.8);
            let star = this.add.circle(x, y, Math.random() > 0.8 ? 2 : 1, 0xffffff, alpha);
            
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createGrid() {
        let startX = 51.5;
        let startY = 121.4;
        
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                let x = startX + c * 1.5 * this.R;
                let y = startY + r * Math.sqrt(3) * this.R + (c % 2 === 1 ? Math.sqrt(3)/2 * this.R : 0);
                
                let hex = {
                    c, r, x, y,
                    state: 'SAFE',
                    type: this.rollHexType(),
                    graphics: this.add.graphics(),
                    container: this.add.container(x, y),
                    stateTimer: 0,
                    tween: null,
                    shakeTween: null
                };
                
                hex.container.add(hex.graphics);
                this.hexes.push(hex);
                this.hexMap.set(`${c},${r}`, hex);
                this.drawHex(hex);
            }
        }
    }

    rollHexType() {
        let rand = Math.random();
        if (rand < 0.04) return 'FREEZE';
        if (rand < 0.10) return 'SUPER';
        return 'NORMAL';
    }

    getHex(c, r) {
        return this.hexMap.get(`${c},${r}`);
    }

    getNeighbors(c, r) {
        let parity = c & 1;
        let oddq_dirs = [
            [[+1,  0], [+1, -1], [ 0, -1], [-1, -1], [-1,  0], [ 0, +1]],
            [[+1, +1], [+1,  0], [ 0, -1], [-1,  0], [-1, +1], [ 0, +1]]
        ];
        let dirs = parity ? oddq_dirs[1] : oddq_dirs[0];
        let neighbors = [];
        for (let i = 0; i < dirs.length; i++) {
            let d = dirs[i];
            let n = this.getHex(c + d[0], r + d[1]);
            neighbors.push(n || null); // Keep index alignment for mobile controls
        }
        return neighbors;
    }
    
    isAdjacent(hexA, hexB) {
        let neighbors = this.getNeighbors(hexA.c, hexA.r);
        return neighbors.some(n => n === hexB);
    }

    drawHex(hex) {
        if (hex.state === 'DEAD') {
            hex.graphics.clear();
            return;
        }

        let lineColor = 0x00ffff;
        let fillAlpha = 0;
        let fillColor = 0x000000;
        let lineWidth = 2;

        if (hex.state === 'SAFE') {
            if (hex.type === 'SUPER') {
                lineColor = 0xffd700;
                lineWidth = 3;
            } else if (hex.type === 'FREEZE') {
                lineColor = 0x00ffaa;
                lineWidth = 4;
            } else {
                lineColor = 0x0088ff;
            }
        } else if (hex.state === 'WARNING') {
            lineColor = 0xff8800;
            fillColor = 0xff4400;
            fillAlpha = 0.3;
            lineWidth = 4;
        } else if (hex.state === 'FALLING') {
            lineColor = 0xff0000;
            fillColor = 0xff0000;
            fillAlpha = 0.6;
            lineWidth = 5;
        }

        hex.graphics.clear();
        hex.graphics.lineStyle(lineWidth, lineColor, 1);
        if (fillAlpha > 0) hex.graphics.fillStyle(fillColor, fillAlpha);

        let points = [];
        for (let i = 0; i < 6; i++) {
            let angle = (60 * i) * Math.PI / 180;
            points.push(new Phaser.Math.Vector2(this.R * Math.cos(angle), this.R * Math.sin(angle)));
        }

        if (fillAlpha > 0) hex.graphics.fillPoints(points, true, true);
        hex.graphics.strokePoints(points, true, true);
    }
    
    setHexState(hex, state) {
        if (hex.state === 'DEAD' || this.gameOver) return;
        hex.state = state;
        
        if (hex.tween) {
            hex.tween.stop();
            hex.tween = null;
        }
        hex.container.alpha = 1;
        hex.container.scale = 1;
        hex.container.x = hex.x;
        hex.container.y = hex.y;

        if (state === 'WARNING') {
            hex.stateTimer = 1500;
            hex.tween = this.tweens.add({
                targets: hex.container,
                alpha: 0.4,
                yoyo: true,
                repeat: -1,
                duration: 200
            });
        } else if (state === 'FALLING') {
            hex.stateTimer = 400; // 0.4s to fall
            hex.tween = this.tweens.add({
                targets: hex.container,
                scaleX: 0,
                scaleY: 0,
                duration: 400,
                ease: 'Back.easeIn'
            });
            hex.shakeTween = this.tweens.add({
                targets: hex.container,
                x: hex.x + (Math.random() > 0.5 ? 2 : -2),
                y: hex.y + (Math.random() > 0.5 ? 2 : -2),
                yoyo: true,
                repeat: -1,
                duration: 40
            });
        } else if (state === 'DEAD') {
            if (hex.shakeTween) hex.shakeTween.stop();
            hex.graphics.clear();
            this.checkPlayerDeath();
            this.updateRemainingTiles();
        }
        
        this.drawHex(hex);
    }
    
    update(time, delta) {
        if (this.gameOver) return;

        for (let hex of this.hexes) {
            if (this.frozen && hex.state === 'WARNING') {
                continue; // pause their warning progress
            }
            if (hex.state === 'WARNING') {
                hex.stateTimer -= delta;
                if (hex.stateTimer <= 0) {
                    this.setHexState(hex, 'FALLING');
                }
            } else if (hex.state === 'FALLING') {
                hex.stateTimer -= delta;
                if (hex.stateTimer <= 0) {
                    this.setHexState(hex, 'DEAD');
                }
            }
        }
    }

    startDangerTimer() {
        this.dangerEvent = this.time.addEvent({
            delay: this.dangerInterval,
            callback: this.spawnDanger,
            callbackScope: this,
            loop: true
        });
    }

    spawnDanger() {
        if (this.gameOver || this.frozen) return;
        
        let safeHexes = this.hexes.filter(h => h.state === 'SAFE');
        if (safeHexes.length === 0) return;

        Phaser.Utils.Array.Shuffle(safeHexes);
        let count = Math.min(this.dangerCount, safeHexes.length);
        for (let i = 0; i < count; i++) {
            this.setHexState(safeHexes[i], 'WARNING');
        }
    }
    
    tickSurvival() {
        if (this.gameOver) return;
        this.timeSurvived++;
        this.score += 1;
        
        if (this.timeSurvived % 10 === 0) {
            this.dangerCount++;
        }
        if (this.timeSurvived % 15 === 0 && this.dangerInterval > 600) {
            this.dangerInterval -= 200;
            this.dangerEvent.remove(false);
            this.startDangerTimer();
        }
        
        this.updateHUD();
    }
    
    handleTap(pointer) {
        if (this.gameOver) return;
        
        // Prevent hex clicking if tapping the control area (Y > 580)
        if (pointer.y > 580 && (window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))) return;

        let closestDist = Infinity;
        let targetHex = null;

        for (let hex of this.hexes) {
            if (hex.state === 'DEAD') continue;
            let dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, hex.x, hex.y);
            if (dist < closestDist) {
                closestDist = dist;
                targetHex = hex;
            }
        }

        if (targetHex && closestDist < 45) {
            if (this.isAdjacent(this.player.hex, targetHex)) {
                this.movePlayer(targetHex);
            } else if (targetHex === this.player.hex) {
                this.highlightValidMoves();
            }
        }
    }
    
    movePlayer(hex) {
        this.player.hex = hex;
        
        this.tweens.add({
            targets: this.player.sprite,
            x: hex.x,
            y: hex.y,
            duration: 150,
            ease: 'Power2'
        });

        if (hex.type === 'SUPER') {
            this.score += 10;
            hex.type = 'NORMAL';
            this.drawHex(hex);
            this.showFloatingText(hex.x, hex.y, '+10', 0xffd700);
            this.updateHUD();
        } else if (hex.type === 'FREEZE') {
            this.triggerFreeze();
            hex.type = 'NORMAL';
            this.drawHex(hex);
            this.showFloatingText(hex.x, hex.y, 'FREEZE!', 0x00ffaa);
        }
        
        this.checkPlayerDeath();
    }
    
    drawPlayer() {
        this.player.sprite.clear();
        this.player.sprite.fillStyle(0xffffff, 1);
        this.player.sprite.fillCircle(0, 0, 15);
        this.player.sprite.lineStyle(2, 0x00ffff, 1);
        this.player.sprite.strokeCircle(0, 0, 18);
        
        this.player.sprite.fillStyle(0x00ffff, 0.4);
        this.player.sprite.fillCircle(0, 0, 22);

        this.player.sprite.x = this.player.hex.x;
        this.player.sprite.y = this.player.hex.y;
        this.player.sprite.setDepth(10);
    }
    
    checkPlayerDeath() {
        if (this.player.hex.state === 'DEAD') {
            this.die();
        }
    }

    die() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.survivalTimer.remove(false);
        this.dangerEvent.remove(false);
        
        this.tweens.add({
            targets: this.player.sprite,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            ease: 'Back.easeIn'
        });

        this.time.delayedCall(1000, () => {
            this.showGameOver();
        });
    }
    
    triggerFreeze() {
        this.frozen = true;
        this.cameras.main.flash(500, 0, 255, 170, 0.2);
        
        this.time.delayedCall(3000, () => {
            this.frozen = false;
        });
    }

    createHUD() {
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setDepth(20);

        this.tilesText = this.add.text(400 - 20, 20, 'Tiles: ' + this.hexes.length, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(20);
    }

    updateHUD() {
        this.scoreText.setText('Score: ' + this.score);
    }

    updateRemainingTiles() {
        let remaining = this.hexes.filter(h => h.state !== 'DEAD').length;
        this.tilesText.setText('Tiles: ' + remaining);
        if (remaining === 0 && !this.gameOver) {
            this.die(); 
        }
    }
    
    showFloatingText(x, y, message, color) {
        let t = this.add.text(x, y - 20, message, {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: color === 0xffd700 ? '#ffd700' : '#00ffaa'
        }).setOrigin(0.5).setDepth(15);

        this.tweens.add({
            targets: t,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => t.destroy()
        });
    }
    
    highlightValidMoves() {
        let neighbors = this.getNeighbors(this.player.hex.c, this.player.hex.r);
        for (let n of neighbors) {
            if (n && n.state !== 'DEAD') {
                let glow = this.add.graphics();
                glow.lineStyle(4, 0xffffff, 0.8);
                
                let points = [];
                for (let i = 0; i < 6; i++) {
                    let angle = (60 * i) * Math.PI / 180;
                    points.push(new Phaser.Math.Vector2(this.R * Math.cos(angle), this.R * Math.sin(angle)));
                }
                glow.strokePoints(points, true, true);
                glow.x = n.x;
                glow.y = n.y;
                glow.setDepth(5);
                
                this.tweens.add({
                    targets: glow,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => glow.destroy()
                });
            }
        }
    }
    
    createMobileControls() {
        const isMobile = window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobile) return;

        let controlContainer = this.add.container(200, 630).setDepth(100);
        let btnRadius = 24;
        let spacing = 50;
        
        let dirs = [
            { id: 'T', ang: -90, idx: 2 },
            { id: 'TR', ang: -30, idx: 1 },
            { id: 'BR', ang: 30, idx: 0 },
            { id: 'B', ang: 90, idx: 5 },
            { id: 'BL', ang: 150, idx: 4 },
            { id: 'TL', ang: 210, idx: 3 }
        ];

        for (let d of dirs) {
            let rad = Phaser.Math.DegToRad(d.ang);
            let bx = spacing * Math.cos(rad);
            let by = spacing * Math.sin(rad);
            
            let btn = this.add.circle(bx, by, btnRadius, 0xffffff, 0.15).setInteractive();
            let label = this.add.text(bx, by, d.id, {
                fontSize: '14px', fill: '#fff', fontStyle: 'bold'
            }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                btn.setFillStyle(0xffffff, 0.4);
                this.moveInDirection(d.idx);
            });
            btn.on('pointerup', () => btn.setFillStyle(0xffffff, 0.15));
            btn.on('pointerout', () => btn.setFillStyle(0xffffff, 0.15));
            
            controlContainer.add([btn, label]);
        }
    }
    
    moveInDirection(idx) {
        if (this.gameOver) return;
        let neighbors = this.getNeighbors(this.player.hex.c, this.player.hex.r);
        let target = neighbors[idx];
        if (target && target.state !== 'DEAD') {
            this.movePlayer(target);
        }
    }

    showGameOver() {
        let overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.7).setDepth(30);
        
        this.add.text(200, 250, 'GAME OVER', {
            fontSize: '40px',
            fontFamily: 'Arial',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(31);

        this.add.text(200, 310, 'Score: ' + this.score, {
            fontSize: '32px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(31);

        let restartBtn = this.add.text(200, 450, 'RESTART', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#0055ff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(31);

        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
