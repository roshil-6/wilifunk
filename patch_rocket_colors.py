import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace hardcoded nose gradient
js = js.replace("""    let noseGrad = ctx.createLinearGradient(40, 18, 60, 25);
    noseGrad.addColorStop(0, '#ff4757');
    noseGrad.addColorStop(1, '#ff6b81');""", """    let noseGrad = ctx.createLinearGradient(40, 18, 60, 25);
    noseGrad.addColorStop(0, color1);
    noseGrad.addColorStop(1, color2);""")

# Replace hardcoded fuselage gradient
js = js.replace("""    let fuseGrad = ctx.createLinearGradient(12, 16, 12, 34);
    fuseGrad.addColorStop(0, '#f1f2f6');
    fuseGrad.addColorStop(0.3, '#ffffff');
    fuseGrad.addColorStop(0.7, '#dfe4ea');
    fuseGrad.addColorStop(1, '#a4b0be');""", """    let fuseGrad = ctx.createLinearGradient(12, 16, 12, 34);
    fuseGrad.addColorStop(0, '#ffffff');
    fuseGrad.addColorStop(0.4, color2);
    fuseGrad.addColorStop(1, '#2f3542');""")

# Replace hardcoded cockpit gradient
js = js.replace("""    let cockpitGrad = ctx.createLinearGradient(28, 20, 42, 28);
    cockpitGrad.addColorStop(0, '#ffeaa7');
    cockpitGrad.addColorStop(0.5, '#ffd2c4');
    cockpitGrad.addColorStop(1, '#ff9f43');""", """    let cockpitGrad = ctx.createLinearGradient(28, 20, 42, 28);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.5, color1);
    cockpitGrad.addColorStop(1, '#1e272e');""")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print('Rocket colors patched.')
