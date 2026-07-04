class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Initialize global save data structure
        const defaultSaveData = {
            coins: 25,
            highScore: 0,
            equipped_character: "space_explorer",
            unlocked: {
                space_explorer: true,
                space_chicken: false,
                cosmic_unicorn: false,
                space_dino: false
            }
        };

        // Check if there is existing local storage data
        let saved = localStorage.getItem('infiniteCrosserSave');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                this.registry.set('saveData', parsed);
            } catch (e) {
                this.registry.set('saveData', defaultSaveData);
            }
        } else {
            this.registry.set('saveData', defaultSaveData);
        }

        // Move to PreloadScene
        this.scene.start('PreloadScene');
    }
}
