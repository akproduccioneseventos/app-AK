'use server';

// src/app/actions/auth.ts
// Server actions for the custom authentication system.
// All password and security-question answers are hashed with SHA-256.

import crypto from 'crypto';
import { dbAdmin } from '@/lib/firebase/server';

// ── Helpers ────────────────────────────────────────────────────────────────

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SecurityQuestion {
  question: string;
  answer: string; // stored hashed
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

  try {
    const snapshot = await dbAdmin.collection('users').limit(1).get();
    if (!snapshot.empty) return;

    await dbAdmin.collection('users').add({
      email: 'akproduccionessalto@gmail.com',
      passwordHash: hashValue('AKproducciones2024'),
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
    const passwordHash = hashValue(password);
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

    if (data.passwordHash !== passwordHash) {
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
        error: 'Este usuario no tiene preguntas de seguridad configuradas. Contactá al administrador.',
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
        error: 'Este usuario no tiene preguntas de seguridad configuradas.',
      };
    }

    const a1Hash = hashValue(normalizeAnswer(answers.a1));
    const a2Hash = hashValue(normalizeAnswer(answers.a2));
    const a3Hash = hashValue(normalizeAnswer(answers.a3));

    if (
      sq.q1.answer !== a1Hash ||
      sq.q2.answer !== a2Hash ||
      sq.q3.answer !== a3Hash
    ) {
      return { success: false, error: 'Una o más respuestas son incorrectas.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
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

    if (data.passwordHash !== hashValue(currentPassword)) {
      return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
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

    if (data.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
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
    if (newPassword.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
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
