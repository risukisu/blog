// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { rehypeLinks } from './src/plugins/rehype-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://risu.pl',
  // /acorn (easter egg), /risu-mcp (privacy policy for a private tool) and /cc (redirect to a private
  // dashboard) stay out of the sitemap; all three are noindex in their head
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/acorn') && !page.includes('/risu-mcp') && !/\/cc\/?$/.test(page) })],

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
