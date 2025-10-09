import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',

  adapter: process.env.NODE_ENV === 'production' ? netlify() : undefined,

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'firebase-vendor';
            }
            
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }
            
            if (id.includes('node_modules/@tanstack/react-table')) {
              return 'table-vendor';
            }
            
            if (id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }
            
            if (id.includes('node_modules/zustand')) {
              return 'state-vendor';
            }
            
            if (id.includes('node_modules/date-fns') || id.includes('node_modules/react-day-picker')) {
              return 'date-vendor';
            }
          }
        }
      }
    }
  },
  
  integrations: [react()],
  
  experimental: {
    clientPrerender: true,
  },
});