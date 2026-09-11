export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CHECKOUT_ALLOWPAY_API_KEY || process.env.ALLOWPAY_API_KEY;
  const baseUrl = process.env.ALLOWPAY_BASE || 'https://allow-gi0i.onrender.com';
  if (!apiKey) {
    return response.status(500).json({ error: 'Checkout payment is not configured' });
  }

  try {
    const upstream = await fetch(`${baseUrl}/api/v2/allowpay-seller/create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request.body, api_key: apiKey })
    });
    const body = await upstream.json();
    if (upstream.ok && body.txid && process.env.UTMIFY_API_TOKEN) {
      const customer = request.body.customer || {};
      await fetch('https://api.utmify.com.br/api-credentials/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-token': process.env.UTMIFY_API_TOKEN },
        body: JSON.stringify({
          orderId: String(body.txid), platform: 'AllowPay', paymentMethod: 'pix', status: 'waiting_payment',
          createdAt: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
          approvedDate: null, refundedAt: null,
          customer: { name: customer.name || 'Cliente', email: customer.email || 'cliente@email.com', phone: customer.cellphone || null, document: customer.taxId || null },
          products: [{ id: 'kit-principal', name: request.body.description || 'Kit 10 Panelas', planId: 'default', planName: 'Oferta principal', quantity: 1, priceInCents: Number(request.body.amount) || 0 }],
          trackingParameters: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
          commission: { totalPriceInCents: Number(request.body.amount) || 0, gatewayFeeInCents: 0, userCommissionInCents: Number(request.body.amount) || 0, currency: 'BRL' },
          isTest: false
        })
      });
    }
    return response.status(upstream.status).json(body);
  } catch {
    return response.status(502).json({ error: 'Payment provider unavailable' });
  }
}
