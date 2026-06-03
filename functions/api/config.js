// Cloudflare Pages Function — GET /api/config
// Tells the client whether a Gemini key is configured on the server,
// without ever exposing the key itself.
export function onRequestGet(context) {
  return new Response(JSON.stringify({ aiAvailable: !!context.env.GEMINI_API_KEY }), {
    headers: { 'content-type': 'application/json' },
  })
}
