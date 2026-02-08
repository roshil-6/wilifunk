using UnityEngine;
using UnityEngine.UI;
using System.Collections;

/// <summary>
/// Displays the hint text once at the start of Level 1.
/// Fades in smoothly, stays for ~2 seconds, fades out.
/// Never shows again.
/// </summary>
public class HintDisplay : MonoBehaviour
{
    [Header("UI")]
    [SerializeField] private Text hintText;
    
    [Header("Settings")]
    [SerializeField] private float fadeInDuration = 0.5f;
    [SerializeField] private float displayDuration = 2f;
    [SerializeField] private float fadeOutDuration = 0.5f;
    
    private const string HINT_MESSAGE = "Try collecting the right color combo to save her.";
    private bool hasShown = false;
    
    void Start()
    {
        if (hintText == null)
        {
            hintText = GetComponent<Text>();
        }
        
        // Check if hint was already shown (using PlayerPrefs for persistence)
        if (PlayerPrefs.GetInt("HintShown", 0) == 0)
        {
            StartCoroutine(ShowHintCoroutine());
        }
        else
        {
            // Hide hint text if already shown
            if (hintText != null)
            {
                hintText.gameObject.SetActive(false);
            }
        }
    }
    
    /// <summary>
    /// Coroutine that handles hint display with fade in/out.
    /// </summary>
    private IEnumerator ShowHintCoroutine()
    {
        if (hintText == null) yield break;
        
        hintText.text = HINT_MESSAGE;
        hintText.gameObject.SetActive(true);
        
        // Set initial alpha to 0
        Color color = hintText.color;
        color.a = 0f;
        hintText.color = color;
        
        // Fade in
        float elapsed = 0f;
        while (elapsed < fadeInDuration)
        {
            elapsed += Time.deltaTime;
            color.a = Mathf.Lerp(0f, 1f, elapsed / fadeInDuration);
            hintText.color = color;
            yield return null;
        }
        
        color.a = 1f;
        hintText.color = color;
        
        // Stay visible
        yield return new WaitForSeconds(displayDuration);
        
        // Fade out
        elapsed = 0f;
        while (elapsed < fadeOutDuration)
        {
            elapsed += Time.deltaTime;
            color.a = Mathf.Lerp(1f, 0f, elapsed / fadeOutDuration);
            hintText.color = color;
            yield return null;
        }
        
        color.a = 0f;
        hintText.color = color;
        
        // Hide and mark as shown
        hintText.gameObject.SetActive(false);
        PlayerPrefs.SetInt("HintShown", 1);
        PlayerPrefs.Save();
    }
}
