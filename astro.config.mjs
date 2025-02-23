import { defineConfig } from "astro/config"
import remarkBreaks from "remark-breaks"
import remarkHeadingShift from "remark-heading-shift"
import mdx from "@astrojs/mdx"

import sitemap from "@astrojs/sitemap"

import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
  site: "https://oknm.jp",
  integrations: [mdx(), sitemap()],

  markdown: {
    remarkPlugins: [remarkBreaks, [remarkHeadingShift, 1]],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
