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
[{ "from": "BOS", "to": "SGN", "miles": 8700, "note": "optional" }]
```

`from` and `to` are IATA codes, and a pair counts once in either direction.
`npm run check` (also run in CI before every build) fails if a code isn't in
`airports.json`, `miles` isn't a positive whole number, a field name is
misspelled, or a pair is listed twice.

## Development

```sh
npm install
npm run dev     # local dev server on port 4006
npm run build   # static output in dist/
```

Pushes to `main` build and deploy via GitHub Actions
(`.github/workflows/deploy.yml`). GitHub Pages must be set to deploy from
GitHub Actions (Settings → Pages → Source).
