import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from "astro:content"
import { SITE_TITLE, SITE_DESCRIPTION } from '@/config';

export async function get(context: APIContext) {
  const posts = (await getCollection("posts")).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site as unknown as string,
    items: posts.map(post => ({
      ...post.data,
      pubDate: post.data.pubDate,
      link: `/posts/${post.slug}`
    }))
  });
}
