class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const saveData = this.registry.get('saveData');

        // Scrolling space background
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'space_bg');

        // Title glow
        const glow = this.add.text(400, 145, 'INFINITE CROSSER', {
            font: 'bold 50px Courier', fill: '#ff00ff'
        }).setOrigin(0.5).setAlpha(0.3);

        // Title
        const title = this.add.text(400, 140, 'INFINITE CROSSER', {
            font: 'bold 50px Courier', fill: '#00ffff'
        }).setOrigin(0.5);
        title.setStroke('#9c27b0', 6);

        this.tweens.add({
            targets: [title, glow], y: 125,
            duration: 2000, ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1
        });

        // Subtitle
        this.add.text(400, 200, 'A BIOME CROSSER ADVENTURE', {
            font: '18px Courier', fill: '#9c27b0'
        }).setOrigin(0.5);

        // High score
        this.add.text(400, 235, `HIGH SCORE: ${saveData.highScore}`, {
            font: 'bold 22px Courier', fill: '#ffeb3b'
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.text(400, 330, '▶  TAP TO PLAY', {
            font: 'bold 34px Courier', fill: '#000000',
            backgroundColor: '#00ffff',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: playBtn, scaleX: 1.06, scaleY: 1.06,
            duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        playBtn.on('pointerover', () => playBtn.setFill('#9c27b0'));
        playBtn.on('pointerout', () => playBtn.setFill('#000000'));
        playBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });

        // Character Archive
        const shopBtn = this.add.text(400, 430, '★  CHARACTER ARCHIVE', {
            font: 'bold 22px Courier', fill: '#ffeb3b',
            backgroundColor: '#1a0a2e',
            padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        shopBtn.on('pointerover', () => this.tweens.add({ targets: shopBtn, scaleX: 1.08, scaleY: 1.08, duration: 80 }));
        shopBtn.on('pointerout', () => this.tweens.add({ targets: shopBtn, scaleX: 1, scaleY: 1, duration: 80 }));
        shopBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ShopScene'));
        });

        // Controls hint
        this.add.text(400, 520, '← ↑ ↓ →  ARROW KEYS TO MOVE', {
            font: '16px Courier', fill: '#555555'
        }).setOrigin(0.5);

        // Coin count
        this.add.text(400, 550, `YOUR COINS: ${saveData.coins}  ★`, {
            font: '16px Courier', fill: '#ffeb3b'
        }).setOrigin(0.5);
    }

    update() {
        this.bg.tilePositionY -= 0.4;
        this.bg.tilePositionX -= 0.2;
    }
}
