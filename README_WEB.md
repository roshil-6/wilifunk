# WILIFUNK - Web Version

A browser-based 2D side-scrolling runner game built with Phaser 3.

## Quick Start

### Option 1: Direct File (Easiest)
1. Open `index.html` in a web browser
2. That's it! The game should load and run.

### Option 2: Local Server (Recommended for Development)
1. Install a simple HTTP server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js (if you have it)
   npx http-server
   ```
2. Open browser to `http://localhost:8000`

## How to Play

- **Space Bar** or **Click/Tap** - Jump
- **Auto-run** - Willu automatically runs from left to right
- **Goal** - Reach the falling girlfriend before she falls out of view
- **Collect Colors** - Collect Red, Blue, and Green cubes
- **System Override** - Collecting Red + Blue + Green deactivates bombs temporarily

## Game Features

✅ Auto-running Willu  
✅ Jump mechanic  
✅ Instant death on collision + instant restart  
✅ Falling girlfriend (visual timer)  
✅ Win/Lose conditions  
✅ Obstacles and bombs  
✅ Color cube collection (3-color limit)  
✅ System Override combo (RED+BLUE+GREEN)  
✅ One-time hint display  

## File Structure

```
wilifunk game dev/
├── index.html          # Main HTML file
├── game.js             # Game logic (Phaser 3)
├── style.css           # Basic styling
└── README_WEB.md       # This file
```

## Deployment

### Deploy to Any Web Host
1. Upload all files to your web server
2. Access via `yourdomain.com/index.html`

### Popular Free Hosting Options:
- **GitHub Pages** - Free, easy, works great
- **Netlify** - Drag and drop deployment
- **Vercel** - Fast, free hosting
- **Itch.io** - Game-specific hosting

### GitHub Pages Setup:
1. Create a GitHub repository
2. Upload files
3. Go to Settings → Pages
4. Select main branch
5. Your game will be live at `username.github.io/repository-name`

## Customization

### Change Game Size
Edit `config.width` and `config.height` in `game.js`

### Adjust Difficulty
Modify values in `SETTINGS` object in `game.js`:
- `RUN_SPEED` - How fast Willu runs
- `JUMP_FORCE` - Jump height
- `GIRLFRIEND_FALL_SPEED` - How fast girlfriend falls

### Add More Levels
Create additional obstacles, bombs, and color cubes in the `create()` function.

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Uses Phaser 3 CDN (no installation needed)
- All game logic in single `game.js` file
- No build process required
- Works offline after first load
