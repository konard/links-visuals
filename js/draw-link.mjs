const EPSILON = 1e-9;

function finitePoint(point) {
  return point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y);
}

function clonePoint(point, extra = {}) {
  return { ...point, x: point.x, y: point.y, ...extra };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function totalPolylineLength(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  let length = 0;
  for (let index = 1; index < points.length; index++) {
    length += distanceBetween(points[index - 1], points[index]);
  }
  return length;
}

export function pointAtPolylineFraction(points, fraction) {
  const cleanPoints = (points || []).filter(finitePoint);
  if (cleanPoints.length === 0) {
    throw new Error('Cannot sample an empty polyline');
  }
  if (cleanPoints.length === 1) {
    return {
      ...clonePoint(cleanPoints[0]),
      segmentIndex: 0,
      segmentT: 0,
      distance: 0,
      totalLength: 0,
    };
  }

  const totalLength = totalPolylineLength(cleanPoints);
  if (totalLength <= EPSILON) {
    return {
      ...clonePoint(cleanPoints[0]),
      segmentIndex: 0,
      segmentT: 0,
      distance: 0,
      totalLength,
    };
  }

  const targetDistance = totalLength * clamp01(fraction);
  let walked = 0;

  for (let index = 1; index < cleanPoints.length; index++) {
    const previous = cleanPoints[index - 1];
    const current = cleanPoints[index];
    const segmentLength = distanceBetween(previous, current);
    const nextWalked = walked + segmentLength;

    if (segmentLength > EPSILON && targetDistance <= nextWalked + EPSILON) {
      const segmentT = clamp01((targetDistance - walked) / segmentLength);
      return {
        x: previous.x + (current.x - previous.x) * segmentT,
        y: previous.y + (current.y - previous.y) * segmentT,
        segmentIndex: index - 1,
        segmentT,
        distance: targetDistance,
        totalLength,
      };
    }

    walked = nextWalked;
  }

  return {
    ...clonePoint(cleanPoints.at(-1)),
    segmentIndex: Math.max(0, cleanPoints.length - 2),
    segmentT: 1,
    distance: totalLength,
    totalLength,
  };
}

export function insertPointAtPolylineFraction(points, fraction, extra = {}) {
  const cleanPoints = (points || []).filter(finitePoint).map(point => clonePoint(point));
  if (cleanPoints.length === 0) {
    throw new Error('Cannot insert into an empty polyline');
  }

  const sampled = pointAtPolylineFraction(cleanPoints, fraction);
  const center = clonePoint(sampled, extra);
  delete center.segmentIndex;
  delete center.segmentT;
  delete center.distance;
  delete center.totalLength;

  if (cleanPoints.length === 1) {
    return { points: [center], centerIndex: 0, center };
  }

  if (sampled.segmentT <= EPSILON) {
    const pointsWithCenter = cleanPoints.slice();
    pointsWithCenter[sampled.segmentIndex] = center;
    return { points: pointsWithCenter, centerIndex: sampled.segmentIndex, center };
  }

  if (sampled.segmentT >= 1 - EPSILON) {
    const centerIndex = sampled.segmentIndex + 1;
    const pointsWithCenter = cleanPoints.slice();
    pointsWithCenter[centerIndex] = center;
    return { points: pointsWithCenter, centerIndex, center };
  }

  const centerIndex = sampled.segmentIndex + 1;
  return {
    points: [
      ...cleanPoints.slice(0, centerIndex),
      center,
      ...cleanPoints.slice(centerIndex),
    ],
    centerIndex,
    center,
  };
}

export function simplifyPolyline(points, minPointDistance = 0, maxPoints = Infinity) {
  const cleanPoints = (points || []).filter(finitePoint).map(point => clonePoint(point));
  if (cleanPoints.length <= 2) return cleanPoints;

  const simplified = [cleanPoints[0]];
  for (let index = 1; index < cleanPoints.length - 1; index++) {
    if (distanceBetween(simplified.at(-1), cleanPoints[index]) >= minPointDistance) {
      simplified.push(cleanPoints[index]);
    }
  }

  const last = cleanPoints.at(-1);
  if (distanceBetween(simplified.at(-1), last) > EPSILON) {
    simplified.push(last);
  } else {
    simplified[simplified.length - 1] = last;
  }

  if (!Number.isFinite(maxPoints) || simplified.length <= maxPoints || maxPoints < 2) {
    return simplified;
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const fraction = index / (maxPoints - 1);
    const sampled = pointAtPolylineFraction(simplified, fraction);
    return { x: sampled.x, y: sampled.y };
  });
}

export function getLinkCenter(link) {
  if (!link || !Array.isArray(link.points)) return null;
  return link.points.find(point => point.role === 'center') ||
    link.points[link.centerIndex] ||
    null;
}

export function createCenterLookup(links) {
  const lookup = new Map();
  for (const link of links || []) {
    const center = getLinkCenter(link);
    if (link?.id != null && center) {
      lookup.set(link.id, { x: center.x, y: center.y, link });
    }
  }
  return lookup;
}

export function findNearestCenter(point, links, snapRadius) {
  if (!finitePoint(point) || snapRadius <= 0) return null;

  let nearest = null;
  for (const link of links || []) {
    const center = getLinkCenter(link);
    if (!center) continue;

    const distance = distanceBetween(point, center);
    if (distance <= snapRadius && (!nearest || distance < nearest.distance)) {
      nearest = { id: link.id, center, distance };
    }
  }
  return nearest;
}

export function createDrawnLink({
  id,
  rawPoints,
  existingLinks = [],
  snapRadius = 0,
  minPointDistance = 2,
  maxPoints = 96,
}) {
  const simplified = simplifyPolyline(rawPoints, minPointDistance, maxPoints);
  if (simplified.length < 2 || totalPolylineLength(simplified) <= EPSILON) {
    throw new Error('A drawn link needs at least two distinct points');
  }

  const startAnchor = findNearestCenter(simplified[0], existingLinks, snapRadius);
  const endAnchor = findNearestCenter(simplified.at(-1), existingLinks, snapRadius);
  if (startAnchor) {
    simplified[0] = { ...simplified[0], x: startAnchor.center.x, y: startAnchor.center.y };
  }
  if (endAnchor) {
    simplified[simplified.length - 1] = {
      ...simplified.at(-1),
      x: endAnchor.center.x,
      y: endAnchor.center.y,
    };
  }

  const inserted = insertPointAtPolylineFraction(simplified, 0.5, { role: 'center' });
  const points = inserted.points.map((point, index) => {
    let role = 'intermediate';
    if (index === 0) role = 'start';
    else if (index === inserted.centerIndex) role = 'center';
    else if (index === inserted.points.length - 1) role = 'end';
    return { x: point.x, y: point.y, role };
  });

  return {
    id,
    points,
    centerIndex: inserted.centerIndex,
    startAnchorId: startAnchor?.id ?? null,
    endAnchorId: endAnchor?.id ?? null,
  };
}

export function applyCenterAnchors(link, centerLookup) {
  const points = (link.points || []).map(point => clonePoint(point));
  if (points.length === 0) return { ...link, points };

  const readCenter = id => {
    if (!id) return null;
    if (centerLookup instanceof Map) return centerLookup.get(id) || null;
    return centerLookup?.[id] || null;
  };

  const startCenter = readCenter(link.startAnchorId);
  if (startCenter) {
    points[0] = { ...points[0], x: startCenter.x, y: startCenter.y };
  }

  const endCenter = readCenter(link.endAnchorId);
  if (endCenter) {
    points[points.length - 1] = {
      ...points.at(-1),
      x: endCenter.x,
      y: endCenter.y,
    };
  }

  return { ...link, points };
}
