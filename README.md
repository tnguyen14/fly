# fly

Flight tools, published with GitHub Pages at
[tridnguyen.com/fly](https://tridnguyen.com/fly/):

- [Airport codes](https://tridnguyen.com/fly/) (the root page): search by IATA
  code (`BOS`), ICAO code (`KBOS`), or part of an airport or city name.
- [Route miles](https://tridnguyen.com/fly/miles/) (`miles/`): miles between
  airport pairs.

Searches are kept in the query string, so a view can be linked:
`https://tridnguyen.com/fly/?q=BOS`. Shared code (fonts, styles, airport data)
is in `lib/common.js`.

## Data

Airports come from [OurAirports](https://ourairports.com/data/) open data
(public domain, community-maintained) and are stored in `airports.json`, which
is bundled into the page. `scripts/pull-data.js` keeps airports that have an
IATA code and scheduled airline service, and drops closed airports and
heliports. Each pull stamps `pulledAt`, shown on the page as "Data pulled".

To refresh the data, run the **Pull airport data** workflow (Actions tab → Run
workflow). It commits `airports.json` and deploys. Or run it locally:

```sh
npm run pull
```

## Route miles

Pairs are hand-written in `miles/miles.json`:

```json
[{ "from": "BOS", "to": "SGN", "miles": 8700 }]
```

`from` and `to` are IATA codes, and a pair counts once in either direction.
The page draws every pair on a world map (`miles/map.js`: `d3-geo` with
country outlines from `world-atlas`, bundled with the site, so no map service)
as great-circle routes. Searching dims the routes that don't match.
The page checks each entry when it loads: an entry with a code that isn't in
`airports.json`, `miles` that isn't a positive whole number, a misspelled
field, or a pair listed twice is left out of the list and shown at the top of
the page with what to fix.

## Development

```sh
npm install
npm run dev     # local dev server on port 4006
npm run build   # static output in dist/
```

Pushes to `main` build and deploy via GitHub Actions
(`.github/workflows/deploy.yml`). GitHub Pages must be set to deploy from
GitHub Actions (Settings → Pages → Source).
