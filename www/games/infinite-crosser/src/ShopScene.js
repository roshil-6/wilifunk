class ShopScene extends Phaser.Scene {
    constructor() { super('ShopScene'); }

    create() {
        this.saveData = this.registry.get('saveData');
        this.add.tileSprite(400, 300, 800, 600, 'neon_bg');

        // Dark panel
        const panel = this.add.graphics();
        panel.fillStyle(0x06000f, 0.97);
        panel.fillRoundedRect(40, 50, 720, 510, 24);
        panel.lineStyle(3, 0x9c27b0, 1);
        panel.strokeRoundedRect(40, 50, 720, 510, 24);

        // Header
        this.add.text(400, 90, '★  CHARACTER ARCHIVE  ★', {
            font: 'bold 26px Courier', fill: '#00ffff'
        }).setOrigin(0.5);

        // Wallet
        this.coinText = this.add.text(400, 125, `COINS:  ${this.saveData.coins}`, {
            font: 'bold 20px Courier', fill: '#ffeb3b'
        }).setOrigin(0.5);

        // Back button
        const back = this.add.text(75, 88, '◄ BACK', {
            font: 'bold 16px Courier', fill: '#888888'
        }).setInteractive({ useHandCursor: true });
        back.on('pointerover', () => back.setFill('#ffffff'));
        back.on('pointerout',  () => back.setFill('#888888'));
        back.on('pointerdown', () => {
            this.cameras.main.fadeOut(250, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
        });

        // 5-card layout: 3 on top row, 2 on bottom row
        const grid = [
            { x: 190, y: 320 },
            { x: 400, y: 320 },
            { x: 610, y: 320 },
            { x: 295, y: 490 },
            { x: 505, y: 490 }
        ];

        this.chars = [
            { key: 'space_explorer', name: 'SPACE EXPLORER', cost: 0,   pos: grid[0] },
            { key: 'space_chicken',  name: 'SPACE CHICKEN',  cost: 100, pos: grid[1] },
            { key: 'cosmic_unicorn', name: 'COSMIC UNICORN', cost: 150, pos: grid[2] },
            { key: 'space_dino',     name: 'SPACE DINO',     cost: 250, pos: grid[3] },
            { key: 'cyber_ninja',    name: 'CYBER NINJA',    cost: 500, pos: grid[4] }
        ];

        this.chars.forEach(c => this.buildCard(c));
    }

    buildCard(char) {
        const { x, y } = char.pos;
        const W = 170, H = 190;
        const isUnlocked = this.saveData.unlocked[char.key];
        const isEquipped  = this.saveData.equipped_character === char.key;

        // --- Card BG graphics ---
        const cardGfx = this.add.graphics();
        const borderColor = isEquipped ? 0x00ff88 : isUnlocked ? 0x7b1fa2 : 0x333333;
        const fillColor   = isEquipped ? 0x00180c : isUnlocked ? 0x150030 : 0x0a0a0a;

        cardGfx.fillStyle(fillColor, 1);
        cardGfx.fillRoundedRect(x - W/2, y - H/2, W, H, 14);
        cardGfx.lineStyle(3, borderColor, 1);
        cardGfx.strokeRoundedRect(x - W/2, y - H/2, W, H, 14);

        // Equipped glow
        if (isEquipped) {
            cardGfx.lineStyle(8, 0x00ff88, 0.25);
            cardGfx.strokeRoundedRect(x - W/2 - 4, y - H/2 - 4, W + 8, H + 8, 18);
        }

        // --- Character image (strictly sized and centered) ---
        // Use a RenderTexture to safely crop/display the image at exact size
        const rt = this.add.renderTexture(x, y - 30, 96, 96).setOrigin(0.5);

        const tex = this.textures.get(char.key);
        const frame = tex.get();
        // Draw centered in the render texture
        const scaleW = 96 / frame.realWidth;
        const scaleH = 96 / frame.realHeight;
        const scale  = Math.min(scaleW, scaleH);
        const imgW   = frame.realWidth * scale;
        const imgH   = frame.realHeight * scale;
        const ox     = (96 - imgW) / 2;
        const oy     = (96 - imgH) / 2;

        rt.draw(char.key, ox, oy, 1, 0xffffff);
        rt.setScale(1);

        if (!isUnlocked) rt.setTint(0x333333);

        // Idle bob for unlocked
        if (isUnlocked) {
            this.tweens.add({
                targets: rt, y: rt.y - 6,
                duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // --- Name label ---
        this.add.text(x, y + 52, char.name, {
            font: 'bold 13px Courier',
            fill: isUnlocked ? '#dddddd' : '#555555',
            align: 'center'
        }).setOrigin(0.5);

        // --- Status / cost badge ---
        let badgeText, badgeColor;
        if (isEquipped)       { badgeText = '✓ EQUIPPED'; badgeColor = '#00ff88'; }
        else if (isUnlocked)  { badgeText = 'SELECT';     badgeColor = '#aaaaff'; }
        else                  { badgeText = `★ ${char.cost} COINS`; badgeColor = '#ffeb3b'; }

        const badge = this.add.text(x, y + 74, badgeText, {
            font: 'bold 13px Courier', fill: badgeColor, align: 'center'
        }).setOrigin(0.5);

        // --- Interactive hit zone ---
        const zone = this.add.rectangle(x, y, W, H, 0, 0)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            this.tweens.add({ targets: cardGfx, alpha: 0.85, duration: 80 });
            badge.setScale(1.08);
        });
        zone.on('pointerout', () => {
            this.tweens.add({ targets: cardGfx, alpha: 1, duration: 80 });
            badge.setScale(1);
        });
        zone.on('pointerdown', () => this.onCardClick(char, badge));
    }

    onCardClick(char, badge) {
        const isUnlocked = this.saveData.unlocked[char.key];

        if (isUnlocked) {
            this.saveData.equipped_character = char.key;
            this.save();
            this.scene.restart();
            return;
        }

        if (this.saveData.coins >= char.cost) {
            this.saveData.coins -= char.cost;
            this.saveData.unlocked[char.key] = true;
            this.saveData.equipped_character = char.key;
            this.save();

            // Unlock burst
            const burst = this.add.particles(char.pos.x, char.pos.y - 30, 'stardust', {
                speed: { min: 80, max: 200 },
                scale: { start: 1.2, end: 0 },
                lifespan: 700,
                quantity: 30,
                emitting: false
            });
            burst.explode(30);
            this.time.delayedCall(350, () => this.scene.restart());
        } else {
            // Insufficient coins
            this.cameras.main.shake(220, 0.012);
            badge.setFill('#ff3333');
            const prev = badge.text.includes('★') ? '#ffeb3b' : '#aaaaff';
            this.time.delayedCall(600, () => badge.setFill(prev));
        }
    }

    save() {
        this.registry.set('saveData', this.saveData);
        localStorage.setItem('infiniteCrosserSave', JSON.stringify(this.saveData));
    }
}
