import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the domain root on Vercel (https://sports.bittobyte.qzz.io).
export default defineConfig({
  base: "/",
  plugins: [react()],
});
