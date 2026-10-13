import { SprintPlan, SubTask } from '../../types/index.js';

export function formatGitHubIssue(task: SubTask, epicTitle: string): string {
  const lines: string[] = [];
  lines.push(`## 📌 Objetivo`);
  lines.push(`${task.description}\n`);

  lines.push(`### 🏷️ Metadatos`);
  lines.push(`- **Epica:** ${epicTitle}`);
  lines.push(`- **Prioridad:** \`${task.priority}\``);
  lines.push(`- **Complejidad:** \`${task.complexity}\``);
  lines.push(`- **Estimacion:** \`${task.estimateHours}h\``);
  if (task.dependencies && task.dependencies.length > 0) {
    lines.push(`- **Dependencias:** ${task.dependencies.map(d => `\`${d}\``).join(', ')}`);
  }
  lines.push('');

  if (task.suggestedFiles && task.suggestedFiles.length > 0) {
    lines.push(`### 📂 Archivos Involucrados`);
    for (const f of task.suggestedFiles) {
      lines.push(`- \`${f}\``);
    }
    lines.push('');
  }

  lines.push(`### ✅ Criterios de Aceptacion (Definicion de Terminado)`);
  for (const c of task.acceptanceCriteria) {
    lines.push(`- [ ] **Dado que** ${c.given}, **cuando** ${c.when}, **entonces** ${c.then}`);
  }

  return lines.join('\n');
}

export function exportGitHubIssues(plan: SprintPlan): Array<{ filename: string; title: string; body: string }> {
  const issues: Array<{ filename: string; title: string; body: string }> = [];

  for (const epic of plan.epics) {
    for (const task of epic.tasks) {
      const issueTitle = `[${task.id}] ${task.title}`;
      const issueBody = formatGitHubIssue(task, epic.title);
      issues.push({
        filename: `${task.id.toLowerCase()}-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
        title: issueTitle,
        body: issueBody,
      });
    }
  }

  return issues;
}
