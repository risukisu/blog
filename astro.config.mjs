// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { rehypeLinks } from './src/plugins/rehype-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://risu.pl',
  integrations: [mdx(), sitemap()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    rehypePlugins: [rehypeLinks],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
