function launchGame(gameUrl, layoutType = 'portrait') {
    const hubUI = document.getElementById('hubUI');
    const splashScreen = document.getElementById('splashScreen');
    const gameContainer = document.getElementById('gameContainer');
    const gameFrame = document.getElementById('gameFrame');

    // Hide hub, show splash
    hubUI.style.display = 'none';
    splashScreen.classList.remove('hidden');

    // Restart loading animation
    const fill = document.querySelector('.loading-fill');
    fill.style.animation = 'none';
    fill.offsetHeight; // trigger reflow
    fill.style.animation = 'loadingAnim 2s ease-in-out forwards';

    // Wait 2 seconds before showing game
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        gameFrame.src = gameUrl;
        
        // Apply layout type (portrait/landscape)
        gameContainer.className = layoutType;
    }, 2000);
}

function closeGame() {
    const hubUI = document.getElementById('hubUI');
    const gameContainer = document.getElementById('gameContainer');
    const gameFrame = document.getElementById('gameFrame');

    // Clear iframe source to stop game execution and free memory
    gameFrame.src = '';

    // Hide game, show hub
    gameContainer.className = 'hidden';
    hubUI.style.display = 'block';
}
