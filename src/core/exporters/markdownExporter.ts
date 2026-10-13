import { SprintPlan } from '../../types/index.js';

export function exportToMarkdown(plan: SprintPlan): string {
  const lines: string[] = [];

  lines.push(`# 📋 Sprint Plan: ${plan.projectTitle}`);
  lines.push(`> **Resumen Ejecutivo:** ${plan.summary}\n`);
  lines.push(`- **Duracion Estimada del Sprint:** ${plan.targetSprintDurationDays} dias`);
  lines.push(`- **Esfuerzo Total Estimado:** \`${plan.totalEstimatedHours} horas hombre\``);
  lines.push(`- **Fecha de Generacion:** ${new Date(plan.generatedAt).toLocaleString()}\n`);

  lines.push(`---`);
  lines.push(`## ⚠️ Evaluacion de Riesgos Tecnicos`);
  for (const risk of plan.technicalRisks) {
    lines.push(`- ⚠️ ${risk}`);
  }
  lines.push('');

  lines.push(`## 🏛️ Recomendaciones Arquitectonicas`);
  for (const rec of plan.architectureRecommendations) {
    lines.push(`- 💡 ${rec}`);
  }
  lines.push('');

  lines.push(`---`);
  lines.push(`## 📦 Epicas y Tareas Tecnicas Detalladas\n`);

  for (const epic of plan.epics) {
    lines.push(`### 🎯 [${epic.id}] ${epic.title} *(Capa: \`${epic.layer.toUpperCase()}\`)*`);
    lines.push(`**Objetivo de la Epica:** ${epic.goal}\n`);

    for (const task of epic.tasks) {
      const badge = task.priority === 'critical' ? '🔴 CRITICA' : task.priority === 'high' ? '🟠 ALTA' : task.priority === 'medium' ? '🟡 MEDIA' : '🟢 BAJA';
      lines.push(`#### 🔹 \`${task.id}\`: ${task.title}`);
      lines.push(`- **Prioridad:** ${badge} | **Complejidad:** \`${task.complexity}\` | **Estimacion:** \`${task.estimateHours} horas\``);
      if (task.dependencies && task.dependencies.length > 0) {
        lines.push(`- **Dependencias:** ${task.dependencies.map(d => `\`${d}\``).join(', ')}`);
      }
      lines.push(`- **Descripcion:** ${task.description}`);

      if (task.suggestedFiles && task.suggestedFiles.length > 0) {
        lines.push(`- **Archivos Afectados / Creados:**`);
        for (const file of task.suggestedFiles) {
          lines.push(`  - \`${file}\``);
        }
      }

      lines.push(`- **Criterios de Aceptacion (Gherkin):**`);
      for (const crit of task.acceptanceCriteria) {
        lines.push(`  - [ ] **Dado que** ${crit.given}, **cuando** ${crit.when}, **entonces** ${crit.then}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
