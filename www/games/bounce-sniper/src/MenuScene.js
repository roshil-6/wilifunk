class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.progress = JSON.parse(localStorage.getItem('bounceSniperProgress'));
        
        this.add.text(350, 50, 'BOUNCE SNIPER', {
            fontSize: '40px',
            fontFamily: 'Arial',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        for (let i = 0; i < 10; i++) {
            let row = Math.floor(i / 5);
            let col = i % 5;
            let x = 150 + col * 100;
            let y = 150 + row * 100;

            let isUnlocked = i === 0 || this.progress[i-1] > 0;
            
            let bg = this.add.graphics();
            if (isUnlocked) {
                bg.fillStyle(0x333344, 1);
                bg.lineStyle(2, 0x00ffff);
            } else {
                bg.fillStyle(0x11111a, 1);
                bg.lineStyle(2, 0x444455);
            }
            bg.fillRect(x - 40, y - 40, 80, 80);
            bg.strokeRect(x - 40, y - 40, 80, 80);

            if (isUnlocked) {
                this.add.text(x, y - 10, (i + 1).toString(), {
                    fontSize: '30px',
                    fontFamily: 'Arial',
                    color: '#ffffff'
                }).setOrigin(0.5);

                let stars = this.progress[i];
                for (let s = 0; s < 3; s++) {
                    let sx = x - 20 + s * 20;
                    let sy = y + 20;
                    let color = s < stars ? '#ffff00' : '#444444';
                    this.add.text(sx, sy, '★', { fontSize: '20px', color: color }).setOrigin(0.5);
                }

                let hitArea = this.add.zone(x, y, 80, 80).setInteractive();
                hitArea.on('pointerdown', () => {
                    this.scene.start('GameScene', { level: i });
                });
            } else {
                this.add.text(x, y, '🔒', { fontSize: '30px' }).setOrigin(0.5);
            }
        }

        let all3 = this.progress.every(stars => stars === 3);
        if (all3) {
            this.add.text(350, 350, 'CONGRATULATIONS! ALL LEVELS CLEARED PERFECTLY!', {
                fontSize: '20px',
                color: '#ffff00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }
    }
}
