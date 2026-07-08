class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.createBackground();

        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x00ffff, 0.8);
        
        let hexRadius = 60;
        let points = this.getHexPoints(200, 220, hexRadius);
        graphics.strokePoints(points, true, true);
        
        this.add.text(200, 220, 'HEX', {
            fontSize: '48px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.add.text(200, 280, 'SURVIVE', {
            fontSize: '48px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#00ffff'
        }).setOrigin(0.5, 0.5);

        let instructionText = this.add.text(200, 360, "Tap adjacent tiles to move.\nAvoid RED falling tiles!\nGrab GOLD for score,\nGREEN for freeze.", {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#aaaaaa',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        let playBtn = this.add.text(200, 500, 'TAP TO START', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff',
            backgroundColor: '#0055ff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: playBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        playBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }

    createBackground() {
        for (let i = 0; i < 100; i++) {
            let x = Phaser.Math.Between(0, 400);
            let y = Phaser.Math.Between(0, 700);
            let alpha = Phaser.Math.FloatBetween(0.2, 0.8);
            let star = this.add.circle(x, y, Math.random() > 0.8 ? 2 : 1, 0xffffff, alpha);
            
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }
    }

    getHexPoints(x, y, radius) {
        let points = [];
        for (let i = 0; i < 6; i++) {
            let angle = (60 * i) * Math.PI / 180;
            points.push(new Phaser.Math.Vector2(x + radius * Math.cos(angle), y + radius * Math.sin(angle)));
        }
        return points;
    }
}
