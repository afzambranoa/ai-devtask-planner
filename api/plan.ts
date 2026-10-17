import { generateSprintPlan } from '../src/core/engine.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requirements = body?.requirements;

    if (!requirements || typeof requirements !== 'string' || requirements.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'El campo requirements es obligatorio.' });
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
