import { defineConfig } from 'astro/config';
import remarkBreaks from "remark-breaks"
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://oknm.jp',
  integrations: [
    mdx(),
    sitemap()
  ],
  markdown: {
    remarkPlugins: [
      remarkBreaks
    ]
  }
});
