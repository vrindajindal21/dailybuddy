export async function POST(req) {
  const { token, userId } = await req.json();
  if (!token || !userId) {
    return new Response(JSON.stringify({ error: 'Missing token or userId' }), { status: 400 });
  }
  // For demo: store in memory (not persistent)
  // global.tokens = global.tokens || [];
  // global.tokens.push({ token, userId });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 