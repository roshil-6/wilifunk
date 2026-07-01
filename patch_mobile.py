import re
import os

html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove HTML HUD panels because we use Phaser HUD now
# We keep <div id="gameUI" class="hidden"> and <div class="cockpit-overlay"></div>
# but delete the rest inside it
hud_pattern = r'(<div id="gameUI" class="hidden">\s*<!-- Cockpit vignette overlay for space theme immersion -->\s*<div class="cockpit-overlay"></div>).*?(</div>\s*<!-- Game Over Screen -->)'
html = re.sub(hud_pattern, r'\1\n        \2', html, flags=re.DOTALL)

# Remove Mode Selector Cards completely
mode_selector_pattern = r'<!-- Mode Selector Cards -->.*?</div>\s*<p class="tagline">'
html = re.sub(mode_selector_pattern, '<p class="tagline">', html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html patched")


css_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/style.css'
with open(css_path, 'a', encoding='utf-8') as f:
    f.write("""
/* ===== MOBILE RESPONSIVENESS ===== */
@media (max-width: 768px) {
    .honeypot-title {
        font-size: 36px;
        letter-spacing: 2px;
    }
    .game-title {
        font-size: 28px;
    }
    .home-content, .rocket-select-content, .game-over-content {
        width: 95%;
        padding: 20px;
    }
    .rocket-grid {
        grid-template-columns: 1fr;
    }
    .overlay-buttons {
        flex-direction: column;
    }
    .menu-button {
        width: 100%;
        margin-bottom: 10px;
    }
    .badges-container {
        flex-wrap: wrap;
        justify-content: center;
    }
}
""")
print("style.css patched with media queries")
