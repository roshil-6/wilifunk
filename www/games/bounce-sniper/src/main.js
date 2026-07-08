const config = {
    type: Phaser.AUTO,
    width: 700,
    height: 400,
    backgroundColor: '#1a1a24',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, GameScene]
};

window.onload = () => {
    if (!localStorage.getItem('bounceSniperProgress')) {
        let defaultProgress = new Array(10).fill(0);
        localStorage.setItem('bounceSniperProgress', JSON.stringify(defaultProgress));
    }
    new Phaser.Game(config);
};
