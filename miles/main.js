import { $, bindQuery, byIata, esc, norm } from "../lib/common.js";
import pairs from "./miles.json";

const $q = $("q");
const $list = $("list");
const $count = $("count");
const $problems = $("problems");

// Check each entry in miles.json as the page loads. Entries with a problem
// are left out of the list and shown at the top so they can be fixed.
const FIELDS = new Set(["from", "to", "miles"]);
const problems = [];
const seen = new Map();
const valid = [];

(Array.isArray(pairs) ? pairs : []).forEach((p, i) => {
  const label = `#${i + 1} ${p?.from ?? "?"}–${p?.to ?? "?"}`;
  const issues = [];
  for (const key of Object.keys(p ?? {})) {
    if (!FIELDS.has(key)) issues.push(`unknown field "${key}"`);
  }
  for (const side of ["from", "to"]) {
    if (!byIata.has(p?.[side])) {
      issues.push(`${side} "${p?.[side] ?? ""}" is not a known airport code`);
    }
  }
  if (p?.from && p.from === p.to) issues.push("from and to are the same");
  if (!Number.isInteger(p?.miles) || p.miles <= 0) {
    issues.push("miles must be a positive whole number");
  }
  const key = [p?.from, p?.to].sort().join("-");
  if (seen.has(key)) issues.push(`same pair as #${seen.get(key)}`);
  else seen.set(key, i + 1);

  if (issues.length) problems.push({ label, issues });
  else valid.push(p);
});
if (!Array.isArray(pairs)) {
  problems.push({ label: "miles.json", issues: ["must be a list of pairs"] });
}

if (problems.length) {
  $problems.hidden = false;
  $problems.innerHTML =
    (problems.length > 1
      ? `<b>${problems.length} entries in miles/miles.json need fixing</b> and are not shown below:`
      : `<b>1 entry in miles/miles.json needs fixing</b> and is not shown below:`) +
    `<ul>${problems
      .map(
        (p) =>
          `<li><code>${esc(p.label)}</code>: ${esc(p.issues.join("; "))}</li>`,
      )
      .join("")}</ul>`;
}

// Search text for each pair: both codes, airport names and cities.
const airportText = (code) => {
  const a = byIata.get(code);
  return `${code} ${a[1]} ${a[2]} ${a[3]} ${a[4]}`;
};
const rows = valid
  .map((p) => ({
    ...p,
    text: norm(`${airportText(p.from)} ${airportText(p.to)}`),
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
  const place = [a[3], a[4]].filter(Boolean).join(", ");
  return `<div class="end">
    <a class="code" href="../?q=${esc(code)}" title="${esc(a[2])}">${esc(code)}</a>
    <div class="place">${esc(place)}</div>
  </div>`;
}

function row(r) {
  return `<li class="pair">
    ${end(r.from)}
    <div class="arrow" aria-label="to">⇄</div>
    ${end(r.to)}
    <div class="miles"><b>${r.miles.toLocaleString()}</b> mi</div>
  </li>`;
}

function render() {
  const q = $q.value.trim();
  const results = search(q);
  if (!rows.length) {
    $count.textContent = "";
    $list.innerHTML = problems.length
      ? ""
      : `<li class="empty">No airport pairs yet. Add them to
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
