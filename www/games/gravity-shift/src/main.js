const config = {
  type: Phaser.AUTO,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 700, height: 400, parent: 'game' },
  backgroundColor: '#0a0a2e',
  physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
  scene: [MenuScene, GameScene]
};
new Phaser.Game(config);
