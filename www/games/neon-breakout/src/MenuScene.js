class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    // Starfield
    this._stars = [];
    for (let i = 0; i < 80; i++) {
      this._stars.push({ x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H), s: Math.random() * 1.5 + 0.5, sp: Math.random() * 0.3 + 0.1 });
    }
    this._bg = this.add.graphics();

    // Title glow
    this.add.text(W / 2, H * 0.22, 'NEON', { fontFamily: 'Arial Black, Arial', fontSize: '64px', color: '#00ffff', stroke: '#004466', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.34, 'BREAKOUT', { fontFamily: 'Arial Black, Arial', fontSize: '44px', color: '#ff00ff', stroke: '#440044', strokeThickness: 6 }).setOrigin(0.5);

    const hs = localStorage.getItem('neonBreakoutHS') || 0;
    this.add.text(W / 2, H * 0.50, `HIGH SCORE: ${hs}`, { fontFamily: 'Arial', fontSize: '22px', color: '#ffff00' }).setOrigin(0.5);

    // Play button
    const btn = this.add.graphics();
    btn.fillStyle(0x00ffff, 0.15); btn.fillRoundedRect(W/2-100, H*0.62-28, 200, 56, 12);
    btn.lineStyle(3, 0x00ffff, 1); btn.strokeRoundedRect(W/2-100, H*0.62-28, 200, 56, 12);
    const btnTxt = this.add.text(W/2, H*0.62, 'PLAY', { fontFamily: 'Arial Black', fontSize: '28px', color: '#00ffff' }).setOrigin(0.5);

    this.add.zone(W/2, H*0.62, 200, 56).setInteractive().on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });
    this.tweens.add({ targets: btnTxt, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
  }

  update() {
    const W = this.scale.width, H = this.scale.height;
    this._bg.clear();
    this._bg.fillStyle(0x000510, 1); this._bg.fillRect(0, 0, W, H);
    for (const s of this._stars) {
      s.y += s.sp; if (s.y > H) s.y = 0;
      this._bg.fillStyle(0xffffff, 0.6); this._bg.fillCircle(s.x, s.y, s.s);
    }
  }
}
