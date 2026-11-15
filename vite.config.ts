import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "./package.json";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "pages" ? "/holiday-visualizer/" : "/",
  define: { "import.meta.env.VITE_APP_VERSION": JSON.stringify(`v${version}`) },
  json: { stringify: true },
}));
