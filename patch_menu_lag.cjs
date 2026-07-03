const fs = require('fs');
const path = require('path');

const wwwPath = path.join(__dirname, 'www');

// index.html - Fix menu lag (3D models running at high pixel ratio)
let htmlPath = path.join(wwwPath, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Cap pixel ratio to 1 for the 3D menu preview renderer
html = html.replace(/sharedModalRenderer\.setPixelRatio\(window\.devicePixelRatio \|\| 2\);/g, 
    "sharedModalRenderer.setPixelRatio(1);");

fs.writeFileSync(htmlPath, html);

console.log('Menu lag resolved.');
