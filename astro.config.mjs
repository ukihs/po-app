import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',

  adapter: process.env.NODE_ENV === 'production' ? netlify() : undefined,

  vite: {
    plugins: [tailwindcss()],
  },
  
  integrations: [react()],
});