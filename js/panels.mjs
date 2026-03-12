// initPanelsToggle — manages show/hide of the coordinates HUD and config panel.

export function initPanelsToggle() {
  const toggleButton = document.getElementById("toggle-panels");
  let panelsVisible = true;
  toggleButton.addEventListener("click", () => {
    panelsVisible = !panelsVisible;
    document.body.classList.toggle("panels-hidden", !panelsVisible);
    toggleButton.textContent = panelsVisible ? "\u2630" : "\u2715";
  });
}
