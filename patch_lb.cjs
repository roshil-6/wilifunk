const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'www', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Hide the leaderboard button in the DOM
html = html.replace(/<button id="menuLeaderboardBtn" class="poster-btn btn-gold-glow">/g, 
                    '<button id="menuLeaderboardBtn" class="poster-btn btn-gold-glow hidden" style="display:none !important;">');

fs.writeFileSync(htmlPath, html);

console.log('Leaderboard button hidden successfully.');
