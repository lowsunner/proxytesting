// service.js
// Cloudflare Pages Function to proxy requests using UV decoding

// Inline the exact UV XOR decode function
function xorDecode(str) {
    if (!str) return str;
    // Split URL from query if present
    const [path, ...rest] = str.split("?");
    const query = rest.length ? "?" + rest.join("?") : "";
    // Decode URI component
    return decodeURIComponent(path)
        .split("")
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i & 255)))
        .join("") + query;
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
    decoded = Ultraviolet.codec.xor.decode(encoded);
  } catch (err) {
    return new Response('Invalid encoded URL', { status: 400 });
  }

  // Ensure URL has proper scheme
  if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
    decoded = 'https://' + decoded;
  }

  // Fetch the target URL
  try {
    const res = await fetch(decoded, {
      headers: request.headers,
      method: request.method,
      body: request.body
    });

    if (!res) {
      return new Response('Fetch failed: empty response', { status: 502 });
    }

    const body = await res.arrayBuffer();
    const responseHeaders = new Headers(res.headers);

    // Make sure status is valid
    const status = res.status >= 200 && res.status <= 599 ? res.status : 502;

    return new Response(body, {
      status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response('Proxy fetch failed: ' + err.message, { status: 502 });
  }
}
