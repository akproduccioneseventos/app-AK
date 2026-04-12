'use server';

// src/app/actions/auth.ts
// Server actions for the custom authentication system.
// Passwords are hashed with scrypt (salt:hash format).
// Security question answers are hashed the same way.

import crypto from 'crypto';
import { dbAdmin } from '@/lib/firebase/server';

// ── Constants ──────────────────────────────────────────────────────────────

const SCRYPT_SALT_LEN = 16;
const SCRYPT_KEY_LEN = 64;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Hashes a value using scrypt with a random salt.
 * Output format: "scrypt:<salt_hex>:<hash_hex>"
 */
function hashValue(value: string): string {
  const salt = crypto.randomBytes(SCRYPT_SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(value, salt, SCRYPT_KEY_LEN).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verifies a plain-text value against a stored hash.
 * Supports both:
 *   - New format: "scrypt:<salt>:<hash>"
 *   - Legacy format: plain SHA-256 hex (for any records created before migration)
 */
function verifyValue(value: string, stored: string): boolean {
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    try {
      const derived = crypto.scryptSync(value, salt, SCRYPT_KEY_LEN).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    } catch {
      return false;
    }
  }
  // Legacy SHA-256 fallback (no salt) for existing records.
  const legacyHash = crypto.createHash('sha256').update(value).digest('hex');
  return legacyHash === stored;
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SecurityQuestion {
  question: string;
  answer: string; // stored as scrypt:<salt>:<hash>
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  modules: string[];
  securityQuestions: {
    q1?: SecurityQuestion;
    q2?: SecurityQuestion;
    q3?: SecurityQuestion;
  };
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserRecord {
  id: string;
  email: string;
  role: 'admin' | 'user';
  modules: string[];
  mustChangePassword?: boolean;
  hasSecurityQuestions: boolean;
  createdAt: string;
}

// ── Admin bootstrap ────────────────────────────────────────────────────────

/**
 * Creates the default admin account if no users exist yet in Firestore.
 * Called on every login attempt so it triggers automatically on first use.
 */
export async function initializeAdminIfNeeded(): Promise<void> {
  if (!dbAdmin) return;

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!bootstrapEmail || !bootstrapPassword) {
    console.error('[auth] ADMIN_BOOTSTRAP_EMAIL y/o ADMIN_BOOTSTRAP_PASSWORD no están configuradas.');
    return;
  }

  try {
    const snapshot = await dbAdmin.collection('users').limit(1).get();
    if (!snapshot.empty) return;

    await dbAdmin.collection('users').add({
      email: bootstrapEmail,
      passwordHash: hashValue(bootstrapPassword),
      role: 'admin',
      modules: ['all'],
      securityQuestions: {},
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[auth] initializeAdminIfNeeded error:', err);
  }
}

// ── Login ──────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    modules: string[];
    mustChangePassword?: boolean;
  };
  error?: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  // Auto-create admin on first use.
  await initializeAdminIfNeeded();

  try {
    const snapshot = await dbAdmin
      .collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (!verifyValue(password, data.passwordHash)) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    return {
      success: true,
      user: {
        id: doc.id,
        email: data.email,
        role: data.role,
        modules: data.modules,
        mustChangePassword: data.mustChangePassword ?? false,
      },
    };
  } catch (err) {
    console.error('[auth] loginUser error:', err);
    return { success: false, error: 'Error al iniciar sesión. Intentá de nuevo.' };
  }
}

// ── Password recovery ──────────────────────────────────────────────────────

export interface SecurityQuestionsResult {
  success: boolean;
  questions?: { q1: string; q2: string; q3: string };
  /** True when the user has no security questions set — show a hint about the default password. */
  noQuestionsConfigured?: boolean;
  error?: string;
}

/**
 * Returns the 3 security question texts for a given email (answers not included).
 */
export async function getSecurityQuestions(
  email: string
): Promise<SecurityQuestionsResult> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const snapshot = await dbAdmin
      .collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'No se encontró ningún usuario con ese correo.' };
    }

    const data = snapshot.docs[0].data();
    const sq = data.securityQuestions ?? {};

    if (!sq.q1?.question || !sq.q2?.question || !sq.q3?.question) {
      return {
        success: false,
        noQuestionsConfigured: true,
        error:
          'Este usuario no tiene preguntas de seguridad configuradas. ' +
          'Contactá al administrador para que restablezca tu contraseña.',
      };
    }

    return {
      success: true,
      questions: {
        q1: sq.q1.question,
        q2: sq.q2.question,
        q3: sq.q3.question,
      },
    };
  } catch (err) {
    console.error('[auth] getSecurityQuestions error:', err);
    return { success: false, error: 'Error al obtener las preguntas.' };
  }
}

/**
 * Verifies the 3 security answers and, if correct, resets the user's password.
 */
export async function resetPasswordWithQuestions(
  email: string,
  answers: { a1: string; a2: string; a3: string },
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const snapshot = await dbAdmin
      .collection('users')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const sq = data.securityQuestions ?? {};

    if (!sq.q1?.answer || !sq.q2?.answer || !sq.q3?.answer) {
      return {
        success: false,
        error:
          'Este usuario no tiene preguntas de seguridad configuradas. ' +
          'Contactá al administrador para que restablezca tu contraseña.',
      };
    }

    const a1 = normalizeAnswer(answers.a1);
    const a2 = normalizeAnswer(answers.a2);
    const a3 = normalizeAnswer(answers.a3);

    if (
      !verifyValue(a1, sq.q1.answer) ||
      !verifyValue(a2, sq.q2.answer) ||
      !verifyValue(a3, sq.q3.answer)
    ) {
      return { success: false, error: 'Una o más respuestas son incorrectas.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    await doc.ref.update({
      passwordHash: hashValue(newPassword),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error('[auth] resetPasswordWithQuestions error:', err);
    return { success: false, error: 'Error al restablecer la contraseña.' };
  }
}

// ── Change password ────────────────────────────────────────────────────────

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const docRef = dbAdmin.collection('users').doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const data = docSnap.data()!;

    if (!verifyValue(currentPassword, data.passwordHash)) {
      return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }

    await docRef.update({
      passwordHash: hashValue(newPassword),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error('[auth] changePassword error:', err);
    return { success: false, error: 'Error al cambiar la contraseña.' };
  }
}

// ── Security questions management ─────────────────────────────────────────

export const SECURITY_QUESTIONS = [
  '¿Nombre de tu primera mascota?',
  '¿Tu color favorito?',
  '¿Nombre de tu escuela?',
] as const;

export async function updateSecurityQuestions(
  userId: string,
  questions: {
    q1: { question: string; answer: string };
    q2: { question: string; answer: string };
    q3: { question: string; answer: string };
  }
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const docRef = dbAdmin.collection('users').doc(userId);

    await docRef.update({
      securityQuestions: {
        q1: { question: questions.q1.question, answer: hashValue(normalizeAnswer(questions.q1.answer)) },
        q2: { question: questions.q2.question, answer: hashValue(normalizeAnswer(questions.q2.answer)) },
        q3: { question: questions.q3.question, answer: hashValue(normalizeAnswer(questions.q3.answer)) },
      },
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error('[auth] updateSecurityQuestions error:', err);
    return { success: false, error: 'Error al guardar las preguntas de seguridad.' };
  }
}

export async function getUserSecurityQuestionsForEdit(
  userId: string
): Promise<{
  success: boolean;
  data?: { q1: string; q2: string; q3: string };
  error?: string;
}> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const docSnap = await dbAdmin.collection('users').doc(userId).get();
    if (!docSnap.exists) return { success: false, error: 'Usuario no encontrado.' };

    const sq = docSnap.data()?.securityQuestions ?? {};
    return {
      success: true,
      data: {
        q1: sq.q1?.question ?? '',
        q2: sq.q2?.question ?? '',
        q3: sq.q3?.question ?? '',
      },
    };
  } catch (err) {
    console.error('[auth] getUserSecurityQuestionsForEdit error:', err);
    return { success: false, error: 'Error al obtener preguntas.' };
  }
}

// ── User management (admin) ────────────────────────────────────────────────

export async function listUsers(): Promise<{
  success: boolean;
  users?: PublicUserRecord[];
  error?: string;
}> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const snapshot = await dbAdmin
      .collection('users')
      .orderBy('createdAt', 'asc')
      .get();

    const users: PublicUserRecord[] = snapshot.docs.map((doc: any) => {
      const d = doc.data();
      const sq = d.securityQuestions ?? {};
      return {
        id: doc.id,
        email: d.email,
        role: d.role,
        modules: d.modules,
        mustChangePassword: d.mustChangePassword ?? false,
        hasSecurityQuestions: !!(sq.q1?.answer && sq.q2?.answer && sq.q3?.answer),
        createdAt: d.createdAt,
      };
    });

    return { success: true, users };
  } catch (err) {
    console.error('[auth] listUsers error:', err);
    return { success: false, error: 'Error al obtener usuarios.' };
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  role: 'admin' | 'user';
  modules: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    const email = data.email.trim().toLowerCase();

    // Check uniqueness
    const existing = await dbAdmin
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existing.empty) {
      return { success: false, error: 'Ya existe un usuario con ese correo.' };
    }

    if (data.password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    const docRef = await dbAdmin.collection('users').add({
      email,
      passwordHash: hashValue(data.password),
      role: data.role,
      modules: data.modules,
      securityQuestions: {},
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('[auth] createUser error:', err);
    return { success: false, error: 'Error al crear el usuario.' };
  }
}

export async function updateUserModules(
  userId: string,
  modules: string[],
  role: 'admin' | 'user'
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    await dbAdmin.collection('users').doc(userId).update({
      modules,
      role,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    console.error('[auth] updateUserModules error:', err);
    return { success: false, error: 'Error al actualizar permisos.' };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    await dbAdmin.collection('users').doc(userId).delete();
    return { success: true };
  } catch (err) {
    console.error('[auth] deleteUser error:', err);
    return { success: false, error: 'Error al eliminar el usuario.' };
  }
}

export async function adminResetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  try {
    if (newPassword.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    await dbAdmin.collection('users').doc(userId).update({
      passwordHash: hashValue(newPassword),
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error('[auth] adminResetUserPassword error:', err);
    return { success: false, error: 'Error al restablecer la contraseña.' };
  }
}
