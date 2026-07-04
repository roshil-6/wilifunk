class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Loading bar
        let barBg = this.add.graphics();
        barBg.fillStyle(0x222222, 1);
        barBg.fillRoundedRect(200, 280, 400, 24, 12);

        let bar = this.add.graphics();
        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0x00ffff, 1);
            bar.fillRoundedRect(200, 280, 400 * value, 24, 12);
        });

        this.add.text(400, 250, 'LOADING ARCADE...', { font: 'bold 20px Courier', fill: '#ffffff' }).setOrigin(0.5);

        // No external images needed! Everything is generated procedurally.
    }

    create() {
        // Generate all procedural textures that don't need real images
        this.generateTextures();
        this.scene.start('MenuScene');
    }

    generateTextures() {
        const g = this.add.graphics();

        // ===== BACKGROUNDS (800x600) =====
        // Space BG - deep space with stars
        g.fillStyle(0x0a0016, 1); g.fillRect(0, 0, 800, 600);
        g.fillStyle(0xffffff, 1);
        for (let i = 0; i < 200; i++) {
            let s = Math.random() > 0.9 ? 2 : 1;
            g.fillRect(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600), s, s);
        }
        g.fillStyle(0x9900ff, 0.08); g.fillCircle(200, 200, 150);
        g.fillStyle(0x0066ff, 0.06); g.fillCircle(600, 400, 200);
        g.generateTexture('space_bg', 800, 600); g.clear();

        // Snow BG
        g.fillStyle(0xc8e6f5, 1); g.fillRect(0, 0, 800, 600);
        g.fillStyle(0xa0c8e0, 1); g.fillRect(0, 300, 800, 300);
        g.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0,800), Phaser.Math.Between(0,600), Phaser.Math.Between(1,4));
        g.generateTexture('snow_bg', 800, 600); g.clear();

        // Cyberpunk BG
        g.fillStyle(0x020208, 1); g.fillRect(0, 0, 800, 600);
        g.lineStyle(1, 0x00ffff, 0.15);
        for (let i = 0; i < 800; i += 64) { g.moveTo(i,0); g.lineTo(i,600); }
        for (let j = 0; j < 600; j += 64) { g.moveTo(0,j); g.lineTo(800,j); }
        g.strokePath();
        g.fillStyle(0xff00ff, 0.05); g.fillRect(0, 0, 800, 600);
        g.generateTexture('neon_bg', 800, 600); g.clear();

        // ===== ROAD TILES (800x64) =====
        // Safe ground - grassy
        g.fillStyle(0x2d6a1e, 1); g.fillRect(0, 0, 800, 64);
        g.fillStyle(0x3a8a28, 1);
        for (let i = 0; i < 800; i += 64) {
            g.fillRect(i + 4, 4, 56, 56);
        }
        g.fillStyle(0x1e4d12, 1);
        g.fillRect(0, 0, 800, 4); g.fillRect(0, 60, 800, 4);
        g.generateTexture('safe_ground_texture', 800, 64); g.clear();

        // Asteroid Belt road
        g.fillStyle(0x1a1a2e, 1); g.fillRect(0, 0, 800, 64);
        g.fillStyle(0x16213e, 1); g.fillRect(0, 28, 800, 8);
        g.fillStyle(0x4a4a6e, 0.5);
        for (let i = 0; i < 12; i++) g.fillCircle(Phaser.Math.Between(0,800), Phaser.Math.Between(8,56), Phaser.Math.Between(3,8));
        g.generateTexture('asteroid_belt', 800, 64); g.clear();

        // Ice floe road
        g.fillStyle(0x5bc8f5, 1); g.fillRect(0, 0, 800, 64);
        g.fillStyle(0x81d4fa, 0.6);
        for (let i = 0; i < 5; i++) { g.fillRect(i*170+10, 10, 140, 44); }
        g.lineStyle(2, 0xffffff, 0.4);
        g.strokeRect(0, 0, 800, 64);
        g.generateTexture('ice_floe', 800, 64); g.clear();

        // Laser highway
        g.fillStyle(0x0a0a1a, 1); g.fillRect(0, 0, 800, 64);
        g.fillStyle(0x111122, 1); g.fillRect(0, 12, 800, 40);
        g.fillStyle(0x00ffff, 1); g.fillRect(0, 12, 800, 3); g.fillRect(0, 49, 800, 3);
        g.fillStyle(0xff00ff, 0.8);
        for (let i = 0; i < 800; i += 80) g.fillRect(i, 30, 40, 4);
        g.generateTexture('laser_highway', 800, 64); g.clear();

        // ===== HAZARD VEHICLES (96x48) =====
        // Comet / Space rock
        g.fillStyle(0xff5722, 1); g.fillEllipse(48, 24, 80, 36);
        g.fillStyle(0xff8a50, 1); g.fillEllipse(44, 22, 40, 20);
        g.fillStyle(0xffcc80, 1); g.fillCircle(40, 20, 8);
        g.fillStyle(0xff3300, 0.6);
        for (let i = 0; i < 5; i++) g.fillEllipse(80 + i*4, 24 + Phaser.Math.Between(-4,4), 12, 6);
        g.generateTexture('comet', 96, 48); g.clear();

        // Snowmobile
        g.fillStyle(0x90caf9, 1); g.fillRoundedRect(8, 16, 80, 28, 8);
        g.fillStyle(0x1565c0, 1); g.fillRoundedRect(12, 20, 30, 20, 4);
        g.fillStyle(0x333333, 1); g.fillEllipse(20, 48, 20, 10); g.fillEllipse(70, 48, 20, 10);
        g.fillStyle(0xffffff, 1); g.fillRect(70, 18, 12, 8);
        g.generateTexture('snowmobile', 96, 48); g.clear();

        // Hover bike
        g.fillStyle(0x7b1fa2, 1); g.fillRoundedRect(8, 20, 80, 20, 6);
        g.fillStyle(0xce93d8, 1); g.fillRoundedRect(14, 24, 28, 12, 4);
        g.fillStyle(0x00ffff, 0.8); g.fillRect(6, 36, 84, 4);
        g.fillStyle(0xff00ff, 1); g.fillRect(0, 26, 8, 8); g.fillRect(88, 26, 8, 8);
        g.generateTexture('hover_bike', 96, 48); g.clear();

        // ===== STATIC OBSTACLES (48x48) =====
        g.fillStyle(0x607d8b, 1); g.fillRoundedRect(8, 8, 32, 32, 6);
        g.fillStyle(0x90a4ae, 1); g.fillRoundedRect(12, 12, 16, 12, 3);
        g.generateTexture('space_junk', 48, 48); g.clear();

        g.fillStyle(0x80cbc4, 1); g.fillTriangle(24, 4, 44, 44, 4, 44);
        g.fillStyle(0xb2dfdb, 1); g.fillTriangle(24, 12, 36, 38, 12, 38);
        g.generateTexture('glacier_rock', 48, 48); g.clear();

        g.lineStyle(4, 0xff00ff, 1); g.strokeRect(8, 8, 32, 32);
        g.lineStyle(2, 0xff00ff, 0.4); g.strokeRect(12, 12, 24, 24);
        g.generateTexture('holo_barrier', 48, 48); g.clear();

        // ===== REWARDS (32x32) =====
        // Space crystal - yellow gem
        g.fillStyle(0xffeb3b, 1); g.fillTriangle(16, 2, 30, 14, 16, 30); g.fillTriangle(16, 2, 2, 14, 16, 30);
        g.fillStyle(0xfff176, 1); g.fillTriangle(16, 6, 26, 14, 16, 22);
        g.generateTexture('space_crystal', 32, 32); g.clear();

        // Frozen rune - blue crystal
        g.fillStyle(0x29b6f6, 1); g.fillRect(12, 2, 8, 28);
        g.fillStyle(0x4fc3f7, 1); g.fillRect(2, 12, 28, 8);
        g.fillStyle(0x81d4fa, 1); g.fillCircle(16, 16, 6);
        g.generateTexture('frozen_rune', 32, 32); g.clear();

        // Data chip - green triangle
        g.fillStyle(0x00e676, 1); g.fillRoundedRect(4, 4, 24, 24, 4);
        g.fillStyle(0x00bfa5, 1); g.fillRect(8, 8, 16, 16);
        g.fillStyle(0x69f0ae, 1); g.fillRect(12, 12, 8, 8);
        g.generateTexture('data_chip', 32, 32); g.clear();

        // ===== CHARACTERS (96x96 boxy pixel art style) =====
        
        // 1. Space Explorer (Boxy Person)
        g.fillStyle(0x3b82f6, 1); g.fillRect(28, 40, 40, 36); // blue suit body
        g.fillStyle(0x1e3a8a, 1); g.fillRect(36, 44, 24, 20); // chest plate
        g.fillStyle(0xffffff, 1); g.fillRoundedRect(32, 12, 32, 28, 8); // helmet
        g.fillStyle(0x111111, 1); g.fillRect(36, 18, 24, 12); // visor
        g.fillStyle(0x00ffff, 1); g.fillRect(38, 20, 10, 4); // visor reflection
        g.fillStyle(0xe2e8f0, 1); g.fillRect(16, 40, 12, 24); g.fillRect(68, 40, 12, 24); // arms
        g.fillStyle(0x475569, 1); g.fillRect(32, 76, 12, 16); g.fillRect(52, 76, 12, 16); // legs
        g.generateTexture('space_explorer', 96, 96); g.clear();

        // 2. Space Chicken (Boxy Hen)
        g.fillStyle(0xffffff, 1); g.fillRoundedRect(28, 36, 44, 40, 12); // white fluffy body
        g.fillStyle(0xef4444, 1); g.fillRect(40, 24, 12, 12); // red comb
        g.fillStyle(0xf59e0b, 1); g.fillTriangle(66, 44, 82, 50, 66, 56); // orange beak
        g.fillStyle(0x000000, 1); g.fillRect(52, 40, 6, 6); // eye
        g.fillStyle(0xd1d5db, 1); g.fillRect(12, 44, 20, 20); // wing
        g.fillStyle(0xf59e0b, 1); g.fillRect(36, 76, 6, 16); g.fillRect(56, 76, 6, 16); // stick legs
        g.fillRect(36, 90, 10, 4); g.fillRect(56, 90, 10, 4); // feet
        g.generateTexture('space_chicken', 96, 96); g.clear();

        // 3. Cosmic Unicorn (Boxy Unicorn)
        g.fillStyle(0xfdf4ff, 1); g.fillRoundedRect(20, 44, 56, 32, 8); // body
        g.fillStyle(0xfdf4ff, 1); g.fillRect(56, 16, 24, 32); // neck/head
        g.fillStyle(0xfbcfe8, 1); g.fillRect(72, 20, 12, 16); // snout
        g.fillStyle(0x000000, 1); g.fillRect(64, 20, 4, 4); // eye
        g.fillStyle(0xa855f7, 1); g.fillTriangle(60, 16, 64, 0, 68, 16); // horn
        g.fillStyle(0xec4899, 1); g.fillRect(48, 16, 12, 20); g.fillRect(12, 44, 12, 24); // mane & tail
        g.fillStyle(0xe2e8f0, 1); g.fillRect(28, 76, 8, 16); g.fillRect(60, 76, 8, 16); // legs
        g.generateTexture('cosmic_unicorn', 96, 96); g.clear();

        // 4. Space Dino (Boxy T-Rex)
        g.fillStyle(0x22c55e, 1); g.fillRoundedRect(28, 36, 40, 48, 8); // thick body
        g.fillStyle(0x22c55e, 1); g.fillRect(48, 12, 36, 28); // head
        g.fillStyle(0x166534, 1); g.fillRect(16, 44, 16, 32); // tail
        g.fillStyle(0x000000, 1); g.fillRect(56, 16, 4, 4); // eye
        g.fillStyle(0xffffff, 1); g.fillRect(68, 36, 12, 4); // teeth
        g.fillStyle(0x166534, 1); g.fillRect(60, 48, 12, 4); // tiny arms
        g.fillStyle(0x15803d, 1); g.fillRect(32, 84, 12, 12); g.fillRect(52, 84, 12, 12); // chunky legs
        g.generateTexture('space_dino', 96, 96); g.clear();

        // ===== NEW CHARACTER (96x96 pixel art style) =====
        // Cyber Ninja
        g.fillStyle(0x1a1a2e, 1); g.fillRoundedRect(32, 16, 32, 32, 6); // head
        g.fillStyle(0x00ffff, 1); g.fillRect(40, 24, 20, 6); // visor
        g.fillStyle(0x22223b, 1); g.fillRect(28, 48, 40, 36); // body
        g.fillStyle(0x4a4e69, 1); g.fillRect(36, 48, 24, 16); // chest plate
        g.fillStyle(0x00ffff, 1); g.fillCircle(48, 56, 4); // chest core
        // Arms & Katana
        g.fillStyle(0x22223b, 1); g.fillRect(16, 48, 12, 28); g.fillRect(68, 48, 12, 28);
        g.fillStyle(0xff00ff, 1); g.fillRect(72, 36, 4, 32); // sword blade
        g.fillStyle(0xffffff, 1); g.fillRect(72, 36, 2, 32);
        // Legs
        g.fillStyle(0x1a1a2e, 1); g.fillRect(32, 84, 12, 12); g.fillRect(52, 84, 12, 12);
        g.generateTexture('cyber_ninja', 96, 96); g.clear();

        // ===== UI ELEMENTS =====
        // Card background
        g.fillStyle(0x1a0a2e, 1); g.fillRoundedRect(0, 0, 160, 210, 16);
        g.lineStyle(3, 0x6a1b9a, 1); g.strokeRoundedRect(0, 0, 160, 210, 16);
        g.generateTexture('card_bg', 160, 210); g.clear();

        g.destroy();
    }
}
