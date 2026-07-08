class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = 300;
    this.gravityReversed = false;
    this.gameOver = false;
    this.timer = 0;

    // Physics
    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, W, H);

    // Background
    this.bg = this.add.graphics();
    this.bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
    this.bg.fillRect(0, 0, W, H);

    // Floor and Ceiling
    this.floor = this.add.rectangle(W/2, H, W, 40, 0x111133).setDepth(5);
    this.physics.add.existing(this.floor, true);
    this.ceiling = this.add.rectangle(W/2, 0, W, 40, 0x111133).setDepth(5);
    this.physics.add.existing(this.ceiling, true);

    // Player
    this.player = this.add.rectangle(100, H/2, 30, 30, 0x00ffff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    
    // Collisions
    this.physics.add.collider(this.player, this.floor);
    this.physics.add.collider(this.player, this.ceiling);

    // Groups
    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();
    
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // Input
    this.input.on('pointerdown', this.flipGravity, this);
    this.input.keyboard.on('keydown-SPACE', this.flipGravity, this);

    // Particles
    this.coinParticles = this.add.particles(0, 0, 'coin', {
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        emitting: false
    });

    // Trail
    this.trail = [];
    this.trailGfx = this.add.graphics();

    // HUD
    this.distText = this.add.text(10, 10, '0m', { fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff' }).setDepth(10);
    this.scoreText = this.add.text(W - 10, 10, 'SCORE: 0', { fontFamily: 'Arial Black', fontSize: '24px', color: '#ffff00' }).setOrigin(1, 0).setDepth(10);
  }

  flipGravity() {
    if (this.gameOver) return;
    if (this.player.body.touching.down || this.player.body.touching.up) {
      this.gravityReversed = !this.gravityReversed;
      this.physics.world.gravity.y = this.gravityReversed ? -800 : 800;
      this.player.body.velocity.y = 0; // reset velocity when flipping
    }
  }

  spawnObstacle() {
    if (this.gameOver) return;
    const isCeiling = Math.random() > 0.5;
    const w = Phaser.Math.Between(30, 80);
    const h = Phaser.Math.Between(30, 120);
    const y = isCeiling ? 20 + h/2 : this.H - 20 - h/2;
    
    const obs = this.add.rectangle(this.W + 50, y, w, h, 0xff0044);
    obs.setStrokeStyle(2, 0xffcccc);
    this.physics.add.existing(obs);
    obs.body.setAllowGravity(false);
    obs.body.setVelocityX(-this.gameSpeed);
    this.obstacles.add(obs);
  }

  spawnCoin() {
      if (this.gameOver) return;
      const y = Phaser.Math.Between(60, this.H - 60);
      const coin = this.add.circle(this.W + 50, y, 12, 0xffff00);
      coin.setStrokeStyle(2, 0xffffff);
      this.physics.add.existing(coin);
      coin.body.setAllowGravity(false);
      coin.body.setVelocityX(-this.gameSpeed);
      this.coins.add(coin);
  }

  hitObstacle() {
    this.gameOver = true;
    this.physics.pause();
    this.player.fillColor = 0xff0000;
    
    const hs = Math.max(this.score, parseInt(localStorage.getItem('gravityShiftHS') || 0));
    localStorage.setItem('gravityShiftHS', hs);

    const overlay = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0x000000, 0.7).setDepth(20);
    this.add.text(this.W/2, this.H/2 - 40, 'GAME OVER', { fontFamily: 'Arial Black', fontSize: '36px', color: '#ff4444' }).setOrigin(0.5).setDepth(21);
    this.add.text(this.W/2, this.H/2 + 10, `SCORE: ${this.score} | DIST: ${Math.floor(this.distance)}m`, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    
    const restartBtn = this.add.text(this.W/2, this.H/2 + 60, 'TAP TO RESTART', { fontFamily: 'Arial Black', fontSize: '24px', color: '#00ffff' }).setOrigin(0.5).setInteractive().setDepth(21);
    this.tweens.add({ targets: restartBtn, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    
    this.time.delayedCall(500, () => {
        this.input.once('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    });
  }

  collectCoin(player, coin) {
      coin.destroy();
      this.score += 50;
      this.scoreText.setText(`SCORE: ${this.score}`);
      // simple particle effect alternative since we don't have texture
      for(let i=0; i<8; i++) {
          const p = this.add.circle(coin.x, coin.y, 4, 0xffff00);
          this.tweens.add({
              targets: p,
              x: p.x + Phaser.Math.Between(-50, 50),
              y: p.y + Phaser.Math.Between(-50, 50),
              alpha: 0,
              scale: 0.1,
              duration: 500,
              onComplete: () => p.destroy()
          });
      }
  }

  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    
    // Distance and speed
    this.distance += (this.gameSpeed * dt) / 10;
    this.distText.setText(`${Math.floor(this.distance)}m`);
    
    this.gameSpeed += 5 * dt; // speed up slowly
    
    // Spawning logic
    this.timer += dt;
    if (this.timer > 1.5) {
        this.timer = 0;
        if (Math.random() > 0.3) this.spawnObstacle();
        if (Math.random() > 0.4) this.spawnCoin();
        
        // Update velocity of existing objects to match new game speed
        this.obstacles.getChildren().forEach(obs => {
            obs.body.setVelocityX(-this.gameSpeed);
        });
        this.coins.getChildren().forEach(coin => {
            coin.body.setVelocityX(-this.gameSpeed);
        });
    }

    // Cleanup offscreen objects
    this.obstacles.getChildren().forEach(obs => { if (obs.x < -100) obs.destroy(); });
    this.coins.getChildren().forEach(coin => { if (coin.x < -50) coin.destroy(); });

    // Trail effect
    this.trail.push({ x: this.player.x, y: this.player.y, a: 1 });
    if (this.trail.length > 10) this.trail.shift();
    
    this.trailGfx.clear();
    for(let i=0; i < this.trail.length; i++) {
        const t = this.trail[i];
        this.trailGfx.fillStyle(0x00ffff, (i / this.trail.length) * 0.5);
        this.trailGfx.fillRect(t.x - 15, t.y - 15, 30, 30);
    }
  }
}
