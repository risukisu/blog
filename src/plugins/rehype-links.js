import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that enhances links:
 * 1. External links get target="_blank" + rel="noopener noreferrer"
 * 2. Links with title get data-preview + data-domain attributes
 */
export function rehypeLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (!href || typeof href !== 'string') return;

      // External link detection
      const isExternal = href.startsWith('http') && !href.includes('risu.pl');
      if (isExternal) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }

      // Link preview: copy title to data-preview, extract domain
      const title = node.properties?.title;
      if (title && typeof title === 'string') {
        node.properties.dataPreview = title;
        try {
          const domain = new URL(href).hostname.replace(/^www\./, '');
          node.properties.dataDomain = domain;
        } catch {
          // Invalid URL — skip domain extraction
        }
        // Keep title for JS-disabled fallback (native tooltip)
      }
    });
  };
}
