import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["frontend", "crm.kbenterprise.org", "localhost"],
    // Proxy API requests to backend in development
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        // Suppress proxy errors in console when backend is unavailable
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Silently handle all connection errors in development
            // AggregateError contains ECONNREFUSED inside its errors array
            const isConnectionError =
              err.code === 'ECONNREFUSED' ||
              err.name === 'AggregateError' ||
              err.message?.includes('ECONNREFUSED');

            if (isConnectionError && res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend unavailable', code: 'ECONNREFUSED' }));
            }
          });
        },
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const isConnectionError =
              err.code === 'ECONNREFUSED' ||
              err.name === 'AggregateError' ||
              err.message?.includes('ECONNREFUSED');

            if (isConnectionError && res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend unavailable', code: 'ECONNREFUSED' }));
            }
          });
        },
      },
    },
  },
});
