class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cx = W/2; this.cy = H/2;

    this.score = 0;
    this.hp = 100;
    this.gameOver = false;
    this.shieldAngle = 0;
    this.shieldRadius = 80;
    this.colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88];
    this.colorIdx = 0;

    // Background
    this.bg = this.add.graphics();
    this.bg.fillStyle(0x050511, 1);
    this.bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
        this.bg.fillStyle(0xffffff, Math.random() * 0.5 + 0.1);
        this.bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Math.random() * 1.5);
    }

    // Core
    this.coreGfx = this.add.graphics();
    this.corePulse = 0;

    // Shield
    this.shieldGfx = this.add.graphics();
    
    // Meteors
    this.meteors = [];
    this.meteorSpeed = 100;
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;

    // Particles
    this.parts = [];

    // HUD
    this.hpText = this.add.text(10, 10, 'CORE: 100%', { fontFamily: 'Courier', fontSize: '18px', color: '#ffffff' });
    this.scoreText = this.add.text(W - 10, 10, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '18px', color: '#ffff00' }).setOrigin(1, 0);

    // Input zones for rotation
    const leftZone = this.add.zone(0, 0, W/2, H).setOrigin(0, 0).setInteractive();
    const rightZone = this.add.zone(W/2, 0, W/2, H).setOrigin(0, 0).setInteractive();

    leftZone.on('pointerdown', () => { this.rotDir = -1; });
    leftZone.on('pointerup', () => { this.rotDir = 0; });
    leftZone.on('pointerout', () => { this.rotDir = 0; });

    rightZone.on('pointerdown', () => { this.rotDir = 1; });
    rightZone.on('pointerup', () => { this.rotDir = 0; });
    rightZone.on('pointerout', () => { this.rotDir = 0; });

    // Keyboard Input - Safe Check
    if (this.input.keyboard) {
        this.input.keyboard.on('keydown-LEFT', () => { this.rotDir = -1; });
        this.input.keyboard.on('keyup-LEFT', () => { this.rotDir = 0; });
        this.input.keyboard.on('keydown-RIGHT', () => { this.rotDir = 1; });
        this.input.keyboard.on('keyup-RIGHT', () => { this.rotDir = 0; });
    }

    // Tap center to change color
    const centerZone = this.add.circle(this.cx, this.cy, 50, 0x000000, 0).setInteractive();
    centerZone.on('pointerdown', () => {
        this.colorIdx = (this.colorIdx + 1) % this.colors.length;
    });

    this.rotDir = 0;
  }

  spawnMeteor() {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(this.W, this.H);
      const x = this.cx + Math.cos(angle) * dist;
      const y = this.cy + Math.sin(angle) * dist;
      const cIdx = Phaser.Math.Between(0, this.colors.length - 1);
      
      this.meteors.push({
          x, y, 
          vx: -Math.cos(angle) * this.meteorSpeed,
          vy: -Math.sin(angle) * this.meteorSpeed,
          color: this.colors[cIdx],
          colorIdx: cIdx,
          active: true
      });
  }

  spawnParts(x, y, color) {
      for (let i=0; i<15; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = Math.random() * 100 + 50;
          this.parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1.0, color });
      }
  }

  update(time, delta) {
      if (this.gameOver) return;
      const dt = delta / 1000;

      // Rotate shield
      if (this.rotDir !== 0) {
          this.shieldAngle += this.rotDir * 3.5 * dt;
      }

      // Draw core
      this.corePulse += dt * 3;
      this.coreGfx.clear();
      this.coreGfx.fillStyle(0xffffff, 1);
      this.coreGfx.fillCircle(this.cx, this.cy, 20);
      this.coreGfx.lineStyle(2, this.colors[this.colorIdx], 0.5 + Math.sin(this.corePulse)*0.5);
      this.coreGfx.strokeCircle(this.cx, this.cy, 25 + Math.sin(this.corePulse)*5);

      // Draw shield
      this.shieldGfx.clear();
      this.shieldGfx.lineStyle(8, this.colors[this.colorIdx], 1);
      this.shieldGfx.beginPath();
      // Shield covers about 90 degrees (PI/2)
      this.shieldGfx.arc(this.cx, this.cy, this.shieldRadius, this.shieldAngle - Math.PI/4, this.shieldAngle + Math.PI/4, false);
      this.shieldGfx.strokePath();

      // Meteors
      this.spawnTimer += dt;
      if (this.spawnTimer > this.spawnInterval) {
          this.spawnTimer = 0;
          this.spawnMeteor();
          this.spawnInterval = Math.max(0.4, this.spawnInterval - 0.05); // get faster
          this.meteorSpeed += 5;
      }

      for (let i = this.meteors.length - 1; i >= 0; i--) {
          const m = this.meteors[i];
          if (!m.active) continue;
          
          m.x += m.vx * dt;
          m.y += m.vy * dt;

          const distToCore = Phaser.Math.Distance.Between(m.x, m.y, this.cx, this.cy);
          
          // Check shield collision
          if (distToCore <= this.shieldRadius + 10 && distToCore >= this.shieldRadius - 10) {
              const angleToMeteor = Phaser.Math.Angle.Between(this.cx, this.cy, m.x, m.y);
              let diff = Phaser.Math.Angle.Wrap(angleToMeteor - this.shieldAngle);
              
              if (Math.abs(diff) < Math.PI/4) {
                  // Hit shield! Check color
                  if (m.colorIdx === this.colorIdx) {
                      this.score += 10;
                      this.scoreText.setText(`SCORE: ${this.score}`);
                      this.spawnParts(m.x, m.y, m.color);
                      m.active = false;
                  } else {
                      // Wrong color on shield = damage!
                      this.hp -= 15;
                      this.spawnParts(m.x, m.y, 0xff0000);
                      m.active = false;
                  }
              }
          } else if (distToCore < 20) {
              // Hit core
              this.hp -= 25;
              this.spawnParts(this.cx, this.cy, 0xff0000);
              m.active = false;
          }

          if (this.hp <= 0 && !this.gameOver) {
              this.endGame();
          }

          if (m.active) {
              this.shieldGfx.fillStyle(m.color, 1);
              this.shieldGfx.fillCircle(m.x, m.y, 8);
              this.shieldGfx.fillStyle(0xffffff, 0.8);
              this.shieldGfx.fillCircle(m.x, m.y, 3);
          }
      }

      this.meteors = this.meteors.filter(m => m.active);
      this.hpText.setText(`CORE: ${Math.max(0, this.hp)}%`);

      // Particles
      for (let i = this.parts.length - 1; i >= 0; i--) {
          const p = this.parts[i];
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.life -= dt * 2;
          if (p.life <= 0) {
              this.parts.splice(i, 1);
          } else {
              this.shieldGfx.fillStyle(p.color, p.life);
              this.shieldGfx.fillCircle(p.x, p.y, 4 * p.life);
          }
      }
  }

  endGame() {
      this.gameOver = true;
      const hs = Math.max(this.score, parseInt(localStorage.getItem('orbitalShieldHS') || 0));
      localStorage.setItem('orbitalShieldHS', hs);

      const overlay = this.add.rectangle(this.cx, this.cy, this.W, this.H, 0x000000, 0.8).setDepth(20);
      this.add.text(this.cx, this.cy - 40, 'CORE BREACHED', { fontFamily: 'Courier', fontStyle: 'bold', fontSize: '32px', color: '#ff0000' }).setOrigin(0.5).setDepth(21);
      this.add.text(this.cx, this.cy + 10, `SCORE: ${this.score}  BEST: ${hs}`, { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
      
      const rb = this.add.text(this.cx, this.cy + 60, '[ REBOOT SYSTEM ]', { fontFamily: 'Courier', fontStyle: 'bold', fontSize: '20px', color: '#00ffff' }).setOrigin(0.5).setInteractive().setDepth(21);
      this.tweens.add({ targets: rb, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
      
      rb.on('pointerdown', () => { this.scene.start('MenuScene'); });
  }
}
