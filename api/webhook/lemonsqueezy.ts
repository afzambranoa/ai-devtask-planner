import { PaymentGateway } from '../../src/licensing/paymentGateway.js';

const gateway = new PaymentGateway();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Use POST.' });
  }

  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['x-signature'] as string;

    const isValid = gateway.verifyLemonSqueezyWebhookSignature(raw, signature);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Firma de Webhook Lemon Squeezy inválida.' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventName = event?.meta?.event_name || 'unknown';
    const outcome = gateway.handleLemonSqueezyEvent(eventName, event);

    return res.status(200).json({ received: true, ...outcome });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
