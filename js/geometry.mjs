// geometry.mjs — minimal 2D vector arithmetic and path geometry helpers.

// Simple 2D vector operations.
export const vectorAdd      = (first, second) => ({ x: first.x + second.x, y: first.y + second.y });
export const vectorSubtract = (first, second) => ({ x: first.x - second.x, y: first.y - second.y });
export const vectorScale    = (vector, scalar) => ({ x: vector.x * scalar, y: vector.y * scalar });

// offsetPoint — moves `anchor` toward `neighbor` by `offset` world units.
export function offsetPoint(anchor, neighbor, offset) {
  if (offset === 0) return anchor;
  const deltaX = neighbor.x - anchor.x;
  const deltaY = neighbor.y - anchor.y;
  const length = Math.hypot(deltaX, deltaY);
  if (length < 1e-6) return anchor;
  return {
    x: anchor.x + deltaX / length * offset,
    y: anchor.y + deltaY / length * offset,
  };
}
