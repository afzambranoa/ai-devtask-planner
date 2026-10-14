# AI DevTask Planner 🚀
### *Motor Inteligente de Planificación y Desglose de Software con IA*

> **Propósito:** Transformar requerimientos en bruto, PRDs o historias de usuario en un **Sprint Plan exhaustivo** con descomposición arquitectónica, estimaciones en horas, criterios de aceptación Gherkin y exportación directa a GitHub Issues o Markdown.
> **Modelo de Negocio:** Micro-SaaS / Developer Tool con modelo freemium y suscripción de $15 a $39 USD/mes.

---

## 🏗️ Arquitectura del Core Engine

```
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
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│       Payment & Licensing Gateway     │
│  - Lemon Squeezy (Merchant of Record) │
│  - Stripe Checkout & Direct Cards     │
│  - Claves Criptográficas Offline      │
└───────────────────────────────────────┘
```

---

## ⚡ Guía de Uso Rápido

### 1. Ejecutar Demostración Inmediata (Modo Offline / Mock)
```bash
npm run demo
```
Esto analiza el archivo de ejemplo `examples/sample_prd.md` y genera la carpeta `output/` con todos los formatos listos.

### 2. Planificar con Google Gemini
```bash
set GEMINI_API_KEY=tu_api_key_aqui
npm run dev -- plan tu_requerimiento.md -p gemini -m gemini-1.5-flash
```

### 3. Planificar con Modelos Locales (Ollama / Privacidad Total)
```bash
# Requiere Ollama corriendo localmente
npm run dev -- plan tu_requerimiento.md -p ollama -m llama3
```

### 4. Gestión de Licencias & Pasarela de Pago
```bash
# Consultar estado de licencia y cuota de planes
node dist/cli.js auth status

# Iniciar checkout y emitir clave (sandbox o lemonsqueezy)
node dist/cli.js checkout pro --email dev@tuempresa.com

# Activar una clave de licencia en tu máquina
node dist/cli.js auth activate DT-PRO-TU-CLAVE-AQUI

# Iniciar servidor API de pagos y webhooks (Puerto 3000)
npm run server
```

### 5. Compilar para Producción
```bash
npm run build
node dist/cli.js plan examples/sample_prd.md --provider mock
```

---

## 💳 Arquitectura de la Pasarela de Pago

* **Merchant of Record (MoR):** Integración nativa con **Lemon Squeezy API v1** (manejo automático de impuestos, facturación electrónica e IVA internacional para SaaS).
* **Direct Card & Stripe:** Soporte para tarjetas Visa, Mastercard, Amex.
* **Generador Criptográfico Anti-Tamper:** Claves de licencia en formato `DT-{PLAN}-{ENTROPY}-{HMAC_SIG}` verificables matemáticamente sin conexión a internet (ideal para entornos con Ollama y privacidad total).
* **Landing & Portal de Autoservicio:** Modal de checkout de alta conversión con entrega inmediata de clave, comando terminal y portal de validación en tiempo real.

---

## 📁 Estructura del Código

* `src/types/index.ts`: Definición de interfaces tipadas (SprintPlan, Epic, SubTask, LicenseKeyData, CheckoutRequest).
* `src/licensing/`:
  * `licenseManager.ts`: Generación criptográfica, validación offline/online y control de activaciones.
  * `paymentGateway.ts`: Conector multi-proveedor para Lemon Squeezy, Stripe y Sandbox interactivo.
* `src/server.ts`: Servidor HTTP API ligero para checkouts, webhooks y verificación de licencias.
* `src/core/schema.ts`: Esquemas de validación Zod en tiempo de ejecución.
* `src/core/prompts.ts`: Prompt del Arquitecto Principal de Software con formato Gherkin.
* `src/core/engine.ts`: Conectores para Gemini, OpenAI, Ollama y Mock.
* `src/core/exporters/`:
  * `markdownExporter.ts`: Genera reportes ejecutivos legibles.
  * `githubExporter.ts`: Genera issues individuales listos para GitHub / Jira.
  * `jsonExporter.ts`: Exportación de datos estructurados para APIs web.
* `src/cli.ts`: Interfaz CLI con subcomandos `plan`, `auth` (status, activate, logout) y `checkout`.
* `landing/`: Landing page de conversión con simulador interactivo, calculadora de ROI, portal de licencias y checkout modal.
* `docs/`: Documentación del Sistema Operativo de Ingresos Pasivos y Plan Financiero.
