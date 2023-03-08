using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using Platformer.ThirdWeb;
using TMPro;
using UnityEngine.UI;

namespace Platformer.Scene {
    /// <summary>
    /// Manages the start scene.
    /// </summary>
    public class StartManager : MonoBehaviour {
        [SerializeField] private GameObject startCanvas;
        [SerializeField] private GameObject loadingCanvas;
        [SerializeField] private GameObject coinCount;
        [SerializeField] private TextMeshProUGUI coinCountText;
        [SerializeField] private Button playButton;
        [SerializeField] private Button characterSelectButton;

        private void Start() {
#if UNITY_EDITOR
            playButton.onClick.AddListener(() => { AuthenticatedSceneManager.LoadScene("LevelSelect"); });

            characterSelectButton.onClick.AddListener(() => {
                AuthenticatedSceneManager.LoadScene("CharacterSelect");
            });
#else
            playButton.onClick.AddListener(() => {
                if (ThirdWebManager.IsAuthenticated) {
                    AuthenticatedSceneManager.LoadScene("LevelSelect");
                }
            });

            characterSelectButton.onClick.AddListener(() => {
                if (ThirdWebManager.IsAuthenticated) {
                    AuthenticatedSceneManager.LoadScene("CharacterSelect");
                }
            });
#endif

            UpdateCoinBalance();
        }

        private void UpdateCoinBalance() {
            coinCountText.text = ThirdWebManager.GetCoinBalance().ToString();
        }

        private async Task UpdateData() {
            ThirdWebManager.HideAuthPanel();
            loadingCanvas.SetActive(true);

            StartCoroutine(RefreshData());
            UpdateCoinBalance();
        }

        private async void Update() {
#if UNITY_EDITOR
            startCanvas.SetActive(true);
            loadingCanvas.SetActive(false);
            return;
#endif

            if (ThirdWebManager.ShouldDataBeRefreshed) {
                if (ThirdWebManager.IsAuthenticated) {
                    await UpdateData();
                    ThirdWebManager.ShouldDataBeRefreshed = false;
                }
                else {
                    startCanvas.SetActive(false);
                    loadingCanvas.SetActive(false);
                    ThirdWebManager.ShowAuthPanel();
                }
            }
        }

        private IEnumerator RefreshData() {
            ThirdWebManager.RefreshData();
            yield return new WaitForSeconds(1);
            loadingCanvas.SetActive(false);
            startCanvas.SetActive(true);
            yield return null;
        }
    }
}