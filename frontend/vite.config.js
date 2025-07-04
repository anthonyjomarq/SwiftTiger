import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': '""',
    'process.platform': '""',
    'process.arch': '""',
    'process.env.NODE_ENV': '"development"',
    __dirname: '""',
    __filename: '""',
    require: 'undefined'
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    hmr: {
      clientPort: 3000,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxy
      },
    },
  },
});
