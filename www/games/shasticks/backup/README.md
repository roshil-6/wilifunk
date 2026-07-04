# Stick Fighter 🥊

A polished 2D stickman fighting game built with **Phaser 3 + Vite**, wrapped in **Capacitor** for Android/Play Store deployment.

---

## Quick Start (Browser)

```bash
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## Project Structure

```
/src
  /scenes
    BootScene.js          — Loading screen, asset preload
    MenuScene.js          — Animated main menu
    CharacterSelectScene.js — 6-character portrait grid + stat preview
    ArenaSelectScene.js   — 10-arena thumbnail grid
    FightScene.js         — Core gameplay loop
    PauseScene.js         — Pause overlay (ESC / back button)
    ResultScene.js        — Post-match winner screen
  /entities
    Fighter.js            — State machine, procedural rig, rendering
    Hitbox.js             — Attack detection zone logic
  /systems
    InputManager.js       — Keyboard + touch abstraction
    ComboSystem.js        — Combo chains, damage scaling
    AIController.js       — CPU AI (Easy / Medium / Hard)
    SoundManager.js       — Web Audio synthesized SFX
    ParticleManager.js    — Hit sparks, dust, trails, arena FX
    CameraFX.js           — Screen shake, hit-stop, slow-mo
  /data
    characters.json       — All character stats and specials
    moves.json            — Frame data, damage, hitbox windows
    arenas.json           — Arena configs and parallax layers
  /ui
    HUD.js                — Health bars, round pips, combo counter
    HealthBar.js          — Animated gradient HP + meter bars
    TouchControls.js      — Virtual d-pad + action buttons
  main.js                 — Phaser game entry point
index.html                — Zero-CDN entry point
vite.config.js            — Vite bundler config
capacitor.config.ts       — Capacitor Android config
```

---

## Game Controls

### Player 1 (Keyboard)
| Action       | Key         |
|-------------|-------------|
| Move Left   | `A`         |
| Move Right  | `D`         |
| Jump        | `W`         |
| Crouch/Block| `S`         |
| Punch       | `F`         |
| Kick        | `G`         |
| Special 1   | `H`         |
| Special 2   | `J`         |
| Special 3   | `K`         |
| Pause       | `ESC`       |

### Player 2 (Keyboard)
| Action       | Key            |
|-------------|----------------|
| Move Left   | `← Arrow`      |
| Move Right  | `→ Arrow`      |
| Jump        | `↑ Arrow`      |
| Crouch/Block| `↓ Arrow`      |
| Punch       | `Numpad 1`     |
| Kick        | `Numpad 2`     |
| Special 1   | `Numpad 3`     |
| Special 2   | `Numpad 4`     |
| Special 3   | `Numpad 5`     |

### Touch (Mobile)
Virtual d-pad (left side) + action buttons (right side) appear automatically on touch devices.

---

## Characters

| Name   | Speed | Power | Defense | Style                        |
|--------|-------|-------|---------|------------------------------|
| Kai    | 7     | 6     | 7       | Balanced all-rounder         |
| Ryu    | 4     | 9     | 8       | Heavy hitter, slow but deadly|
| Ninja  | 10    | 5     | 4       | Lightning-fast combo machine |
| Spike  | 5     | 7     | 9       | Tanky brawler, ground game   |
| Shadow | 8     | 6     | 6       | Counter-attack specialist    |
| Ghost  | 3     | 10    | 10      | Maximum tank, one-hit threat |

---

## Combat System

- **Light → Light → Heavy** combo chains with damage scaling
- **Directional attacks**: forward+punch = different move than neutral
- **Crouch** (hold Down): crouch block (chip reduction), low sweep kick
- **Grab**: short-range, unblockable
- **3 Specials per character**: drain meter (30–50%), usable at partial meter for reduced power
- **Super** (100% meter, Special 3): max damage, screen flash + zoom
- **Hit-stop**: 40–150ms freeze on impactful hits for "feel"
- **Combo damage scaling**: hits 1→2→3→4+ scale down to 40%
- **Best-of-3 rounds**, 60-second timer per round

---

## Adding a New Character

1. Open `src/data/characters.json`
2. Add a new entry following the existing schema:
   ```json
   {
     "id": "newchar",
     "name": "NewChar",
     "color": 16711680,
     "colorHex": "#ff0000",
     "speed": 260, "power": 1.0, "defense": 0.9,
     "meterGain": 11, "jumpForce": -550,
     "description": "Short description here.",
     "stats": { "speed": 6, "power": 6, "defense": 7, "special": 6 },
     "specials": ["dash_strike", "energy_wave", "power_uppercut"]
   }
   ```
3. The character automatically appears in Character Select — no engine code changes needed.

---

## Adding a New Arena

1. Open `src/data/arenas.json`
2. Add a new entry with sky color palette (decimal integers), ground color, and particle type
3. Add a matching `_drawYourArena(g)` method in `FightScene.js` and add its case to `_buildArenaLayers()`

---

## Tuning Balance

All damage, speed, knockback, and frame data lives in `src/data/moves.json`. Edit values there — no engine code changes required.

Key fields per move:
- `damage` — base damage before combo scaling and power multiplier
- `knockback` — horizontal velocity applied on hit
- `hitstun` — ms target is locked in hit state
- `activeWindow` — `[start, end]` as fraction of move duration (0.0–1.0)
- `meterCost` — for specials; partial meter gives partial damage

---

## Production Build

```bash
npm run build
```
Output goes to `dist/`. Phaser is fully bundled — no CDN dependencies.

---

## Android / Play Store Build

### Prerequisites
- Android Studio installed
- Java 17+
- Android SDK (API 33+)

### Steps

```bash
# 1. Build the web app
npm run build

# 2. Initialize Capacitor (first time only)
npx cap init "Stick Fighter" com.shaticks.stickfighter --web-dir dist

# 3. Add the Android platform (first time only)
npx cap add android

# 4. Sync web build into native project
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

In Android Studio:
- Select **Build → Generate Signed Bundle / APK**
- Choose **Android App Bundle (.aab)** — required by Play Store
- Create/use your keystore (back it up securely — losing it means you can't update the listing)
- Build in **Release** mode

### Lock to Landscape

In `android/app/src/main/AndroidManifest.xml`, add to the `<activity>` tag:
```xml
android:screenOrientation="landscape"
```

### Adaptive Icon + Splash Screen

```bash
npx @capacitor/assets generate --iconBackgroundColor '#0b0b12' --splashBackgroundColor '#0b0b12'
```
Place your `icon.png` (1024×1024) and `splash.png` (2732×2732) in the project root first.

---

## Privacy Policy (Play Store Requirement)

This game **does not collect any personal data**. Host a simple one-page privacy policy at a public URL (e.g. GitHub Pages) and submit it in Play Console under App Content → Privacy Policy.

Example text:
> "Stick Fighter does not collect, store, or share any personal information. No analytics, no tracking, no network requests during gameplay."

---

## Content Rating

Stick-figure combat with no blood or gore typically qualifies as:
- **PEGI 3** (Europe)
- **Everyone** (ESRB / Google Play)

Fill out the Play Console rating questionnaire honestly based on the final violence level.

---

## Monetization Hooks (Optional)

Character unlock state is stored per-character in `characters.json` (add an `"unlocked": false` flag). Gate locked characters in `CharacterSelectScene.js` with a simple check — easy to hook into IAP or ad-reward later.

For AdMob: stub interstitial calls in `ResultScene.js` after match ends using `@capacitor-community/admob`.

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Game Engine| Phaser 3 (v3.70, local npm) |
| Bundler    | Vite 5                      |
| Mobile     | Capacitor 6 (Android)       |
| Rendering  | Procedural Canvas (no sprites) |
| Audio      | Web Audio API (synthesized) |
| Data       | JSON (data-driven design)   |
