# Unity Setup Steps - WILIFUNK

## Step 1: Open the Project
- Unity should now be loading your project
- Wait for Unity to finish importing assets

## Step 2: Create Your First Scene
1. Right-click in Project window → Create → Scene
2. Name it "Level1" or "MainScene"
3. Double-click to open it
4. Save the scene (Ctrl+S)

## Step 3: Set Up Willu (Player)

### Create Willu GameObject:
1. Right-click in Hierarchy → Create Empty → Name it "Willu"
2. Add components to Willu:
   - **Sprite Renderer**: Component → Rendering → Sprite Renderer
   - **Rigidbody 2D**: Component → Physics 2D → Rigidbody 2D
   - **Box Collider 2D**: Component → Physics 2D → Box Collider 2D
   - **WilluController**: Component → Scripts → WilluController

### Configure Willu:
1. **Tag**: Select Willu → Inspector → Tag dropdown → Add Tag → Create "Player" tag → Assign "Player" to Willu
2. **Rigidbody 2D Settings**:
   - Body Type: Dynamic
   - Freeze Rotation: Z ✓ (checked)
   - Collision Detection: Continuous
3. **Position**: Set Transform to (0, 0, 0) or wherever you want Willu to start

### Create Ground Check:
1. Right-click on Willu in Hierarchy → Create Empty → Name it "GroundCheck"
2. Position it at Willu's feet (e.g., y = -0.5 if Willu is at y = 0)
3. In WilluController component:
   - Drag GroundCheck to "Ground Check" field

### Create Ground Layer:
1. Edit → Project Settings → Tags and Layers
2. Under "Layers", expand "User Layer 8"
3. Name it "Ground"
4. In WilluController:
   - Ground Layer: Select "Ground" from dropdown

## Step 4: Create Ground Platform

1. Right-click in Hierarchy → 2D Object → Sprite → Square (or use Sprite Renderer)
2. Name it "Ground"
3. Set Layer to "Ground" (Inspector → Layer dropdown)
4. Add **Box Collider 2D** component
5. Scale it: Transform → Scale → (20, 1, 1) or larger
6. Position it below Willu: Transform → Position → (0, -2, 0)

## Step 5: Create Girlfriend

1. Right-click in Hierarchy → Create Empty → Name it "Girlfriend"
2. Add **Sprite Renderer** component
3. Add **GirlfriendController** script
4. Position: Transform → Position → (0, 10, 0)
5. In GirlfriendController:
   - Fall Speed: 2
   - Start Height: 10
   - Win Height: 1
   - Willu: Drag Willu from Hierarchy
   - Reach Distance: 1.5

## Step 6: Create GameManager

1. Right-click in Hierarchy → Create Empty → Name it "GameManager"
2. Add **GameManager** script
3. Add **ColorCollectionManager** script (same GameObject)
4. Create Start Position:
   - Right-click in Hierarchy → Create Empty → Name it "StartPosition"
   - Position it where Willu should start (e.g., 0, 0, 0)
5. In GameManager:
   - Willu: Drag Willu from Hierarchy
   - Girlfriend: Drag Girlfriend from Hierarchy
   - Start Position: Drag StartPosition from Hierarchy

## Step 7: Set Up Camera

1. Select Main Camera in Hierarchy
2. Add **CameraController** script
3. In CameraController:
   - Target: Drag Willu from Hierarchy
   - Smooth Speed: 0.125
   - Offset: (2, 0, -10)

## Step 8: Create UI

### Create Canvas:
1. Right-click in Hierarchy → UI → Canvas
2. Canvas should auto-create EventSystem (keep it)

### Create Game Over Text:
1. Right-click on Canvas → UI → Text - TextMeshPro (or Legacy Text)
2. Name it "GameOverText"
3. Text: "GAME OVER"
4. Center it on screen
5. Make it large and visible
6. Initially disable it: Uncheck the GameObject checkbox in Inspector
7. In GameManager:
   - Game Over Text: Drag GameOverText from Hierarchy

### Create Hint Text:
1. Right-click on Canvas → UI → Text - TextMeshPro (or Legacy Text)
2. Name it "HintText"
3. Add **HintDisplay** script
4. Center it on screen
5. In HintDisplay:
   - Hint Text: Drag HintText from Hierarchy (or it will auto-find)

## Step 9: Create Test Obstacles

### Static Block:
1. Right-click in Hierarchy → 2D Object → Sprite → Square
2. Name it "ObstacleBlock"
3. Add **Obstacle** script
4. Add **Box Collider 2D** (not trigger)
5. Position it in Willu's path (e.g., x = 5, y = 0)

### Bomb:
1. Right-click in Hierarchy → 2D Object → Sprite → Square
2. Name it "Bomb"
3. Add **Bomb** script
4. Add **Box Collider 2D** → Check "Is Trigger"
5. Position it in Willu's path (e.g., x = 8, y = 1)
6. Change color to red (Sprite Renderer → Color → Red)

## Step 10: Create Color Cubes

1. Right-click in Hierarchy → 2D Object → Sprite → Square
2. Name it "ColorCubeRed"
3. Add **ColorCube** script
4. Add **Box Collider 2D** → Check "Is Trigger"
5. In ColorCube:
   - Color Type: Red
6. Position it floating (e.g., x = 3, y = 2)
7. Repeat for Blue and Green cubes

## Step 11: Test the Game

1. Press Play button
2. Willu should auto-run
3. Press Space to jump
4. Test collision with obstacles
5. Test collecting color cubes
6. Test System Override combo (collect Red + Blue + Green)

## Quick Tips

- If Willu falls through ground: Check that Ground has a collider and is on "Ground" layer
- If jump doesn't work: Check GroundCheck position and Ground Layer setting
- If camera doesn't follow: Check that Target is assigned in CameraController
- Adjust speeds/forces in Inspector as needed

## Next Steps After Testing

- Add more obstacles and color cubes
- Adjust difficulty (speeds, distances)
- Add visual polish (sprites, animations, effects)
- Create more levels
