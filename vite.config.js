import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: '5174'
  },
  plugins: [tailwindcss()],
  base: "./",
});
