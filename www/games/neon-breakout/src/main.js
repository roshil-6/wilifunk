const config = {
  type: Phaser.AUTO,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 400, height: 700, parent: 'game' },
  backgroundColor: '#000510',
  scene: [MenuScene, GameScene]
};
new Phaser.Game(config);
