function launchGame(gameUrl) {
    const hubUI = document.getElementById('hubUI');
    const gameContainer = document.getElementById('gameContainer');
    const gameFrame = document.getElementById('gameFrame');

    // Set iframe source
    gameFrame.src = gameUrl;

    // Hide hub, show game
    hubUI.style.display = 'none';
    gameContainer.classList.remove('hidden');
}

function closeGame() {
    const hubUI = document.getElementById('hubUI');
    const gameContainer = document.getElementById('gameContainer');
    const gameFrame = document.getElementById('gameFrame');

    // Clear iframe source to stop game execution and free memory
    gameFrame.src = '';

    // Hide game, show hub
    gameContainer.classList.add('hidden');
    hubUI.style.display = 'block';
}
