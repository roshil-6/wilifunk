const fs = require('fs');
const path = require('path');

const wwwPath = path.join(__dirname, 'www');

// 1. game.js - Set resolution to 1 and add Thrust button logic
let gameJsPath = path.join(wwwPath, 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// Resolution to exactly 1
gameJs = gameJs.replace(/resolution: Math\.min\(1\.5, window\.devicePixelRatio \|\| 1\),/, "resolution: 1,");
gameJs = gameJs.replace(/resolution: window\.devicePixelRatio \|\| 1,/, "resolution: 1,");

// Thrust logic - wire up the new DOM button
const thrustLogicStr = `
    const mobileThrustBtn = document.getElementById('mobileThrustBtn');
    if (mobileThrustBtn) {
        mobileThrustBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(gameState.isPlaying && !gameState.isGameOver) {
                gameState.rocket.body.velocity.y = -350;
            }
        }, { passive: false });
        mobileThrustBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if(gameState.isPlaying && !gameState.isGameOver) {
                gameState.rocket.body.velocity.y = -350;
            }
        });
    }
`;

// Insert after mobileLaserBtn setup
gameJs = gameJs.replace(/(const mobileLaserBtn = document.getElementById\('mobileLaserBtn'\);[\s\S]*?\}\);[\s\S]*?\})/, `$1\n${thrustLogicStr}`);

// Prevent full screen tap from trusting if they tap the bottom buttons
gameJs = gameJs.replace(/if \(pointer\.y > 600 && pointer\.x > 500\) return;/g, 
    "if (pointer.y > scene.scale.height - 150) return; // Ignore bottom area for buttons");

fs.writeFileSync(gameJsPath, gameJs);


// 2. style.css - Add #mobileThrustBtn
let stylePath = path.join(wwwPath, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const thrustCss = `
/* Circular Mobile Thrust Button */
#mobileThrustBtn {
    position: absolute;
    bottom: 25px;
    left: 25px;
    width: 76px;
    height: 76px;
    background: radial-gradient(circle, #00ffaa 20%, #008855 90%);
    border: 3px solid #88ffcc;
    border-radius: 50% !important;
    box-shadow: 0 0 20px rgba(0, 255, 170, 0.8), inset 0 0 8px rgba(255, 255, 255, 0.4);
    display: none;
    justify-content: center;
    align-items: center;
    color: #ffffff;
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 1px;
    z-index: 99999;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.05s ease, box-shadow 0.1s ease;
}
#mobileThrustBtn:not(.hidden) {
    display: flex;
}
#mobileThrustBtn:active {
    transform: scale(0.88);
    box-shadow: 0 0 10px rgba(0, 255, 170, 0.5);
    background: radial-gradient(circle, #00dd88 20%, #006644 90%);
}
`;

styleCss = styleCss.replace(/#mobileLaserBtn \{/, `${thrustCss}\n#mobileLaserBtn {`);
fs.writeFileSync(stylePath, styleCss);


// 3. index.html - Add button to DOM, toggle it, and mock leaderboard data
let htmlPath = path.join(wwwPath, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Add button to DOM
html = html.replace(/<div id="mobileLaserBtn" class="hidden">SHOOT<\/div>/, `<div id="mobileLaserBtn" class="hidden">SHOOT</div>\n        <div id="mobileThrustBtn" class="hidden">THRUST</div>`);

// Toggle visibility
html = html.replace(/document\.getElementById\('mobileLaserBtn'\)\?\.classList\.remove\('hidden'\);/g, 
    "document.getElementById('mobileLaserBtn')?.classList.remove('hidden');\n            document.getElementById('mobileThrustBtn')?.classList.remove('hidden');");

html = html.replace(/document\.getElementById\('mobileLaserBtn'\)\?\.classList\.add\('hidden'\);/g, 
    "document.getElementById('mobileLaserBtn')?.classList.add('hidden');\n            document.getElementById('mobileThrustBtn')?.classList.add('hidden');");

// Mock Leaderboard Data
const mockLbCode = `
        function getLbEntries() {
            try { 
                let entries = JSON.parse(localStorage.getItem(LB_KEY) || '[]'); 
                if (entries.length === 0) {
                    // Populate mock global leaderboard
                    entries = [
                        { name: "CosmicKing", score: 12500 },
                        { name: "StarDust99", score: 9800 },
                        { name: "NebulaRider", score: 8500 },
                        { name: "VoidWalker", score: 6200 },
                        { name: "AstroBot", score: 4500 }
                    ];
                    localStorage.setItem(LB_KEY, JSON.stringify(entries));
                }
                return entries;
            }
            catch(e) { return []; }
        }
`;

html = html.replace(/function getLbEntries\(\) \{[\s\S]*?catch\(e\) \{ return \[\]; \}\n        \}/, mockLbCode);

fs.writeFileSync(htmlPath, html);

console.log('Patches applied for resolution, leaderboard, and thrust button.');
