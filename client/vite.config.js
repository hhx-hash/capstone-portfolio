import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The client talks to the API through `VITE_API_URL`, so the deployed build and
 * the local dev server run exactly the same code - only the value of one
 * environment variable changes.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
