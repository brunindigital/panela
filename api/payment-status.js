export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CHECKOUT_ALLOWPAY_API_KEY;
  const baseUrl = process.env.ALLOWPAY_BASE || 'https://allow-gi0i.onrender.com';
  const txId = request.query.txId;
  const route = request.query.route || 'fyntra';
  if (!apiKey || !txId) {
    return response.status(400).json({ error: 'Missing payment configuration or transaction ID' });
  }

  try {
    const upstream = await fetch(`${baseUrl}/api/v2/allowpay-seller/payment-status/${encodeURIComponent(txId)}?route=${encodeURIComponent(route)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    const body = await upstream.json();
    return response.status(upstream.status).json(body);
  } catch {
    return response.status(502).json({ error: 'Payment provider unavailable' });
  }
}
