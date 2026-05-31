'use server';

import crypto from 'crypto';
import { dbAdmin } from '@/lib/firebase/server';
import { readData, writeData } from '@/lib/data-service';
import { ensureFreshGoogleAccount, sendGoogleGmailMessage } from '@/lib/google-workspace';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';

const HARDCODED_PASSWORD = 'AKproducciones2024';
const AUTH_COLLECTION = 'app-settings';
const AUTH_DOC_ID = 'auth';
const GOOGLE_ACCOUNTS_FILE = '_google-workspace-accounts.json';
const DEFAULT_RECOVERY_EMAIL =
  process.env.AUTH_RECOVERY_EMAIL ||
  process.env.NEXT_PUBLIC_AUTH_ALLOWED_EMAILS?.split(',')[0]?.trim() ||
  'akproduccionessalto@gmail.com';
const SCRYPT_SALT_LEN = 16;
const SCRYPT_KEY_LEN = 64;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const MAX_FAILED_RECOVERY_ATTEMPTS = 5;
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
const RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const RESET_REQUEST_WINDOW_LIMIT = 5;
const BACKUP_CODE_COUNT = 8;

type SecurityQuestionKey = 'q1' | 'q2' | 'q3';

type SecurityQuestionConfig = {
  question: string;
  answerHash: string;
};

type BackupRecoveryCode = {
  hash: string;
  createdAt: string;
  usedAt?: string;
};

type SimpleAuthConfig = {
  password?: string;
  passwordHash?: string;
  recoveryEmail?: string;
  securityQuestions?: Partial<Record<SecurityQuestionKey, SecurityQuestionConfig>>;
  backupCodes?: BackupRecoveryCode[];
  resetCodeHash?: string;
  resetCodeExpiresAt?: string;
  resetCodeRequestedAt?: string;
  resetCodeRequestWindowStart?: string;
  resetCodeRequestCount?: number;
  failedLoginCount?: number;
  loginLockedUntil?: string;
  lastFailedLoginAt?: string;
  recoveryFailedCount?: number;
  recoveryLockedUntil?: string;
  lastRecoveryFailedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastSuccessfulRecoveryAt?: string;
  lastEmergencyLoginAt?: string;
  passwordChangedAt?: string;
  recoveryUpdatedAt?: string;
  updatedAt?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getRecoveryEmail(config: SimpleAuthConfig | null) {
  return normalizeEmail(config?.recoveryEmail || DEFAULT_RECOVERY_EMAIL);
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function normalizeBackupCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isEmergencyPassword(password: string) {
  return process.env.AK_DISABLE_EMERGENCY_PASSWORD !== 'true' && password === HARDCODED_PASSWORD;
}

function getActiveLockMessage(lockUntil?: string, reason = 'Por seguridad, espera') {
  if (!lockUntil) return undefined;
  const until = new Date(lockUntil).getTime();
  if (!Number.isFinite(until) || until <= Date.now()) return undefined;
  const minutes = Math.max(1, Math.ceil((until - Date.now()) / 60000));
  return `${reason} ${minutes} minuto(s) antes de volver a intentar.`;
}

function validateNewPassword(newPassword: string) {
  if (newPassword.length < 10) {
    return 'La nueva contrasena debe tener al menos 10 caracteres.';
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return 'La nueva contrasena debe combinar letras y numeros.';
  }
  return undefined;
}

function hashValue(value: string) {
  const salt = crypto.randomBytes(SCRYPT_SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(value, salt, SCRYPT_KEY_LEN).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyHash(value: string, stored?: string) {
  if (!stored) return false;
  if (stored.startsWith('scrypt:')) {
    const [, salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    try {
      const derived = crypto.scryptSync(value, salt, SCRYPT_KEY_LEN).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    } catch {
      return false;
    }
  }

  const legacySha = crypto.createHash('sha256').update(value).digest('hex');
  return stored === legacySha;
}

function createResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function createBackupCode() {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

async function getAuthDoc() {
  if (!dbAdmin) return null;
  const doc = await dbAdmin.collection(AUTH_COLLECTION).doc(AUTH_DOC_ID).get();
  return doc.exists ? (doc.data() as SimpleAuthConfig) : null;
}

async function saveAuthConfig(config: Partial<SimpleAuthConfig>) {
  if (!dbAdmin) {
    return { success: false, error: 'Base de datos no disponible.' };
  }

  await dbAdmin.collection(AUTH_COLLECTION).doc(AUTH_DOC_ID).set(
    {
      ...config,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { success: true };
}

async function ensurePasswordHash(config: SimpleAuthConfig | null, plainPassword: string) {
  if (!dbAdmin) return;
  if (config?.passwordHash) return;
  if (config?.password && config.password === plainPassword) {
    await saveAuthConfig({ passwordHash: hashValue(plainPassword), password: '' });
  }
}

async function registerFailedLogin(config: SimpleAuthConfig | null) {
  const count = (config?.failedLoginCount || 0) + 1;
  const patch: Partial<SimpleAuthConfig> = {
    failedLoginCount: count,
    lastFailedLoginAt: new Date().toISOString(),
  };

  if (count >= MAX_FAILED_LOGIN_ATTEMPTS) {
    patch.loginLockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
  }

  await saveAuthConfig(patch).catch(() => undefined);
  return patch.loginLockedUntil
    ? 'Hubo demasiados intentos. El acceso queda pausado 15 minutos.'
    : 'Contrasena incorrecta.';
}

async function clearLoginProtection(extra?: Partial<SimpleAuthConfig>) {
  await saveAuthConfig({
    failedLoginCount: 0,
    loginLockedUntil: '',
    lastSuccessfulLoginAt: new Date().toISOString(),
    ...extra,
  }).catch(() => undefined);
}

async function registerFailedRecovery(config: SimpleAuthConfig | null) {
  const count = (config?.recoveryFailedCount || 0) + 1;
  const patch: Partial<SimpleAuthConfig> = {
    recoveryFailedCount: count,
    lastRecoveryFailedAt: new Date().toISOString(),
  };

  if (count >= MAX_FAILED_RECOVERY_ATTEMPTS) {
    patch.recoveryLockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
  }

  await saveAuthConfig(patch).catch(() => undefined);
  return patch.recoveryLockedUntil
    ? 'Hubo demasiados intentos de recuperacion. Espera 15 minutos.'
    : 'Los datos de recuperacion no son correctos.';
}

async function clearRecoveryProtection(extra?: Partial<SimpleAuthConfig>) {
  return saveAuthConfig({
    recoveryFailedCount: 0,
    recoveryLockedUntil: '',
    lastSuccessfulRecoveryAt: new Date().toISOString(),
    ...extra,
  }).catch(() => ({ success: false, error: 'No se pudo guardar la recuperacion.' }));
}

function getResetRequestPatch(config: SimpleAuthConfig | null): { patch?: Partial<SimpleAuthConfig>; error?: string } {
  const now = Date.now();
  const lastRequest = config?.resetCodeRequestedAt ? new Date(config.resetCodeRequestedAt).getTime() : 0;
  if (Number.isFinite(lastRequest) && now - lastRequest < RESET_REQUEST_COOLDOWN_MS) {
    return { error: 'Espera un minuto antes de pedir otro codigo.' };
  }

  const windowStart = config?.resetCodeRequestWindowStart ? new Date(config.resetCodeRequestWindowStart).getTime() : 0;
  const isSameWindow = Number.isFinite(windowStart) && now - windowStart < RESET_REQUEST_WINDOW_MS;
  const currentCount = isSameWindow ? config?.resetCodeRequestCount || 0 : 0;
  if (currentCount >= RESET_REQUEST_WINDOW_LIMIT) {
    return { error: 'Ya se pidieron demasiados codigos en la ultima hora.' };
  }

  return {
    patch: {
      resetCodeRequestedAt: new Date(now).toISOString(),
      resetCodeRequestWindowStart: isSameWindow ? config?.resetCodeRequestWindowStart : new Date(now).toISOString(),
      resetCodeRequestCount: currentCount + 1,
    },
  };
}

async function getConnectedCompanyGoogleAccount() {
  const accounts = await readData<GoogleWorkspaceAccount[]>(GOOGLE_ACCOUNTS_FILE, []);
  const company = accounts.find((account) => account.kind === 'company');
  if (!company) return undefined;
  const fresh = await ensureFreshGoogleAccount(company).catch(() => undefined);
  if (fresh) {
    await writeData(
      GOOGLE_ACCOUNTS_FILE,
      accounts.map((account) => (account.id === fresh.id ? fresh : account))
    ).catch(() => undefined);
  }
  if (!fresh || fresh.status !== 'connected' || !fresh.accessToken) return undefined;
  return fresh;
}

async function getCompanyGoogleAccountStatus() {
  const accounts = await readData<GoogleWorkspaceAccount[]>(GOOGLE_ACCOUNTS_FILE, []);
  const company = accounts.find((account) => account.kind === 'company');
  if (!company) {
    return { connected: false, email: undefined as string | undefined, reason: 'No hay cuenta Gmail de AK conectada.' };
  }

  const fresh = await ensureFreshGoogleAccount(company).catch(() => undefined);
  if (fresh) {
    await writeData(
      GOOGLE_ACCOUNTS_FILE,
      accounts.map((account) => (account.id === fresh.id ? fresh : account))
    ).catch(() => undefined);
  }

  const account = fresh || company;
  return {
    connected: account.status === 'connected' && Boolean(account.accessToken),
    email: account.email,
    reason: account.status === 'connected'
      ? undefined
      : account.lastError || 'La cuenta Gmail de AK necesita volver a conectarse.',
  };
}

async function sendSecurityEmail(to: string, code: string) {
  const account = await getConnectedCompanyGoogleAccount();
  if (!account) {
    return { sent: false, warning: 'Google Workspace no esta conectado. El codigo quedo generado, pero no se pudo enviar mail.' };
  }

  await sendGoogleGmailMessage(
    account,
    to,
    'AK Producciones - Codigo para recuperar acceso',
    `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="color:#b91c1c;margin-bottom:8px">Codigo de recuperacion AK</h2>
        <p>Usa este codigo para cambiar la contrasena de acceso a la app:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p>
        <p>El codigo vence en 15 minutos. Si no lo pediste vos, ignora este mensaje.</p>
      </div>
    `
  );
  return { sent: true };
}

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getAuthDoc();
    const emergencyLogin = isEmergencyPassword(password);
    const hasConfiguredPassword = Boolean(config?.passwordHash || config?.password);

    if (verifyHash(password, config?.passwordHash)) {
      await clearLoginProtection();
      return { success: true };
    }

    if (config?.password && password === config.password) {
      await ensurePasswordHash(config, password);
      await clearLoginProtection();
      return { success: true };
    }

    if (emergencyLogin && !hasConfiguredPassword) {
      await clearLoginProtection({ lastEmergencyLoginAt: new Date().toISOString() });
      return { success: true };
    }

    const lockMessage = getActiveLockMessage(config?.loginLockedUntil, 'Hubo muchos intentos incorrectos. Espera');
    if (lockMessage) {
      return { success: false, error: lockMessage };
    }

    return { success: false, error: await registerFailedLogin(config) };
  } catch (err) {
    console.error('[simple-auth] verifyPassword error:', err);
    return { success: isEmergencyPassword(password) };
  }
}

export async function changeAppPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const verify = await verifyPassword(currentPassword);
  if (!verify.success) {
    return { success: false, error: 'La contraseña actual es incorrecta.' };
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) return { success: false, error: passwordError };

  try {
    return await saveAuthConfig({
      passwordHash: hashValue(newPassword),
      password: '',
      resetCodeHash: '',
      resetCodeExpiresAt: '',
      failedLoginCount: 0,
      loginLockedUntil: '',
      recoveryFailedCount: 0,
      recoveryLockedUntil: '',
      passwordChangedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[simple-auth] changeAppPassword error:', err);
    return { success: false, error: 'Error al cambiar la contraseña.' };
  }
}

export async function saveSecurityRecoverySettings(input: {
  currentPassword: string;
  recoveryEmail: string;
  questions: Record<SecurityQuestionKey, { question: string; answer: string }>;
}): Promise<{ success: boolean; error?: string }> {
  const verify = await verifyPassword(input.currentPassword);
  if (!verify.success) return { success: false, error: 'La contraseña actual es incorrecta.' };

  const recoveryEmail = normalizeEmail(input.recoveryEmail);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recoveryEmail)) {
    return { success: false, error: 'El mail de recuperacion no es valido.' };
  }

  const questions = input.questions;
  const entries = (['q1', 'q2', 'q3'] as const).map((key) => [key, questions[key]] as const);
  if (entries.some(([, item]) => !item.question.trim() || !item.answer.trim())) {
    return { success: false, error: 'Completa las 3 preguntas y sus respuestas.' };
  }

  return saveAuthConfig({
    recoveryEmail,
    recoveryUpdatedAt: new Date().toISOString(),
    recoveryFailedCount: 0,
    recoveryLockedUntil: '',
    securityQuestions: {
      q1: { question: questions.q1.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q1.answer)) },
      q2: { question: questions.q2.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q2.answer)) },
      q3: { question: questions.q3.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q3.answer)) },
    },
  });
}

export async function generateBackupRecoveryCodes(currentPassword: string): Promise<{ success: boolean; codes?: string[]; error?: string }> {
  const verify = await verifyPassword(currentPassword);
  if (!verify.success) return { success: false, error: 'La contrasena actual es incorrecta.' };

  const now = new Date().toISOString();
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, createBackupCode);
  const backupCodes = codes.map((code) => ({
    hash: hashValue(normalizeBackupCode(code)),
    createdAt: now,
  }));

  const result = await saveAuthConfig({
    backupCodes,
    recoveryUpdatedAt: now,
    recoveryFailedCount: 0,
    recoveryLockedUntil: '',
  });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudieron generar los codigos.' };
  }

  return { success: true, codes };
}

export async function getPublicSecurityRecoveryStatus(): Promise<{
  hasRecoveryEmail: boolean;
  hasSecurityQuestions: boolean;
  hasBackupCodes: boolean;
  backupCodeCount: number;
  gmailConnected: boolean;
  gmailAccountHint?: string;
  gmailWarning?: string;
  recoveryEmailHint?: string;
  questions?: Record<SecurityQuestionKey, string>;
}> {
  const config = await getAuthDoc().catch(() => null);
  const email = getRecoveryEmail(config);
  const gmail = await getCompanyGoogleAccountStatus().catch(() => ({
    connected: false,
    email: undefined,
    reason: 'No se pudo verificar la conexion con Gmail.',
  }));
  const sq = config?.securityQuestions || {};
  const mask = email ? email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : undefined;
  const gmailMask = gmail.email ? gmail.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : undefined;
  const hasSecurityQuestions = Boolean(sq.q1?.question && sq.q2?.question && sq.q3?.question);
  const backupCodeCount = (config?.backupCodes || []).filter((code) => !code.usedAt).length;

  return {
    hasRecoveryEmail: Boolean(email),
    hasSecurityQuestions,
    hasBackupCodes: backupCodeCount > 0,
    backupCodeCount,
    gmailConnected: gmail.connected,
    gmailAccountHint: gmailMask,
    gmailWarning: gmail.connected ? undefined : gmail.reason,
    recoveryEmailHint: mask,
    questions: hasSecurityQuestions
      ? {
          q1: sq.q1!.question,
          q2: sq.q2!.question,
          q3: sq.q3!.question,
        }
      : undefined,
  };
}

export async function requestPasswordResetEmail(): Promise<{ success: boolean; sent?: boolean; warning?: string; error?: string }> {
  try {
    const config = await getAuthDoc();
    const recoveryEmail = getRecoveryEmail(config);

    const rateLimit = getResetRequestPatch(config);
    if (rateLimit.error) return { success: false, error: rateLimit.error };

    const gmail = await getCompanyGoogleAccountStatus();
    if (!gmail.connected) {
      return {
        success: false,
        error: `${gmail.reason || 'Gmail no esta conectado.'} Conecta la cuenta en Ajustes > Google Workspace para enviar codigos de recuperacion.`,
      };
    }

    const code = createResetCode();
    const saveResult = await saveAuthConfig({
      resetCodeHash: hashValue(code),
      resetCodeExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS).toISOString(),
      ...rateLimit.patch,
    });
    if (!saveResult.success) {
      return { success: false, error: saveResult.error || 'No se pudo guardar el codigo de recuperacion.' };
    }

    const mail = await sendSecurityEmail(recoveryEmail, code);
    return { success: true, sent: mail.sent, warning: mail.warning };
  } catch (err) {
    console.error('[simple-auth] requestPasswordResetEmail error:', err);
    return { success: false, error: 'No se pudo generar el codigo de recuperacion.' };
  }
}

export async function resetPasswordWithCode(code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const config = await getAuthDoc().catch(() => null);
  const recoveryLock = getActiveLockMessage(config?.recoveryLockedUntil, 'Hubo muchos intentos de recuperacion. Espera');
  if (recoveryLock) return { success: false, error: recoveryLock };

  if (!config?.resetCodeHash || !config.resetCodeExpiresAt) {
    return { success: false, error: 'No hay codigo de recuperacion activo.' };
  }
  if (new Date(config.resetCodeExpiresAt).getTime() < Date.now()) {
    return { success: false, error: 'El codigo vencio. Pedi uno nuevo.' };
  }
  if (!verifyHash(code.trim(), config.resetCodeHash)) {
    return { success: false, error: await registerFailedRecovery(config) };
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) return { success: false, error: passwordError };

  const result = await clearRecoveryProtection({
    passwordHash: hashValue(newPassword),
    password: '',
    resetCodeHash: '',
    resetCodeExpiresAt: '',
    failedLoginCount: 0,
    loginLockedUntil: '',
    passwordChangedAt: new Date().toISOString(),
  });

  return result.success ? { success: true } : { success: false, error: result.error };
}

export async function resetPasswordWithSecurityAnswers(input: {
  answers: Record<SecurityQuestionKey, string>;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = await getAuthDoc().catch(() => null);
  const recoveryLock = getActiveLockMessage(config?.recoveryLockedUntil, 'Hubo muchos intentos de recuperacion. Espera');
  if (recoveryLock) return { success: false, error: recoveryLock };

  const sq = config?.securityQuestions || {};
  if (!sq.q1?.answerHash || !sq.q2?.answerHash || !sq.q3?.answerHash) {
    return { success: false, error: 'No hay preguntas de seguridad configuradas.' };
  }
  const valid =
    verifyHash(normalizeAnswer(input.answers.q1), sq.q1.answerHash) &&
    verifyHash(normalizeAnswer(input.answers.q2), sq.q2.answerHash) &&
    verifyHash(normalizeAnswer(input.answers.q3), sq.q3.answerHash);

  if (!valid) return { success: false, error: await registerFailedRecovery(config) };

  const passwordError = validateNewPassword(input.newPassword);
  if (passwordError) return { success: false, error: passwordError };

  const result = await clearRecoveryProtection({
    passwordHash: hashValue(input.newPassword),
    password: '',
    resetCodeHash: '',
    resetCodeExpiresAt: '',
    failedLoginCount: 0,
    loginLockedUntil: '',
    passwordChangedAt: new Date().toISOString(),
  });

  return result.success ? { success: true } : { success: false, error: result.error };
}

export async function resetPasswordWithRecoveryCode(
  recoveryCode: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const config = await getAuthDoc().catch(() => null);
  const recoveryLock = getActiveLockMessage(config?.recoveryLockedUntil, 'Hubo muchos intentos de recuperacion. Espera');
  if (recoveryLock) return { success: false, error: recoveryLock };

  const normalizedCode = normalizeBackupCode(recoveryCode);
  if (!normalizedCode) {
    return { success: false, error: 'Ingresa un codigo de respaldo.' };
  }

  const backupCodes = config?.backupCodes || [];
  const matchIndex = backupCodes.findIndex((item) => !item.usedAt && verifyHash(normalizedCode, item.hash));
  if (matchIndex < 0) {
    return { success: false, error: await registerFailedRecovery(config) };
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) return { success: false, error: passwordError };

  const now = new Date().toISOString();
  const updatedCodes = backupCodes.map((item, index) => (
    index === matchIndex ? { ...item, usedAt: now } : item
  ));

  const result = await clearRecoveryProtection({
    passwordHash: hashValue(newPassword),
    password: '',
    backupCodes: updatedCodes,
    resetCodeHash: '',
    resetCodeExpiresAt: '',
    failedLoginCount: 0,
    loginLockedUntil: '',
    passwordChangedAt: now,
  });

  return result.success ? { success: true } : { success: false, error: result.error };
}
