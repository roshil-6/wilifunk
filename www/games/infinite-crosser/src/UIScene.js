class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const gameScene = this.scene.get('GameScene');

        // HUD bar
        const barGfx = this.add.graphics();
        barGfx.fillStyle(0x000000, 0.75);
        barGfx.fillRect(0, 0, 800, 52);
        barGfx.lineStyle(2, 0x6a1b9a, 1);
        barGfx.lineBetween(0, 52, 800, 52);

        // Score
        this.scoreText = this.add.text(20, 14, 'SCORE: 0', {
            font: 'bold 26px Courier', fill: '#00ffff'
        });

        // Biome
        this.biomeText = this.add.text(400, 14, 'COSMIC NEBULA', {
            font: 'bold 20px Courier', fill: '#ff00ff'
        }).setOrigin(0.5, 0);

        // Coin icon + counter
        this.add.text(660, 14, '★', { font: '26px Courier', fill: '#ffeb3b' });
        const saveData = this.registry.get('saveData');
        this.coinText = this.add.text(690, 14, `${saveData.coins}`, {
            font: 'bold 26px Courier', fill: '#ffeb3b'
        });

        // Listen
        gameScene.events.on('scoreChanged', (score) => {
            this.scoreText.setText(`SCORE: ${score}`);
        });

        gameScene.events.on('biomeChanged', (id) => {
            const labels = { SPACE: 'COSMIC NEBULA', SNOW: 'GLACIAL TUNDRA', CYBERPUNK: 'NEON GRID' };
            this.biomeText.setText(labels[id] || id);
        });

        gameScene.events.on('rewardCollected', (totalCoins, amount) => {
            // Animate counter
            const prev = parseInt(this.coinText.text) || 0;
            this.tweens.addCounter({
                from: prev, to: totalCoins, duration: 300,
                onUpdate: (tween) => this.coinText.setText(`${Math.floor(tween.getValue())}`)
            });

            // Floating +N pop
            const pop = this.add.text(730, 10, `+${amount}`, {
                font: 'bold 22px Courier', fill: '#ffeb3b'
            });
            this.tweens.add({
                targets: pop, y: -20, alpha: 0,
                duration: 800, ease: 'Quad.easeOut',
                onComplete: () => pop.destroy()
            });

            // Pulse the coin text
            this.tweens.add({
                targets: this.coinText,
                scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true
            });
        });
    }
}
