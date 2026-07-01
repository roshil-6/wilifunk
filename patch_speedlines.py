import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Remove speedLines creation
js = re.sub(r'// Speed lines for arcade sense of speed\s*gameState\.speedLines = this\.add\.particles.*?gameState\.speedLines\.setVisible\(false\);', '', js, flags=re.DOTALL)

# Remove speedLines usage
js = js.replace('if (gameState.speedLines) gameState.speedLines.setVisible(true);', '')
js = js.replace('if (gameState.speedLines) gameState.speedLines.setVisible(false);', '')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Removed speedLines from game.js")
