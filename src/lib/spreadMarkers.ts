// Port of calculate_offsets() from the original MLB/NFL folium scripts.
// Teams closer than minKm are pushed apart so their logos do not overlap;
// hand-tuned pairs get a fixed angle and strength instead.

export interface SpreadOptions {
  /** Minimum allowed distance between markers, in km. */
  minKm: number;
  /** Number of passes over every pair. */
  iterations: number;
  /** Force divisor for the default push (lower means more separation). */
  divFactor: number;
  /** [teamA, teamB, angle in degrees, relative strength]: the pair is pushed apart along the angle. */
  custom?: [string, string, number, number][];
}

interface Point {
  name: string;
  lat: number;
  lon: number;
}

const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Returns the displayed [lat, lon] for every team name. */
export function spreadMarkers(points: Point[], opts: SpreadOptions): Map<string, [number, number]> {
  const offsets = new Map(points.map((p) => [p.name, [0, 0] as [number, number]]));
  const custom = new Map<string, [number, number]>();
  // As in the Python original, the angle applies to whichever team of the pair comes
  // first in data order, so both key orders map to the same rule.
  for (const [a, b, angle, strength] of opts.custom ?? []) {
    custom.set(`${a}|${b}`, [angle, strength]);
    custom.set(`${b}|${a}`, [angle, strength]);
  }

  for (let pass = 0; pass < opts.iterations; pass++) {
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const p2 = points[j];
        // Like the original, distances use true positions, not already-moved ones.
        const distance = haversineKm([p1.lat, p1.lon], [p2.lat, p2.lon]);
        if (distance >= opts.minKm) continue;
        const o1 = offsets.get(p1.name)!;
        const o2 = offsets.get(p2.name)!;
        const rule = custom.get(`${p1.name}|${p2.name}`);
        if (rule) {
          const [angle, strength] = rule;
          const push = ((opts.minKm - distance) / 20) * strength;
          const dLat = (push * Math.cos(rad(angle))) / 111;
          const dLon = (push * Math.sin(rad(angle))) / (111 * Math.cos(rad(p1.lat)));
          o1[0] += dLat;
          o1[1] += dLon;
          o2[0] -= dLat;
          o2[1] -= dLon;
        } else {
          let dx = p2.lon - p1.lon;
          let dy = p2.lat - p1.lat;
          const mag = Math.max(Math.sqrt(dx * dx + dy * dy), 0.0001);
          dx /= mag;
          dy /= mag;
          const push = (opts.minKm - distance) / opts.divFactor;
          o1[0] -= dy * push;
          o1[1] -= dx * push;
          o2[0] += dy * push;
          o2[1] += dx * push;
        }
      }
    }
  }
  return new Map(points.map((p) => [p.name, [p.lat + offsets.get(p.name)![0], p.lon + offsets.get(p.name)![1]]]));
}

/** For leagues without hand-drawn division paths: a nearest-neighbour chain from the westernmost team. */
export function nearestChain(names: string[], pos: Map<string, [number, number]>): string[] {
  if (names.length < 2) return names;
  const left = [...names].sort((a, b) => pos.get(a)![1] - pos.get(b)![1]);
  const chain = [left.shift()!];
  while (left.length) {
    const last = pos.get(chain[chain.length - 1])!;
    let best = 0;
    for (let i = 1; i < left.length; i++) {
      if (haversineKm(last, pos.get(left[i])!) < haversineKm(last, pos.get(left[best])!)) best = i;
    }
    chain.push(left.splice(best, 1)[0]);
  }
  return chain;
}
