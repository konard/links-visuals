// updateHUD — refreshes the coordinate display panel with current point positions.

import { points } from './state.mjs';

function fmt(n) {
  const s = Math.round(n).toString();
  return s.startsWith('-') ? '-' + s.slice(1).padStart(3,'0') : s.padStart(4,'0');
}

export function updateHUD() {
  document.getElementById("coordinates").textContent =
    points.map(p =>
      `${p.id.padEnd(6)}: (${fmt(p.x)}, ${fmt(p.y)})  z=${String(p.z).padStart(4,'0')}`
    ).join("\n");
}
