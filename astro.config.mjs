// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'server',  // Enable SSR
  adapter: vercel(), // Vercel serverless adapter
  site: 'https://novel.example.com',
  integrations: [sitemap()],
});