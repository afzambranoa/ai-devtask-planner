import { PaymentGateway } from '../src/licensing/paymentGateway.js';
import { CheckoutRequest } from '../src/types/index.js';

const gateway = new PaymentGateway();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Use POST.' });
  }

  try {
    const data: CheckoutRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!data?.email || !data?.plan) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: email y plan.' });
    }

    const OFFICIAL_LEMON_CHECKOUT = 'https://stream-arch.lemonsqueezy.com/checkout/buy/13a8729f-a2e2-4e42-81a9-8765a9a98578';
    const result = await gateway.createCheckout(data);

    if (data.provider === 'lemonsqueezy' && !result.checkoutUrl) {
      result.checkoutUrl = data.email 
        ? `${OFFICIAL_LEMON_CHECKOUT}?checkout[email]=${encodeURIComponent(data.email)}`
        : OFFICIAL_LEMON_CHECKOUT;
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
