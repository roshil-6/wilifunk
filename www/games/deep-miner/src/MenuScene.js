class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.rectangle(0, 0, 400, 700, 0x110800).setOrigin(0);

        this.add.text(200, 150, 'DEEP CORE\nMINER', {
            fontSize: '48px',
            fill: '#ffb74d',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#ff0000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        let instructions = "Dig deep into the earth.\nCollect gems for score.\nGrab oxygen (cyan) to survive.\nAvoid the hard rocks.";
        this.add.text(200, 300, instructions, {
            fontSize: '18px',
            fill: '#cccccc',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        let playBtn = this.add.rectangle(200, 500, 200, 60, 0x0088ff)
            .setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'));
            
        this.add.text(200, 500, 'START DIGGING', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Decorative glowing dots
        for (let i = 0; i < 30; i++) {
            let x = Math.random() * 400;
            let y = Math.random() * 700;
            let dot = this.add.circle(x, y, Math.random() * 3 + 1, 0x00ffff, 0.6);
            this.tweens.add({
                targets: dot,
                alpha: 0.1,
                yoyo: true,
                repeat: -1,
                duration: 1000 + Math.random() * 2000
            });
        }
    }
}
