import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./style.css";
import data from "./airports.json";

// [iata, icao, name, city, country, type, lat, lon]
const airports = data.airports;
const EXAMPLES = ["BOS", "JFK", "LHR", "SGN"];
const MAX_RESULTS = 60;

const $ = (id) => document.getElementById(id);
const $q = $("q");
const $list = $("list");
const $count = $("count");

const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const index = airports.map((a) => norm(`${a[2]} ${a[3]} ${a[4]}`));
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const pulled = new Date(data.pulledAt).toLocaleDateString("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  year: "numeric",
});
$("src").innerHTML =
  `Data pulled <b>${pulled}</b> from ` +
  `<a href="https://ourairports.com/data/">OurAirports</a> · ` +
  `<a href="${esc(data.source)}">airports.csv</a>`;
$("foot").textContent =
  `${airports.length.toLocaleString()} airports with an IATA code and ` +
  `scheduled airline service, heliports excluded. OurAirports is ` +
  `community-maintained, so a few entries may be out of date.`;

// Exact code matches first, then code prefixes, then name/city/country.
function search(raw) {
  const q = raw.trim();
  if (!q) return airports.filter((a) => EXAMPLES.includes(a[0]));
  const upper = q.toUpperCase();
  const n = norm(q);
  const hits = [];
  airports.forEach((a, i) => {
    let rank = -1;
    if (a[0] === upper || a[1] === upper) rank = 0;
    else if (a[0].startsWith(upper) || a[1].startsWith(upper)) rank = 1;
    else if (n.length >= 2 && index[i].includes(n)) rank = 2;
    if (rank >= 0) hits.push([rank, a]);
  });
  hits.sort((x, y) => x[0] - y[0] || x[1][0].localeCompare(y[1][0]));
  return hits.map((h) => h[1]);
}

function row(a) {
  const [iata, icao, name, city, country, type, lat, lon] = a;
  const place = [city, country].filter(Boolean).join(", ");
  const map = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  return `<li>
    <div class="code">${esc(iata)}</div>
    <div class="info">
      <div class="name">${esc(name)}</div>
      <div class="place">${esc(place)}</div>
      <div class="meta">
        <span>ICAO <b>${esc(icao || "—")}</b></span>
        <span class="tag">${esc(type)}</span>
        <a href="${map}" target="_blank" rel="noopener">${lat.toFixed(3)}, ${lon.toFixed(3)}</a>
      </div>
    </div>
  </li>`;
}

function render() {
  const q = $q.value.trim();
  const results = search(q);
  if (!q) $count.textContent = "Examples";
  else if (!results.length) $count.textContent = "";
  else
    $count.textContent =
      `${results.length.toLocaleString()} match${results.length > 1 ? "es" : ""}` +
      (results.length > MAX_RESULTS ? ` · showing first ${MAX_RESULTS}` : "");
  $list.innerHTML = results.length
    ? results.slice(0, MAX_RESULTS).map(row).join("")
    : `<li class="empty">No airport matches “${esc(q)}”. Check the code, or try part of the city name.</li>`;
}

// The search lives in the query string (?q=BOS) so lookups can be linked.
function syncUrl() {
  const url = new URL(location.href);
  const q = $q.value.trim();
  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

$q.value = new URLSearchParams(location.search).get("q") ?? "";
$q.addEventListener("input", () => {
  render();
  syncUrl();
});

const $chips = $("chips");
$chips.innerHTML = ["BOS", "KLAX", "EGLL", "Tokyo", "Hanoi"]
  .map((c) => `<button class="chip" type="button">${c}</button>`)
  .join("");
$chips.addEventListener("click", (e) => {
  if (!e.target.matches(".chip")) return;
  $q.value = e.target.textContent;
  render();
  syncUrl();
});

render();
