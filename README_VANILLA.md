# WILIFUNK - Vanilla JavaScript Version

A lightweight, browser-based 2D side-scrolling runner game built with pure HTML5 Canvas and JavaScript.

## File Structure

```
/
├── index.html          # Main HTML file
├── style.css           # Styling
├── main.js             # Entry point
└── game/
    ├── Game.js         # Main game loop and state
    ├── Player.js       # Willu (auto-run + jump)
    ├── Girlfriend.js   # Falling timer
    ├── Obstacles.js    # Blocks and bombs
    ├── Collectibles.js # Color cubes
    ├── ComboSystem.js  # Color combo effects
    └── Input.js        # Keyboard and touch input
```

## Features

✅ **Auto-running Willu** - Runs automatically from left to right  
✅ **Jump mechanic** - Space bar, arrow up, or touch/click  
✅ **Instant death** - Collision with obstacles/bombs = game over  
✅ **Instant restart** - Press jump key/tap to restart  
✅ **Falling girlfriend** - Visual timer (falls from top)  
✅ **Win/Lose conditions** - Reach girlfriend = win, she falls = lose  
✅ **Color cube collection** - Collect Red, Blue, Green cubes  
✅ **System Override combo** - RED+BLUE+GREEN deactivates bombs  
✅ **One-time hint** - Shows once at first play  
✅ **Retro cyberpunk style** - Neon colors, dark background  

## How to Run

### Option 1: Direct File
1. Open `index.html` in a web browser
2. Game starts automatically

### Option 2: Local Server
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option 3: VS Code Live Server
1. Right-click `index.html`
2. Select "Open with Live Server"

## Controls

- **Space** / **Arrow Up** / **Click/Tap** - Jump
- **Auto-run** - Willu runs automatically

## Game Mechanics

### Color Combo System
- Collect exactly 3 color cubes
- When 3rd cube is collected, combo triggers automatically
- **RED + BLUE + GREEN** = **SYSTEM OVERRIDE**
  - Bombs deactivate for 3 seconds
  - Visual glitch effect
  - No UI explanation (discovery-based)

### Win/Lose Conditions
- **WIN**: Reach the girlfriend before she falls
- **LOSE**: Hit an obstacle/bomb OR girlfriend falls out of view

## Technical Details

- **Pure JavaScript** - No external game engines
- **HTML5 Canvas** - 2D rendering
- **ES6 Modules** - Clean, modular architecture
- **RequestAnimationFrame** - Smooth 60fps game loop
- **Delta time** - Frame-rate independent movement

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Customization

Edit values in `game/Game.js`:
- `RUN_SPEED` - Player speed (in Player.js)
- `GIRLFRIEND_FALL_SPEED` - Timer speed (in Girlfriend.js)
- `SYSTEM_OVERRIDE_DURATION` - Combo effect duration (in ComboSystem.js)

## Notes

- No build process required
- No dependencies
- Works offline
- Lightweight (~20KB total)
