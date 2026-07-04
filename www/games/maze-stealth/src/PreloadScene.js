class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.add.text(width / 2, height / 2, 'GENERATING MAZE...', {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // We use setTimeout to ensure the text renders before the heavy procedural drawing
        setTimeout(() => {
            this.generateTextures();
            this.scene.start('MenuScene');
        }, 100);
    }

    generateTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 1. Player Avatar (Blue character, 40x40)
        g.clear();
        g.fillStyle(0x4287f5, 1);
        g.fillRoundedRect(0, 0, 40, 40, 16); // Body
        g.fillStyle(0xffffff, 1);
        g.fillCircle(12, 16, 6); // Left eye
        g.fillCircle(28, 16, 6); // Right eye
        g.fillStyle(0x000000, 1);
        g.fillCircle(14, 16, 3);
        g.fillCircle(30, 16, 3);
        g.generateTexture('player', 40, 40);

        // 2. Seeker Avatar (Pink chaser, 40x40)
        g.clear();
        g.fillStyle(0xff5bbe, 1);
        g.fillRoundedRect(0, 0, 40, 40, 16);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(12, 16, 6);
        g.fillCircle(28, 16, 6);
        g.fillStyle(0x990000, 1); // Angry eyes
        g.fillCircle(14, 16, 3);
        g.fillCircle(30, 16, 3);
        g.lineStyle(3, 0xffffff, 1);
        g.beginPath();
        g.moveTo(6, 6); g.lineTo(16, 12);
        g.moveTo(34, 6); g.lineTo(24, 12);
        g.strokePath();
        g.generateTexture('enemy', 40, 40);

        // 3. Wall Block (Orange angular structure, 60x60)
        g.clear();
        g.fillStyle(0xff5722, 1);
        g.fillRect(0, 0, 60, 60);
        g.fillStyle(0xe64a19, 1); // Darker border/shadow
        g.fillRect(0, 50, 60, 10);
        g.fillRect(50, 0, 10, 60);
        g.fillStyle(0xff8a65, 1); // Highlight
        g.fillRect(0, 0, 60, 5);
        g.fillRect(0, 0, 5, 60);
        g.generateTexture('wall', 60, 60);

        // 4. Locked Door Block (Brown wood style, 60x60)
        g.clear();
        g.fillStyle(0x5d4037, 1);
        g.fillRect(0, 0, 60, 60);
        g.lineStyle(2, 0x3e2723, 1);
        g.strokeRect(4, 4, 24, 52);
        g.strokeRect(32, 4, 24, 52);
        g.fillStyle(0xffd54f, 1);
        g.fillCircle(28, 30, 4); // Lock
        g.generateTexture('door', 60, 60);

        // 5. Pressure Switch Plate (Yellow/Orange base, 40x40)
        g.clear();
        g.fillStyle(0xffb300, 1);
        g.fillRoundedRect(0, 0, 40, 40, 8);
        g.fillStyle(0xffca28, 1);
        g.fillRoundedRect(4, 4, 32, 32, 6);
        g.fillStyle(0xf44336, 1); // Red button center
        g.fillCircle(20, 20, 10);
        g.generateTexture('plate', 40, 40);
        
        // 5b. Pressed Plate (Green)
        g.clear();
        g.fillStyle(0x7cb342, 1);
        g.fillRoundedRect(0, 0, 40, 40, 8);
        g.fillStyle(0x8bc34a, 1);
        g.fillRoundedRect(4, 4, 32, 32, 6);
        g.generateTexture('plate_pressed', 40, 40);

        // 6. Gold Treasure (Gold Bar, 30x20)
        g.clear();
        g.fillStyle(0xffd700, 1);
        g.fillRect(0, 0, 30, 20);
        g.fillStyle(0xfff59d, 1);
        g.fillRect(2, 2, 26, 4); // Top shine
        g.fillStyle(0xf57f17, 1);
        g.fillRect(2, 14, 26, 4); // Bottom shadow
        g.generateTexture('gold', 30, 20);
        
        // 7. Danger Aura (Enemy Sight Indicator)
        g.clear();
        g.fillStyle(0xff0000, 0.3);
        g.fillCircle(30, 30, 30);
        g.generateTexture('aura', 60, 60);
    }
}
