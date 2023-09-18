import rss from "@astrojs/rss"
import type { APIContext } from "astro"
import { getCollection } from "astro:content"
import { SITE_TITLE, SITE_DESCRIPTION } from "@/config"
import MarkdownIt from "markdown-it"
import sanitizeHTML from "sanitize-html"

const parser = new MarkdownIt()

export async function GET(context: APIContext) {
  const posts = (await getCollection("posts")).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site as unknown as string,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.slug}`,
      date: post.data.pubDate,
      content: sanitizeHTML(parser.render(post.body)),
    })),
  })
}
