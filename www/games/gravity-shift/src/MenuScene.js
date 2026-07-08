class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const W = this.scale.width, H = this.scale.height;
    // Gradient background
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
    g.fillRect(0, 0, W, H);
    // Grid lines
    g.lineStyle(1, 0x2233ff, 0.3);
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath(); }

    this.add.text(W/2, H*0.22, 'GRAVITY', { fontFamily: 'Arial Black', fontSize: '54px', color: '#ffffff', stroke: '#4444ff', strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(W/2, H*0.35, 'SHIFT', { fontFamily: 'Arial Black', fontSize: '54px', color: '#88aaff', stroke: '#4444ff', strokeThickness: 8 }).setOrigin(0.5);

    const hs = localStorage.getItem('gravityShiftHS') || 0;
    this.add.text(W/2, H*0.52, `BEST: ${hs}m`, { fontFamily: 'Arial', fontSize: '20px', color: '#aaaaff' }).setOrigin(0.5);
    this.add.text(W/2, H*0.62, 'TAP / CLICK TO FLIP GRAVITY', { fontFamily: 'Arial', fontSize: '14px', color: '#8888cc' }).setOrigin(0.5);

    const btn = this.add.text(W/2, H*0.74, '▶  PLAY', { fontFamily: 'Arial Black', fontSize: '26px', color: '#ffffff', backgroundColor: '#3333cc', padding: { x: 30, y: 14 } }).setOrigin(0.5).setInteractive();
    btn.on('pointerdown', () => { this.cameras.main.fade(300,0,0,0); this.time.delayedCall(300, () => this.scene.start('GameScene')); });
    this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
  }
}
