class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const W = this.scale.width, H = this.scale.height;
    
    // Starfield background
    this.bg = this.add.graphics();
    this.bg.fillStyle(0x050511, 1);
    this.bg.fillRect(0, 0, W, H);
    
    for (let i = 0; i < 100; i++) {
        this.bg.fillStyle(0xffffff, Math.random());
        this.bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Math.random() * 1.5 + 0.5);
    }

    // Title
    this.add.text(W/2, H*0.2, 'ORBITAL', { fontFamily: 'Courier', fontSize: '50px', fontStyle: 'bold', color: '#00ffff', stroke: '#0055aa', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(W/2, H*0.3, 'SHIELD', { fontFamily: 'Courier', fontSize: '50px', fontStyle: 'bold', color: '#ff00ff', stroke: '#aa0055', strokeThickness: 4 }).setOrigin(0.5);

    // Decor core
    this.add.circle(W/2, H/2, 40, 0x00ffff, 0.2);
    this.add.circle(W/2, H/2, 20, 0x00ffff, 0.8);

    const hs = localStorage.getItem('orbitalShieldHS') || 0;
    this.add.text(W/2, H*0.65, `HIGH SCORE: ${hs}`, { fontFamily: 'Arial', fontSize: '20px', color: '#ffff00' }).setOrigin(0.5);
    this.add.text(W/2, H*0.72, 'TAP LEFT/RIGHT TO ROTATE SHIELD', { fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);
    this.add.text(W/2, H*0.77, 'MATCH SHIELD COLOR TO METEORS', { fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

    const btn = this.add.text(W/2, H*0.88, 'START SYSTEM', { fontFamily: 'Courier', fontSize: '24px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#aa00aa', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
    btn.on('pointerdown', () => { this.cameras.main.fade(300, 0,0,0); this.time.delayedCall(300, () => this.scene.start('GameScene')); });
    this.tweens.add({ targets: btn, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
  }
}
