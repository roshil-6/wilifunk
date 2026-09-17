const fs = require('fs');
const path = require('path');

const cssFile = path.join('c:', 'Users', 'Abhinand Antony', 'Desktop', 'wilifunk game dev', 'www', 'style.css');
let css = fs.readFileSync(cssFile, 'utf8');

// Replace global font
css = css.replace(/font-family:Inter,"Segoe UI",Arial,sans-serif/g, "font-family:'Outfit', sans-serif");

// Bump font weights to address "thin" text complaint
css = css.replace(/font-weight:300/g, 'font-weight:400');
css = css.replace(/font-weight:400/g, 'font-weight:500');
css = css.replace(/font-weight:450/g, 'font-weight:600');
css = css.replace(/font-weight:500/g, 'font-weight:600');
css = css.replace(/font-weight:550/g, 'font-weight:700');

// Add Orbitron to headers and specific titles to look less "AI"
css = css.replace(/h1\{/g, "h1{font-family:'Orbitron', sans-serif;font-weight:800;");
css = css.replace(/h2\{/g, "h2{font-family:'Orbitron', sans-serif;font-weight:700;");
css = css.replace(/h3\{/g, "h3{font-family:'Orbitron', sans-serif;font-weight:700;");

// Update some specific text sizes to make them slightly larger
css = css.replace(/font-size:7px/g, 'font-size:8.5px');
css = css.replace(/font-size:8px/g, 'font-size:9.5px');
css = css.replace(/font-size:9px/g, 'font-size:10.5px');
css = css.replace(/font-size:10px/g, 'font-size:11.5px');

fs.writeFileSync(cssFile, css);
console.log('CSS fonts updated!');
