// Turn miles.json pairs into airports (with how many pairs each is in) and
// routes, for either map.
export function buildRoutes(pairs, byIata) {
  const counts = new Map();
  const routes = [];
  for (const p of pairs) {
    const a = byIata.get(p.from);
    const b = byIata.get(p.to);
    if (!a || !b) continue;
    routes.push({ ...p, a, b });
    for (const code of [p.from, p.to]) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  const airports = [...counts]
    .map(([code, count]) => ({ code, count, airport: byIata.get(code) }))
    .sort((x, y) => y.count - x.count || x.code.localeCompare(y.code));
  return { airports, routes };
}

// Circle radius in pixels: area grows with the number of pairs, so an airport
// in 9 pairs has 9 times the area of one in a single pair.
export const radius = (count, base = 4.5) => base * Math.sqrt(count);
