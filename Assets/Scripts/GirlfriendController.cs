using UnityEngine;

/// <summary>
/// Controls the falling girlfriend (visual timer).
/// She falls from above and is always visible on screen.
/// If she falls out of view → LOSE.
/// If Willu reaches her → WIN.
/// </summary>
public class GirlfriendController : MonoBehaviour
{
    [Header("Fall Settings")]
    [SerializeField] private float fallSpeed = 2f;
    [SerializeField] private float startHeight = 10f;
    [SerializeField] private float winHeight = 1f; // Height at which Willu can reach her
    
    [Header("References")]
    [SerializeField] private Transform willu;
    [SerializeField] private float reachDistance = 1.5f;
    
    private Vector3 startPosition;
    private bool hasReached = false;
    private bool hasFallen = false;
    
    void Start()
    {
        startPosition = transform.position;
    }
    
    void Update()
    {
        // Make girlfriend fall
        if (!hasReached && !hasFallen)
        {
            transform.position += Vector3.down * fallSpeed * Time.deltaTime;
            
            // Check if Willu reached her (win condition)
            if (willu != null)
            {
                float distanceToWillu = Vector3.Distance(transform.position, willu.position);
                if (distanceToWillu <= reachDistance && transform.position.y <= winHeight)
                {
                    OnReached();
                }
            }
            
            // Check if she fell out of view (lose condition)
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                Vector3 viewportPos = mainCam.WorldToViewportPoint(transform.position);
                if (viewportPos.y < -0.1f) // Below camera view
                {
                    OnFell();
                }
            }
        }
    }
    
    /// <summary>
    /// Called when Willu reaches the girlfriend (win).
    /// </summary>
    private void OnReached()
    {
        if (hasReached) return;
        
        hasReached = true;
        GameManager.Instance?.OnWilluReachGirlfriend();
    }
    
    /// <summary>
    /// Called when girlfriend falls out of view (lose).
    /// </summary>
    private void OnFell()
    {
        if (hasFallen) return;
        
        hasFallen = true;
        GameManager.Instance?.OnGirlfriendFell();
    }
    
    /// <summary>
    /// Resets girlfriend to starting position.
    /// </summary>
    public void ResetGirlfriend()
    {
        transform.position = startPosition;
        hasReached = false;
        hasFallen = false;
    }
}
