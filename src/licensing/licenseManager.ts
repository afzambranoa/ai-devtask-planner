import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  LicenseKeyData,
  LicenseStatus,
  LicenseVerificationResponse,
  SubscriptionPlan,
} from '../types/index.js';

const MASTER_SIGNING_SECRET = process.env.LICENSE_MASTER_SECRET || 'devtask-anti-tamper-secret-key-2026';
const DB_PATH = path.resolve(process.cwd(), 'data/licenses_db.json');
const USER_CONFIG_DIR = path.join(os.homedir(), '.ai-devtask');
const USER_LICENSE_FILE = path.join(USER_CONFIG_DIR, 'license.json');
const WORKSPACE_LICENSE_FILE = path.resolve(process.cwd(), '.devtask_license.json');

export class LicenseManager {
  private static ensureDbExists(): void {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private static loadDb(): LicenseKeyData[] {
    this.ensureDbExists();
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private static saveDb(licenses: LicenseKeyData[]): void {
    this.ensureDbExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(licenses, null, 2), 'utf-8');
  }

  /**
   * Genera un checksum criptográfico HMAC para permitir validación offline
   */
  public static generateSignature(prefix: string, entropy: string): string {
    return crypto
      .createHmac('sha256', MASTER_SIGNING_SECRET)
      .update(`${prefix}:${entropy}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
  }

  /**
   * Genera una nueva clave de licencia con firma offline verificable
   */
  public static issueLicenseKey(params: {
    plan: SubscriptionPlan;
    customerEmail: string;
    orderId?: string;
    provider?: 'lemonsqueezy' | 'stripe' | 'sandbox';
    expiresInDays?: number;
  }): LicenseKeyData {
    const planTag = params.plan === 'lifetime' ? 'LIFE' : params.plan === 'team' ? 'TEAM' : 'PRO';
    const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
    const signature = this.generateSignature(planTag, entropy);
    const key = `DT-${planTag}-${entropy}-${signature}`;

    const now = new Date();
    let expiresAt: string | undefined = undefined;

    if (params.plan === 'pro') {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + (params.expiresInDays || 30));
      expiresAt = exp.toISOString();
    }

    const license: LicenseKeyData = {
      key,
      plan: params.plan,
      customerEmail: params.customerEmail,
      createdAt: now.toISOString(),
      expiresAt,
      status: 'active',
      maxActivations: params.plan === 'team' ? 10 : params.plan === 'lifetime' ? 3 : 2,
      activations: [],
      orderId: params.orderId || `ORD-${Date.now()}`,
      provider: params.provider || 'sandbox',
      signature,
    };

    const licenses = this.loadDb();
    licenses.push(license);
    this.saveDb(licenses);

    return license;
  }

  /**
   * Valida matemáticamente la clave sin necesidad de conexión externa
   */
  public static verifyOffline(key: string): { valid: boolean; plan: SubscriptionPlan } {
    if (!key || typeof key !== 'string') {
      return { valid: false, plan: 'free' };
    }

    const parts = key.trim().toUpperCase().split('-');
    if (parts.length !== 4 || parts[0] !== 'DT') {
      return { valid: false, plan: 'free' };
    }

    const [, planTag, entropy, sig] = parts;
    const expectedSig = this.generateSignature(planTag, entropy);

    if (sig !== expectedSig) {
      return { valid: false, plan: 'free' };
    }

    let plan: SubscriptionPlan = 'pro';
    if (planTag === 'LIFE') plan = 'lifetime';
    if (planTag === 'TEAM') plan = 'team';

    return { valid: true, plan };
  }

  /**
   * Verificación completa (online contra base de datos de licencias)
   */
  public static verifyLicense(key: string): LicenseVerificationResponse {
    const offlineCheck = this.verifyOffline(key);
    if (!offlineCheck.valid) {
      return {
        valid: false,
        plan: 'free',
        status: 'invalid' as LicenseStatus,
        message: 'Clave de licencia con formato o firma criptográfica inválida.',
      };
    }

    const licenses = this.loadDb();
    const found = licenses.find(l => l.key.toUpperCase() === key.trim().toUpperCase());

    if (!found) {
      // Si la firma offline es válida pero no está en la DB local (ej. emitida por servidor de producción)
      return {
        valid: true,
        plan: offlineCheck.plan,
        status: 'active',
        message: 'Licencia válida verificada por firma criptográfica local.',
      };
    }

    if (found.status !== 'active') {
      return {
        valid: false,
        plan: found.plan,
        status: found.status,
        message: `La licencia se encuentra en estado: ${found.status}.`,
      };
    }

    if (found.expiresAt) {
      const expDate = new Date(found.expiresAt);
      if (expDate < new Date()) {
        found.status = 'expired';
        this.saveDb(licenses);
        return {
          valid: false,
          plan: found.plan,
          status: 'expired',
          expiresAt: found.expiresAt,
          message: 'La suscripción de la licencia ha expirado.',
        };
      }
    }

    return {
      valid: true,
      plan: found.plan,
      status: found.status,
      customerEmail: found.customerEmail,
      expiresAt: found.expiresAt,
      maxActivations: found.maxActivations,
      currentActivations: found.activations.length,
      message: 'Licencia activa y en regla.',
    };
  }

  /**
   * Asocia una máquina al pool de activaciones de la licencia
   */
  public static activateMachine(key: string, machineId?: string): { success: boolean; message: string } {
    const verification = this.verifyLicense(key);
    if (!verification.valid) {
      return { success: false, message: verification.message || 'Licencia inválida' };
    }

    const id = machineId || `${os.hostname()}-${os.platform()}-${os.userInfo().username}`;
    const licenses = this.loadDb();
    const found = licenses.find(l => l.key.toUpperCase() === key.trim().toUpperCase());

    if (found) {
      if (!found.activations.includes(id)) {
        if (found.activations.length >= found.maxActivations) {
          return {
            success: false,
            message: `Límite de activaciones alcanzado (${found.activations.length}/${found.maxActivations}). Desactiva un dispositivo antes de continuar.`,
          };
        }
        found.activations.push(id);
        this.saveDb(licenses);
      }
    }

    // Guardar en la máquina del usuario
    try {
      if (!fs.existsSync(USER_CONFIG_DIR)) {
        fs.mkdirSync(USER_CONFIG_DIR, { recursive: true });
      }
      const record = {
        key: key.trim().toUpperCase(),
        plan: verification.plan,
        activatedAt: new Date().toISOString(),
        customerEmail: verification.customerEmail,
      };
      fs.writeFileSync(USER_LICENSE_FILE, JSON.stringify(record, null, 2), 'utf-8');
      fs.writeFileSync(WORKSPACE_LICENSE_FILE, JSON.stringify(record, null, 2), 'utf-8');
    } catch (e: any) {
      return { success: false, message: `No se pudo guardar la licencia localmente: ${e.message}` };
    }

    return {
      success: true,
      message: `Licencia activada con éxito para el plan [${verification.plan.toUpperCase()}].`,
    };
  }

  /**
   * Obtiene la licencia instalada actualmente en la máquina local
   */
  public static getInstalledLicense(): { active: boolean; plan: SubscriptionPlan; key?: string; email?: string } {
    const candidates = [WORKSPACE_LICENSE_FILE, USER_LICENSE_FILE];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        try {
          const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
          if (content.key) {
            const ver = this.verifyLicense(content.key);
            if (ver.valid) {
              return { active: true, plan: ver.plan, key: content.key, email: ver.customerEmail };
            }
          }
        } catch {
          // continuar con el siguiente
        }
      }
    }
    return { active: false, plan: 'free' };
  }

  /**
   * Elimina la licencia local (Cerrar sesión)
   */
  public static deactivateLocal(): boolean {
    let deleted = false;
    for (const f of [WORKSPACE_LICENSE_FILE, USER_LICENSE_FILE]) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
          deleted = true;
        } catch {}
      }
    }
    return deleted;
  }
}
