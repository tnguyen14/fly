import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "../style.css";
import data from "../airports.json";

// Each airport is [iata, icao, name, city, country, type, lat, lon].
export const airports = data.airports;
export const byIata = new Map(airports.map((a) => [a[0], a]));
export const pulledAt = data.pulledAt;
export const source = data.source;

export const $ = (id) => document.getElementById(id);

// Lowercase and strip accents, so "sao paulo" matches "São Paulo".
export const norm = (s) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Search text lives in the query string (?q=BOS) so views can be linked.
export function bindQuery(input, onChange) {
  input.value = new URLSearchParams(location.search).get("q") ?? "";
  input.addEventListener("input", () => {
    const url = new URL(location.href);
    const q = input.value.trim();
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    onChange();
  });
}
