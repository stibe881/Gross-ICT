import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    workbox: {
      // CRITICAL: Exclude /api/ routes from navigation fallback
      // This prevents the service worker from intercepting OAuth callbacks
      navigateFallbackDenylist: [/^\/api\//],
      // Don't cache API routes
      runtimeCaching: [
        {
          urlPattern: /^\/api\//,
          handler: 'NetworkOnly',
        },
      ],
    },
    manifest: {
      name: 'Gross ICT',
      short_name: 'Gross ICT',
      description: 'Next-Gen IT Services & Web Development',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  })
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Explicitly tell Vite to optimize these dependencies
  optimizeDeps: {
    include: [
      'grapesjs',
      'grapesjs-preset-newsletter',
      'recharts',
      'chart.js',
      'react-chartjs-2',
    ],
    exclude: [],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Simplified bundle optimization - let Vite handle chunking automatically
    rollupOptions: {
      output: {
        // Use Vite's default automatic chunking with size limits
        manualChunks: undefined,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minification (esbuild is default and faster)
    minify: 'esbuild',
    // Ensure all dependencies are bundled
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Target older browsers for better iOS compatibility (especially iOS 12-13)
    // ES2015 (ES6) is widely supported across all modern mobile browsers
    target: 'es2015',
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
