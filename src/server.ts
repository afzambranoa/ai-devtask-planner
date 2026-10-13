import http from 'http';
import dotenv from 'dotenv';
import { PaymentGateway } from './licensing/paymentGateway.js';
import { LicenseManager } from './licensing/licenseManager.js';
import { CheckoutRequest } from './types/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const gateway = new PaymentGateway();

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const method = req.method?.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'AI DevTask Planner Payment Gateway & Licensing API',
      timestamp: new Date().toISOString(),
    });
  }

  // Pricing Endpoint
  if (url.pathname === '/api/pricing' && method === 'GET') {
    return sendJson(res, 200, {
      plans: [
        { id: 'free', name: 'Desarrollador', price: 0, period: 'siempre', features: ['5 planes/mes', 'Export a Markdown & JSON', 'Modo offline'] },
        { id: 'pro', name: 'Pro Solo (Early-Bird)', price: 15, regularPrice: 29, period: 'mes', features: ['Planes ilimitados', 'Cloud AI (Gemini/OpenAI)', 'Exportador a GitHub Issues', 'VS Code & Cursor'] },
        { id: 'lifetime', name: 'Pase Vitalicio', price: 99, period: 'pago único', features: ['Licencia vitalicia', 'Bring Your Own Key ($0 costo)', 'Updates prioritarios', 'Discord privado'] },
      ],
    });
  }

  // Create Checkout Session
  if (url.pathname === '/api/checkout' && method === 'POST') {
    try {
      const raw = await parseBody(req);
      const data: CheckoutRequest = JSON.parse(raw);

      if (!data.email || !data.plan) {
        return sendJson(res, 400, { success: false, message: 'Faltan campos requeridos: email y plan.' });
      }

      const result = await gateway.createCheckout(data);
      return sendJson(res, 200, result);
    } catch (err: any) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // Verify License
  if (url.pathname === '/api/license/verify' && method === 'POST') {
    try {
      const raw = await parseBody(req);
      const { key } = JSON.parse(raw);

      if (!key) {
        return sendJson(res, 400, { success: false, message: 'Falta el parámetro: key.' });
      }

      const verification = LicenseManager.verifyLicense(key);
      return sendJson(res, 200, verification);
    } catch (err: any) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // Activate Machine
  if (url.pathname === '/api/license/activate' && method === 'POST') {
    try {
      const raw = await parseBody(req);
      const { key, machineId } = JSON.parse(raw);

      if (!key) {
        return sendJson(res, 400, { success: false, message: 'Falta el parámetro: key.' });
      }

      const result = LicenseManager.activateMachine(key, machineId);
      return sendJson(res, result.success ? 200 : 400, result);
    } catch (err: any) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // Lemon Squeezy Webhook
  if (url.pathname === '/api/webhook/lemonsqueezy' && method === 'POST') {
    try {
      const raw = await parseBody(req);
      const signature = req.headers['x-signature'] as string;

      const isValid = gateway.verifyLemonSqueezyWebhookSignature(raw, signature);
      if (!isValid) {
        return sendJson(res, 401, { success: false, message: 'Firma de Webhook inválida.' });
      }

      const event = JSON.parse(raw);
      const eventName = event?.meta?.event_name || 'unknown';
      const outcome = gateway.handleLemonSqueezyEvent(eventName, event);

      return sendJson(res, 200, { received: true, ...outcome });
    } catch (err: any) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // 404 Not Found
  return sendJson(res, 404, { error: 'Ruta no encontrada' });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`⚡ [Payment Gateway API] Servidor de pagos y licencias activo en http://localhost:${PORT}`);
  });
}
