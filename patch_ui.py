import re

html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Make homeMenu transparent so Phaser game shows through!
# Remove the old start button and replace with arcade button
arcade_start_btn = """<p class="blink-text" style="color: #00ff88; font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: bold; margin-bottom: 15px;">INSERT COIN</p>
                    <button id="startGameBtn" class="arcade-btn start-arcade">PRESS START</button>"""
html = re.sub(r'<button id="startGameBtn"[^>]*>.*?</button>', arcade_start_btn, html, flags=re.DOTALL)

# Update Game Over buttons
game_over_btns = """<button id="restartBtn" class="arcade-btn restart-arcade">INSERT COIN (RETRY)</button>
                    <button id="homeBtn" class="arcade-btn menu-arcade">MENU</button>"""
html = re.sub(r'<button id="restartBtn"[^>]*>.*?</button>\s*<button id="homeBtn"[^>]*>.*?</button>', game_over_btns, html, flags=re.DOTALL)

# Update Rocket Select buttons
rocket_btns = """<button id="rocketLaunchBtn" class="arcade-btn start-arcade">LAUNCH</button>
                    <button id="rocketBackBtn" class="arcade-btn menu-arcade">BACK</button>"""
html = re.sub(r'<button id="rocketLaunchBtn"[^>]*>.*?</button>\s*<button id="rocketBackBtn"[^>]*>.*?</button>', rocket_btns, html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html patched")


css_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Make home menu transparent
css = re.sub(r'\.home-menu\s*\{[^}]*background:[^;]+;', '.home-menu {\n    background: rgba(0, 0, 0, 0.75);', css)
css = re.sub(r'\.home-content\s*\{[^}]*background:[^;]+;', '.home-content {\n    background: rgba(10, 10, 26, 0.85);\n    border: 4px solid #4a5568;', css)

# Make Game Over and Rocket Select consistent
css = re.sub(r'\.game-over-content\s*\{[^}]*background:[^;]+;', '.game-over-content {\n    background: rgba(10, 10, 26, 0.95);\n    border: 4px solid #ff3366;', css)
css = re.sub(r'\.rocket-select-content\s*\{[^}]*background:[^;]+;', '.rocket-select-content {\n    background: rgba(10, 10, 26, 0.95);\n    border: 4px solid #00d4ff;', css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

with open(css_path, 'a', encoding='utf-8') as f:
    f.write("""
/* ===== ARCADE GAME-CENTRIC STYLES ===== */
.arcade-btn {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    font-size: 18px;
    padding: 15px 30px;
    color: white;
    border: 2px solid #fff;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.1s ease;
    border-radius: 4px;
}

.start-arcade {
    background-color: #ff3366;
    border-color: #ff88a0;
    border-bottom: 6px solid #990022;
}

.start-arcade:active {
    transform: translateY(4px);
    border-bottom: 2px solid #990022;
}

.restart-arcade {
    background-color: #ff7800;
    border-color: #ffb880;
    border-bottom: 6px solid #994400;
}

.restart-arcade:active {
    transform: translateY(4px);
    border-bottom: 2px solid #994400;
}

.menu-arcade {
    background-color: #4a5568;
    border-color: #a0aec0;
    border-bottom: 6px solid #2d3748;
}

.menu-arcade:active {
    transform: translateY(4px);
    border-bottom: 2px solid #2d3748;
}

.blink-text {
    animation: arcadeBlink 1.2s infinite;
}

@keyframes arcadeBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
}

/* Remove old button classes to prevent conflicts if needed */
.start-button, .menu-button, .back-btn {
    background: none; border: none; box-shadow: none;
}
""")
print("style.css patched")
