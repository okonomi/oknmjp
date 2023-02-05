import rss from '@astrojs/rss';
import { getCollection } from "astro:content"
import { SITE_TITLE, SITE_DESCRIPTION } from '../config';

export const get = () => {
  const posts = getCollection("posts")
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: posts.map(post => ({
      title: post.data.title,
    }))
  });
}
