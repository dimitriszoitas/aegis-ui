import type { AnatomyPart } from './types';

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

type Anchor = AnatomyPart['anchor'];

interface MarkerOptions {
  target: Rect;
  anchor?: Anchor;
  stage: Rect;
  obstacles: Rect[];
  markers: Point[];
  offset: number;
  radius: number;
  gap: number;
}

interface LabelOptions {
  marker: Point;
  size: { width: number; height: number };
  stage: Rect;
  obstacles: Rect[];
  markers: Point[];
  radius: number;
  gap: number;
}

export interface AnatomyLabelPlacement extends Point {
  width: number;
  direction: 'left' | 'right' | 'both';
}

const right = (rect: Rect) => rect.x + rect.width;
const bottom = (rect: Rect) => rect.y + rect.height;
const squaredDistance = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const clamp = (value: number, min: number, max: number) =>
  min > max ? (min + max) / 2 : Math.max(min, Math.min(max, value));

/** Negative inside a rectangle, positive outside, and zero on its perimeter. */
function signedDistance(point: Point, rect: Rect) {
  const dx = Math.max(rect.x - point.x, 0, point.x - right(rect));
  const dy = Math.max(rect.y - point.y, 0, point.y - bottom(rect));
  if (dx || dy) return Math.hypot(dx, dy);
  return -Math.min(
    point.x - rect.x,
    right(rect) - point.x,
    point.y - rect.y,
    bottom(rect) - point.y,
  );
}

function anchorPoint(target: Rect, anchor: Anchor = 'top'): Point {
  return {
    x: anchor.includes('left')
      ? target.x
      : anchor.includes('right')
        ? right(target)
        : target.x + target.width / 2,
    y: anchor.includes('bottom')
      ? bottom(target)
      : anchor === 'left' || anchor === 'right'
        ? target.y + target.height / 2
        : target.y,
  };
}

function preferredMarker(target: Rect, anchor: Anchor, offset: number): Point {
  const position = anchorPoint(target, anchor);
  return {
    x: position.x + (anchor?.includes('left') ? -offset : anchor?.includes('right') ? offset : 0),
    y:
      position.y +
      (anchor?.includes('bottom') ? offset : anchor === 'left' || anchor === 'right' ? 0 : -offset),
  };
}

function uniqueClamped(values: number[], min: number, max: number) {
  return [...new Set(values.map((value) => clamp(value, min, max)))];
}

/**
 * All coordinates and clearances are in rendered screen pixels. Search the preferred
 * outward point and obstacle boundaries, so crowded markers slide into nearby space.
 * Ancestor bounds are not obstacles: a badge may sit in their empty interior beside
 * its target. Prefer a short boundary connector before preserving a crowded anchor.
 * When space is exhausted, protect its own target before other bounds.
 */
export function placeAnatomyMarker({
  target,
  anchor,
  stage,
  obstacles,
  markers,
  offset,
  radius,
  gap,
}: MarkerOptions): Point {
  const clearance = Math.max(0, radius) + Math.max(0, gap);
  const separation = Math.max(0, radius) * 2 + Math.max(0, gap);
  const preferredOffset = Math.max(offset, clearance);
  const preferred = preferredMarker(target, anchor, preferredOffset);
  const nearbyObstacles = obstacles.filter(
    (rect) =>
      !(
        rect.x <= target.x &&
        rect.y <= target.y &&
        right(rect) >= right(target) &&
        bottom(rect) >= bottom(target)
      ),
  );
  const rectangles = [target, ...nearbyObstacles];
  const xs = uniqueClamped(
    [
      preferred.x,
      target.x,
      target.x + target.width / 2,
      right(target),
      stage.x + radius,
      right(stage) - radius,
      ...rectangles.flatMap((rect) => [rect.x - clearance, right(rect) + clearance]),
      ...markers.flatMap((point) => [point.x - separation, point.x + separation]),
    ],
    stage.x + radius,
    right(stage) - radius,
  );
  const ys = uniqueClamped(
    [
      preferred.y,
      target.y,
      target.y + target.height / 2,
      bottom(target),
      stage.y + radius,
      bottom(stage) - radius,
      ...rectangles.flatMap((rect) => [rect.y - clearance, bottom(rect) + clearance]),
      ...markers.flatMap((point) => [point.y - separation, point.y + separation]),
    ],
    stage.y + radius,
    bottom(stage) - radius,
  );
  const candidates = xs.flatMap((x) => ys.map((y) => ({ x, y })));
  const penalty = (point: Point, rect: Rect) =>
    Math.max(0, clearance - signedDistance(point, rect));
  const scored = candidates.map((point) => ({
    point,
    own: penalty(point, target),
    others:
      nearbyObstacles.reduce((sum, rect) => sum + penalty(point, rect) ** 2, 0) +
      markers.reduce(
        (sum, other) =>
          sum + Math.max(0, separation - Math.sqrt(squaredDistance(point, other))) ** 2,
        0,
      ),
    distance: squaredDistance(point, preferred),
    leader: squaredDistance(point, closestTargetPoint(point, target)),
  }));
  const safe = scored.filter((candidate) => candidate.own === 0 && candidate.others === 0);
  if (safe.length) {
    // A diagonal outward anchor is still local, so allow its full diagonal length.
    const comfortable = safe.filter((candidate) => candidate.leader <= preferredOffset ** 2 * 2);
    if (comfortable.length) {
      comfortable.sort((a, b) => a.distance - b.distance);
      return comfortable[0].point;
    }
    safe.sort((a, b) => a.leader - b.leader || a.distance - b.distance);
    return safe[0].point;
  }
  scored.sort((a, b) => a.own - b.own || a.others - b.others || a.distance - b.distance);
  return scored[0].point;
}

/**
 * Connect to the nearest target edge rather than its center. If a crowded fallback
 * leaves a marker inside its target, choose the nearest edge, with top winning ties.
 */
export function closestTargetPoint(marker: Point, target: Rect): Point {
  const point = {
    x: clamp(marker.x, target.x, right(target)),
    y: clamp(marker.y, target.y, bottom(target)),
  };
  if (signedDistance(marker, target) >= 0) return point;
  const edges = [
    { x: point.x, y: target.y },
    { x: right(target), y: point.y },
    { x: point.x, y: bottom(target) },
    { x: target.x, y: point.y },
  ];
  edges.sort((a, b) => squaredDistance(a, marker) - squaredDistance(b, marker));
  return edges[0];
}

/**
 * Expand around the existing badge without moving its anchor or vertical position.
 * Rectangles containing that anchor are enclosing blank regions, not obstructions.
 * A shortened width lets the caller ellipsize; null keeps the original circle.
 */
export function placeAnatomyLabel({
  marker,
  size,
  stage,
  obstacles,
  markers,
  radius,
  gap,
}: LabelOptions): AnatomyLabelPlacement | null {
  const badgeRadius = Math.max(0, radius);
  const space = Math.max(0, gap);
  const y = marker.y - size.height / 2;
  const labelBottom = y + size.height;
  const minimumWidth = badgeRadius * 2 + space;
  if (size.width < minimumWidth || size.height <= 0 || y < stage.y || labelBottom > bottom(stage))
    return null;

  // At a fixed height, all blockers reduce to forbidden horizontal intervals.
  const intervals: [number, number][] = [];
  for (const rect of obstacles) {
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      signedDistance(marker, rect) <= 0 ||
      bottom(rect) + space <= y ||
      labelBottom + space <= rect.y
    )
      continue;
    intervals.push([rect.x - space, right(rect) + space]);
  }
  for (const other of markers) {
    if (other.x === marker.x && other.y === marker.y) continue;
    const dy = Math.max(y - other.y, 0, other.y - labelBottom);
    const clearance = badgeRadius + space;
    if (dy >= clearance) continue;
    const dx = Math.sqrt(clearance ** 2 - dy ** 2);
    intervals.push([other.x - dx, other.x + dx]);
  }

  let left = stage.x;
  let rightEdge = right(stage);
  for (const [start, end] of intervals) {
    if (end <= marker.x) left = Math.max(left, end);
    else if (start >= marker.x) rightEdge = Math.min(rightEdge, start);
    else return null;
  }
  if (marker.x - badgeRadius < left || marker.x + badgeRadius > rightEdge) return null;

  const candidates = (
    [
      {
        x: marker.x,
        y,
        width: Math.min(size.width, Math.min(marker.x - left, rightEdge - marker.x) * 2),
        direction: 'both',
      },
      {
        x: marker.x - badgeRadius,
        y,
        width: Math.min(size.width, rightEdge - marker.x + badgeRadius),
        direction: 'right',
      },
      {
        x: marker.x + badgeRadius,
        y,
        width: Math.min(size.width, marker.x + badgeRadius - left),
        direction: 'left',
      },
    ] satisfies AnatomyLabelPlacement[]
  ).map((candidate) => ({
    ...candidate,
    x:
      candidate.direction === 'both'
        ? candidate.x - candidate.width / 2
        : candidate.direction === 'left'
          ? candidate.x - candidate.width
          : candidate.x,
  }));
  const fitting = candidates.filter((candidate) => candidate.width >= minimumWidth);
  fitting.sort((a, b) => b.width - a.width);
  return fitting[0] ?? null;
}
