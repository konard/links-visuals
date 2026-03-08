// initPanelsToggle — manages show/hide of the coordinates HUD and config panel.

export function initPanelsToggle() {
  const toggleBtn = document.getElementById("toggle-panels");
  let panelsVisible = true;
  toggleBtn.addEventListener("click", () => {
    panelsVisible = !panelsVisible;
    document.body.classList.toggle("panels-hidden", !panelsVisible);
    toggleBtn.textContent = panelsVisible ? "☰" : "✕";
  });
}
