import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature, mesh } from "topojson-client";
import { radius } from "./routes.js";

const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

// Draw a world map in an <svg> from bundled country outlines. Centered on
// 100°W so no route is cut at the map's edge (LAX–SYD crosses the date line).
export function drawD3Map(svg, world, { airports, routes }) {
  const width = 960;
  const height = 500;
  const projection = geoNaturalEarth1()
    .rotate([100, 0])
    .fitExtent(
      [
        [4, 4],
        [width - 4, height - 4],
      ],
      { type: "Sphere" },
    );
  const path = geoPath(projection);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren();

  const countries = feature(world, world.objects.countries);
  const borders = mesh(world, world.objects.countries, (a, b) => a !== b);
  svg.append(
    el("path", { class: "sphere", d: path({ type: "Sphere" }) }),
    el("path", { class: "graticule", d: path(geoGraticule10()) }),
    el("path", { class: "land", d: path(countries) }),
    el("path", { class: "borders", d: path(borders) }),
  );

  // A LineString between two points is drawn as a great-circle arc.
  const arcs = el("g", { class: "arcs" });
  for (const r of routes) {
    const line = el("path", {
      d: path({
        type: "LineString",
        coordinates: [
          [r.a[7], r.a[6]],
          [r.b[7], r.b[6]],
        ],
      }),
    });
    const title = el("title");
    title.textContent = `${r.from}–${r.to}: ${r.miles.toLocaleString()} mi`;
    line.append(title);
    arcs.append(line);
  }
  svg.append(arcs);

  // Biggest circles first so small ones stay on top and clickable.
  const dots = el("g", { class: "dots" });
  const labels = el("g", { class: "labels" });
  const taken = [];
  for (const { code, count, airport } of airports) {
    const [x, y] = projection([airport[7], airport[6]]);
    const r = radius(count);
    const dot = el("circle", { cx: x, cy: y, r });
    const title = el("title");
    title.textContent = `${code} · ${airport[3]} · ${count} route${count > 1 ? "s" : ""}`;
    dot.append(title);
    dots.append(dot);

    // Label to the right; skip a label that would overlap one already placed.
    const box = { x: x + r + 3, y: y - 7, w: 30, h: 14 };
    const hit = taken.some(
      (t) =>
        box.x < t.x + t.w &&
        t.x < box.x + box.w &&
        box.y < t.y + t.h &&
        t.y < box.y + box.h,
    );
    if (!hit) {
      taken.push(box);
      const label = el("text", { x: box.x, y: y + 4 });
      label.textContent = code;
      labels.append(label);
    }
  }
  svg.append(dots, labels);
}
