import { $, bindQuery, byIata, esc, norm } from "../lib/common.js";
import pairs from "./miles.json";

const $q = $("q");
const $list = $("list");
const $count = $("count");

// Search text for each pair: both codes, airport names and cities.
const airportText = (code) => {
  const a = byIata.get(code);
  return a ? `${code} ${a[1]} ${a[2]} ${a[3]} ${a[4]}` : code;
};
const rows = pairs
  .map((p) => ({
    ...p,
    text: norm(`${airportText(p.from)} ${airportText(p.to)} ${p.note ?? ""}`),
  }))
  .sort((x, y) => x.from.localeCompare(y.from) || x.to.localeCompare(y.to));

// Every word in the query has to match one side of the pair, so "bos sgn"
// finds BOS–SGN either way round.
function search(raw) {
  const words = norm(raw).split(/\s+/).filter(Boolean);
  return rows.filter((r) => words.every((w) => r.text.includes(w)));
}

function end(code) {
  const a = byIata.get(code);
  const place = a ? [a[3], a[4]].filter(Boolean).join(", ") : "Unknown code";
  return `<div class="end">
    <a class="code" href="../?q=${esc(code)}" title="${esc(a?.[2] ?? code)}">${esc(code)}</a>
    <div class="place">${esc(place)}</div>
  </div>`;
}

function row(r) {
  return `<li class="pair">
    ${end(r.from)}
    <div class="arrow" aria-label="to">⇄</div>
    ${end(r.to)}
    <div class="miles"><b>${r.miles.toLocaleString()}</b> mi</div>
    ${r.note ? `<div class="note">${esc(r.note)}</div>` : ""}
  </li>`;
}

function render() {
  const q = $q.value.trim();
  const results = search(q);
  if (!rows.length) {
    $count.textContent = "";
    $list.innerHTML = `<li class="empty">No airport pairs yet. Add them to
      <code>miles/miles.json</code> as
      <code>{ "from": "BOS", "to": "SGN", "miles": 8700 }</code>.</li>`;
    return;
  }
  const total = rows.length.toLocaleString();
  $count.textContent = q
    ? `${results.length.toLocaleString()} of ${total} pairs`
    : `${total} pair${rows.length > 1 ? "s" : ""}`;
  $list.innerHTML = results.length
    ? results.map(row).join("")
    : `<li class="empty">No pair matches “${esc(q)}”. Try an airport code or city.</li>`;
}

bindQuery($q, render);
render();
