class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, 100, 'MAZE RUNNER', {
            fontFamily: 'Orbitron',
            fontSize: '36px',
            color: '#ffb300',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, 'STEALTH PURSUIT', {
            fontFamily: 'Outfit',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const totalGold = this.registry.get('totalGold');
        this.add.text(width / 2, height - 50, `TOTAL GOLD: ${totalGold}`, {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const unlockedLevels = this.registry.get('unlockedLevels');
        
        // Define levels
        const levels = [
            { id: 1, x: width / 2 - 80, y: 300 },
            { id: 2, x: width / 2 + 80, y: 300 },
            { id: 3, x: width / 2 - 80, y: 460 },
            { id: 4, x: width / 2 + 80, y: 460 }
        ];

        levels.forEach(lvl => {
            const isUnlocked = lvl.id <= unlockedLevels;
            
            const btn = this.add.graphics();
            btn.fillStyle(isUnlocked ? 0xff5722 : 0x555555, 1);
            btn.fillRoundedRect(lvl.x - 60, lvl.y - 60, 120, 120, 16);
            btn.lineStyle(4, isUnlocked ? 0xffffff : 0x333333, 1);
            btn.strokeRoundedRect(lvl.x - 60, lvl.y - 60, 120, 120, 16);

            this.add.text(lvl.x, lvl.y, `LVL ${lvl.id}`, {
                fontFamily: 'Orbitron',
                fontSize: '28px',
                color: isUnlocked ? '#ffffff' : '#999999'
            }).setOrigin(0.5);

            if (isUnlocked) {
                // Invisible interactive hit zone
                const hit = this.add.zone(lvl.x, lvl.y, 120, 120).setInteractive({ useHandCursor: true });
                hit.on('pointerdown', () => {
                    this.scene.start('GameScene', { level: lvl.id });
                    this.scene.launch('UIScene');
                });
            } else {
                this.add.text(lvl.x, lvl.y + 40, '🔒 LOCKED', {
                    fontFamily: 'Outfit',
                    fontSize: '14px',
                    color: '#aaaaaa'
                }).setOrigin(0.5);
            }
        });
    }
}
