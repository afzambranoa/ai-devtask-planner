export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    plans: [
      {
        id: 'free',
        name: 'Desarrollador',
        price: 0,
        period: 'siempre',
        badge: 'Free Forever',
        features: ['5 desgloses/mes', 'Exportación a Markdown & JSON', 'Criterios Gherkin estándar', 'Modo offline / Mock'],
      },
      {
        id: 'pro',
        name: 'Pro Solo (Early-Bird)',
        price: 12,
        regularPrice: 29,
        period: 'mes',
        badge: 'Más Popular',
        features: ['Planes y épicas ilimitadas', 'Conexión Cloud Gemini 1.5/2.0 Flash', 'Exportador automático a GitHub Issues', 'Extensión VS Code & Cursor', 'Soporte prioritario'],
      },
      {
        id: 'lifetime',
        name: 'Pase Vitalicio',
        price: 79,
        regularPrice: 199,
        period: 'pago único',
        badge: 'Mejor Inversión',
        features: ['Licencia vitalicia perpetua', 'Bring Your Own Key ($0 costo marginal)', 'Todas las actualizaciones futuras', 'Comunidad y canal VIP de soporte'],
      },
      {
        id: 'team',
        name: 'Equipo Dev (5 Asientos)',
        price: 199,
        period: 'pago único',
        badge: 'Para Agencias',
        features: ['5 licencias simultáneas', 'Plantillas arquitectónicas personalizadas', 'Onboarding dedicado'],
      },
    ],
  });
}
