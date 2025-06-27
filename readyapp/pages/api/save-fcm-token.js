let tokens = [];

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing token or userId' });
    }
    // Store token (in-memory for demo)
    tokens.push({ token, userId });
    return res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    // Return all tokens (for testing)
    return res.status(200).json(tokens);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 