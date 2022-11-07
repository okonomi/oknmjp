import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://oknmjp',
  integrations: [
    mdx({
      extendPlugins: 'astroDefaults'
    }),
    sitemap()
  ],
  markdown: {
    remarkPlugins: [
      "remark-breaks",
      "remark-gfm",
      "remark-smartypants"
    ]
  }
});
