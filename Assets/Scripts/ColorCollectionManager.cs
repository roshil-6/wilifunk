using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Manages color cube collection and combo system.
/// Player can store EXACTLY 3 colors.
/// When 3rd color is collected → effect triggers automatically.
/// </summary>
public class ColorCollectionManager : MonoBehaviour
{
    public static ColorCollectionManager Instance { get; private set; }
    
    [Header("Combo Settings")]
    [SerializeField] private float systemOverrideDuration = 3f;
    
    private List<ColorCube.ColorType> collectedColors = new List<ColorCube.ColorType>();
    private const int MAX_COLORS = 3;
    private bool isSystemOverrideActive = false;
    
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
    
    /// <summary>
    /// Called when a color cube is collected.
    /// </summary>
    public void CollectColor(ColorCube.ColorType color)
    {
        // If already at max, remove oldest color (FIFO)
        if (collectedColors.Count >= MAX_COLORS)
        {
            collectedColors.RemoveAt(0);
        }
        
        collectedColors.Add(color);
        
        // If we now have 3 colors, check for combo
        if (collectedColors.Count == MAX_COLORS)
        {
            CheckForCombo();
        }
    }
    
    /// <summary>
    /// Checks if collected colors match a combo pattern.
    /// </summary>
    private void CheckForCombo()
    {
        // RED + BLUE + GREEN → SYSTEM OVERRIDE
        if (collectedColors.Contains(ColorCube.ColorType.Red) &&
            collectedColors.Contains(ColorCube.ColorType.Blue) &&
            collectedColors.Contains(ColorCube.ColorType.Green))
        {
            TriggerSystemOverride();
        }
        
        // Clear colors after combo check (combo consumes them)
        collectedColors.Clear();
        
        // TODO: Other combos (not implemented yet)
        // Example:
        // RED + RED + RED → ???
        // BLUE + BLUE + BLUE → ???
        // etc.
    }
    
    /// <summary>
    /// Triggers the System Override combo effect.
    /// - World glitches briefly (≈3 seconds)
    /// - Bombs deactivate temporarily
    /// - Obstacles freeze in place
    /// - Visual-only feedback (screen distortion / neon pulse)
    /// </summary>
    private void TriggerSystemOverride()
    {
        if (isSystemOverrideActive) return;
        
        isSystemOverrideActive = true;
        
        // Deactivate all bombs
        Bomb[] bombs = FindObjectsOfType<Bomb>();
        foreach (Bomb bomb in bombs)
        {
            bomb.Deactivate();
        }
        
        // TODO: Freeze obstacles (if we add moving obstacles later)
        // TODO: Visual glitch effect (screen distortion / neon pulse)
        
        // Reactivate after duration
        Invoke(nameof(EndSystemOverride), systemOverrideDuration);
    }
    
    /// <summary>
    /// Ends the System Override effect.
    /// </summary>
    private void EndSystemOverride()
    {
        isSystemOverrideActive = false;
        
        // Reactivate all bombs
        Bomb[] bombs = FindObjectsOfType<Bomb>();
        foreach (Bomb bomb in bombs)
        {
            bomb.Reactivate();
        }
        
        // TODO: Unfreeze obstacles
        // TODO: End visual glitch effect
    }
}
