# WILIFUNK - Unity Scene Setup Guide

## Quick Setup Steps

### 1. Create Willu (Player)

1. Create an empty GameObject named "Willu"
2. Add components:
   - `SpriteRenderer` (or use a simple colored quad/cube for placeholder)
   - `Rigidbody2D`:
     - Body Type: Dynamic
     - Freeze Rotation Z: ✓
     - Collision Detection: Continuous
   - `BoxCollider2D` (or `CircleCollider2D`)
   - `WilluController` script
3. Tag: Set to "Player"
4. Create child GameObject named "GroundCheck" (empty, positioned at Willu's feet)
   - Assign to `groundCheck` field in WilluController
5. In WilluController inspector:
   - Run Speed: 5
   - Jump Force: 10
   - Ground Check: Assign GroundCheck transform
   - Ground Layer: Create a "Ground" layer and assign it

### 2. Create Ground

1. Create a GameObject with a `SpriteRenderer` (or use a colored quad)
2. Add `BoxCollider2D`
3. Set Layer to "Ground" (same layer used in Willu's ground check)
4. Position at y = 0 or below Willu
5. Scale to create a platform/ground

### 3. Create Girlfriend

1. Create an empty GameObject named "Girlfriend"
2. Add components:
   - `SpriteRenderer` (abstract shape/glyph)
   - `GirlfriendController` script
3. Position above Willu (e.g., y = 10)
4. In GirlfriendController inspector:
   - Fall Speed: 2
   - Start Height: 10
   - Win Height: 1
   - Willu: Assign Willu transform
   - Reach Distance: 1.5

### 4. Create GameManager

1. Create empty GameObject named "GameManager"
2. Add `GameManager` script
3. Add `ColorCollectionManager` script (same GameObject)
4. In GameManager inspector:
   - Willu: Assign Willu GameObject
   - Girlfriend: Assign Girlfriend GameObject
   - Start Position: Create empty GameObject at starting position, assign here
   - Game Over Text: Create UI Text, assign here

### 5. Setup Camera

1. Select Main Camera
2. Add `CameraController` script
3. In CameraController inspector:
   - Target: Assign Willu transform
   - Smooth Speed: 0.125
   - Offset: (2, 0, -10)

### 6. Create Obstacles

**Static Blocks:**
1. Create GameObject with `SpriteRenderer` and `BoxCollider2D`
2. Add `Obstacle` script
3. Position along the path

**Bombs:**
1. Create GameObject with `SpriteRenderer` and `BoxCollider2D` (set as Trigger)
2. Add `Bomb` script
3. Position along the path

### 7. Create Color Cubes

1. Create GameObject with `SpriteRenderer` and `BoxCollider2D` (set as Trigger)
2. Add `ColorCube` script
3. In ColorCube inspector:
   - Color Type: Red / Blue / Green
4. Position floating above ground

### 8. Setup UI

1. Create Canvas (UI > Canvas)
2. Create Text for "GAME OVER":
   - Name: "GameOverText"
   - Text: "GAME OVER"
   - Initially disabled
   - Assign to GameManager's Game Over Text field
3. Create Text for Hint:
   - Name: "HintText"
   - Add `HintDisplay` script
   - Text will be set automatically
   - Position center of screen

### 9. Layer Setup

Create these layers in Edit > Project Settings > Tags and Layers:
- Ground (for ground detection)
- Default (for obstacles, bombs, etc.)

### 10. Testing

1. Press Play
2. Willu should auto-run
3. Press Space or tap screen to jump
4. Test collision with obstacles
5. Test color cube collection
6. Test System Override combo (collect Red + Blue + Green)

## Notes

- All scripts are ready to use
- Adjust speeds, forces, and distances in inspector as needed
- Use placeholder sprites (colored quads) until art assets are ready
- Make sure colliders are set up correctly (Trigger vs Collision)
