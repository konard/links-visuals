// updateHUD — refreshes the coordinate display panel with current point positions.

import { points } from './state.mjs';

function format(number) {
  const string = Math.round(number).toString();
  return string.startsWith('-') ? '-' + string.slice(1).padStart(3,'0') : string.padStart(4,'0');
}

export function updateHUD() {
  document.getElementById("coordinates").textContent =
    points.map(point =>
      `${point.id.padEnd(6)}: (${format(point.x)}, ${format(point.y)})  z=${String(point.z).padStart(4,'0')}`
    ).join("\n");
}
