import { defineConfig } from "vite";

// BASE_PATH is set in CI to the GitHub Pages path (/fly/).
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  server: { port: 4006, strictPort: true },
  preview: { port: 4006, strictPort: true },
});
