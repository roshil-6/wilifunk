import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# We want to change the gradient rendering to use the selected rocket's colors as a tint.
# Let's add a helper function to game.js to tint colors.
patch_helper = """
// ====================================
// THEME TINTING HELPER
// ====================================
function getThemedColor(baseColor, isTop) {
    if (!gameState || !gameState.selectedRocket) return baseColor;
    const rocket = ROCKETS.find(r => r.id === gameState.selectedRocket);
    if (!rocket) return baseColor;
    
    const hexToRGB = hex => {
        let h = hex.replace('#', '');
        return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16)
        };
    };

    const rColor = hexToRGB(isTop ? rocket.color1 : rocket.color2);
    
    // Extract base color components
    const bR = (baseColor >> 16) & 255;
    const bG = (baseColor >> 8) & 255;
    const bB = baseColor & 255;

    // Mix base background with rocket color (e.g. 50% mix)
    const mixR = Math.floor(bR * 0.4 + rColor.r * 0.15);
    const mixG = Math.floor(bG * 0.4 + rColor.g * 0.15);
    const mixB = Math.floor(bB * 0.4 + rColor.b * 0.15);

    return (mixR << 16) + (mixG << 8) + mixB;
}
"""

if "function getThemedColor(" not in js:
    js = js.replace('const COLORS = {', patch_helper + '\nconst COLORS = {')

# Now replace the background drawing calls
def replace_gradient(match):
    full = match.group(0)
    top1 = match.group(1)
    top2 = match.group(2)
    bot1 = match.group(3)
    bot2 = match.group(4)
    # Replace the parameters with themed versions
    return f"bgGraphics.fillGradientStyle(getThemedColor({top1}, true), getThemedColor({top2}, true), getThemedColor({bot1}, false), getThemedColor({bot2}, false), 1);"

js = re.sub(r'bgGraphics\.fillGradientStyle\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*1\);', replace_gradient, js)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Patch applied.")
