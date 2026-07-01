import re

js_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/game.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Let's improve the color tinting so it looks amazing and vivid!
# We will use the rocket's color as the core dominant hue, heavily mixed with the deep space zone base.
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

    // Rich dynamic mix: 40% rocket color, 60% original zone background, boosted slightly for vividness
    const mixR = Math.min(255, Math.floor(bR * 0.6 + rColor.r * 0.25));
    const mixG = Math.min(255, Math.floor(bG * 0.6 + rColor.g * 0.25));
    const mixB = Math.min(255, Math.floor(bB * 0.6 + rColor.b * 0.25));

    return (mixR << 16) + (mixG << 8) + mixB;
}
"""

js = re.sub(r'// ====================================\n// THEME TINTING HELPER\n// ====================================\nfunction getThemedColor.*?}\n', patch_helper, js, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Patch improved.")
