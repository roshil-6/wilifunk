const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'www', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Insert favicon before the stylesheet
html = html.replace(/<link rel="stylesheet" href="style.css">/, '<link rel="icon" type="image/png" href="honeypot_logo.png">\n    <link rel="stylesheet" href="style.css">');

fs.writeFileSync(htmlPath, html);

console.log('Favicon added successfully.');
