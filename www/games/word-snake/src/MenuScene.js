class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background grid effect
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x111133, 0.5);
        for (let i = 0; i <= 400; i += 20) {
            graphics.moveTo(i, 0);
            graphics.lineTo(i, 700);
        }
        for (let j = 0; j <= 700; j += 20) {
            graphics.moveTo(0, j);
            graphics.lineTo(400, j);
        }
        graphics.strokePath();

        // Title
        this.add.text(200, 250, 'WORD\nSNAKE', {
            fontSize: '56px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#00ff00',
            align: 'center',
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00ff00',
                blur: 20,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(200, 380, 'Eat letters to spell words!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.container(200, 480);
        
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x00ff00, 0.2);
        btnBg.lineStyle(2, 0x00ff00, 1);
        btnBg.fillRoundedRect(-80, -25, 160, 50, 25);
        btnBg.strokeRoundedRect(-80, -25, 160, 50, 25);
        
        const btnText = this.add.text(0, 0, 'PLAY', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#00ff00'
        }).setOrigin(0.5);

        startBtn.add([btnBg, btnText]);
        startBtn.setSize(160, 50);
        startBtn.setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x00ff00, 0.4);
            btnBg.lineStyle(2, 0x00ff00, 1);
            btnBg.fillRoundedRect(-80, -25, 160, 50, 25);
            btnBg.strokeRoundedRect(-80, -25, 160, 50, 25);
        });

        startBtn.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x00ff00, 0.2);
            btnBg.lineStyle(2, 0x00ff00, 1);
            btnBg.fillRoundedRect(-80, -25, 160, 50, 25);
            btnBg.strokeRoundedRect(-80, -25, 160, 50, 25);
        });

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Instructions
        this.add.text(200, 600, 'Swipe or use Arrow Keys', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
    }
}
