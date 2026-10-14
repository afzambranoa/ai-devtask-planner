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
import { LicenseManager } from './licensing/licenseManager.js';
import { PaymentGateway } from './licensing/paymentGateway.js';

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

    // Verificación de Licencia
    const license = LicenseManager.getInstalledLicense();
    if (license.active) {
      console.log(chalk.bgGreen.black.bold(` [PLAN ${license.plan.toUpperCase()} ACTIVO] `) + chalk.green(` Licencia: ${license.key} (Ilimitado)`));
    } else {
      console.log(chalk.bgYellow.black.bold(` [PLAN DEVELOPER FREE] `) + chalk.gray(' 5 planes/mes incluidos. Para ilimitado: ') + chalk.cyan('devtask checkout pro'));
    }
    console.log('');

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

// Comandos de Licenciamiento y Auth
const authCommand = program.command('auth').description('Gestionar licencia y autenticación de AI DevTask');

authCommand
  .command('status')
  .description('Consultar el estado de tu licencia actual')
  .action(() => {
    const lic = LicenseManager.getInstalledLicense();
    console.log(chalk.bold.cyan('\n=== Estado de Licencia AI DevTask Planner ===\n'));
    if (lic.active && lic.key) {
      const ver = LicenseManager.verifyLicense(lic.key);
      console.log(chalk.green('Estado:        Activa ✅'));
      console.log(`Plan:          ${chalk.bold.yellow(ver.plan.toUpperCase())}`);
      console.log(`Clave:         ${chalk.white(lic.key)}`);
      if (ver.customerEmail) console.log(`Propietario:   ${chalk.gray(ver.customerEmail)}`);
      if (ver.expiresAt) console.log(`Vencimiento:   ${chalk.gray(new Date(ver.expiresAt).toLocaleDateString())}`);
      console.log(`Activaciones:  ${chalk.cyan(`${ver.currentActivations || 1}/${ver.maxActivations || 2}`)} dispositivos`);
    } else {
      console.log(chalk.yellow('Estado:        Plan Free (Sin licencia Pro activada) ℹ️'));
      console.log('Límite:        5 planes por mes.');
      console.log(chalk.gray('\nPara activar una licencia:'));
      console.log(chalk.cyan('  devtask auth activate <TU_CLAVE>'));
      console.log(chalk.gray('Para adquirir una licencia:'));
      console.log(chalk.cyan('  devtask checkout pro\n'));
    }
  });

authCommand
  .command('activate <key>')
  .description('Activa una clave de licencia en esta máquina')
  .action((key: string) => {
    const res = LicenseManager.activateMachine(key);
    if (res.success) {
      console.log(chalk.green(`\n✔ ${res.message}\n`));
    } else {
      console.log(chalk.red(`\n✖ Error: ${res.message}\n`));
      process.exit(1);
    }
  });

authCommand
  .command('logout')
  .description('Desvincula la licencia local')
  .action(() => {
    LicenseManager.deactivateLocal();
    console.log(chalk.yellow('\n✔ Licencia local removida. Ahora estás en modo Free.\n'));
  });

// Comando de Checkout
program
  .command('checkout [plan]')
  .description('Inicia el proceso de suscripción o pago para Pro o Lifetime')
  .option('-e, --email <email>', 'Correo del desarrollador para enviar la licencia', 'dev@example.com')
  .option('-p, --provider <provider>', 'Proveedor: lemonsqueezy | stripe | sandbox', 'sandbox')
  .action(async (planArg = 'pro', options) => {
    const gateway = new PaymentGateway();
    const plan = planArg.toLowerCase() as any;
    console.log(chalk.cyan(`\nIniciando pasarela de pago para el plan [${plan.toUpperCase()}]...`));

    const result = await gateway.createCheckout({
      plan,
      email: options.email,
      provider: options.provider as any,
    });

    console.log(chalk.bold.green('\n=== Sesión de Pago Creada ===\n'));
    console.log(`Plan:         ${chalk.yellow(result.plan.toUpperCase())}`);
    console.log(`Precio:       ${chalk.bold.white(`$${result.amount} USD`)}`);
    console.log(`Proveedor:    ${chalk.cyan(result.provider.toUpperCase())}`);
    console.log(`Orden:        ${chalk.gray(result.orderId)}`);

    if (result.licenseKey) {
      console.log(`\n🎉 Clave emitida de inmediato: ${chalk.bold.green(result.licenseKey)}`);
      console.log(chalk.gray(`Para activarla ahora mismo ejecuta:`));
      console.log(chalk.cyan(`  devtask auth activate ${result.licenseKey}\n`));
    } else {
      console.log(`\nEnlace de Checkout oficial: ${chalk.underline.cyan(result.checkoutUrl)}\n`);
    }
  });

program.parse();

