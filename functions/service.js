// Minimal UV XOR decode function
function decodeUrl(e) {
  if (!e) return e;
  const [t, ...n] = e.split('?');
  return decodeURIComponent(
    t
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 256)))
      .join('')
  );
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const encoded = url.searchParams.get('url');

  if (!encoded) {
    return new Response('No URL specified', { status: 400 });
  }

  let decoded;
  try {
    decoded = decodeUrl(encoded);
  } catch (err) {
    return new Response('Invalid encoded URL', { status: 400 });
  }

  try {
    // Proxy the request to the decoded URL
    const res = await fetch(decoded, {
      headers: request.headers,
      method: request.method,
      body: request.body,
    });

    // Return the fetched response directly
    const body = await res.arrayBuffer();
    const responseHeaders = new Headers(res.headers);
    return new Response(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 502 });
  }
}
