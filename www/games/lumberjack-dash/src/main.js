const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 700
    },
    backgroundColor: '#0a2a1a',
    scene: [MenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);

const isMobile = window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
    document.getElementById('mobile-controls').style.display = 'block';
}

const dispatchLeft = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('chop-left'));
};
const dispatchRight = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('chop-right'));
};

document.getElementById('btn-left').addEventListener('touchstart', dispatchLeft, {passive: false});
document.getElementById('btn-left').addEventListener('mousedown', dispatchLeft, {passive: false});
document.getElementById('btn-right').addEventListener('touchstart', dispatchRight, {passive: false});
document.getElementById('btn-right').addEventListener('mousedown', dispatchRight, {passive: false});
