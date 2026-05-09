// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    functionPerRoute: false,
    includeFiles: [],
    excludeFiles: ['public/novels/**/*.json', 'public/novels/**/*.json.br'],
  }),
  site: 'https://novel.example.com',
  integrations: [sitemap()],
});