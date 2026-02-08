using UnityEngine;

/// <summary>
/// Bomb obstacle that kills Willu on contact.
/// Can be deactivated by System Override combo.
/// </summary>
public class Bomb : MonoBehaviour
{
    [Header("Visual")]
    [SerializeField] private SpriteRenderer spriteRenderer;
    [SerializeField] private Color activeColor = Color.red;
    [SerializeField] private Color inactiveColor = Color.gray;
    
    private bool isActive = true;
    
    void Start()
    {
        if (spriteRenderer == null)
            spriteRenderer = GetComponent<SpriteRenderer>();
    }
    
    void OnTriggerEnter2D(Collider2D other)
    {
        if (!isActive) return;
        
        if (other.CompareTag("Player"))
        {
            WilluController willu = other.GetComponent<WilluController>();
            if (willu != null)
            {
                willu.Die();
            }
        }
    }
    
    void OnCollisionEnter2D(Collision2D collision)
    {
        if (!isActive) return;
        
        if (collision.gameObject.CompareTag("Player"))
        {
            WilluController willu = collision.gameObject.GetComponent<WilluController>();
            if (willu != null)
            {
                willu.Die();
            }
        }
    }
    
    /// <summary>
    /// Deactivates the bomb (called by System Override combo).
    /// </summary>
    public void Deactivate()
    {
        isActive = false;
        if (spriteRenderer != null)
        {
            spriteRenderer.color = inactiveColor;
        }
        
        // Disable collider
        Collider2D col = GetComponent<Collider2D>();
        if (col != null)
        {
            col.enabled = false;
        }
    }
    
    /// <summary>
    /// Reactivates the bomb (after combo effect ends).
    /// </summary>
    public void Reactivate()
    {
        isActive = true;
        if (spriteRenderer != null)
        {
            spriteRenderer.color = activeColor;
        }
        
        // Enable collider
        Collider2D col = GetComponent<Collider2D>();
        if (col != null)
        {
            col.enabled = true;
        }
    }
}
