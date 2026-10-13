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
  initModal();
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

function initModal() {
  const modal = document.getElementById('preorder-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const preorderBtns = document.querySelectorAll('.btn-preorder');
  const form = document.getElementById('preorder-form');
  const successBox = document.getElementById('modal-success');
  const planInput = document.getElementById('selected-plan');

  preorderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      planInput.value = plan;
      modal.classList.remove('hidden');
      form.classList.remove('hidden');
      successBox.classList.add('hidden');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('user-email').value;
    const editor = document.getElementById('user-editor').value;
    const plan = planInput.value;

    // Guardar lead localmente
    const leads = JSON.parse(localStorage.getItem('devtask_waitlist_leads') || '[]');
    leads.push({ email, editor, plan, date: new Date().toISOString() });
    localStorage.setItem('devtask_waitlist_leads', JSON.stringify(leads));

    // Mostrar éxito
    form.classList.add('hidden');
    successBox.classList.remove('hidden');

    setTimeout(() => {
      // Simular apertura de checkout Lemon Squeezy
      alert(`[Demo de Preventa]: Correo registrado exitosamente (${email}). Redirigiendo a pasarela de Lemon Squeezy para plan: ${plan.toUpperCase()}`);
      modal.classList.add('hidden');
    }, 2500);
  });
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}
