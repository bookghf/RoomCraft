const EPS = 1e-3;

export function normalizeAngle(rot: number): number {
  const t = Math.PI * 2;
  let r = rot % t;
  if (r > Math.PI) r -= t;
  if (r <= -Math.PI) r += t;
  return r;
}

/** Oriented rectangle on the floor: centre, half sizes along local x/z, rotation about +Y. */
export interface Rect2 {
  cx: number;
  cz: number;
  hw: number;
  hd: number;
  rot: number;
}

function rectAxes(r: Rect2): [number, number][] {
  const c = Math.cos(r.rot);
  const s = Math.sin(r.rot);
  // local x axis and local z axis in world XZ (rotation about +Y)
  return [
    [c, -s],
    [s, c],
  ];
}

function project(r: Rect2, axis: [number, number]): [number, number] {
  const [ax, az] = rectAxes(r);
  const center = r.cx * axis[0] + r.cz * axis[1];
  const radius = r.hw * Math.abs(ax[0] * axis[0] + ax[1] * axis[1]) + r.hd * Math.abs(az[0] * axis[0] + az[1] * axis[1]);
  return [center - radius, center + radius];
}

/** Separating-axis test for two oriented rectangles. Touching edges do not count as overlap. */
export function rectsOverlap(a: Rect2, b: Rect2): boolean {
  for (const axis of [...rectAxes(a), ...rectAxes(b)]) {
    const [amin, amax] = project(a, axis);
    const [bmin, bmax] = project(b, axis);
    if (amax <= bmin + EPS || bmax <= amin + EPS) return false;
  }
  return true;
}
