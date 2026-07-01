import re
import os

filepath = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/style.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Honeypot Title to be big, yellow, red, no glow
title_pattern = r'\.honeypot-title\s*\{[^}]+\}'
new_title = """.honeypot-title {
    font-family: 'Creepster', cursive;
    font-weight: 400;
    font-size: 64px;
    letter-spacing: 4px;
    margin-bottom: 25px;
    color: #ffea00;
    text-shadow: 4px 4px 0px #ff0000;
}"""
content = re.sub(title_pattern, new_title, content)

# Remove creepy pulse animation
content = re.sub(r'@keyframes creepyPulse\s*\{[^}]+\}', '', content)
content = re.sub(r'animation:\s*creepyPulse[^;]+;', '', content)

# 2. Strip "Modern AI" elements: box-shadow, text-shadow, backdrop-filter
# We don't want to remove all shadows, maybe just make them solid or completely remove glowing.
# The user said "not glowing at all... everything feels modern AI please dont do that"
content = re.sub(r'box-shadow:\s*[^;]+;', '/* box-shadow removed */', content)
content = re.sub(r'text-shadow:\s*0\s*0[^;]+;', '/* text-shadow removed */', content)
content = re.sub(r'backdrop-filter:\s*blur[^;]+;', '/* backdrop-filter removed */', content)
content = re.sub(r'-webkit-backdrop-filter:\s*blur[^;]+;', '/* backdrop-filter removed */', content)

# Fix loading bar glow
content = re.sub(r'box-shadow:\s*0\s*0\s*10px\s*rgba\(255,\s*0,\s*85,\s*0\.8\);', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("style.css patched!")
