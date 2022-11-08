export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = request.url

  if (url == 'https://oknm.jp/posts/2022-11-06-google-cloud-sdk-release-notes-feed') {
    return Response.redirect('https://oknm.jp/posts/2022-11-06-google-cloud-cli-release-notes-feed', 301)
  }

  if (!url.endsWith('/')) {
    const res = await fetch(`${url}/`)
    if (res.ok) {
      return new Response(res.body, {
        headers: res.headers
      });
    }
  }

  return await next();
}
