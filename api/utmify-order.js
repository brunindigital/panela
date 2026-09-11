export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) {
    return response.status(500).json({ error: 'UTMify is not configured' });
  }

  try {
    const upstream = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-token': token },
      body: JSON.stringify(request.body)
    });
    const body = await upstream.json();
    return response.status(upstream.status).json(body);
  } catch {
    return response.status(502).json({ error: 'UTMify unavailable' });
  }
}
