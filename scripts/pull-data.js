#!/usr/bin/env node
// Pull airports from OurAirports and write airports.json.
//
//   node scripts/pull-data.js
//   node scripts/pull-data.js --input airports.csv --countries countries.csv
//
// Keeps airports with an IATA code and scheduled airline service, and drops
// closed airports and heliports. Each run stamps `pulledAt` with the time of
// the pull.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";

const BASE = "https://davidmegginson.github.io/ourairports-data";
const OUT = resolve(import.meta.dirname, "..", "airports.json");

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

async function load(file, localPath) {
  const text = localPath
    ? await readFile(localPath, "utf8")
    : await fetch(`${BASE}/${file}`).then((r) => {
        if (!r.ok) throw new Error(`${BASE}/${file}: HTTP ${r.status}`);
        return r.text();
      });
  return parse(text, { columns: true, skip_empty_lines: true });
}

const [rows, countryRows] = await Promise.all([
  load("airports.csv", arg("--input")),
  load("countries.csv", arg("--countries")),
]);
const countries = new Map(countryRows.map((c) => [c.code, c.name]));

const TYPES = {
  large_airport: "large",
  medium_airport: "medium",
  small_airport: "small",
  seaplane_base: "seaplane",
};
const round = (n) => Math.round(Number(n) * 1e4) / 1e4;

// Each airport is [iata, icao, name, city, country, type, lat, lon] to keep
// the bundled file small.
const airports = rows
  .filter(
    (r) => r.iata_code.trim() && r.scheduled_service === "yes" && TYPES[r.type],
  )
  .map((r) => [
    r.iata_code.trim(),
    r.icao_code.trim(),
    r.name,
    r.municipality,
    countries.get(r.iso_country) ?? r.iso_country,
    TYPES[r.type],
    round(r.latitude_deg),
    round(r.longitude_deg),
  ])
  .sort((a, b) => a[0].localeCompare(b[0]));

if (airports.length < 1000) {
  throw new Error(`Only ${airports.length} airports matched; not writing.`);
}

const data = {
  pulledAt: new Date().toISOString(),
  source: `${BASE}/airports.csv`,
  fields: ["iata", "icao", "name", "city", "country", "type", "lat", "lon"],
  airports,
};
await writeFile(
  OUT,
  JSON.stringify(data, null, 0).replace(/\],\[/g, "],\n[") + "\n",
);
console.log(`Wrote ${airports.length} airports to airports.json`);
