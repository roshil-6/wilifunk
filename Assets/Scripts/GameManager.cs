using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Manages game state, restart logic, and win/lose conditions.
/// Handles instant restart on death.
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    [Header("References")]
    [SerializeField] private WilluController willu;
    [SerializeField] private GirlfriendController girlfriend;
    [SerializeField] private Transform startPosition;
    
    [Header("UI")]
    [SerializeField] private GameObject gameOverText;
    
    private bool isGameOver = false;
    private bool hasWon = false;
    private bool hasShownHint = false;
    
    void Awake()
    {
        // Singleton pattern
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
            return;
        }
    }
    
    void Start()
    {
        InitializeGame();
    }
    
    void Update()
    {
        // Instant restart on tap/key after game over
        if (isGameOver && (Input.GetKeyDown(KeyCode.Space) || Input.GetMouseButtonDown(0) || 
            (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began)))
        {
            RestartGame();
        }
    }
    
    /// <summary>
    /// Initializes the game at start or restart.
    /// </summary>
    private void InitializeGame()
    {
        isGameOver = false;
        hasWon = false;
        
        if (gameOverText != null)
            gameOverText.SetActive(false);
        
        // Reset Willu position
        if (willu != null && startPosition != null)
        {
            willu.transform.position = startPosition.position;
            willu.ResetWillu();
        }
        
        // Reset girlfriend
        if (girlfriend != null)
        {
            girlfriend.ResetGirlfriend();
        }
        
        // Show hint only once at Level 1 start
        if (!hasShownHint)
        {
            ShowHint();
            hasShownHint = true;
        }
    }
    
    /// <summary>
    /// Called when Willu dies (hits obstacle or bomb).
    /// </summary>
    public void OnWilluDeath()
    {
        if (isGameOver) return;
        
        isGameOver = true;
        
        if (gameOverText != null)
            gameOverText.SetActive(true);
    }
    
    /// <summary>
    /// Called when Willu reaches the girlfriend (win condition).
    /// </summary>
    public void OnWilluReachGirlfriend()
    {
        if (isGameOver || hasWon) return;
        
        hasWon = true;
        isGameOver = true;
        
        // TODO: Win state handling (for now, same as restart)
        // In future: could show win text, load next level, etc.
    }
    
    /// <summary>
    /// Called when girlfriend falls out of view (lose condition).
    /// </summary>
    public void OnGirlfriendFell()
    {
        if (isGameOver) return;
        
        isGameOver = true;
        
        if (gameOverText != null)
            gameOverText.SetActive(true);
    }
    
    /// <summary>
    /// Instantly restarts the game.
    /// </summary>
    private void RestartGame()
    {
        // Reload scene for clean restart
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }
    
    /// <summary>
    /// Shows the hint text once at Level 1 start.
    /// </summary>
    private void ShowHint()
    {
        // TODO: Implement hint text display
        // Fade in smoothly, stay for ~2 seconds, fade out
        // Never show again
        Debug.Log("Try collecting the right color combo to save her.");
    }
}
