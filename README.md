# fly

Airport code lookup, published with GitHub Pages at
[tridnguyen.com/fly](https://tridnguyen.com/fly/).

Search by IATA code (`BOS`), ICAO code (`KBOS`), or part of an airport or city
name. The search is kept in the query string, so a lookup can be linked:
`https://tridnguyen.com/fly/?q=BOS`.

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

## Development

```sh
npm install
npm run dev     # local dev server on port 4006
npm run build   # static output in dist/
```

Pushes to `main` build and deploy via GitHub Actions
(`.github/workflows/deploy.yml`). GitHub Pages must be set to deploy from
GitHub Actions (Settings → Pages → Source).
