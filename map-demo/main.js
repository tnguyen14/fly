import { byIata } from "../lib/common.js";
import pairs from "../miles/miles.json";
import world from "world-atlas/countries-110m.json";
import { buildRoutes } from "./routes.js";
import { drawD3Map } from "./d3map.js";
import { drawLeafletMap } from "./leafletmap.js";
import "./map.css";

const data = buildRoutes(pairs, byIata);
drawD3Map(document.getElementById("d3"), world, data);
drawLeafletMap(document.getElementById("leaflet"), data);
