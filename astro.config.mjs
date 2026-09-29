// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { rehypeLinks } from './src/plugins/rehype-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://risu.pl',
  // /acorn (easter egg) and /risu-mcp (privacy policy for a private tool) stay out of the sitemap; both are noindex in their head
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/acorn') && !page.includes('/risu-mcp') })],

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
