import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const keyPath = path.resolve(__dirname, '../certs/silentguard-local.key');
const certPath = path.resolve(__dirname, '../certs/silentguard-local.crt');

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    ...(isDev && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
      host: 'silentguard-local.ricardocampos.dev.br',
      allowedHosts: ['silentguard-local.ricardocampos.dev.br']
    })
  },
  plugins: [
    {
      name: 'build-html',
      apply: 'build',
      transformIndexHtml: (html) => {
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                src: '/env.js'
              },
              injectTo: 'head'
            }
          ]
        };
      }
    },
    tailwindcss(),
    react()
  ],
});
