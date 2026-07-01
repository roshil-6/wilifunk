/**
 * WILIFUNK - Main Entry Point
 * Browser-based 2D side-scrolling runner game
 */

import { Game } from './game/Game.js';

// Initialize game when DOM is ready
window.addEventListener('load', () => {
    try {
        console.log('DOM loaded, initializing game...');
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            document.body.innerHTML = '<div style="color: red;">Canvas element not found!</div>';
            return;
        }
        
        console.log('Canvas found:', canvas);
        console.log('Creating game instance...');
        
        const game = new Game(canvas);
        console.log('Game instance created');
        
        // Make game accessible globally
        window.gameInstance = game;
        
        console.log('Calling game.init()...');
        game.init();
        console.log('Game initialized successfully!');
        
        // Setup menu buttons
        function setupMenuButtons() {
            const startBtn = document.getElementById('startGameBtn');
            
            console.log('Setting up menu buttons:', { startBtn });
            
            if (startBtn) {
                // Make sure button is clickable
                startBtn.style.pointerEvents = 'all';
                startBtn.style.cursor = 'pointer';
                startBtn.style.zIndex = '10000';
                startBtn.style.position = 'relative';
                
                // Remove any existing onclick to avoid conflicts
                startBtn.onclick = null;
                
                // Clean onclick handler
                startBtn.onclick = function(e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    if (window.gameInstance && typeof window.gameInstance.startGame === 'function') {
                        window.gameInstance.startGame();
                    }
                    return false;
                };
                
                console.log('Start button setup complete!');
            }
        }
        
        // Setup after a short delay to ensure everything is ready
        setTimeout(setupMenuButtons, 100);
        setTimeout(setupMenuButtons, 500);
        
    } catch (error) {
        console.error('Error initializing game:', error);
        console.error('Stack trace:', error.stack);
        document.body.innerHTML = `
            <div style="color: white; padding: 20px; font-family: monospace; background: #1a1a1a;">
                <h1 style="color: #ff0040;">Error Loading Game</h1>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Check browser console (F12) for details.</strong></p>
                <pre style="background: #0a0a0a; padding: 10px; overflow: auto;">${error.stack}</pre>
            </div>
        `;
    }
});
