# AI DevTask Planner - Extensión para VS Code y Cursor 🚀

Convierte cualquier archivo Markdown, PRD o especificación de software en un **Sprint Plan exhaustivo** con tareas granulares, horas estimadas, archivos afectados y criterios de aceptación Gherkin directamente en tu editor.

## ✨ Características Clave
- **Comando contextual:** Clic derecho en cualquier archivo -> *"AI DevTask: Planificar archivo actual en Sprint Plan"*.
- **Desglose arquitectónico:** Agrupación por capas (Frontend, Backend, Database, Security, DevOps).
- **Cero latencia:** Genera un archivo Markdown al lado de tu editor listo para compartir o subir a GitHub.
- **Soporte Multi-Modelo:** Usa Google Gemini, OpenAI o tu propio **Ollama local** para 100% privacidad de código.

## 🛠️ Instalación para Desarrollo Local
1. Abre esta carpeta en VS Code / Cursor:
   ```bash
   cd D:\PROYECTOS\ai-task-planner\extension
   npm install
   npm run compile
   ```
2. Presiona `F5` para iniciar una ventana de desarrollo de extensiones (*Extension Development Host*).
3. Abre cualquier archivo `.md` y presiona `Ctrl+Shift+P` -> Escribe **AI DevTask: Planificar archivo actual**.
