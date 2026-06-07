import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers (Chrome 87+, Edge 88+, Safari 14+)
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // React core — cached long-term, rarely changes
          if (id.includes("/react-dom/") || id.includes("/react/")) return "vendor-react";
          // Router — changes with major upgrades only
          if (id.includes("react-router")) return "vendor-router";
          // Server state + HTTP — shared across all feature modules
          if (id.includes("@tanstack") || id.includes("/axios/")) return "vendor-data";
          // Icons — large tree-shakeable set, cached separately
          if (id.includes("lucide-react")) return "vendor-icons";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
