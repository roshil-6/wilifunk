using UnityEngine;

/// <summary>
/// Base class for obstacles that kill Willu on contact.
/// Static blocks use this directly.
/// </summary>
public class Obstacle : MonoBehaviour
{
    void OnTriggerEnter2D(Collider2D other)
    {
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
        if (collision.gameObject.CompareTag("Player"))
        {
            WilluController willu = collision.gameObject.GetComponent<WilluController>();
            if (willu != null)
            {
                willu.Die();
            }
        }
    }
}
