#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateSprintPlan } from './core/engine.js';
import { exportToMarkdown } from './core/exporters/markdownExporter.js';
import { exportGitHubIssues } from './core/exporters/githubExporter.js';
import { exportToJson } from './core/exporters/jsonExporter.js';

dotenv.config();

const program = new Command();

program
  .name('devtask')
  .description('Motor Inteligente de Planificacion y Desglose de Software con IA')
  .version('1.0.0');

program
  .command('plan')
  .description('Desglosa un requerimiento de software en un Sprint Plan completo')
  .argument('<input>', 'Ruta al archivo (PRD / spec en Markdown/texto) o requerimiento en texto')
  .option('-p, --provider <provider>', 'Proveedor de IA: gemini | openai | ollama | mock', 'mock')
  .option('-m, --model <model>', 'Modelo especifico a usar')
  .option('-k, --api-key <key>', 'API Key del proveedor')
  .option('-o, --output <format>', 'Formato de salida: markdown | github | json | all', 'all')
  .option('-d, --out-dir <directory>', 'Directorio donde guardar los resultados', './output')
  .action(async (input, options) => {
    console.log(chalk.bold.cyan('\n=================================================='));
    console.log(chalk.bold.cyan('       AI DevTask Planner - Sprint Engine        '));
    console.log(chalk.bold.cyan('==================================================\n'));

    let requirements = input;
    if (fs.existsSync(input)) {
      console.log(chalk.gray(`-> Leyendo archivo de entrada: ${input}`));
      requirements = fs.readFileSync(input, 'utf-8');
    }

    const spinner = ora({
      text: chalk.yellow(`Analizando requerimientos y arquitectura con IA (Proveedor: ${options.provider})...`),
      color: 'cyan',
    }).start();

    try {
      const plan = await generateSprintPlan({
        requirements,
        provider: options.provider,
        options: {
          apiKey: options.apiKey,
          model: options.model,
        },
      });

      spinner.succeed(chalk.green('Sprint Plan generado y validado contra esquema Zod con exito!\n'));

      console.log(chalk.bold.white(`Titulo del Proyecto: `) + chalk.cyan(plan.projectTitle));
      console.log(chalk.bold.white(`Total de Epicas:      `) + chalk.yellow(plan.epics.length));
      const totalTasks = plan.epics.reduce((acc, e) => acc + e.tasks.length, 0);
      console.log(chalk.bold.white(`Total de Tareas:      `) + chalk.yellow(totalTasks));
      console.log(chalk.bold.white(`Horas Estimadas:     `) + chalk.magenta(`${plan.totalEstimatedHours} horas hombre`));
      console.log('');

      // Guardar salidas
      const outDir = path.resolve(process.cwd(), options.out_dir || './output');
      fs.mkdirSync(outDir, { recursive: true });

      const format = options.output;

      if (format === 'markdown' || format === 'all') {
        const md = exportToMarkdown(plan);
        const mdPath = path.join(outDir, 'SPRINT_PLAN.md');
        fs.writeFileSync(mdPath, md, 'utf-8');
        console.log(chalk.green(`[+] Markdown generado en: `) + chalk.underline(mdPath));
      }

      if (format === 'json' || format === 'all') {
        const jsonStr = exportToJson(plan, true);
        const jsonPath = path.join(outDir, 'sprint_plan.json');
        fs.writeFileSync(jsonPath, jsonStr, 'utf-8');
        console.log(chalk.green(`[+] JSON estructurado en: `) + chalk.underline(jsonPath));
      }

      if (format === 'github' || format === 'all') {
        const issues = exportGitHubIssues(plan);
        const issuesDir = path.join(outDir, 'github_issues');
        fs.mkdirSync(issuesDir, { recursive: true });
        for (const issue of issues) {
          fs.writeFileSync(path.join(issuesDir, issue.filename), `# ${issue.title}\n\n${issue.body}`, 'utf-8');
        }
        console.log(chalk.green(`[+] ${issues.length} GitHub Issues generados en: `) + chalk.underline(issuesDir));
      }

      console.log(chalk.bold.cyan('\nEjecucion completada con exito. Listo para sincronizar con tu equipo!\n'));
    } catch (err: any) {
      spinner.fail(chalk.red('Error generando el Sprint Plan'));
      console.error(chalk.red(`\nDetalle: ${err.message}\n`));
      process.exit(1);
    }
  });

program.parse();
