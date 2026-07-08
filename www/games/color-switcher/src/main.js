import MenuScene from './MenuScene.js';
import GameScene from './GameScene.js';

window.playPopSound = function() {
    try {
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

window.playScoreSound = function() {
    try {
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
}

window.playDieSound = function() {
    try {
        let ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

window.GAME_COLORS = [0xFF004D, 0x00E5FF, 0x00FF4D, 0xFFEA00];

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [MenuScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

const isMobile = window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
    document.getElementById('mobile-controls').style.display = 'block';
    
    document.getElementById('btn-switch').addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('colorSwitchAction'));
    });
    document.getElementById('btn-switch').addEventListener('mousedown', (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('colorSwitchAction'));
    });
}
