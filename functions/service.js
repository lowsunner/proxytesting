// service.js

// Import UV bundle (adjust path if needed; on Pages, this will resolve in /static/public)
importScripts('./static/public/js/uv/uv.bundle.js');
importScripts('./static/public/js/uv/uv.config.js');
importScripts('./static/public/js/uv/uv.sw.js');

const sw = new UVServiceWorker();

// Cloudflare Pages Functions style
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const encoded = url.searchParams.get('url');

  if (!encoded) {
    return new Response('No URL specified', { status: 400 });
  }

  let decoded;
  try {
    // ✅ Use the exact UV decode function
    decoded = __uv$config.decodeUrl(encoded);
  } catch (err) {
    return new Response('Invalid encoded URL', { status: 400 });
  }

  // Validate URL
  try {
    const targetURL = new URL(decoded);
  } catch {
    return new Response('Decoded URL is not valid', { status: 400 });
  }

  try {
    // Fetch the target URL exactly as UV does
    const res = await fetch(decoded, {
      headers: request.headers,
      method: request.method,
      body: request.body,
      redirect: 'manual', // UV handles redirects itself
    });

    const body = await res.arrayBuffer();
    const headers = new Headers(res.headers);

    // Remove unsafe headers for the browser
    headers.delete('content-encoding');
    headers.delete('content-length');

    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 502 });
  }
}

// Optional: fallback SW for client-side fetch interception
self.addEventListener('fetch', (event) => event.respondWith(sw.fetch(event)));
