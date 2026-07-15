export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.colors = window.GAME_COLORS;
        this.colorIndex = 0;
        this.fallSpeed = 200;
        this.score = 0;
        this.combo = 0;
        this.lastPassedColor = -1;
        this.ringsPassed = 0;
        this.isGameOver = false;
        this.rings = [];
        
        this.createSkyline();
        
        this.bgStars = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 400 },
            y: { min: 0, max: 700 },
            lifespan: 3000,
            speedY: { min: -20, max: -50 },
            scale: { min: 0.1, max: 0.3 },
            alpha: { min: 0.1, max: 0.3 },
            quantity: 1,
            frequency: 100
        });
        this.bgStars.setScrollFactor(0);
        
        this.indicator = this.add.circle(200, 50, 15, this.colors[this.colorIndex]);
        this.indicator.setStrokeStyle(2, 0xffffff);
        this.indicator.setScrollFactor(0);
        this.indicator.setDepth(10);
        
        this.scoreText = this.add.text(200, 90, 'SCORE: 0', {
            fontSize: '24px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);
        this.scoreText.setDepth(10);

        this.comboText = this.add.text(200, 120, 'COMBO x2!', {
            fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#ffea00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
        this.comboText.setDepth(10);
        
        this.ball = this.add.circle(200, 150, 10, this.colors[this.colorIndex]);
        this.ball.setStrokeStyle(2, 0xffffff);
        this.ball.setDepth(5);
        
        this.emitters = [];
        for (let i = 0; i < 4; i++) {
            let em = this.add.particles(0, 0, 'particle', {
                speed: { min: -10, max: 10 },
                scale: { start: 1, end: 0 },
                alpha: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 400,
                tint: this.colors[i]
            });
            em.startFollow(this.ball);
            em.emitting = (i === this.colorIndex);
            this.emitters.push(em);
        }
        
        this.lastRingY = 400;
        for(let i=0; i<4; i++) {
            this.createRing(this.lastRingY);
            this.lastRingY += Phaser.Math.Between(350, 450);
        }
        
        this.input.on('pointerdown', this.handleAction, this);
        // Safe check for keyboard input
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-SPACE', this.handleAction, this);
        }
        
        this.actionHandler = () => {
            this.handleAction();
        };
        window.addEventListener('colorSwitchAction', this.actionHandler);
        this.events.on('shutdown', () => {
            window.removeEventListener('colorSwitchAction', this.actionHandler);
        });
        
        this.cameras.main.scrollY = 0;
    }
    
    createSkyline() {
        let skyline = this.add.graphics();
        skyline.fillStyle(0x11111a, 1);
        for (let x = 0; x < 400; x += Phaser.Math.Between(30, 60)) {
            let width = Phaser.Math.Between(30, 70);
            let height = Phaser.Math.Between(100, 250);
            skyline.fillRect(x, 400 - height, width, height); 
        }
        skyline.fillStyle(0xffff00, 0.3);
        for (let i = 0; i < 30; i++) {
            let wx = Phaser.Math.Between(10, 390);
            let wy = Phaser.Math.Between(200, 390);
            skyline.fillRect(wx, wy, 4, 8);
        }
    }
    
    createRing(y) {
        let radius = Phaser.Math.Between(70, 110);
        let speed = Phaser.Math.FloatBetween(0.015, 0.04) * Phaser.Math.RND.pick([-1, 1]);
        let ring = this.add.container(200, y);
        
        let graphics = this.add.graphics();
        for (let i = 0; i < 4; i++) {
            graphics.lineStyle(20, this.colors[i], 1);
            graphics.beginPath();
            let startA = i * Math.PI/2 - Math.PI/4;
            let endA = (i+1) * Math.PI/2 - Math.PI/4 - 0.05;
            graphics.arc(0, 0, radius, startA, endA, false);
            graphics.strokePath();
        }
        ring.add(graphics);
        
        let glow = this.add.graphics();
        glow.lineStyle(4, 0xffffff, 0.2);
        glow.strokeCircle(0, 0, radius - 12);
        glow.strokeCircle(0, 0, radius + 12);
        ring.add(glow);
        
        ring.radius = radius;
        ring.speed = speed;
        ring.passedTop = false;
        ring.passedBottom = false;
        this.rings.push(ring);
    }
    
    handleAction() {
        if (this.isGameOver) return;
        
        this.colorIndex = (this.colorIndex + 1) % 4;
        
        this.ball.fillColor = this.colors[this.colorIndex];
        this.indicator.fillColor = this.colors[this.colorIndex];
        
        this.emitters.forEach((em, i) => {
            em.emitting = (i === this.colorIndex);
        });
        
        window.playPopSound();
        
        this.tweens.add({
            targets: this.ball,
            scale: 1.3,
            yoyo: true,
            duration: 80
        });
    }
    
    update(time, delta) {
        if (this.isGameOver) return;
        
        let dt = delta / 1000;
        this.ball.y += this.fallSpeed * dt;
        
        this.cameras.main.scrollY = this.ball.y - 150;
        
        let ballRadius = 10;
        let halfT = 10;
        
        for (let i = this.rings.length - 1; i >= 0; i--) {
            let ring = this.rings[i];
            ring.rotation += ring.speed;
            
            if (ring.y < this.cameras.main.scrollY - 200) {
                ring.destroy();
                this.rings.splice(i, 1);
                
                this.createRing(this.lastRingY);
                this.lastRingY += Phaser.Math.Between(350, 450);
                continue;
            }
            
            let dist = Math.abs(this.ball.y - ring.y);
            let hitZone = Math.abs(dist - ring.radius) < (ballRadius + halfT);
            
            if (hitZone) {
                let dy = this.ball.y - ring.y;
                let dx = this.ball.x - ring.x; 
                let worldAngle = Math.atan2(dy, dx);
                
                let localAngle = worldAngle - ring.rotation;
                let shiftedAngle = localAngle + Math.PI/4;
                while (shiftedAngle < 0) shiftedAngle += Math.PI * 2;
                shiftedAngle = shiftedAngle % (Math.PI * 2);
                
                let segment = Math.floor(shiftedAngle / (Math.PI / 2));
                
                if (this.colorIndex !== segment) {
                    this.triggerGameOver();
                }
            } else {
                if (this.ball.y > ring.y - ring.radius + (ballRadius + halfT)) {
                    if (!ring.passedTop) {
                        ring.passedTop = true;
                    }
                }
                if (this.ball.y > ring.y + ring.radius + (ballRadius + halfT)) {
                    if (!ring.passedBottom) {
                        ring.passedBottom = true;
                        this.ringPassed(ring);
                    }
                }
            }
        }
    }
    
    ringPassed(ring) {
        if (this.colorIndex === this.lastPassedColor) {
            this.combo++;
        } else {
            this.combo = 1;
            this.lastPassedColor = this.colorIndex;
        }
        
        let multiplier = (this.combo >= 3) ? 2 : 1;
        this.score += 1 * multiplier;
        
        if (multiplier > 1) {
            this.comboText.setVisible(true);
            this.comboText.setText('COMBO x2!');
            this.comboText.setScale(1.5);
            this.comboText.setAlpha(1);
            this.tweens.add({
                targets: this.comboText,
                y: this.comboText.y - 20,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    this.comboText.y = 120;
                    this.comboText.setVisible(false);
                }
            });
        }
        
        this.scoreText.setText('SCORE: ' + this.score);
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.3,
            yoyo: true,
            duration: 100
        });
        
        this.ringsPassed++;
        if (this.ringsPassed % 10 === 0) {
            this.fallSpeed += 30;
        }
        
        window.playScoreSound();
    }
    
    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        window.playDieSound();
        
        let explosion = this.add.particles(this.ball.x, this.ball.y, 'particle', {
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: this.colors[this.colorIndex],
            lifespan: 800,
            blendMode: 'ADD'
        });
        explosion.explode(30);
        
        this.ball.setVisible(false);
        this.emitters.forEach(e => e.emitting = false);
        
        this.cameras.main.shake(300, 0.02);
        
        this.time.delayedCall(1500, () => {
            this.scene.start('MenuScene', { score: this.score });
        });
    }
}
