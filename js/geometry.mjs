// geometry.mjs — minimal 2D vector arithmetic and path geometry helpers.

// Simple 2D vector operations
export const vecAdd   = (v, w) => ({ x: v.x + w.x, y: v.y + w.y });
export const vecSub   = (v, w) => ({ x: v.x - w.x, y: v.y - w.y });
export const vecScale = (v, s) => ({ x: v.x * s,   y: v.y * s   });

// offsetPoint — moves `anchor` toward `neighbor` by `offset` world units.
export function offsetPoint(anchor, neighbor, offset) {
  if (offset === 0) return anchor;
  const dx = neighbor.x - anchor.x, dy = neighbor.y - anchor.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return anchor;
  return { x: anchor.x + dx / len * offset, y: anchor.y + dy / len * offset };
}
