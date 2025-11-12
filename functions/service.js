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
    const encoded = url.searchParams.get("url");

    if (!encoded) {
        return new Response("No URL specified", { status: 400 });
    }

    let decoded;
    try {
        decoded = xorDecode(encoded);
    } catch (err) {
        return new Response("Invalid encoded URL", { status: 400 });
    }

    // Validate decoded URL
    if (!/^https?:\/\//.test(decoded)) {
        return new Response("Decoded URL is not valid: " + decoded, { status: 400 });
    }

    // Fetch target URL
    try {
        const res = await fetch(decoded, {
            headers: request.headers,
            method: request.method,
            body: request.body
        });

        // Return response as-is
        const body = await res.arrayBuffer();
        const responseHeaders = new Headers(res.headers);

        // Force CORS headers if needed
        responseHeaders.set("Access-Control-Allow-Origin", "*");

        return new Response(body, {
            status: res.status,
            headers: responseHeaders
        });
    } catch (err) {
        return new Response("Proxy fetch failed: " + err.message, { status: 502 });
    }
}
