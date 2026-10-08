import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://alexmtzrmz0212.github.io/Sports/
export default defineConfig({
  base: "/Sports/",
  plugins: [react()],
});
