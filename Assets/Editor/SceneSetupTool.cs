using UnityEngine;
using UnityEditor;
using UnityEngine.UI;

/// <summary>
/// Editor tool that automatically sets up the WILIFUNK game scene.
/// Run this from: Tools > WILIFUNK > Setup Scene
/// </summary>
public class SceneSetupTool : EditorWindow
{
    [MenuItem("Tools/WILIFUNK/Setup Scene")]
    public static void SetupScene()
    {
        Debug.Log("Setting up WILIFUNK scene...");
        
        // Clear existing scene (optional - comment out if you want to keep existing objects)
        // GameObject[] allObjects = FindObjectsOfType<GameObject>();
        // foreach (GameObject obj in allObjects)
        // {
        //     if (obj.name != "Main Camera" && obj.name != "Directional Light")
        //         DestroyImmediate(obj);
        // }
        
        // 1. Create Willu (Player)
        GameObject willu = CreateWillu();
        
        // 2. Create Ground
        CreateGround();
        
        // 3. Create Girlfriend
        GameObject girlfriend = CreateGirlfriend();
        
        // 4. Create GameManager
        GameObject gameManager = CreateGameManager();
        
        // 5. Setup Camera
        SetupCamera(willu);
        
        // 6. Setup UI
        GameObject gameOverText = CreateUI();
        
        // 7. Create Start Position
        GameObject startPosition = CreateStartPosition();
        
        // 8. Link references in GameManager
        LinkGameManagerReferences(gameManager, willu, girlfriend, startPosition, gameOverText);
        
        // 9. Create Ground Layer
        CreateGroundLayer();
        
        Debug.Log("Scene setup complete! Don't forget to:");
        Debug.Log("1. Assign the 'Ground' layer to the Ground object");
        Debug.Log("2. Set Willu's tag to 'Player'");
        Debug.Log("3. Test the game!");
    }
    
    static GameObject CreateWillu()
    {
        // Create Willu GameObject
        GameObject willu = new GameObject("Willu");
        willu.transform.position = Vector3.zero;
        
        // Add Sprite Renderer
        SpriteRenderer sr = willu.AddComponent<SpriteRenderer>();
        sr.color = Color.cyan; // Placeholder color
        
        // Create a simple white square sprite for placeholder
        Texture2D texture = new Texture2D(1, 1);
        texture.SetPixel(0, 0, Color.white);
        texture.Apply();
        Sprite sprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        sr.sprite = sprite;
        sr.sortingOrder = 1;
        
        // Add Rigidbody2D
        Rigidbody2D rb = willu.AddComponent<Rigidbody2D>();
        rb.freezeRotation = true;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
        
        // Add Box Collider 2D
        BoxCollider2D col = willu.AddComponent<BoxCollider2D>();
        col.size = new Vector2(0.8f, 0.8f);
        
        // Add WilluController
        WilluController controller = willu.AddComponent<WilluController>();
        
        // Create Ground Check
        GameObject groundCheck = new GameObject("GroundCheck");
        groundCheck.transform.SetParent(willu.transform);
        groundCheck.transform.localPosition = new Vector3(0, -0.5f, 0);
        
        // Set ground check reference using reflection (since it's private)
        var field = typeof(WilluController).GetField("groundCheck", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            field.SetValue(controller, groundCheck.transform);
        }
        
        // Set tag to Player
        willu.tag = "Player";
        
        Debug.Log("Created Willu");
        return willu;
    }
    
    static void CreateGround()
    {
        GameObject ground = new GameObject("Ground");
        ground.transform.position = new Vector3(0, -2, 0);
        ground.transform.localScale = new Vector3(20, 1, 1);
        
        // Add Sprite Renderer
        SpriteRenderer sr = ground.AddComponent<SpriteRenderer>();
        Texture2D texture = new Texture2D(1, 1);
        texture.SetPixel(0, 0, Color.gray);
        texture.Apply();
        Sprite sprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        sr.sprite = sprite;
        sr.sortingOrder = 0;
        
        // Add Box Collider 2D
        BoxCollider2D col = ground.AddComponent<BoxCollider2D>();
        
        Debug.Log("Created Ground");
    }
    
    static GameObject CreateGirlfriend()
    {
        GameObject girlfriend = new GameObject("Girlfriend");
        girlfriend.transform.position = new Vector3(0, 10, 0);
        
        // Add Sprite Renderer
        SpriteRenderer sr = girlfriend.AddComponent<SpriteRenderer>();
        sr.color = Color.magenta; // Placeholder color
        Texture2D texture = new Texture2D(1, 1);
        texture.SetPixel(0, 0, Color.white);
        texture.Apply();
        Sprite sprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        sr.sprite = sprite;
        sr.sortingOrder = 1;
        
        // Add GirlfriendController
        GirlfriendController controller = girlfriend.AddComponent<GirlfriendController>();
        
        Debug.Log("Created Girlfriend");
        return girlfriend;
    }
    
    static GameObject CreateGameManager()
    {
        GameObject gameManager = new GameObject("GameManager");
        
        // Add GameManager script
        gameManager.AddComponent<GameManager>();
        
        // Add ColorCollectionManager script
        gameManager.AddComponent<ColorCollectionManager>();
        
        Debug.Log("Created GameManager");
        return gameManager;
    }
    
    static void SetupCamera(GameObject willu)
    {
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            CameraController camController = mainCam.GetComponent<CameraController>();
            if (camController == null)
            {
                camController = mainCam.gameObject.AddComponent<CameraController>();
            }
            
            // Set target using reflection
            var field = typeof(CameraController).GetField("target", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(camController, willu.transform);
            }
            
            Debug.Log("Setup Camera");
        }
    }
    
    static GameObject CreateUI()
    {
        // Create Canvas
        GameObject canvasObj = new GameObject("Canvas");
        Canvas canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObj.AddComponent<CanvasScaler>();
        canvasObj.AddComponent<GraphicRaycaster>();
        
        // Create Game Over Text
        GameObject gameOverText = new GameObject("GameOverText");
        gameOverText.transform.SetParent(canvasObj.transform);
        Text text = gameOverText.AddComponent<Text>();
        text.text = "GAME OVER";
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = 48;
        text.alignment = TextAnchor.MiddleCenter;
        text.color = Color.white;
        
        RectTransform rect = gameOverText.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.anchoredPosition = Vector2.zero;
        rect.sizeDelta = new Vector2(400, 100);
        
        gameOverText.SetActive(false);
        
        // Create Hint Text
        GameObject hintText = new GameObject("HintText");
        hintText.transform.SetParent(canvasObj.transform);
        Text hintTextComponent = hintText.AddComponent<Text>();
        hintTextComponent.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        hintTextComponent.fontSize = 24;
        hintTextComponent.alignment = TextAnchor.MiddleCenter;
        hintTextComponent.color = Color.yellow;
        
        RectTransform hintRect = hintText.GetComponent<RectTransform>();
        hintRect.anchorMin = new Vector2(0.5f, 0.5f);
        hintRect.anchorMax = new Vector2(0.5f, 0.5f);
        hintRect.anchoredPosition = Vector2.zero;
        hintRect.sizeDelta = new Vector2(600, 50);
        
        hintText.AddComponent<HintDisplay>();
        
        // Create EventSystem if it doesn't exist
        if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }
        
        Debug.Log("Created UI");
        return gameOverText;
    }
    
    static GameObject CreateStartPosition()
    {
        GameObject startPos = new GameObject("StartPosition");
        startPos.transform.position = Vector3.zero;
        
        Debug.Log("Created StartPosition");
        return startPos;
    }
    
    static void LinkGameManagerReferences(GameObject gameManager, GameObject willu, 
        GameObject girlfriend, GameObject startPosition, GameObject gameOverText)
    {
        GameManager gm = gameManager.GetComponent<GameManager>();
        if (gm != null)
        {
            // Use reflection to set private fields
            var willuField = typeof(GameManager).GetField("willu", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var girlfriendField = typeof(GameManager).GetField("girlfriend", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var startPosField = typeof(GameManager).GetField("startPosition", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var gameOverTextField = typeof(GameManager).GetField("gameOverText", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            if (willuField != null)
                willuField.SetValue(gm, willu.GetComponent<WilluController>());
            if (girlfriendField != null)
                girlfriendField.SetValue(gm, girlfriend.GetComponent<GirlfriendController>());
            if (startPosField != null)
                startPosField.SetValue(gm, startPosition.transform);
            if (gameOverTextField != null)
                gameOverTextField.SetValue(gm, gameOverText);
        }
        
        // Link Girlfriend to Willu
        GirlfriendController gfController = girlfriend.GetComponent<GirlfriendController>();
        if (gfController != null)
        {
            var willuField = typeof(GirlfriendController).GetField("willu", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (willuField != null)
                willuField.SetValue(gfController, willu.transform);
        }
        
        Debug.Log("Linked references");
    }
    
    static void CreateGroundLayer()
    {
        // Note: Layer creation requires manual setup in Project Settings
        // This is just a reminder
        Debug.Log("IMPORTANT: Create 'Ground' layer manually:");
        Debug.Log("Edit > Project Settings > Tags and Layers > User Layer 8 > Name it 'Ground'");
        Debug.Log("Then assign 'Ground' layer to the Ground object and set it in WilluController");
    }
}
