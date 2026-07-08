class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a2a1a, 0x0a2a1a, 0x05150d, 0x05150d, 1);
        bg.fillRect(0, 0, 400, 700);

        this.drawBgTrees();

        this.add.text(200, 150, 'LUMBERJACK', {
            fontFamily: 'Courier, monospace',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.add.text(200, 210, 'DASH', {
            fontFamily: 'Courier, monospace',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const highScore = localStorage.getItem('lumberjack_highscore') || 0;
        this.add.text(200, 320, `HIGH SCORE: ${highScore}`, {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const instruction = this.add.text(200, 500, 'TAP TO START', {
            fontFamily: 'Courier, monospace',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: instruction,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        const start = () => {
            this.scene.start('GameScene');
        };
        
        this.input.on('pointerdown', start);
        
        this.chopLeftHandler = start;
        this.chopRightHandler = start;
        window.addEventListener('chop-left', this.chopLeftHandler);
        window.addEventListener('chop-right', this.chopRightHandler);

        this.events.on('shutdown', () => {
            window.removeEventListener('chop-left', this.chopLeftHandler);
            window.removeEventListener('chop-right', this.chopRightHandler);
        });
    }

    drawBgTrees() {
        const bg = this.add.graphics();
        bg.fillStyle(0x082014, 1);
        for(let i=0; i<8; i++) {
            const x = Phaser.Math.Between(0, 400);
            const w = Phaser.Math.Between(15, 25);
            const h = Phaser.Math.Between(200, 400);
            bg.fillRect(x - w/2, 700 - h, w, h);
            
            bg.fillStyle(0x0a301a, 1);
            bg.fillTriangle(x, 700 - h - 50, x - w*2, 700 - h + 100, x + w*2, 700 - h + 100);
            bg.fillTriangle(x, 700 - h - 120, x - w*1.5, 700 - h + 20, x + w*1.5, 700 - h + 20);
            bg.fillStyle(0x082014, 1);
        }
    }
}
