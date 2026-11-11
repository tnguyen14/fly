import data from "../airports.json";

// Each airport is [iata, icao, name, city, country, type, lat, lon].
export const airports = data.airports;
export const byIata = new Map(airports.map((a) => [a[0], a]));
export const pulledAt = data.pulledAt;
export const source = data.source;
