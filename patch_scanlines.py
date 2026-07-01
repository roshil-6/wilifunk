import re

# --- 1. Restore cockpit-overlay element to index.html ---
html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# We need to insert <div class="cockpit-overlay"></div> just inside <div id="game-container">
if '<div class="cockpit-overlay"></div>' not in html:
    html = re.sub(r'(<div id="game-container">)', r'\1\n        <div class="cockpit-overlay"></div>', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# --- 2. Add scanlines CSS back to style.css, but WITHOUT the blue radial gradient ---
css_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

if '.cockpit-overlay' not in css:
    scanlines_css = """
/* ===== COCKPIT SCANLINES OVERLAY (RETRO CRT STYLE) ===== */
.cockpit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    /* ONLY horizontal scanlines, NO blue radial gradient flash */
    background: linear-gradient(rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.4) 50%);
    background-size: 100% 4px;
    opacity: 0.8;
}
"""
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(scanlines_css)

print("Scanlines restored without blue flash")
