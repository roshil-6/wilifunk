using UnityEngine;

/// <summary>
/// Color cube that Willu can collect.
/// Types: Red, Blue, Green
/// </summary>
public class ColorCube : MonoBehaviour
{
    public enum ColorType
    {
        Red,
        Blue,
        Green
    }
    
    [Header("Color Settings")]
    [SerializeField] private ColorType colorType = ColorType.Red;
    
    [Header("Visual")]
    [SerializeField] private SpriteRenderer spriteRenderer;
    
    private bool isCollected = false;
    
    void Start()
    {
        if (spriteRenderer == null)
            spriteRenderer = GetComponent<SpriteRenderer>();
        
        // Set color based on type
        UpdateColor();
    }
    
    void OnTriggerEnter2D(Collider2D other)
    {
        if (isCollected) return;
        
        if (other.CompareTag("Player"))
        {
            Collect();
        }
    }
    
    /// <summary>
    /// Collects this color cube.
    /// </summary>
    private void Collect()
    {
        if (isCollected) return;
        
        isCollected = true;
        
        // Notify ColorCollectionManager
        ColorCollectionManager.Instance?.CollectColor(colorType);
        
        // Visual feedback (could add particle effect later)
        gameObject.SetActive(false);
    }
    
    /// <summary>
    /// Updates the visual color of the cube.
    /// </summary>
    private void UpdateColor()
    {
        if (spriteRenderer == null) return;
        
        Color color = Color.white;
        switch (colorType)
        {
            case ColorType.Red:
                color = Color.red;
                break;
            case ColorType.Blue:
                color = Color.blue;
                break;
            case ColorType.Green:
                color = Color.green;
                break;
        }
        
        spriteRenderer.color = color;
    }
}
