import { Ultraviolet } from '/static/public/js/uv/uv.bundle.js'; // adjust path if needed

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const encoded = url.searchParams.get('url');

  if (!encoded) {
    return new Response('No URL specified', { status: 400 });
  }

  let decoded;
  try {
    decoded = Ultraviolet.codec.xor.decode(encoded);
  } catch (err) {
    return new Response('Invalid encoded URL', { status: 400 });
  }

  try {
    const res = await fetch(decoded, {
      headers: request.headers,
      method: request.method,
      body: request.body
    });

    const body = await res.arrayBuffer();
    const headers = new Headers(res.headers);
    return new Response(body, { status: res.status, headers });
  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 502 });
  }
}
