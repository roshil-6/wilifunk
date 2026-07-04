class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Initialize global data
        const savedData = localStorage.getItem('mazeStealthData');
        let gameData = {
            unlockedLevels: 1,
            totalGold: 0
        };

        if (savedData) {
            gameData = JSON.parse(savedData);
        }

        this.registry.set('unlockedLevels', gameData.unlockedLevels);
        this.registry.set('totalGold', gameData.totalGold);

        this.scene.start('PreloadScene');
    }
}
