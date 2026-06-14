import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Split the heavy WebGL stack into its own chunks so the initial HTML/hero
// payload stays small and the 3D bundle streams in behind Suspense.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    // three.js is ~1MB raw / ~290KB gzip — expected for a WebGL landing, and it
    // is lazy-loaded behind Suspense, so silence the size warning for it.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Order matters: "@react-three" also contains the substring "three".
            if (id.includes("@react-three")) return "r3f";
            if (id.includes("/three/") || id.includes("three-stdlib")) return "three";
            if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          }
        },
      },
    },
  },
});
