class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.levelIndex = data.level || 0;
    }

    create() {
        this.progress = JSON.parse(localStorage.getItem('bounceSniperProgress'));
        
        this.levels = [
            { p: {x: 50, y: 200}, t: {x: 650, y: 200}, b: [] }, 
            { p: {x: 50, y: 200}, t: {x: 650, y: 200}, b: [{x: 340, y: 150, w: 20, h: 250}] }, 
            { p: {x: 50, y: 350}, t: {x: 650, y: 350}, b: [{x: 300, y: 200, w: 20, h: 200}, {x: 400, y: 0, w: 20, h: 200}] }, 
            { p: {x: 50, y: 50}, t: {x: 650, y: 50}, b: [{x: 200, y: 0, w: 20, h: 300}, {x: 450, y: 100, w: 20, h: 300}] }, 
            { p: {x: 350, y: 350}, t: {x: 350, y: 50}, b: [{x: 200, y: 150, w: 300, h: 20}] }, 
            { p: {x: 100, y: 350}, t: {x: 600, y: 350}, b: [{x: 340, y: 0, w: 20, h: 320}] }, 
            { p: {x: 50, y: 50}, t: {x: 650, y: 350}, b: [{x: 300, y: 0, w: 20, h: 150}, {x: 400, y: 250, w: 20, h: 150}] }, 
            { p: {x: 50, y: 200}, t: {x: 650, y: 200}, b: [{x: 200, y: 50, w: 20, h: 300}, {x: 450, y: 50, w: 20, h: 300}] }, 
            { p: {x: 100, y: 100}, t: {x: 600, y: 300}, b: [{x: 250, y: 0, w: 20, h: 250}, {x: 450, y: 150, w: 20, h: 250}] }, 
            { p: {x: 50, y: 350}, t: {x: 350, y: 200}, b: [{x: 250, y: 250, w: 200, h: 20}, {x: 250, y: 150, w: 20, h: 100}, {x: 430, y: 150, w: 20, h: 100}] }
        ];
        
        this.currentLevel = this.levels[this.levelIndex];
        
        this.generateTextures();

        this.add.image(350, 200, 'bg');
        
        this.barriers = this.physics.add.staticGroup();
        this.currentLevel.b.forEach(b => {
            let block = this.add.tileSprite(b.x + b.w/2, b.y + b.h/2, b.w, b.h, 'barrier');
            this.barriers.add(block);
        });

        this.target = this.physics.add.sprite(this.currentLevel.t.x, this.currentLevel.t.y, 'target');
        this.target.setCircle(15);
        this.target.setImmovable(true);
        
        this.shotsLeft = 3;
        this.uiText = this.add.text(20, 20, `Level: ${this.levelIndex + 1}   Shots: ${this.shotsLeft}`, {
            fontSize: '20px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold'
        });

        this.backBtn = this.add.text(680, 20, 'MENU', {
            fontSize: '20px', fontFamily: 'Arial', color: '#fff', backgroundColor: '#333344', padding: {x:10, y:5}
        }).setOrigin(1, 0).setInteractive();
        this.backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        
        this.restartBtn = this.add.text(580, 20, 'RESTART', {
            fontSize: '20px', fontFamily: 'Arial', color: '#fff', backgroundColor: '#333344', padding: {x:10, y:5}
        }).setOrigin(1, 0).setInteractive();
        this.restartBtn.on('pointerdown', () => this.scene.start('GameScene', { level: this.levelIndex }));
        
        this.playerSpawn = this.currentLevel.p;
        this.spawnBall();
        
        this.trajectoryGraphics = this.add.graphics();
        
        this.input.on('pointerdown', this.startAim, this);
        this.input.on('pointermove', this.updateAim, this);
        this.input.on('pointerup', this.fireBall, this);
        
        this.state = 'aiming'; // aiming, flying, done
        this.physics.world.setBounds(0, 0, 700, 400);

        this.physics.world.on('worldbounds', (body) => {
            if (this.ball && body.gameObject === this.ball) {
                this.bounces++;
                this.checkBounces();
            }
        });

        this.trail = this.add.particles(0, 0, 'particle', {
            speed: 0,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 300,
            blendMode: 'ADD'
        });
        this.trail.stop();
    }

    generateTextures() {
        if (!this.textures.exists('bg')) {
            let g = this.add.graphics();
            g.fillStyle(0x1a1a24, 1);
            g.fillRect(0, 0, 700, 400);
            g.generateTexture('bg', 700, 400);
            g.destroy();
        }
        if (!this.textures.exists('barrier')) {
            let g = this.add.graphics();
            g.fillStyle(0x222233, 1);
            g.fillRect(0, 0, 20, 20);
            g.lineStyle(1, 0x11111a);
            g.strokeRect(0, 0, 20, 20);
            g.generateTexture('barrier', 20, 20);
            g.destroy();
        }
        if (!this.textures.exists('ball')) {
            let g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(10, 10, 10);
            g.lineStyle(2, 0x00ffff);
            g.strokeCircle(10, 10, 10);
            g.generateTexture('ball', 20, 20);
            g.destroy();
        }
        if (!this.textures.exists('target')) {
            let g = this.add.graphics();
            g.fillStyle(0xff0000, 1);
            g.fillCircle(15, 15, 15);
            g.fillStyle(0x000000, 1);
            g.fillCircle(10, 12, 3);
            g.fillCircle(20, 12, 3);
            g.fillRect(10, 20, 10, 3);
            g.generateTexture('target', 30, 30);
            g.destroy();
        }
        if (!this.textures.exists('particle')) {
            let g = this.add.graphics();
            g.fillStyle(0x00ffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('particle', 8, 8);
            g.destroy();
        }
    }

    spawnBall() {
        if (this.ball) this.ball.destroy();
        this.ball = this.physics.add.sprite(this.playerSpawn.x, this.playerSpawn.y, 'ball');
        this.ball.setCircle(10);
        this.ball.setBounce(1, 1);
        this.ball.setCollideWorldBounds(true);
        this.ball.body.onWorldBounds = true;
        this.bounces = 0;

        this.physics.add.collider(this.ball, this.barriers, () => {
            this.bounces++;
            this.checkBounces();
        });

        this.physics.add.overlap(this.ball, this.target, this.hitTarget, null, this);
    }

    checkBounces() {
        if (this.bounces > 5) {
            this.ball.destroy();
            this.trail.stop();
            this.state = 'done';
            
            let missedText = this.add.text(350, 200, 'MISSED!', { fontSize: '40px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
            this.time.delayedCall(1000, () => {
                missedText.destroy();
                this.nextShot();
            });
        }
    }

    startAim(pointer) {
        if (this.state !== 'aiming') return;
        // Ignore clicks on buttons
        let targets = this.input.hitTestPointer(pointer);
        let clickedButton = targets.some(t => t === this.backBtn || t === this.restartBtn);
        if (clickedButton) return;
        
        this.isAiming = true;
        this.updateAim(pointer);
    }

    updateAim(pointer) {
        if (!this.isAiming || this.state !== 'aiming') return;
        
        let dx = pointer.x - this.ball.x;
        let dy = pointer.y - this.ball.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
            this.aimVx = (dx / dist) * 600; 
            this.aimVy = (dy / dist) * 600;
            this.drawTrajectory(this.ball.x, this.ball.y, this.aimVx, this.aimVy);
        }
    }

    drawTrajectory(startX, startY, vx, vy) {
        this.trajectoryGraphics.clear();
        let pts = this.getTrajectory(startX, startY, vx, vy, this.currentLevel.b);
        
        this.trajectoryGraphics.lineStyle(2, 0x00ffff, 0.8);
        this.trajectoryGraphics.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i % 2 === 0 && i < pts.length - 1) {
                this.trajectoryGraphics.moveTo(pts[i].x, pts[i].y);
                this.trajectoryGraphics.lineTo(pts[i+1].x, pts[i+1].y);
            }
        }
        this.trajectoryGraphics.strokePath();
    }

    getTrajectory(startX, startY, vx, vy, barriers) {
        let pts = [];
        let x = startX, y = startY;
        let dx = vx * 0.016, dy = vy * 0.016; 
        let bounces = 0;
        let r = 10;
        let maxSteps = 300;
        
        for(let i=0; i<maxSteps; i++){
            let nextX = x + dx;
            let nextY = y + dy;
            let hit = false;
            
            if (nextX - r < 0) { nextX = r; dx *= -1; hit = true; }
            else if (nextX + r > 700) { nextX = 700 - r; dx *= -1; hit = true; }
            
            if (nextY - r < 0) { nextY = r; dy *= -1; hit = true; }
            else if (nextY + r > 400) { nextY = 400 - r; dy *= -1; hit = true; }
            
            for(let b of barriers) {
                if (nextX + r > b.x && nextX - r < b.x + b.w && nextY + r > b.y && nextY - r < b.y + b.h) {
                    let wasLeft = x + r <= b.x;
                    let wasRight = x - r >= b.x + b.w;
                    let wasTop = y + r <= b.y;
                    let wasBottom = y - r >= b.y + b.h;
                    
                    if (wasLeft) { nextX = b.x - r; dx *= -1; hit = true; }
                    else if (wasRight) { nextX = b.x + b.w + r; dx *= -1; hit = true; }
                    else if (wasTop) { nextY = b.y - r; dy *= -1; hit = true; }
                    else if (wasBottom) { nextY = b.y + b.h + r; dy *= -1; hit = true; }
                    else { dx *= -1; dy *= -1; hit = true; }
                }
            }
            
            x = nextX;
            y = nextY;
            if (i % 3 === 0) pts.push({x, y});
            
            if (hit) bounces++;
            if (bounces > 5) break; 
        }
        return pts;
    }

    fireBall(pointer) {
        if (!this.isAiming || this.state !== 'aiming') return;
        this.isAiming = false;
        this.trajectoryGraphics.clear();
        
        if (this.aimVx && this.aimVy) {
            this.state = 'flying';
            this.ball.setVelocity(this.aimVx, this.aimVy);
            this.shotsLeft--;
            this.uiText.setText(`Level: ${this.levelIndex + 1}   Shots: ${this.shotsLeft}`);
            this.trail.startFollow(this.ball);
            this.trail.start();
        }
    }

    update() {
        if (this.state === 'flying' && this.ball && this.ball.active) {
            if (Math.abs(this.ball.body.velocity.x) < 5 && Math.abs(this.ball.body.velocity.y) < 5) {
                this.ball.destroy();
                this.trail.stop();
                this.state = 'done';
                let missedText = this.add.text(350, 200, 'STOPPED!', { fontSize: '40px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
                this.time.delayedCall(1000, () => {
                    missedText.destroy();
                    this.nextShot();
                });
            }
        }
    }

    hitTarget(ball, target) {
        ball.destroy();
        this.trail.stop();
        target.destroy();
        this.state = 'done';
        
        let stars = 1;
        if (this.bounces <= 3) stars = 2;
        if (this.bounces <= 1) stars = 3; 

        if (this.progress[this.levelIndex] < stars) {
            this.progress[this.levelIndex] = stars;
            localStorage.setItem('bounceSniperProgress', JSON.stringify(this.progress));
        }

        let g = this.add.graphics();
        g.fillStyle(0x000000, 0.8);
        g.fillRect(0, 0, 700, 400);

        this.add.text(350, 100, 'TARGET DESTROYED!', { fontSize: '40px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);
        
        for (let s = 0; s < 3; s++) {
            let color = s < stars ? '#ffff00' : '#444444';
            this.add.text(300 + s * 50, 200, '★', { fontSize: '60px', color: color }).setOrigin(0.5);
        }

        this.time.delayedCall(2000, () => {
            if (this.levelIndex < 9) {
                this.scene.start('GameScene', { level: this.levelIndex + 1 });
            } else {
                this.scene.start('MenuScene');
            }
        });
    }

    nextShot() {
        if (this.shotsLeft > 0) {
            this.spawnBall();
            this.state = 'aiming';
        } else {
            let g = this.add.graphics();
            g.fillStyle(0x000000, 0.8);
            g.fillRect(0, 0, 700, 400);
            this.add.text(350, 200, 'OUT OF SHOTS\nTOUCH TO RESTART', { fontSize: '30px', color: '#ff0000', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
            
            this.time.delayedCall(500, () => {
                this.input.once('pointerdown', () => {
                    this.scene.start('GameScene', { level: this.levelIndex });
                });
            });
        }
    }
}
