#!/usr/bin/env node
// Check miles/miles.json: every entry is { from, to, miles, note? }, both
// codes are airports in airports.json, and each pair appears once (in either
// direction). Exits non-zero with a list of problems.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));

const { airports } = await read("airports.json");
const codes = new Set(airports.map((a) => a[0]));
const pairs = await read("miles/miles.json");

const problems = [];
const seen = new Map();
const KEYS = new Set(["from", "to", "miles", "note"]);

if (!Array.isArray(pairs)) {
  problems.push("miles.json must be an array of pairs");
} else {
  pairs.forEach((p, i) => {
    const at = `#${i + 1} (${p?.from ?? "?"}–${p?.to ?? "?"})`;
    for (const key of Object.keys(p ?? {})) {
      if (!KEYS.has(key)) problems.push(`${at}: unknown field "${key}"`);
    }
    for (const side of ["from", "to"]) {
      if (!codes.has(p?.[side])) {
        problems.push(
          `${at}: "${p?.[side]}" is not an airport code in airports.json`,
        );
      }
    }
    if (p?.from === p?.to) problems.push(`${at}: from and to are the same`);
    if (!Number.isInteger(p?.miles) || p.miles <= 0) {
      problems.push(`${at}: miles must be a positive whole number`);
    }
    if (p?.note !== undefined && typeof p.note !== "string") {
      problems.push(`${at}: note must be text`);
    }
    const key = [p?.from, p?.to].sort().join("-");
    if (seen.has(key)) problems.push(`${at}: same pair as #${seen.get(key)}`);
    else seen.set(key, i + 1);
  });
}

if (problems.length) {
  console.error(`miles/miles.json has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`miles/miles.json: ${pairs.length} pairs OK`);
