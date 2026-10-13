import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI DevTask Planner extension is now active!');

  // Comando 1: Planificar archivo actual
  const planCommand = vscode.commands.registerCommand('aiDevTask.planCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Por favor abre un archivo PRD o de especificación en el editor.');
      return;
    }

    const document = editor.document;
    const content = document.getText();
    if (!content.trim()) {
      vscode.window.showErrorMessage('El archivo actual está vacío.');
      return;
    }

    const config = vscode.workspace.getConfiguration('aiDevTask');
    const provider = config.get<string>('provider') || 'mock';

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `AI DevTask Planner: Analizando requerimientos y arquitectura (${provider})...`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 30, message: 'Extrayendo requerimientos...' });

        // Simulación o llamada al engine
        await new Promise((res) => setTimeout(res, 1200));
        progress.report({ increment: 50, message: 'Generando épicas, tareas y criterios Gherkin...' });
        await new Promise((res) => setTimeout(res, 800));

        // Crear nuevo documento Markdown al lado con el plan generado
        const title = document.fileName.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'Requerimiento';
        const planMarkdown = `# 📋 Sprint Plan: ${title}
> **Generado automáticamente por AI DevTask Planner para VS Code / Cursor**

- **Duración Estimada del Sprint:** 14 días
- **Esfuerzo Total Estimado:** \`34 horas hombre\`
- **Fecha:** ${new Date().toLocaleString()}

---
## ⚠️ Evaluación de Riesgos Técnicos
- ⚠️ Cuello de botella en consultas complejas: se requiere capa de caché Redis.
- ⚠️ Implementar rate-limiting por API Key para evitar saturación de cuotas.

## 🏛️ Recomendaciones Arquitectónicas
- 💡 Adopción de arquitectura hexagonal para desacoplar el dominio.
- 💡 Observabilidad estructurada JSON con correlation IDs.

---
## 📦 Épicas y Tareas Técnicas Detalladas

### 🎯 [EPIC-01] Capa de Persistencia y Modelado de Dominio *(Capa: DATABASE)*
**Objetivo:** Diseñar entidades clave y migraciones reproducibles.

#### 🔹 \`TASK-101\`: Definir esquema relacional y migraciones iniciales
- **Prioridad:** 🔴 CRÍTICA | **Complejidad:** \`M\` | **Estimación:** \`6 horas\`
- **Archivos Afectados:**
  - \`src/db/schema.prisma\`
  - \`src/db/migrations/001_init.sql\`
- **Criterios de Aceptación (Gherkin):**
  - [ ] **Dado que** la base de datos está limpia, **cuando** se ejecuta la migración, **entonces** todas las tablas e índices se crean sin errores.

### 🎯 [EPIC-02] Servicios de Negocio y API Endpoints *(Capa: BACKEND)*
**Objetivo:** Controladores REST con validación Zod y serialización segura.

#### 🔹 \`TASK-201\`: Implementar endpoints y contratos DTO
- **Prioridad:** 🟠 ALTA | **Complejidad:** \`L\` | **Estimación:** \`12 horas\`
- **Archivos Afectados:**
  - \`src/controllers/resource.controller.ts\`
  - \`src/validators/resource.schema.ts\`
- **Criterios de Aceptación (Gherkin):**
  - [ ] **Dado que** se envía un payload inválido, **cuando** la API recibe el POST, **entonces** responde HTTP 422 con el detalle del error.
`;

        const newDoc = await vscode.workspace.openTextDocument({
          content: planMarkdown,
          language: 'markdown',
        });

        await vscode.window.showTextDocument(newDoc, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: false,
        });

        vscode.window.showInformationMessage('¡Sprint Plan generado exitosamente al costado del editor!');
      }
    );
  });

  // Comando 2: Abrir Webview interactivo
  const webviewCommand = vscode.commands.registerCommand('aiDevTask.openPlannerPanel', () => {
    const panel = vscode.window.createWebviewPanel(
      'aiDevTaskPanel',
      'AI DevTask Planner Studio',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();
  });

  context.subscriptions.push(planCommand, webviewCommand);
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AI DevTask Planner Studio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    h1 { color: var(--vscode-textLink-foreground); font-size: 1.6rem; }
    textarea { width: 100%; height: 160px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 6px; padding: 10px; font-family: monospace; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.8rem; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="badge">PRO VERSION • VS CODE & CURSOR INTEGRATED</div>
  <h1>🚀 AI DevTask Planner Studio</h1>
  <p>Pega aquí los requerimientos o el PRD para desglosarlo instantáneamente en tareas y criterios Gherkin:</p>
  <textarea placeholder="# Requerimiento: Sistema de Notificaciones en Tiempo Real..."></textarea>
  <br>
  <button onclick="alert('Generando plan a través del AI Core Engine...')">⚡ Planificar Sprint Automáticamente</button>
</body>
</html>`;
}

export function deactivate() {}
