import { resolve } from "node:path";
import { defineConfig } from "vite";

// The airport lookup is the root page; other sections live under a sub path,
// e.g. /fly/miles/.
// BASE_PATH is set in CI to the GitHub Pages path (/fly/).
const page = (path) => resolve(import.meta.dirname, path);

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  server: { port: 4006, strictPort: true },
  preview: { port: 4006, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: page("index.html"),
        miles: page("miles/index.html"),
        flights: page("flights/index.html"),
      },
    },
  },
});
