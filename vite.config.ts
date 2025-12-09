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
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Bundle optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
              return 'trpc';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            if (id.includes('socket.io-client')) {
              return 'websocket';
            }
            // Other node_modules
            return 'vendor';
          }
          
          // Split large page components
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0];
            // Group related pages
            if (['Accounting', 'AccountingDashboard', 'AccountingSettings', 'Invoices', 'Quotes', 'RecurringInvoices'].includes(pageName)) {
              return 'pages-accounting';
            }
            if (['CRM', 'Contracts', 'ContractDashboard'].includes(pageName)) {
              return 'pages-crm';
            }
            if (['TicketManagement', 'SLADashboard', 'SLAManagement', 'SLAMonitoring'].includes(pageName)) {
              return 'pages-tickets';
            }
            if (['NewsletterDashboard', 'CampaignEditor', 'EmailTemplateEditor'].includes(pageName)) {
              return 'pages-newsletter';
            }
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minification with better tree shaking
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for production debugging (can be disabled for smaller bundles)
    sourcemap: false,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
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
