import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Add check to prevent recreating existing textures
patch_old = "function createRocketTexture(scene, id, color1, color2) {\n    const key = 'rocket_' + id;\n    const width = 64;"
patch_new = "function createRocketTexture(scene, id, color1, color2) {\n    const key = 'rocket_' + id;\n    if (scene.textures.exists(key)) return;\n    const width = 64;"
js = js.replace(patch_old, patch_new)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("game.js patched to prevent texture recreation crash")
