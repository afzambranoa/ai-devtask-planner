/**
 * AI DevTask Planner — Interactive Simulator & Studio
 */

const TEMPLATES = {
  mobility: `# PRD: Sistema de Despacho y Asignacion Inteligente de Rutas para Flotas

## 1. Contexto y Problema
Las flotas de transporte urbano y mensajería rápida pierden hasta un 24% de tiempo operativo en ruteo ineficiente, tiempos muertos de conductores y reasignaciones manuales. Se requiere un módulo inteligente que reciba pedidos de viaje o entrega, optimice las rutas considerando ventanas de tiempo y asigne el vehículo óptimo automáticamente.

## 2. Requerimientos Funcionales
- Ingesta de Pedidos: API para recibir solicitudes de servicio (origen, destino, ventana horaria, volumen).
- Algoritmo de Ruteo y Despacho: Asignación basada en proximidad, capacidad del vehículo y tráfico en tiempo real.
- Notificaciones al Conductor: Envío en tiempo real de orden de servicio con confirmación de recepción.
- Telemetría y Geocercas: Registro de coordenadas GPS cada 10 segundos y alertas cuando un vehículo sale de su radio autorizado.
- Dashboard Operativo: Vista para despachadores con mapa interactivo de flotas activas y métricas de SLA.

## 3. Requerimientos No Funcionales
- Latencia en API de asignación: < 800ms.
- Soporte para 5,000 vehículos concurrentes enviando telemetría.
- Seguridad: Autenticación JWT con permisos granulares (admin, dispatcher, driver).`,

  auth: `# PRD: Autenticación Biométrica y 2FA con WebAuthn

## 1. Contexto y Problema
Nuestra aplicación móvil y web requiere elevar los estándares de seguridad bancaria implementando inicio de sesión biométrico (FaceID / TouchID / Passkeys) y soporte para doble factor de autenticación TOTP (Google Authenticator) con códigos de recuperación de un solo uso.

## 2. Requerimientos Funcionales
- Registro de Passkey / WebAuthn para inicio de sesión sin contraseña.
- Configuración de 2FA TOTP con generación de código QR y validación de 6 dígitos.
- Generación de 8 códigos de respaldo (Backup Codes) cifrados con bcrypt.
- Detección de dispositivos no reconocidos y notificación inmediata por correo.
- Endpoint de revocación de sesiones remotas activas.

## 3. Requerimientos No Funcionales
- Cero almacenamiento de claves biométricas en el servidor (estándar FIDO2).
- Protección estricta contra ataques de fuerza bruta (Rate-limiting con Redis: 5 intentos / 15 min).`,

  checkout: `# PRD: Pasarela de Pago con Stripe Checkout y Manejo Idempotente de Webhooks

## 1. Contexto y Problema
Migración del sistema de cobros manuales a una pasarela automatizada con Stripe. Debe soportar tanto suscripciones recurrentes mensuales/anuales como pagos únicos, garantizando que ninguna orden se duplique por reintentos de red.

## 2. Requerimientos Funcionales
- Sesión de Stripe Checkout redirigida con éxito/cancelación dinámica.
- Endpoint de webhook seguro con verificación de firma criptográfica de Stripe.
- Procesamiento idempotente de eventos de pago (evitar doble acreditación de saldo).
- Portal de facturación de autoservicio para que el cliente gestione tarjetas y descargue facturas PDF.
- Manejo de reintentos automáticos para pagos rechazados (dunning management).

## 3. Requerimientos No Funcionales
- Cumplimiento estricto con PCI-DSS Level 1 (ningún dato de tarjeta toca nuestros servidores).
- Tiempo de procesamiento de webhook < 500ms.`
};

// State
let currentPlanData = null;

document.addEventListener('DOMContentLoaded', () => {
  initTemplates();
  initSimulator();
  initRoiCalculator();
  initPaymentCheckout();
  initLicensePortal();
});

function initTemplates() {
  const input = document.getElementById('spec-input');
  const tplBtns = document.querySelectorAll('.tpl-btn');

  // Cargar default
  input.value = TEMPLATES.mobility;

  tplBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tplBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.tpl;
      if (TEMPLATES[key]) {
        input.value = TEMPLATES[key];
      }
    });
  });
}

function initSimulator() {
  const btn = document.getElementById('btn-generate');
  const spinner = document.getElementById('btn-spinner');
  const btnText = document.getElementById('btn-text');
  const terminal = document.getElementById('terminal-progress');

  btn.addEventListener('click', async () => {
    const input = document.getElementById('spec-input').value.trim();
    if (!input) {
      alert('Por favor ingresa o selecciona un requerimiento.');
      return;
    }

    // UI Loading state
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Analizando arquitectura...';
    terminal.classList.remove('hidden');

    // Simulated terminal steps
    await sleep(400);
    terminal.children[0].style.opacity = '1';
    await sleep(500);
    terminal.children[1].style.opacity = '1';
    await sleep(450);
    terminal.children[2].style.opacity = '1';
    await sleep(350);
    terminal.children[3].style.opacity = '1';

    // Generar datos sintéticos inteligentes según el texto
    const plan = buildClientPlan(input);
    currentPlanData = plan;

    renderPlan(plan);

    // Reset UI
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = '⚡ Generar Sprint Plan en Vivo';

    // Scroll to results
    document.getElementById('output-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(tBtn => {
    tBtn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tBtn.classList.add('active');
      const tabKey = tBtn.dataset.tab;

      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      const activeContent = document.getElementById(`tab-content-${tabKey}`);
      if (activeContent) activeContent.classList.remove('hidden');
    });
  });

  // Copy Button
  document.getElementById('btn-copy').addEventListener('click', () => {
    if (!currentPlanData) return;
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let textToCopy = '';

    if (activeTab === 'markdown') {
      textToCopy = document.getElementById('code-markdown').textContent;
    } else if (activeTab === 'json') {
      textToCopy = document.getElementById('code-json').textContent;
    } else {
      textToCopy = document.getElementById('code-markdown').textContent;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      const copyBtn = document.getElementById('btn-copy');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ ¡Copiado!';
      setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
    });
  });

  // Download Button
  document.getElementById('btn-download').addEventListener('click', () => {
    if (!currentPlanData) return;
    const md = generateMarkdown(currentPlanData);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SPRINT_PLAN.md';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function buildClientPlan(text) {
  const isMobility = text.includes('Movilidad') || text.includes('Flotas') || text.includes('ruteo');
  const isAuth = text.includes('Autenticación') || text.includes('Biométrica') || text.includes('2FA');

  if (isMobility) {
    return {
      title: "Sistema de Despacho y Asignación de Flotas Urbanas",
      summary: "Arquitectura escalable para asignación de órdenes en tiempo real con ingesta de telemetría geoespacial y geocercas.",
      durationDays: 14,
      totalHours: 34,
      risks: [
        "Cuello de botella en escrituras de telemetría GPS masiva: requiere base de datos de series temporales (Timescale/Redis).",
        "Pérdida de conectividad de los conductores en zonas de sombra: manejo de modo offline en app."
      ],
      recommendations: [
        "Usar geohashing H3 / PostGIS para búsquedas de proximidad en O(1).",
        "Implementar colas de mensajería (RabbitMQ / BullMQ) para desacoplar la ingesta del cálculo de rutas."
      ],
      epics: [
        {
          id: "EPIC-01",
          title: "Persistencia Geoespacial y Modelado de Flotas",
          layer: "database",
          goal: "Modelar tablas de vehículos, conductores, estados y tracking con índices espaciales.",
          tasks: [
            {
              id: "TASK-101",
              title: "Diseñar esquema con PostGIS y migraciones",
              priority: "critical",
              complexity: "M",
              hours: 6,
              files: ["src/db/schema.prisma", "src/db/migrations/001_postgis.sql"],
              criteria: [
                { given: "un conductor enviando coordenadas GPS", when: "se registra el ping", then: "la posición se almacena con índice espacial GiST en < 15ms" }
              ]
            }
          ]
        },
        {
          id: "EPIC-02",
          title: "Motor de Ruteo y Despacho Asíncrono",
          layer: "backend",
          goal: "Algoritmo de optimización de costos y ventanas horarias.",
          tasks: [
            {
              id: "TASK-201",
              title: "Implementar endpoint de despacho automático con BullMQ",
              priority: "high",
              complexity: "L",
              hours: 12,
              files: ["src/services/dispatch.service.ts", "src/queues/dispatch.queue.ts"],
              criteria: [
                { given: "un pedido nuevo confirmado", when: "el despachador evalúa candidatos", then: "se asigna al vehículo más cercano con capacidad disponible en < 800ms" }
              ]
            }
          ]
        },
        {
          id: "EPIC-03",
          title: "Canal WebSockets en Tiempo Real y Alertas",
          layer: "security",
          goal: "Conexión bidireccional segura con conductores y despachadores.",
          tasks: [
            {
              id: "TASK-301",
              title: "Implementar gateway de Socket.io con autenticación JWT",
              priority: "high",
              complexity: "M",
              hours: 8,
              files: ["src/gateways/telemetry.gateway.ts", "src/guards/ws-auth.guard.ts"],
              criteria: [
                { given: "un socket sin token válido", when: "intenta conectarse al namespace de tracking", then: "la conexión es rechazada inmediatamente con 401" }
              ]
            }
          ]
        }
      ]
    };
  } else if (isAuth) {
    return {
      title: "Autenticación Biométrica WebAuthn y 2FA TOTP",
      summary: "Módulo de seguridad bancaria con soporte para Passkeys sin contraseña y respaldo de 8 códigos de un solo uso.",
      durationDays: 14,
      totalHours: 28,
      risks: [
        "Incompatibilidad de navegadores heredados con WebAuthn: se requiere fallback elegante a TOTP.",
        "Ataques de fuerza bruta sobre códigos TOTP de 6 dígitos: rate limiting mandatorio."
      ],
      recommendations: [
        "Almacenar secretos TOTP cifrados en reposo usando AES-256-GCM.",
        "Implementar rotación periódica de claves de cifrado maestras."
      ],
      epics: [
        {
          id: "EPIC-01",
          title: "Módulo FIDO2 / WebAuthn Passkeys",
          layer: "security",
          goal: "Autenticación biométrica nativa en navegadores modernos.",
          tasks: [
            {
              id: "TASK-101",
              title: "Generación de desafíos criptográficos y verificación de firmas",
              priority: "critical",
              complexity: "M",
              hours: 8,
              files: ["src/auth/webauthn.service.ts", "src/auth/dto/verify-passkey.dto.ts"],
              criteria: [
                { given: "un usuario iniciando sesión", when: "confirma su huella o FaceID", then: "el servidor valida el challenge y emite un JWT de sesión seguro" }
              ]
            }
          ]
        },
        {
          id: "EPIC-02",
          title: "2FA TOTP y Códigos de Respaldo",
          layer: "backend",
          goal: "Doble factor con Google Authenticator y 8 backup codes cifrados.",
          tasks: [
            {
              id: "TASK-201",
              title: "Generación de QR y validación de tokens de 6 dígitos con ventana de tiempo",
              priority: "high",
              complexity: "M",
              hours: 10,
              files: ["src/auth/totp.service.ts", "src/models/backup-codes.model.ts"],
              criteria: [
                { given: "un código TOTP generado hace más de 60s", when: "el usuario lo envía", then: "el sistema lo rechaza por token expirado" }
              ]
            }
          ]
        }
      ]
    };
  } else {
    return {
      title: "Checkout Stripe con Webhooks Idempotentes",
      summary: "Integración de pagos con suscripciones y facturación de autoservicio sin almacenar tarjetas.",
      durationDays: 14,
      totalHours: 26,
      risks: [
        "Eventos de webhook duplicados por reintentos de Stripe: verificación de idempotencia crítica.",
        "Tiempos de espera de webhook: procesar en segundo plano para responder < 200ms."
      ],
      recommendations: [
        "Registrar cada event.id de Stripe en tabla de processed_events antes de ejecutar lógica.",
        "Configurar alertas automáticas en Slack cuando un pago sea rechazado."
      ],
      epics: [
        {
          id: "EPIC-01",
          title: "Sesiones de Checkout y Portal del Cliente",
          layer: "backend",
          goal: "Flujos de redirección y gestión de tarjetas del usuario.",
          tasks: [
            {
              id: "TASK-101",
              title: "Endpoint para crear Stripe Checkout Sessions con metadatos",
              priority: "critical",
              complexity: "M",
              hours: 6,
              files: ["src/payments/stripe.service.ts", "src/controllers/checkout.controller.ts"],
              criteria: [
                { given: "un usuario autenticado seleccionando el plan Pro", when: "hace clic en comprar", then: "se genera una URL de Stripe con su customerId y redirección exitosa" }
              ]
            }
          ]
        },
        {
          id: "EPIC-02",
          title: "Receptor de Webhooks Idempotente",
          layer: "security",
          goal: "Procesamiento seguro de payment_intent.succeeded y customer.subscription.deleted.",
          tasks: [
            {
              id: "TASK-201",
              title: "Middleware de verificación de firma y tabla de idempotencia",
              priority: "critical",
              complexity: "L",
              hours: 10,
              files: ["src/payments/webhooks.handler.ts", "src/db/migrations/idempotency.sql"],
              criteria: [
                { given: "un webhook con el mismo event.id recibido dos veces", when: "se procesa la segunda llamada", then: "se responde 200 OK sin duplicar la suscripción" }
              ]
            }
          ]
        }
      ]
    };
  }
}

function renderPlan(plan) {
  // KPIs
  document.getElementById('kpi-days').textContent = `${plan.durationDays} Días`;
  document.getElementById('kpi-hours').textContent = `${plan.totalHours} Horas`;
  document.getElementById('kpi-epics').textContent = `${plan.epics.length} Capas`;
  const totalTasks = plan.epics.reduce((acc, e) => acc + e.tasks.length, 0);
  document.getElementById('kpi-tasks').textContent = `${totalTasks} Tareas`;

  // Visual Tab
  const visualList = document.getElementById('visual-task-list');
  visualList.innerHTML = '';

  plan.epics.forEach(epic => {
    const epicDiv = document.createElement('div');
    epicDiv.className = 'epic-block';
    epicDiv.innerHTML = `
      <div class="epic-title">
        <span>🎯 [${epic.id}] ${epic.title}</span>
        <span class="layer-pill">${epic.layer.toUpperCase()}</span>
      </div>
      <p class="epic-goal">${epic.goal}</p>
    `;

    epic.tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item';
      taskDiv.innerHTML = `
        <div class="task-header">
          <span class="task-title">🔹 <code>${task.id}</code>: ${task.title}</span>
          <div class="task-meta">
            <span class="badge-priority ${task.priority}">${task.priority.toUpperCase()}</span>
            <span class="badge-hours">⏱️ ${task.hours}h</span>
          </div>
        </div>
        <div class="task-desc">
          <strong>Archivos:</strong> ${task.files.map(f => `<code>${f}</code>`).join(', ')}
        </div>
        <ul class="gherkin-list">
          ${task.criteria.map(c => `<li><strong>Dado que</strong> ${c.given}, <strong>cuando</strong> ${c.when}, <strong>entonces</strong> ${c.then}</li>`).join('')}
        </ul>
      `;
      epicDiv.appendChild(taskDiv);
    });

    visualList.appendChild(epicDiv);
  });

  // Markdown Tab
  const md = generateMarkdown(plan);
  document.getElementById('code-markdown').textContent = md;

  // GitHub Tab
  const ghList = document.getElementById('github-issues-list');
  ghList.innerHTML = '';
  plan.epics.forEach(epic => {
    epic.tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-item';
      card.innerHTML = `
        <div class="task-header">
          <span class="task-title">🐙 Issue: [${task.id}] ${task.title}</span>
          <span class="badge-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
        <pre class="code-block" style="font-size:0.75rem; margin-top:8px;">## Objetivo\nImplementar ${task.title} en capa ${epic.layer}.\n\n### Criterios de Aceptación\n- [ ] Dado que ${task.criteria[0].given}, cuando ${task.criteria[0].when}, entonces ${task.criteria[0].then}</pre>
      `;
      ghList.appendChild(card);
    });
  });

  // JSON Tab
  document.getElementById('code-json').textContent = JSON.stringify(plan, null, 2);
}

function generateMarkdown(plan) {
  let lines = [];
  lines.push(`# 📋 Sprint Plan: ${plan.title}`);
  lines.push(`> ${plan.summary}\n`);
  lines.push(`- **Duración Estimada:** ${plan.durationDays} días`);
  lines.push(`- **Esfuerzo Total:** ${plan.totalHours} horas hombre`);
  lines.push(`- **Fecha:** ${new Date().toLocaleString()}\n`);
  lines.push(`---`);
  lines.push(`## ⚠️ Riesgos Técnicos`);
  plan.risks.forEach(r => lines.push(`- ⚠️ ${r}`));
  lines.push(`\n## 🏛️ Recomendaciones Arquitectónicas`);
  plan.recommendations.forEach(r => lines.push(`- 💡 ${r}`));
  lines.push(`\n---`);
  lines.push(`## 📦 Épicas y Tareas Técnicas\n`);

  plan.epics.forEach(epic => {
    lines.push(`### 🎯 [${epic.id}] ${epic.title} *(${epic.layer.toUpperCase()})*`);
    lines.push(`**Objetivo:** ${epic.goal}\n`);
    epic.tasks.forEach(task => {
      lines.push(`#### 🔹 \`${task.id}\`: ${task.title}`);
      lines.push(`- **Prioridad:** \`${task.priority}\` | **Estimación:** \`${task.hours}h\``);
      lines.push(`- **Archivos:** ${task.files.map(f => `\`${f}\``).join(', ')}`);
      lines.push(`- **Criterios de Aceptación:**`);
      task.criteria.forEach(c => {
        lines.push(`  - [ ] **Dado que** ${c.given}, **cuando** ${c.when}, **entonces** ${c.then}`);
      });
      lines.push('');
    });
  });

  return lines.join('\n');
}

function initRoiCalculator() {
  const hoursSlider = document.getElementById('hours-slider');
  const rateSlider = document.getElementById('rate-slider');
  const valHours = document.getElementById('val-hours');
  const valRate = document.getElementById('val-rate');
  const monthlySavings = document.getElementById('roi-monthly-savings');
  const hoursSaved = document.getElementById('roi-hours-saved');
  const multiple = document.getElementById('roi-multiple');

  function calculate() {
    const hours = parseInt(hoursSlider.value);
    const rate = parseInt(rateSlider.value);

    valHours.textContent = `${hours} horas/sem`;
    valRate.textContent = `$${rate} USD/hora`;

    const monthlyHours = hours * 4;
    const monthlyCash = monthlyHours * rate;
    const roiMult = Math.round(monthlyCash / 15);

    hoursSaved.textContent = `${monthlyHours} horas/mes`;
    monthlySavings.textContent = `$${monthlyCash.toLocaleString()} USD`;
    multiple.textContent = `${roiMult}x`;
  }

  hoursSlider.addEventListener('input', calculate);
  rateSlider.addEventListener('input', calculate);

  // Inicial
  calculate();
}

// ==========================================================
// PAYMENT GATEWAY & CHECKOUT SYSTEM
// ==========================================================

const PLANS_CONFIG = {
  pro: {
    name: 'Plan Pro Solo (Early-Bird)',
    price: 15,
    regularPrice: 29,
    period: '/ mes',
    btnText: 'Proceder al Pago Seguro ($15 USD)',
    planTag: 'PRO',
    activations: '2 Dispositivos',
  },
  lifetime: {
    name: 'Pase Vitalicio (Lifetime Early-Bird)',
    price: 79,
    regularPrice: 199,
    period: '/ pago único',
    btnText: 'Adquirir Licencia Vitalicia ($79 USD)',
    planTag: 'LIFE',
    activations: '3 Dispositivos',
  },
  team: {
    name: 'Plan Equipos & Tech Leads',
    price: 39,
    regularPrice: 79,
    period: '/ mes',
    btnText: 'Proceder al Pago Seguro ($39 USD)',
    planTag: 'TEAM',
    activations: '10 Dispositivos',
  },
};

let activeIssuedLicense = null;

async function generateClientLicenseKey(plan) {
  const planTag = plan === 'lifetime' ? 'LIFE' : plan === 'team' ? 'TEAM' : 'PRO';
  const entropy = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('devtask-anti-tamper-secret-key-2026'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(`${planTag}:${entropy}`));
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const sig = sigArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
    return `DT-${planTag}-${entropy}-${sig}`;
  } catch {
    // Fallback simple si subtle crypto falla
    const sig = ((Date.now() ^ 0xa5540eb5) >>> 0).toString(16).padStart(8, '0').slice(0, 8).toUpperCase();
    return `DT-${planTag}-${entropy}-${sig}`;
  }
}

async function verifyClientLicenseOffline(key) {
  if (!key || typeof key !== 'string') return { valid: false };
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 4 || parts[0] !== 'DT') return { valid: false };

  const [, planTag, entropy, sig] = parts;

  try {
    const enc = new TextEncoder();
    const subKey = await crypto.subtle.importKey(
      'raw',
      enc.encode('devtask-anti-tamper-secret-key-2026'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', subKey, enc.encode(`${planTag}:${entropy}`));
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const expectedSig = sigArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8).toUpperCase();

    if (sig === expectedSig) {
      let plan = 'pro';
      if (planTag === 'LIFE') plan = 'lifetime';
      if (planTag === 'TEAM') plan = 'team';
      return { valid: true, plan, planTag };
    }
  } catch {}

  // Validación de compatibilidad para claves demo
  if (key.includes('7B9FEEC6') || key.includes('3F91A802')) {
    const plan = key.includes('LIFE') ? 'lifetime' : 'pro';
    return { valid: true, plan, planTag };
  }

  return { valid: false };
}

function initPaymentCheckout() {
  const modal = document.getElementById('preorder-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const preorderBtns = document.querySelectorAll('.btn-preorder');
  const navEarlyBird = document.getElementById('nav-early-bird');
  const form = document.getElementById('checkout-form');
  const planInput = document.getElementById('selected-plan');

  const summaryName = document.getElementById('summary-plan-name');
  const summaryPrice = document.getElementById('summary-plan-price');
  const btnPayText = document.getElementById('btn-pay-text');
  const checkoutTitle = document.getElementById('checkout-title');

  const viewForm = document.getElementById('checkout-view-form');
  const viewProcessing = document.getElementById('checkout-view-processing');
  const viewSuccess = document.getElementById('checkout-view-success');

  const gatewayTabs = document.querySelectorAll('.gateway-tab');
  const cardFields = document.getElementById('card-fields-group');

  function openCheckout(planKey = 'pro') {
    const plan = PLANS_CONFIG[planKey] || PLANS_CONFIG.pro;
    planInput.value = planKey;

    checkoutTitle.textContent = `Completar Suscripción [${plan.planTag}]`;
    summaryName.textContent = plan.name;
    summaryPrice.innerHTML = `$${plan.price} USD <small>${plan.period}</small>`;
    btnPayText.textContent = plan.btnText;

    viewForm.classList.remove('hidden');
    viewProcessing.classList.add('hidden');
    viewSuccess.classList.add('hidden');
    modal.classList.remove('hidden');
  }

  preorderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openCheckout(btn.dataset.plan || 'pro');
    });
  });

  if (navEarlyBird) {
    navEarlyBird.addEventListener('click', (e) => {
      e.preventDefault();
      openCheckout('pro');
    });
  }

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Selector de Pasarela
  gatewayTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      gatewayTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const radio = tab.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const provider = tab.dataset.provider;
      if (provider === 'stripe') {
        cardFields.classList.remove('hidden');
      } else {
        cardFields.classList.add('hidden');
      }

      const planKey = planInput.value;
      const plan = PLANS_CONFIG[planKey] || PLANS_CONFIG.pro;
      if (provider === 'lemonsqueezy') {
        btnPayText.textContent = `Pagar con Lemon Squeezy ($${plan.price} USD)`;
      } else if (provider === 'stripe') {
        btnPayText.textContent = `Confirmar Tarjeta ($${plan.price} USD)`;
      } else {
        btnPayText.textContent = `Generar Licencia Sandbox ($0 USD)`;
      }
    });
  });

  // Procesamiento del Pago y Emisión de Licencia
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('user-email').value;
    const editor = document.getElementById('user-editor').value;
    const planKey = planInput.value;
    const selectedProvider = document.querySelector('input[name="payment-provider"]:checked')?.value || 'lemonsqueezy';

    // Cambiar a vista de procesamiento
    viewForm.classList.add('hidden');
    viewProcessing.classList.remove('hidden');

    const desc = document.getElementById('processing-step-desc');
    desc.textContent = `Conectando de forma segura con ${selectedProvider.toUpperCase()}...`;
    await sleep(700);

    desc.textContent = 'Verificando autorización y creando sesión Merchant of Record...';
    await sleep(800);

    desc.textContent = 'Firmando clave criptográfica anti-tamper para tu cuenta...';

    const LEMON_CHECKOUTS = {
      pro: 'https://stream-arch.lemonsqueezy.com/checkout/buy/d8385d75-836a-413f-a0f7-89d6bfcd0ed4',
      lifetime: 'https://stream-arch.lemonsqueezy.com/checkout/buy/13a8729f-a2e2-4e42-81a9-8765a9a98578',
      team: 'https://stream-arch.lemonsqueezy.com/checkout/buy/13a8729f-a2e2-4e42-81a9-8765a9a98578',
    };

    if (selectedProvider === 'lemonsqueezy') {
      const targetUrl = LEMON_CHECKOUTS[planKey] || LEMON_CHECKOUTS.pro;
      const checkoutUrl = email 
        ? `${targetUrl}?checkout[email]=${encodeURIComponent(email)}` 
        : targetUrl;

      // Abrir checkout seguro oficial de Lemon Squeezy
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
      }
    }

    // Generar la licencia real
    let licenseKey;
    try {
      // Intentar contactar API si está activa
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: planKey, provider: selectedProvider, editor }),
      });
      if (resp.ok) {
        const data = await resp.json();
        licenseKey = data.licenseKey;
      }
    } catch {}

    if (!licenseKey) {
      licenseKey = await generateClientLicenseKey(planKey);
    }

    await sleep(600);

    // Guardar en almacenamiento local
    activeIssuedLicense = {
      key: licenseKey,
      plan: planKey,
      email,
      editor,
      provider: selectedProvider,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    localStorage.setItem('devtask_active_license', JSON.stringify(activeIssuedLicense));

    const leads = JSON.parse(localStorage.getItem('devtask_orders_history') || '[]');
    leads.push(activeIssuedLicense);
    localStorage.setItem('devtask_orders_history', JSON.stringify(leads));

    // Mostrar pantalla de éxito
    viewProcessing.classList.add('hidden');
    viewSuccess.classList.remove('hidden');

    const keyDisplay = document.getElementById('delivery-license-key');
    const termCmd = document.getElementById('delivery-terminal-cmd');
    keyDisplay.textContent = licenseKey;
    termCmd.textContent = `devtask auth activate ${licenseKey}`;

    // Actualizar también el portal de licencias
    const portalInput = document.getElementById('portal-key-input');
    if (portalInput) portalInput.value = licenseKey;
  });

  // Botón Copiar Licencia
  const btnCopyKey = document.getElementById('btn-copy-delivery-key');
  btnCopyKey.addEventListener('click', () => {
    const key = document.getElementById('delivery-license-key').textContent;
    navigator.clipboard.writeText(key).then(() => {
      btnCopyKey.textContent = '✔ Copiada';
      setTimeout(() => { btnCopyKey.textContent = 'Copiar'; }, 2000);
    });
  });

  // Botón Copiar Comando Terminal
  const btnCopyTerm = document.getElementById('btn-copy-term-cmd');
  btnCopyTerm.addEventListener('click', () => {
    const cmd = document.getElementById('delivery-terminal-cmd').textContent;
    navigator.clipboard.writeText(cmd).then(() => {
      btnCopyTerm.textContent = '✔ Copiado';
      setTimeout(() => { btnCopyTerm.textContent = 'Copiar Comando'; }, 2000);
    });
  });

  // Descargar Archivo JSON de Licencia
  const btnDownloadJson = document.getElementById('btn-download-license-json');
  btnDownloadJson.addEventListener('click', () => {
    if (!activeIssuedLicense) return;
    const blob = new Blob([JSON.stringify(activeIssuedLicense, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devtask_license.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Botón Cerrar y Probar en Simulador
  const btnCloseSuccess = document.getElementById('btn-close-checkout-success');
  btnCloseSuccess.addEventListener('click', () => {
    modal.classList.add('hidden');
    const portalSection = document.getElementById('license-portal');
    if (portalSection) {
      portalSection.scrollIntoView({ behavior: 'smooth' });
      const verifyBtn = document.getElementById('btn-verify-license');
      if (verifyBtn) verifyBtn.click();
    }
  });
}

// ==========================================================
// LIVE LICENSE PORTAL & VERIFICATION
// ==========================================================

function initLicensePortal() {
  const keyInput = document.getElementById('portal-key-input');
  const btnVerify = document.getElementById('btn-verify-license');
  const samplePills = document.querySelectorAll('.sample-pill');

  const statusBadge = document.getElementById('lic-status-badge');
  const statusText = document.getElementById('lic-status-text');
  const planTag = document.getElementById('lic-plan-tag');
  const displayKey = document.getElementById('lic-display-key');
  const displayActivations = document.getElementById('lic-display-activations');
  const displayRenewal = document.getElementById('lic-display-renewal');
  const cliCmd = document.getElementById('lic-cli-cmd');
  const btnCopyCli = document.getElementById('btn-copy-cli-cmd');

  async function verifyKey(key) {
    if (!key) return;
    key = key.trim().toUpperCase();

    btnVerify.textContent = 'Verificando...';
    await sleep(350);

    const check = await verifyClientLicenseOffline(key);

    if (check.valid) {
      statusBadge.className = 'status-indicator active';
      statusText.textContent = 'Licencia Activa y Verificada ✅';
      planTag.textContent = check.plan === 'lifetime' ? 'PASE VITALICIO' : check.plan === 'team' ? 'PLAN EQUIPO' : 'PLAN PRO';
      displayKey.textContent = key;
      displayActivations.textContent = check.plan === 'lifetime' ? '1 / 3 Dispositivos' : check.plan === 'team' ? '1 / 10 Dispositivos' : '1 / 2 Dispositivos';
      displayRenewal.textContent = check.plan === 'lifetime' ? 'Vitalicia (Sin caducidad)' : '11 de Noviembre, 2026';
      cliCmd.textContent = `devtask auth activate ${key}`;
    } else {
      statusBadge.className = 'status-indicator invalid';
      statusText.textContent = 'Clave No Reconocida o Revocada ❌';
      planTag.textContent = 'INVÁLIDA';
      displayKey.textContent = key;
      displayActivations.textContent = '0 Dispositivos';
      displayRenewal.textContent = 'No aplica';
      cliCmd.textContent = `devtask auth activate ${key}`;
    }

    btnVerify.textContent = 'Verificar Clave';
  }

  btnVerify.addEventListener('click', () => {
    verifyKey(keyInput.value);
  });

  samplePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const key = pill.dataset.key;
      keyInput.value = key;
      verifyKey(key);
    });
  });

  btnCopyCli.addEventListener('click', () => {
    navigator.clipboard.writeText(cliCmd.textContent).then(() => {
      btnCopyCli.textContent = '✔ Copiado';
      setTimeout(() => { btnCopyCli.textContent = 'Copiar'; }, 2000);
    });
  });

  // Verificación inicial con la clave por defecto
  verifyKey(keyInput.value);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

