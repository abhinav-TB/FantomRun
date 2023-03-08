using Platformer.Core;
using Platformer.Scene;
using Platformer.Mechanics;
using Platformer.Model;
using UnityEngine;
using UnityEngine.UI;
using Platformer.ThirdWeb;
using System.Threading.Tasks;

namespace Platformer.UI {
    public class PostGameUIController : MonoBehaviour {
        [SerializeField] private GameObject postGameUI;
        [SerializeField] private GameObject claimCoinsUI;
        [SerializeField] private GameObject progressUI;
        [SerializeField] private GameObject successUI;
        [SerializeField] private GameObject failureUI;
        [SerializeField] private Button menuButton;
        [SerializeField] private Button replayButton;
        [SerializeField] private Button nextButton;

        public void RefreshUI() {
            InitializeUI();
        }

        public void InitializePostGameUIController() {
            postGameUI.SetActive(false);

            InitializeUI();

            if (LevelManager.IsLastLevel) {
                nextButton.gameObject.SetActive(false);
            }

            menuButton.onClick.AddListener(() => {
                ThirdWebManager.ShouldDataBeRefreshed = true;
                AuthenticatedSceneManager.LoadScene("Start");
            });

            replayButton.onClick.AddListener(() => {
                InitializeUI();

                // Simulation.Schedule<PlayerSpawn>(2);
                // postGameUI.SetActive(false);

                LevelManager.ReloadLevel();
            });

            nextButton.onClick.AddListener(() => {
                InitializeUI();

                if (!LevelManager.IsLastLevel) {
                    LevelManager.LoadNextLevel();
                }
            });
        }

        private void InitializeUI() {
            PlayerController player = Simulation.GetModel<PlatformerModel>().player;
            int coinCount = player.Coins;

            claimCoinsUI.SetActive(true);
            progressUI.SetActive(false);
            successUI.SetActive(false);
            failureUI.SetActive(false);
        }

        private async Task<bool> GetCoin(string coinCount) {
            return await ThirdWebManager.ClaimCoin(coinCount);
        }
    }
}