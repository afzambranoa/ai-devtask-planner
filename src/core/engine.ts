import { SprintPlan, PlannerProviderOptions } from '../types/index.js';
import { SprintPlanSchema, ValidatedSprintPlan } from './schema.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';

export interface PlanRequest {
  requirements: string;
  context?: string;
  provider?: 'gemini' | 'openai' | 'ollama' | 'mock';
  options?: PlannerProviderOptions;
}

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function generateSprintPlan(request: PlanRequest): Promise<ValidatedSprintPlan> {
  const provider = request.provider || 'mock';

  if (provider === 'mock') {
    return generateMockSprintPlan(request.requirements);
  }

  if (provider === 'gemini') {
    return generateGeminiSprintPlan(request);
  }

  if (provider === 'openai' || provider === 'ollama') {
    return generateOpenAISprintPlan(request);
  }

  throw new Error(`Proveedor no soportado: ${provider}`);
}

async function generateGeminiSprintPlan(request: PlanRequest): Promise<ValidatedSprintPlan> {
  const apiKey = request.options?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No se encontro GEMINI_API_KEY en variables de entorno o parametros.');
  }

  const model = request.options?.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(request.requirements, request.context)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en llamada a Gemini API (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini retorno una respuesta vacia.');
  }

  const parsed = JSON.parse(cleanJsonResponse(rawText));
  return SprintPlanSchema.parse(parsed);
}

async function generateOpenAISprintPlan(request: PlanRequest): Promise<ValidatedSprintPlan> {
  const isOllama = request.provider === 'ollama';
  const apiKey = request.options?.apiKey || process.env.OPENAI_API_KEY || (isOllama ? 'ollama' : undefined);
  const endpoint = request.options?.endpoint || (isOllama ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1');
  const model = request.options?.model || (isOllama ? 'llama3' : 'gpt-4o-mini');

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || 'none'}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(request.requirements, request.context) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API OpenAI/Ollama (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('El modelo retorno una respuesta vacia.');
  }

  const parsed = JSON.parse(cleanJsonResponse(rawText));
  return SprintPlanSchema.parse(parsed);
}

function generateMockSprintPlan(requirements: string): ValidatedSprintPlan {
  const title = requirements.split('\n')[0].slice(0, 50).trim() || 'Proyecto de Software';
  return {
    projectTitle: `Sprint Plan: ${title}`,
    summary: `Plan de ejecucion tecnica desglosado para: "${title}". Disenado para entrega agil en 2 semanas con cobertura completa de backend, frontend y seguridad.`,
    targetSprintDurationDays: 14,
    totalEstimatedHours: 34,
    epics: [
      {
        id: 'EPIC-01',
        title: 'Capa de Datos y Modelado de Dominio',
        goal: 'Establecer el esquema de base de datos relacional, contratos de interfaces y migraciones reproducibles.',
        layer: 'database',
        tasks: [
          {
            id: 'TASK-101',
            title: 'Definir esquema relacional y migraciones iniciales',
            description: 'Modelar entidades clave, definir indices compuestos y constraints de clave foranea con rollback automatizado.',
            priority: 'critical',
            complexity: 'M',
            estimateHours: 6,
            suggestedFiles: ['src/db/schema.prisma', 'src/db/migrations/001_init.sql'],
            acceptanceCriteria: [
              {
                given: 'una base de datos relacional limpia',
                when: 'se ejecuta el comando de migracion up y down',
                then: 'todas las tablas e indices se crean y destruyen limpiamente sin violaciones de integridad',
              },
            ],
            dependencies: [],
          },
        ],
      },
      {
        id: 'EPIC-02',
        title: 'Servicios de Negocio y API Endpoints',
        goal: 'Implementar logica de aplicacion, validacion de DTOs y control de errores asincronos.',
        layer: 'backend',
        tasks: [
          {
            id: 'TASK-201',
            title: 'Implementar endpoints REST con validacion Zod',
            description: 'Crear controladores para operaciones principales con validacion estricta de esquemas de entrada y serializacion segura.',
            priority: 'high',
            complexity: 'L',
            estimateHours: 12,
            suggestedFiles: ['src/controllers/resource.controller.ts', 'src/validators/resource.schema.ts'],
            acceptanceCriteria: [
              {
                given: 'un payload invalido o incompleto',
                when: 'el cliente realiza una peticion POST',
                then: 'la API debe responder con HTTP 422 y un listado detallado de errores',
              },
              {
                given: 'un payload valido con token de autorizacion',
                when: 'el cliente realiza una peticion POST',
                then: 'el recurso es persistido y se retorna HTTP 201 con el identificador unico generado',
              },
            ],
            dependencies: ['TASK-101'],
          },
        ],
      },
      {
        id: 'EPIC-03',
        title: 'Seguridad, Pruebas y Pipeline de Calidad',
        goal: 'Garantizar autenticacion robusta, observabilidad y pruebas automatizadas E2E.',
        layer: 'security',
        tasks: [
          {
            id: 'TASK-301',
            title: 'Configurar middleware de autorizacion JWT y suite de pruebas',
            description: 'Intercepcion de requests protegidas, verificacion de claims y tests unitarios y de integracion automatizados.',
            priority: 'high',
            complexity: 'M',
            estimateHours: 8,
            suggestedFiles: ['src/middlewares/auth.middleware.ts', 'tests/e2e/api.spec.ts'],
            acceptanceCriteria: [
              {
                given: 'un usuario anonimo o con token expirado',
                when: 'intenta consultar una ruta protegida',
                then: 'el middleware intercepta la llamada y responde HTTP 401 Unauthorized sin revelar datos internos',
              },
            ],
            dependencies: ['TASK-201'],
          },
        ],
      },
    ],
    technicalRisks: [
      'Cuello de botella potencial en consultas con alto volumen de concurrencia: se sugiere capa de cache Redis.',
      'Riesgo de agotamiento de cuotas si no se implementa rate-limiting por IP o API Key.',
    ],
    architectureRecommendations: [
      'Implementar arquitectura hexagonal para desacoplar el nucleo de negocio de la persistencia.',
      'Adoptar observabilidad con logging estructurado JSON (Pino/Winston) y metricas OpenTelemetry.',
    ],
    generatedAt: new Date().toISOString(),
  };
}
