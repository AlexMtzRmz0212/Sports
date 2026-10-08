// GitHub Pages has no SPA rewrites: serving index.html as 404.html lets deep links
// like /Sports/mlb load the app, and the router takes it from there.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html written");
