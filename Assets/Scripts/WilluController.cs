using UnityEngine;

/// <summary>
/// Controls Willu's auto-running and jump mechanics.
/// Willu automatically runs from left to right.
/// Player can only control jumping.
/// </summary>
public class WilluController : MonoBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float runSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;
    
    [Header("Ground Detection")]
    [SerializeField] private Transform groundCheck;
    [SerializeField] private float groundCheckRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;
    
    private Rigidbody2D rb;
    private bool isGrounded;
    private bool isDead = false;
    
    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        if (rb == null)
        {
            rb = gameObject.AddComponent<Rigidbody2D>();
        }
        
        // Configure Rigidbody2D for platformer
        rb.freezeRotation = true;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
    }
    
    void Update()
    {
        if (isDead) return;
        
        // Check if grounded
        if (groundCheck != null)
        {
            isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);
        }
        
        // Auto-run (always move right)
        rb.velocity = new Vector2(runSpeed, rb.velocity.y);
        
        // Jump input (mobile-friendly: space key or touch)
        if (Input.GetKeyDown(KeyCode.Space) || (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began))
        {
            Jump();
        }
    }
    
    /// <summary>
    /// Makes Willu jump if grounded.
    /// </summary>
    private void Jump()
    {
        if (isGrounded)
        {
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
        }
    }
    
    /// <summary>
    /// Called when Willu hits an obstacle or bomb.
    /// </summary>
    public void Die()
    {
        if (isDead) return;
        
        isDead = true;
        rb.velocity = Vector2.zero;
        
        // Notify GameManager
        GameManager.Instance?.OnWilluDeath();
    }
    
    /// <summary>
    /// Resets Willu to initial state for restart.
    /// </summary>
    public void ResetWillu()
    {
        isDead = false;
        rb.velocity = Vector2.zero;
        transform.position = Vector3.zero; // Will be set by GameManager
    }
    
    void OnDrawGizmosSelected()
    {
        if (groundCheck != null)
        {
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
        }
    }
}
