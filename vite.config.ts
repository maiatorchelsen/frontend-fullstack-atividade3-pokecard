import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/tcgdex": {
        target: "https://api.tcgdex.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tcgdex/, ""),
      },
    },
  },
});
