# AI DevTask Planner 🚀
### *Motor Inteligente de Planificación y Desglose de Software con IA*

> **Propósito:** Transformar requerimientos en bruto, PRDs o historias de usuario en un **Sprint Plan exhaustivo** con descomposición arquitectónica, estimaciones en horas, criterios de aceptación Gherkin y exportación directa a GitHub Issues o Markdown.
> **Modelo de Negocio:** Micro-SaaS / Developer Tool con modelo freemium y suscripción de  a  USD/mes.

---

## 🏗️ Arquitectura del Core Engine

`
Entrada (PRD / Markdown / Texto)
            │
            ▼
┌───────────────────────────────────────┐
│     AI DevTask Planning Engine        │
│  - Prompts de Arquitectura Principal  │
│  - Multi-Provider: Gemini / OpenAI /  │
│    Ollama / Mock                      │
│  - Validación estricta con Zod        │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│              Exporters                │
│  ├── SPRINT_PLAN.md (Markdown limpio) │
│  ├── sprint_plan.json (JSON API DTO)  │
│  └── github_issues/ (Archivos .md)    │
└───────────────────────────────────────┘
`

---

## ⚡ Guía de Uso Rápido

### 1. Ejecutar Demostración Inmediata (Modo Offline / Mock)
`ash
npm run demo
`
Esto analiza el archivo de ejemplo examples/sample_prd.md y genera la carpeta output/ con todos los formatos listos.

### 2. Planificar con Google Gemini
`ash
# Configurando tu API Key
set GEMINI_API_KEY=tu_api_key_aqui
npm run dev -- plan tu_requerimiento.md -p gemini -m gemini-1.5-flash
`

### 3. Planificar con Modelos Locales (Ollama / Privacidad Total)
`ash
# Requiere Ollama corriendo localmente
npm run dev -- plan tu_requerimiento.md -p ollama -m llama3
`

### 4. Compilar para Producción
`ash
npm run build
node dist/cli.js plan examples/sample_prd.md --provider mock
`

---

## 📁 Estructura del Código

* src/types/index.ts: Definición de interfaces tipadas (SprintPlan, Epic, SubTask, AcceptanceCriterion).
* src/core/schema.ts: Esquemas de validación Zod en tiempo de ejecución.
* src/core/prompts.ts: Prompt del Arquitecto Principal de Software con formato Gherkin.
* src/core/engine.ts: Conectores para Gemini, OpenAI, Ollama y Mock.
* src/core/exporters/:
  * markdownExporter.ts: Genera reportes ejecutivos legibles.
  * githubExporter.ts: Genera issues individuales listos para GitHub / Jira.
  * jsonExporter.ts: Exportación de datos estructurados para APIs web.
* src/cli.ts: Interfaz de línea de comandos interactiva con spinners y colores.
* docs/: Documentación del Sistema Operativo de Ingresos Pasivos y Plan Financiero.
