const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'Abhinand Antony', 'Desktop', 'wilifunk game dev', 'www', 'game.js');
let content = fs.readFileSync(file, 'utf8');

// Remove init
content = content.replace(/\s*ThreeGLBBridge\.init\(this\);/g, '');

// Remove update
content = content.replace(/\s*ThreeGLBBridge\.update\(\);/g, '');

// Remove the entire object block
content = content.replace(/\/\/\s*====================================\r?\n\/\/\s*THREE\.JS GLB RENDER BRIDGE\r?\n\/\/\s*====================================\r?\nconst ThreeGLBBridge = \{[\s\S]*?\n\};\r?\n/, '');

fs.writeFileSync(file, content);
console.log('Removed 3D GLB Bridge from game.js');
