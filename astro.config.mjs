// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { rehypeLinks } from './src/plugins/rehype-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://risu.pl',
  // /acorn is an easter egg: kept out of the sitemap (and noindex in its head)
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/acorn') })],

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
