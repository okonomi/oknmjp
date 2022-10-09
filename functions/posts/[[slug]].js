export async function onRequest({ request, next }) {
  const url = request.url
  if (!url.endsWith('/')) {
    const res = await fetch(`${url}/`)
    return new Response(res.body);
  }

  return await next();
}
