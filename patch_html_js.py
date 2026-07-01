import re

html_path = 'c:/Users/Abhinand Antony/Desktop/wilifunk game dev/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the modeCard selectors completely
html = re.sub(r"const cardRocket = document\.getElementById\('modeCardRocket'\);\s*const cardStreak = document\.getElementById\('modeCardStreak'\);.*?\}", "", html, flags=re.DOTALL)
html = re.sub(r"cardRocket\?\.addEventListener\('click', \(\) => \{.*?\}\);\s*cardStreak\?\.addEventListener\('click', \(\) => \{.*?\}\);", "", html, flags=re.DOTALL)

# Fix pauseBtn issue by removing it or making it safe
html = re.sub(r"document\.getElementById\('pauseBtn'\)\.addEventListener", "document.getElementById('pauseBtn')?.addEventListener", html)

# Fix muteBtn issue
html = re.sub(r"muteBtn\.addEventListener", "muteBtn?.addEventListener", html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html js fixed")
