class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.score = 0; this.lives = 3; this.level = 1;

    // Starfield
    this._stars = [];
    for (let i = 0; i < 60; i++) this._stars.push({ x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H), s: Math.random() + 0.3, sp: Math.random() * 0.2 + 0.05 });
    this._bg = this.add.graphics();

    // Brick colors per type
    this.COLORS = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88, 0xff4444, 0xff8800];
    this._buildLevel();

    // Paddle
    this.paddleW = 90; this.paddleH = 12;
    this.paddleX = W / 2;
    this._paddleGfx = this.add.graphics();

    // Ball
    this.ballX = W / 2; this.ballY = H - 80;
    this.ballVX = 3; this.ballVY = -4;
    this.ballR = 8; this.ballActive = false;
    this._ballGfx = this.add.graphics();
    this._trail = [];

    // Particles
    this._parts = [];

    // HUD
    this._scoreTxt = this.add.text(10, 8, 'SCORE: 0', { fontFamily: 'Arial', fontSize: '16px', color: '#00ffff' });
    this._livesTxt = this.add.text(W - 10, 8, '♥♥♥', { fontFamily: 'Arial', fontSize: '16px', color: '#ff4466' }).setOrigin(1, 0);
    this._lvlTxt = this.add.text(W / 2, 8, 'LEVEL 1', { fontFamily: 'Arial', fontSize: '16px', color: '#ffff00' }).setOrigin(0.5, 0);
    this._msg = this.add.text(W / 2, H / 2 - 20, 'TAP TO LAUNCH', { fontFamily: 'Arial Black', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.8);
    this.tweens.add({ targets: this._msg, alpha: 0, duration: 700, yoyo: true, repeat: -1 });

    // Input
    this.input.on('pointermove', p => { this.paddleX = Phaser.Math.Clamp(p.x, this.paddleW/2, W - this.paddleW/2); });
    this.input.on('pointerdown', () => { if (!this.ballActive) { this.ballActive = true; this._msg.setVisible(false); } });

    // Mobile left/right buttons
    const isMobile = window.matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      const lBtn = this.add.rectangle(50, H - 40, 90, 60, 0x003344, 0.5).setInteractive().setDepth(10);
      this.add.text(50, H - 40, '◀', { fontSize: '28px', color: '#00ffff' }).setOrigin(0.5).setDepth(10);
      const rBtn = this.add.rectangle(W - 50, H - 40, 90, 60, 0x003344, 0.5).setInteractive().setDepth(10);
      this.add.text(W - 50, H - 40, '▶', { fontSize: '28px', color: '#00ffff' }).setOrigin(0.5).setDepth(10);
      lBtn.on('pointerdown', () => { this._mleft = true; }).on('pointerup', () => { this._mleft = false; }).on('pointerout', () => { this._mleft = false; });
      rBtn.on('pointerdown', () => { this._mright = true; }).on('pointerup', () => { this._mright = false; }).on('pointerout', () => { this._mright = false; });
    }
    this._mleft = false; this._mright = false;
    this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this._gameOver = false;
    this._won = false;
  }

  _buildLevel() {
    const W = this.W;
    this.bricks = [];
    const cols = 8, rows = 4 + this.level;
    const bW = Math.floor((W - 20) / cols), bH = 22;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = (this.level >= 3 && Math.random() < 0.3) ? 2 : 1;
        this.bricks.push({ x: 10 + c * bW + bW/2, y: 60 + r * (bH + 4), w: bW - 4, h: bH, hp, maxHp: hp, color: this.COLORS[(r + c) % this.COLORS.length], alive: true, explosive: Math.random() < 0.07 });
      }
    }
    this._brickGfx = this._brickGfx || this.add.graphics();
  }

  _drawBricks() {
    this._brickGfx.clear();
    for (const b of this.bricks) {
      if (!b.alive) continue;
      const alpha = b.hp === 2 ? 1 : 0.85;
      this._brickGfx.fillStyle(b.color, alpha);
      this._brickGfx.fillRoundedRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h, 4);
      this._brickGfx.lineStyle(2, 0xffffff, 0.3);
      this._brickGfx.strokeRoundedRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h, 4);
      if (b.hp === 2) { this._brickGfx.lineStyle(2, 0xffaa00, 0.9); this._brickGfx.strokeRoundedRect(b.x - b.w/2 + 2, b.y - b.h/2 + 2, b.w - 4, b.h - 4, 3); }
    }
  }

  _spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3 + 1;
      this._parts.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, color, r: Math.random() * 3 + 1 });
    }
  }

  _showGameOver(won) {
    const W = this.W, H = this.H;
    this._gameOver = true;
    const msg = won ? '🎉 YOU WIN!' : '💀 GAME OVER';
    const col = won ? '#00ffff' : '#ff4444';
    this.add.rectangle(W/2, H/2, 300, 200, 0x000000, 0.85).setDepth(20);
    this.add.text(W/2, H/2 - 50, msg, { fontFamily: 'Arial Black', fontSize: '28px', color: col }).setOrigin(0.5).setDepth(21);
    this.add.text(W/2, H/2, `SCORE: ${this.score}`, { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    const hs = Math.max(this.score, parseInt(localStorage.getItem('neonBreakoutHS') || 0));
    localStorage.setItem('neonBreakoutHS', hs);
    this.add.text(W/2, H/2 + 35, `BEST: ${hs}`, { fontFamily: 'Arial', fontSize: '18px', color: '#ffff00' }).setOrigin(0.5).setDepth(21);
    const rb = this.add.text(W/2, H/2 + 80, '[ RESTART ]', { fontFamily: 'Arial Black', fontSize: '20px', color: '#00ffff' }).setOrigin(0.5).setInteractive().setDepth(21);
    rb.on('pointerdown', () => this.scene.restart());
  }

  update(time, delta) {
    const W = this.W, H = this.H;
    const dt = delta / 16.67;
    if (this._gameOver) return;

    // BG
    this._bg.clear();
    this._bg.fillStyle(0x000510, 1); this._bg.fillRect(0, 0, W, H);
    for (const s of this._stars) { s.y += s.sp * dt; if (s.y > H) s.y = 0; this._bg.fillStyle(0xffffff, 0.5); this._bg.fillCircle(s.x, s.y, s.s); }

    // Move paddle
    const spd = 6 * dt;
    if (this.cursors && this.cursors.left.isDown || this._mleft) this.paddleX = Math.max(this.paddleW/2, this.paddleX - spd * 4);
    if (this.cursors && this.cursors.right.isDown || this._mright) this.paddleX = Math.min(W - this.paddleW/2, this.paddleX + spd * 4);

    // Ball follows paddle when inactive
    if (!this.ballActive) { this.ballX = this.paddleX; this.ballY = H - 80; }
    else {
      const speed = 4 + this.level * 0.5;
      const mag = Math.sqrt(this.ballVX**2 + this.ballVY**2);
      this.ballVX = this.ballVX / mag * speed;
      this.ballVY = this.ballVY / mag * speed;

      // Trail
      this._trail.push({ x: this.ballX, y: this.ballY, a: 1 });
      if (this._trail.length > 12) this._trail.shift();

      this.ballX += this.ballVX * dt;
      this.ballY += this.ballVY * dt;

      // Wall bounce
      if (this.ballX <= this.ballR) { this.ballX = this.ballR; this.ballVX = Math.abs(this.ballVX); }
      if (this.ballX >= W - this.ballR) { this.ballX = W - this.ballR; this.ballVX = -Math.abs(this.ballVX); }
      if (this.ballY <= this.ballR + 35) { this.ballY = this.ballR + 35; this.ballVY = Math.abs(this.ballVY); }

      // Paddle collision
      const py = H - 52;
      if (this.ballY + this.ballR >= py && this.ballY - this.ballR < py + this.paddleH &&
          this.ballX >= this.paddleX - this.paddleW/2 && this.ballX <= this.paddleX + this.paddleW/2) {
        this.ballVY = -Math.abs(this.ballVY);
        const hitPos = (this.ballX - this.paddleX) / (this.paddleW / 2);
        this.ballVX = hitPos * 5;
        this.ballY = py - this.ballR - 1;
      }

      // Lost
      if (this.ballY > H + 20) {
        this.lives--;
        this._livesTxt.setText('♥'.repeat(Math.max(0, this.lives)));
        if (this.lives <= 0) { this._showGameOver(false); return; }
        this.ballActive = false;
        this._trail = [];
        this._msg.setVisible(true).setAlpha(0.8);
      }

      // Brick collision
      for (const b of this.bricks) {
        if (!b.alive) continue;
        if (this.ballX + this.ballR > b.x - b.w/2 && this.ballX - this.ballR < b.x + b.w/2 &&
            this.ballY + this.ballR > b.y - b.h/2 && this.ballY - this.ballR < b.y + b.h/2) {
          b.hp--;
          if (b.hp <= 0) {
            b.alive = false;
            this.score += 10 * this.level;
            this._scoreTxt.setText(`SCORE: ${this.score}`);
            this._spawnParticles(b.x, b.y, b.color);
            if (b.explosive) {
              for (const nb of this.bricks) {
                if (nb.alive && Math.abs(nb.x - b.x) < 90 && Math.abs(nb.y - b.y) < 50) { nb.alive = false; this._spawnParticles(nb.x, nb.y, nb.color); this.score += 5; }
              }
            }
          }
          // Bounce
          const overlapX = Math.min(Math.abs(this.ballX - (b.x - b.w/2)), Math.abs(this.ballX - (b.x + b.w/2)));
          const overlapY = Math.min(Math.abs(this.ballY - (b.y - b.h/2)), Math.abs(this.ballY - (b.y + b.h/2)));
          if (overlapX < overlapY) this.ballVX *= -1; else this.ballVY *= -1;
          break;
        }
      }

      // Level clear
      if (this.bricks.every(b => !b.alive)) {
        if (this.level < 3) {
          this.level++;
          this._lvlTxt.setText(`LEVEL ${this.level}`);
          this._buildLevel();
          this.ballActive = false; this._trail = [];
          this._msg.setVisible(true).setAlpha(0.8);
        } else {
          this._showGameOver(true);
        }
      }
    }

    // Draw
    this._drawBricks();

    // Paddle
    this._paddleGfx.clear();
    this._paddleGfx.fillStyle(0x00ffff, 0.9);
    this._paddleGfx.fillRoundedRect(this.paddleX - this.paddleW/2, H - 52, this.paddleW, this.paddleH, 6);
    this._paddleGfx.lineStyle(2, 0xffffff, 0.7);
    this._paddleGfx.strokeRoundedRect(this.paddleX - this.paddleW/2, H - 52, this.paddleW, this.paddleH, 6);

    // Trail + ball
    this._ballGfx.clear();
    for (let i = 0; i < this._trail.length; i++) {
      const t = this._trail[i]; const a = (i / this._trail.length) * 0.5;
      this._ballGfx.fillStyle(0x00ffff, a); this._ballGfx.fillCircle(t.x, t.y, this.ballR * 0.7);
    }
    this._ballGfx.fillStyle(0xffffff, 1); this._ballGfx.fillCircle(this.ballX, this.ballY, this.ballR);
    this._ballGfx.lineStyle(3, 0x00ffff, 0.8); this._ballGfx.strokeCircle(this.ballX, this.ballY, this.ballR + 3);

    // Particles
    const pg = this._ballGfx;
    for (let i = this._parts.length - 1; i >= 0; i--) {
      const p = this._parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.1 * dt; p.life -= 0.03 * dt;
      if (p.life <= 0) { this._parts.splice(i, 1); continue; }
      pg.fillStyle(p.color, p.life); pg.fillCircle(p.x, p.y, p.r * p.life);
    }
  }
}
