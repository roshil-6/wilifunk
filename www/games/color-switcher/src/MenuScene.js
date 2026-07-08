export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }
    
    init(data) {
        this.lastScore = data.score || 0;
    }
    
    create() {
        if (!this.textures.exists('particle')) {
            let g = this.make.graphics({x:0, y:0, add:false});
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('particle', 8, 8);
        }
        
        this.add.text(200, 250, 'COLOR SWITCHER', {
            fontSize: '36px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        if (this.lastScore > 0) {
            this.add.text(200, 320, 'SCORE: ' + this.lastScore, {
                fontSize: '24px', fontFamily: 'Arial, sans-serif', color: '#00ff4d', fontStyle: 'bold'
            }).setOrigin(0.5);
        }
        
        let btn = this.add.text(200, 450, 'TAP TO START', {
            fontSize: '28px', fontFamily: 'Arial, sans-serif', color: '#ffea00', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: btn,
            alpha: 0.2,
            yoyo: true,
            repeat: -1,
            duration: 800
        });
        
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        this.startHandler = () => {
            this.scene.start('GameScene');
        };
        window.addEventListener('colorSwitchAction', this.startHandler);
        this.events.on('shutdown', () => {
            window.removeEventListener('colorSwitchAction', this.startHandler);
        });
    }
}
