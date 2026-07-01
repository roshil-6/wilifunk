const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const melody = \[523\.25, 659\.25, 783\.99, 880\.00, 783\.99, 659\.25\]; \/\/ C5, E5, G5, A5, G5, E5/,
    `// Twinkle Twinkle Little Star (C, C, G, G, A, A, G)
        const melody = [523.25, 523.25, 783.99, 783.99, 880.00, 880.00, 783.99];`
);

content = content.replace(
    /const tempo = 0\.3; \/\/ 300ms per note \(relaxed, bouncy pace\)/,
    `const tempo = 0.4; // 400ms per note for a kids lullaby/song pace`
);

fs.writeFileSync(file, content);
console.log('Melody updated.');
