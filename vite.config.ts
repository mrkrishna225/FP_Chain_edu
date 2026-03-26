import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Primary proxy: /ipfs-api/* → http://127.0.0.1:5001/*
      // VITE_IPFS_API=http://localhost:8080/ipfs-api
      '/ipfs-api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ipfs-api/, ''),
      },
      // Also proxy /api/v0 directly — kubo-rpc-client uses this path
      // when given a bare URL like http://localhost:8080
      '/api/v0': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

