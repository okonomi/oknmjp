export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = request.url
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
