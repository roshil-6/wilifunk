const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450,
        height: 800
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down, zero gravity
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene],
    backgroundColor: '#95d13c', // Grassy floor background
    pixelArt: true,
    roundPixels: true
};

const game = new Phaser.Game(config);
