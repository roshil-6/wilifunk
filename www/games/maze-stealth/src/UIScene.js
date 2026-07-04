class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.scoreText = this.add.text(20, 20, 'GOLD: 0/0', {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        });

        const gameScene = this.scene.get('GameScene');

        gameScene.events.on('scoreGold', (data) => {
            this.scoreText.setText(`GOLD: ${data.current}/${data.max}`);
            
            this.tweens.add({
                targets: this.scoreText,
                scale: 1.2,
                duration: 100,
                yoyo: true
            });
        });

        gameScene.events.on('levelFailed', () => {
            this.showOverlay(width, height, 'YOU WERE CAUGHT!', '#ff0000', 'TRY AGAIN', () => {
                this.scene.stop('GameScene');
                this.scene.start('GameScene', { level: gameScene.currentLevel });
            });
        });

        gameScene.events.on('levelComplete', () => {
            this.showOverlay(width, height, 'LEVEL CLEARED!', '#00ff00', 'CONTINUE', () => {
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            });
        });
    }

    showOverlay(w, h, titleStr, titleColor, btnStr, callback) {
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.8);
        panel.fillRect(0, 0, w, h);

        const title = this.add.text(w/2, h/2 - 60, titleStr, {
            fontFamily: 'Orbitron',
            fontSize: '32px',
            color: titleColor,
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xffffff, 1);
        btnBg.fillRoundedRect(w/2 - 100, h/2 + 20, 200, 50, 16);

        const btnText = this.add.text(w/2, h/2 + 45, btnStr, {
            fontFamily: 'Outfit',
            fontSize: '20px',
            color: '#000000',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        const hitZone = this.add.zone(w/2, h/2 + 45, 200, 50).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', callback);
    }
}
