import { PaymentGateway } from '../src/licensing/paymentGateway.js';
import { LicenseManager } from '../src/licensing/licenseManager.js';
import { generateSprintPlan } from '../src/core/engine.js';
import { CheckoutRequest } from '../src/types/index.js';

const gateway = new PaymentGateway();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');
  const method = req.method?.toUpperCase();

  // Health
  if (pathname === '/health' || pathname === '' || pathname === '/') {
    return res.status(200).json({
      status: 'ok',
      service: 'AI DevTask Planner Unified Serverless API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      provider: process.env.LEMON_SQUEEZY_API_KEY ? 'lemonsqueezy' : 'sandbox',
    });
  }

  // Pricing
  if (pathname === '/pricing' && method === 'GET') {
    return res.status(200).json({
      plans: [
        { id: 'free', name: 'Desarrollador', price: 0, period: 'siempre', features: ['5 desgloses/mes', 'Exportación a Markdown & JSON', 'Modo offline'] },
        { id: 'pro', name: 'Pro Solo (Early-Bird)', price: 12, regularPrice: 29, period: 'mes', features: ['Planes ilimitados', 'Cloud AI (Gemini/OpenAI)', 'Exportador a GitHub Issues', 'VS Code & Cursor'] },
        { id: 'lifetime', name: 'Pase Vitalicio', price: 79, period: 'pago único', features: ['Licencia vitalicia', 'Bring Your Own Key ($0 costo)', 'Updates prioritarios', 'Discord privado'] },
        { id: 'team', name: 'Equipo Dev (5 Asientos)', price: 199, period: 'pago único', features: ['5 desarrolladores', 'Soporte prioritario'] },
      ],
    });
  }

  // Checkout
  if (pathname === '/checkout' && method === 'POST') {
    try {
      const data: CheckoutRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!data?.email || !data?.plan) {
        return res.status(400).json({ success: false, message: 'Faltan campos requeridos: email y plan.' });
      }
      const result = await gateway.createCheckout(data);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Plan
  if (pathname === '/plan' && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const requirements = body?.requirements;
      if (!requirements) {
        return res.status(400).json({ success: false, message: 'El campo requirements es requerido.' });
      }
      const apiKey = body?.apiKey || process.env.GEMINI_API_KEY;
      const provider = body?.provider || (apiKey ? 'gemini' : 'mock');
      const sprintPlan = await generateSprintPlan({
        requirements: requirements.trim(),
        context: body?.context,
        provider,
        options: { apiKey, model: body?.model || 'gemini-1.5-flash' },
      });
      return res.status(200).json(sprintPlan);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Verify
  if (pathname === '/license/verify' && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const key = body?.key;
      if (!key) {
        return res.status(400).json({ success: false, message: 'Falta el parámetro: key.' });
      }
      const verification = LicenseManager.verifyLicense(key);
      return res.status(200).json(verification);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Activate
  if (pathname === '/license/activate' && method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { key, machineId } = body || {};
      if (!key) {
        return res.status(400).json({ success: false, message: 'Falta el parámetro: key.' });
      }
      const result = LicenseManager.activateMachine(key, machineId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Webhook
  if (pathname === '/webhook/lemonsqueezy' && method === 'POST') {
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

  return res.status(404).json({ error: 'Ruta no encontrada en la API', pathname });
}
