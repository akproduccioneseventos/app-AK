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
const SCRYPT_SALT_LEN = 16;
const SCRYPT_KEY_LEN = 64;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

type SecurityQuestionKey = 'q1' | 'q2' | 'q3';

type SecurityQuestionConfig = {
  question: string;
  answerHash: string;
};

type SimpleAuthConfig = {
  password?: string;
  passwordHash?: string;
  recoveryEmail?: string;
  securityQuestions?: Partial<Record<SecurityQuestionKey, SecurityQuestionConfig>>;
  resetCodeHash?: string;
  resetCodeExpiresAt?: string;
  updatedAt?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function isEmergencyPassword(password: string) {
  return process.env.AK_DISABLE_EMERGENCY_PASSWORD !== 'true' && password === HARDCODED_PASSWORD;
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

async function getConnectedCompanyGoogleAccount() {
  const accounts = await readData<GoogleWorkspaceAccount[]>(GOOGLE_ACCOUNTS_FILE, []);
  const company = accounts.find((account) => account.kind === 'company');
  if (!company) return undefined;
  const fresh = await ensureFreshGoogleAccount(company).catch(() => undefined);
  if (!fresh || fresh.status !== 'connected' || !fresh.accessToken) return undefined;
  await writeData(
    GOOGLE_ACCOUNTS_FILE,
    accounts.map((account) => (account.id === fresh.id ? fresh : account))
  ).catch(() => undefined);
  return fresh;
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

    if (verifyHash(password, config?.passwordHash)) {
      return { success: true };
    }

    if (config?.password && password === config.password) {
      await ensurePasswordHash(config, password);
      return { success: true };
    }

    if (isEmergencyPassword(password)) {
      return { success: true };
    }

    return { success: false };
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

  if (newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  try {
    return await saveAuthConfig({
      passwordHash: hashValue(newPassword),
      password: '',
      resetCodeHash: '',
      resetCodeExpiresAt: '',
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
    securityQuestions: {
      q1: { question: questions.q1.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q1.answer)) },
      q2: { question: questions.q2.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q2.answer)) },
      q3: { question: questions.q3.question.trim(), answerHash: hashValue(normalizeAnswer(questions.q3.answer)) },
    },
  });
}

export async function getPublicSecurityRecoveryStatus(): Promise<{
  hasRecoveryEmail: boolean;
  hasSecurityQuestions: boolean;
  recoveryEmailHint?: string;
  questions?: Record<SecurityQuestionKey, string>;
}> {
  const config = await getAuthDoc().catch(() => null);
  const email = config?.recoveryEmail;
  const sq = config?.securityQuestions || {};
  const mask = email ? email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : undefined;
  const hasSecurityQuestions = Boolean(sq.q1?.question && sq.q2?.question && sq.q3?.question);

  return {
    hasRecoveryEmail: Boolean(email),
    hasSecurityQuestions,
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
    if (!config?.recoveryEmail) {
      return { success: false, error: 'No hay mail de recuperacion configurado. Usa la contraseña actual o configura recuperacion en Seguridad y Cuenta.' };
    }

    const code = createResetCode();
    await saveAuthConfig({
      resetCodeHash: hashValue(code),
      resetCodeExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS).toISOString(),
    });

    const mail = await sendSecurityEmail(config.recoveryEmail, code);
    return { success: true, sent: mail.sent, warning: mail.warning };
  } catch (err) {
    console.error('[simple-auth] requestPasswordResetEmail error:', err);
    return { success: false, error: 'No se pudo generar el codigo de recuperacion.' };
  }
}

export async function resetPasswordWithCode(code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const config = await getAuthDoc().catch(() => null);
  if (!config?.resetCodeHash || !config.resetCodeExpiresAt) {
    return { success: false, error: 'No hay codigo de recuperacion activo.' };
  }
  if (new Date(config.resetCodeExpiresAt).getTime() < Date.now()) {
    return { success: false, error: 'El codigo vencio. Pedi uno nuevo.' };
  }
  if (!verifyHash(code.trim(), config.resetCodeHash)) {
    return { success: false, error: 'El codigo no es correcto.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }
  return saveAuthConfig({
    passwordHash: hashValue(newPassword),
    password: '',
    resetCodeHash: '',
    resetCodeExpiresAt: '',
  });
}

export async function resetPasswordWithSecurityAnswers(input: {
  answers: Record<SecurityQuestionKey, string>;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = await getAuthDoc().catch(() => null);
  const sq = config?.securityQuestions || {};
  if (!sq.q1?.answerHash || !sq.q2?.answerHash || !sq.q3?.answerHash) {
    return { success: false, error: 'No hay preguntas de seguridad configuradas.' };
  }
  const valid =
    verifyHash(normalizeAnswer(input.answers.q1), sq.q1.answerHash) &&
    verifyHash(normalizeAnswer(input.answers.q2), sq.q2.answerHash) &&
    verifyHash(normalizeAnswer(input.answers.q3), sq.q3.answerHash);

  if (!valid) return { success: false, error: 'Una o mas respuestas no son correctas.' };
  if (input.newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  return saveAuthConfig({
    passwordHash: hashValue(input.newPassword),
    password: '',
    resetCodeHash: '',
    resetCodeExpiresAt: '',
  });
}
