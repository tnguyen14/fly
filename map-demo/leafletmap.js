import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geoInterpolate } from "d3-geo";
import { radius } from "./routes.js";

// Points along the great circle between two airports, with longitudes kept
// continuous (e.g. LAX–SYD runs to -209° instead of jumping to +151°) so
// Leaflet doesn't draw a line across the whole map.
function arcPoints(a, b, steps = 64) {
  const interpolate = geoInterpolate([a[7], a[6]], [b[7], b[6]]);
  const points = [];
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    let [lon, lat] = interpolate(i / steps);
    if (prev !== null) {
      while (lon - prev > 180) lon -= 360;
      while (lon - prev < -180) lon += 360;
    }
    prev = lon;
    points.push([lat, lon]);
  }
  return points;
}

// Leaflet map on OpenStreetMap tiles. Everything is drawn on three side-by-side
// copies of the world so routes that cross the date line connect up.
export function drawLeafletMap(container, { airports, routes }) {
  const map = L.map(container, { minZoom: 1, zoomSnap: 0.25 });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  for (const shift of [-360, 0, 360]) {
    for (const r of routes) {
      L.polyline(
        arcPoints(r.a, r.b).map(([lat, lon]) => [lat, lon + shift]),
        { className: "route", weight: 2 },
      )
        .bindTooltip(`${r.from}–${r.to}: ${r.miles.toLocaleString()} mi`, {
          sticky: true,
        })
        .addTo(map);
    }
    for (const { code, count, airport } of airports) {
      L.circleMarker([airport[6], airport[7] + shift], {
        className: "airport",
        radius: radius(count),
        weight: 1.5,
      })
        .bindTooltip(
          `<b>${code}</b> · ${airport[3]} · ${count} route${count > 1 ? "s" : ""}`,
        )
        .addTo(map);
    }
  }
  // Start on all routes, from East Asia (shown west of Hawaii) to Europe.
  map.fitBounds([
    [-42, -255],
    [62, 22],
  ]);
  return map;
}
