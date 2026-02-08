# WILIFUNK - 2D Side-Scrolling Runner Game

A mobile-first 2D side-scrolling runner game with mystery-based mechanics.

## Project Structure

```
Assets/
├── Scripts/
│   ├── WilluController.cs          # Auto-running and jump mechanics
│   ├── GameManager.cs              # Game state and restart logic
│   ├── CameraController.cs         # Camera follow system
│   ├── GirlfriendController.cs     # Falling girlfriend (visual timer)
│   ├── Obstacle.cs                 # Base obstacle class
│   ├── Bomb.cs                     # Bomb obstacle (deactivatable)
│   ├── ColorCube.cs                # Collectible color cubes
│   ├── ColorCollectionManager.cs   # Color collection and combo system
│   └── HintDisplay.cs              # One-time hint display
```

## Setup Instructions

1. Create a new Unity 2D project
2. Copy all scripts from `Assets/Scripts/` to your Unity project's `Assets/Scripts/` folder
3. Set up the scene:
   - Create a GameObject for Willu (tag: "Player")
   - Add `WilluController` script
   - Add Rigidbody2D and Collider2D components
   - Create a child GameObject for ground check (assign to `groundCheck` in inspector)
   - Create a GameObject for Girlfriend
   - Add `GirlfriendController` script
   - Create a GameObject for GameManager
   - Add `GameManager` script and assign references
   - Create a GameObject for Camera
   - Add `CameraController` script and assign Willu as target
   - Create UI Canvas with Game Over text and Hint text

## Development Status

Following the strict development order:

- [x] Auto-running Willu character
- [x] Jump mechanic
- [x] Collision death + instant restart
- [x] Falling girlfriend logic (visual timer)
- [x] Basic obstacles
- [x] Bomb obstacle
- [x] Color cube collection system
- [x] ONE combo effect (System Override)
- [x] Win condition (reach girlfriend)
- [x] Hint text display (once at Level 1 start)

## Notes

- All scripts are clean, commented, and follow single responsibility principle
- Mobile-friendly input (touch + keyboard)
- No menus, tutorials, or dialogue
- Mystery color combo system: collect 3 colors to trigger effects
- Only RED+BLUE+GREEN combo is implemented (System Override)
