class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x050510, 1);
        bg.fillRect(0, 0, 400, 700);
        
        bg.lineStyle(1, 0x112233, 0.5);
        for(let i=0; i<400; i+=20) {
            bg.moveTo(i, 0); bg.lineTo(i, 700);
        }
        for(let i=0; i<700; i+=20) {
            bg.moveTo(0, i); bg.lineTo(400, i);
        }
        bg.strokePath();

        // Title
        this.add.text(200, 200, 'CYBER\nCONNECT', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#00ffff',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 10, true, true);

        // Play Button
        const btn = this.add.container(200, 450);
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xff00ff, 0.2);
        btnBg.lineStyle(2, 0xff00ff, 1);
        btnBg.fillRoundedRect(-80, -30, 160, 60, 10);
        btnBg.strokeRoundedRect(-80, -30, 160, 60, 10);
        
        const btnText = this.add.text(0, 0, 'PLAY', {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 5, true, true);
        
        btn.add([btnBg, btnText]);
        btn.setSize(160, 60);
        btn.setInteractive();
        
        btn.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 0 });
        });

        // Generate particles texture for later
        if (!this.textures.exists('particle')) {
            const gfx = this.make.graphics({x:0, y:0, add:false});
            gfx.fillStyle(0xffffff);
            gfx.fillCircle(4, 4, 4);
            gfx.generateTexture('particle', 8, 8);
        }
    }
}
