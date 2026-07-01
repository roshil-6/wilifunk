import re
import os

# --- 1. Fix cockpit-overlay in index.html ---
html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove <div class="cockpit-overlay"></div>
html = re.sub(r'<div class="cockpit-overlay"></div>', '', html)

# Make buyRocket and selectRocket explicitly global so onclick="" works perfectly
html = re.sub(r'function selectRocket\(id\) \{', 'window.selectRocket = function(id) {', html)
html = re.sub(r'function buyRocket\(id\) \{', 'window.buyRocket = function(id) {', html)
html = re.sub(r'function renderRocketGrid\(\) \{', 'window.renderRocketGrid = function() {', html)
html = re.sub(r'function updateHomeCoins\(\) \{', 'window.updateHomeCoins = function() {', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# --- 2. Fix cockpit-overlay in style.css ---
css_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Remove cockpit-overlay css
css = re.sub(r'/\* ===== COCKPIT SCANLINES OVERLAY.*?\.cockpit-overlay\s*\{[^}]+\}', '', css, flags=re.DOTALL)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)


# --- 3. Nerf Meteor Shower in game.js ---
js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Nerf triggerMeteorShower
js = js.replace('for (let i = 0; i < 15; i++) sceneRef.time.delayedCall(i * 200 + 1000, spawnMeteor);', 
                'for (let i = 0; i < 6; i++) sceneRef.time.delayedCall(i * 600 + 1000, spawnMeteor);')

# Nerf spawnMeteor speed
js = js.replace('gameState.obstacleSpeed * 2.5', 'gameState.obstacleSpeed * 1.5')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Patch applied: scanlines removed, rocket buy globalized, meteor nerfed")
