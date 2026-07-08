const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 700,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);
