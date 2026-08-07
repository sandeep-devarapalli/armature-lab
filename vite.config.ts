import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          scanner: ["@zxing/browser", "qrcode"]
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "armature - The Physical AI and Robotics Lab",
        short_name: "armature",
        description:
          "Book robotics, fabrication, and GPU resources at armature in HSR Layout, Bengaluru.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#FFFEFA",
        theme_color: "#FFFEFA",
        categories: ["productivity", "education", "business"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Book",
            short_name: "Book",
            url: "/book",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "My bookings",
            short_name: "Bookings",
            url: "/bookings",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Check in",
            short_name: "Check in",
            url: "/check-in",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,webp,svg,woff2}"],
        globIgnores: ["**/building-vision/**"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.(co|in)\/.*/i,
            handler: "NetworkOnly",
            method: "GET"
          },
          {
            urlPattern:
              /\/(?:api|functions|rest|auth|availability|booking|bookings|check-in|checkin|calendar)(?:\/|$)/i,
            handler: "NetworkOnly",
            method: "GET"
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "armature-fonts",
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/frontend/setup.ts"],
    css: true,
    globals: true,
    exclude: ["tests/frontend/e2e/**", "node_modules/**", "dist/**"]
  }
});
