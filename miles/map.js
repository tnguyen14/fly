import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import world from "world-atlas/countries-110m.json";

const WIDTH = 960;
const HEIGHT = 500;
const DOT = 4.5;
const NS = "http://www.w3.org/2000/svg";

const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};
const titled = (node, text) => {
  const title = el("title");
  title.textContent = text;
  node.append(title);
  return node;
};

// Draw the pairs on a world map in an <svg>, from country outlines bundled
// with the site. Centered on 100°W so no route is cut at the map's edge
// (LAX–SYD crosses the date line). `rows` are valid pairs: { from, to, miles }.
// Returns highlight(matchingRows, focusCodes), which dims every route and
// airport not in the matching rows; airports in focusCodes (the ones the
// search names) get first claim on label space. The map redraws when its width changes, so labels and
// dots keep a readable size on phones.
export function drawMap(svg, rows, byIata) {
  let matching = rows;
  let focus = new Set();
  let width = 0;
  let nodes = null;
  const redraw = () => {
    const w = svg.getBoundingClientRect().width;
    if (!w || w === width) return;
    width = w;
    // Scale up labels and dots when the map is shown smaller than its
    // 960-unit drawing, so an 11px label stays near 11px on screen.
    const k = Math.max(1, (WIDTH / w) * 0.9);
    nodes = draw(svg, rows, byIata, k);
    dim(nodes, rows, matching, focus);
  };
  new ResizeObserver(() => requestAnimationFrame(redraw)).observe(svg);
  redraw();
  return (next, nextFocus = new Set()) => {
    matching = next;
    focus = nextFocus;
    if (nodes) dim(nodes, rows, matching, focus);
  };
}

function dim({ arcByRow, airportNodes }, rows, matching, focus) {
  const all = matching.length === rows.length;
  const shown = new Set(matching);
  const codesShown = new Set(matching.flatMap((r) => [r.from, r.to]));
  for (const [r, line] of arcByRow) {
    line.classList.toggle("dim", !all && !shown.has(r));
  }
  for (const { code, dot, label } of airportNodes) {
    const off = !all && !codesShown.has(code);
    dot.classList.toggle("dim", off);
    label.classList.toggle("dim", off);
  }

  // Place labels, skipping any that would overlap one already placed.
  // Airports the search names go first, then the rest of the results, then
  // everything else; within each group, airports in more pairs go first.
  const rank = (n) => (focus.has(n.code) ? 0 : codesShown.has(n.code) ? 1 : 2);
  const ordered = [0, 1, 2].flatMap((g) =>
    airportNodes.filter((n) => rank(n) === g),
  );
  const taken = [];
  for (const { label, box } of ordered) {
    const overlaps = taken.some(
      (t) =>
        box.x < t.x + t.w &&
        t.x < box.x + box.w &&
        box.y < t.y + t.h &&
        t.y < box.y + box.h,
    );
    label.setAttribute("display", overlaps ? "none" : "inline");
    if (!overlaps) taken.push(box);
  }
}

function draw(svg, rows, byIata, k) {
  const projection = geoNaturalEarth1()
    .rotate([100, 0])
    .fitExtent(
      [
        [4, 4],
        [WIDTH - 4, HEIGHT - 4],
      ],
      { type: "Sphere" },
    );
  const path = geoPath(projection);
  svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

  const countries = feature(world, world.objects.countries);
  const borders = mesh(world, world.objects.countries, (a, b) => a !== b);
  svg.replaceChildren(
    el("path", { class: "sphere", d: path({ type: "Sphere" }) }),
    el("path", { class: "graticule", d: path(geoGraticule10()) }),
    el("path", { class: "land", d: path(countries) }),
    el("path", { class: "borders", d: path(borders) }),
  );

  // A LineString between two points is drawn as a great-circle arc.
  const arcs = el("g", { class: "arcs" });
  const arcByRow = new Map();
  for (const r of rows) {
    const a = byIata.get(r.from);
    const b = byIata.get(r.to);
    const line = el("path", {
      d: path({
        type: "LineString",
        coordinates: [
          [a[7], a[6]],
          [b[7], b[6]],
        ],
      }),
    });
    titled(line, `${r.from}–${r.to}: ${r.miles.toLocaleString()} mi`);
    arcs.append(line);
    arcByRow.set(r, line);
  }

  // Busier airports first, so they win label space (BOS over JFK and LGA).
  const counts = new Map();
  for (const r of rows) {
    for (const code of [r.from, r.to]) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  const codes = [...counts.keys()].sort(
    (x, y) => counts.get(y) - counts.get(x) || x.localeCompare(y),
  );

  const dots = el("g", { class: "dots" });
  const labels = el("g", { class: "labels" });
  const airportNodes = codes.map((code) => {
    const a = byIata.get(code);
    const [x, y] = projection([a[7], a[6]]);
    const dot = titled(
      el("circle", { cx: x, cy: y, r: DOT * k }),
      `${code} · ${a[2]}`,
    );
    const box = { x: x + (DOT + 3) * k, y: y - 7 * k, w: 30 * k, h: 14 * k };
    const label = el("text", {
      x: box.x,
      y: y + 4 * k,
      "font-size": 11 * k,
      "stroke-width": 3 * k,
    });
    label.textContent = code;
    dots.append(dot);
    labels.append(label);
    return { code, dot, label, box };
  });
  svg.append(arcs, dots, labels);
  return { arcByRow, airportNodes };
}
