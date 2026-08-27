'use server';

// src/app/actions/auth.ts
// Server actions for the custom authentication system.
// Passwords are hashed with scrypt (salt:hash format).
// Security question answers are hashed the same way.

import crypto from 'crypto';
import { dbAdmin } from '@/lib/firebase/server';
import { verifySession, writeSessionCookie } from '@/lib/auth/session-token';
import { esPerfilValido, perfilDesdeRolViejo, type Perfil } from '@/lib/auth/perfiles';

import { requireAppSession } from '@/lib/auth/require-session';
import { diagnosticarAcceso, type DiagnosticoAcceso } from '@/lib/auth/diagnostico-acceso';
// ── Constants ──────────────────────────────────────────────────────────────

const SCRYPT_SALT_LEN = 16;
const SCRYPT_KEY_LEN = 64;

/**
 * Cuanto se espera a la base de datos antes de dar la respuesta por perdida.
 *
 * **Paso de verdad: el dueno no pudo entrar a su app y el boton parecia no hacer nada.**
 * Probado con un navegador de verdad: al tocar "Ingresar", la pantalla se quedaba
 * **veinticinco segundos** diciendo "Ingresando...", y recien ahi contestaba "Error al
 * iniciar sesion. Intenta de nuevo." Nadie espera veinticinco segundos: se toca de nuevo,
 * se cierra, se concluye que el boton esta roto.
 *
 * El problema no era la clave ni el boton: la consulta a la base **quedaba colgada**. Sin
 * tope propio se arrastraba hasta el limite del navegador.
 *
 * Ocho segundos alcanzan de sobra: una consulta que anda contesta en menos de uno, incluso
 * con el servidor recien despierto. Si a los ocho no contesto, no va a contestar.
 */
const TOPE_BASE_MS = 8000;

class BaseSinRespuesta extends Error {
  // Se marca con una propiedad ademas del tipo. `instanceof` puede fallar cuando el
  // empaquetador deja dos copias del modulo; una propiedad sobrevive siempre.
  readonly esBaseCaida = true;
}

/**
 * Reconoce que la base fue el problema, venga el fallo de nuestro reloj o de la
 * propia libreria de Firestore (que avisa con UNAVAILABLE, DEADLINE_EXCEEDED o un
 * fallo de red). En todos esos casos la clave del usuario nunca llego a compararse,
 * asi que decirle "contrasena incorrecta" seria mentirle.
 */
function laBaseNoContesto(err: unknown): boolean {
  if (err && typeof err === 'object' && 'esBaseCaida' in err) return true;
  const texto = String((err as { code?: unknown; message?: unknown })?.code ?? '')
    + ' ' + String((err as { message?: unknown })?.message ?? '');
  return /UNAVAILABLE|DEADLINE_EXCEEDED|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|network error|Total timeout|Getting metadata from plugin failed/i
    .test(texto);
}

/** Corre la consulta contra el reloj. Si la base no contesta a tiempo, se dice. */
async function conTopeDeEspera<T>(tarea: Promise<T>, topeMs = TOPE_BASE_MS): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      tarea,
      new Promise<never>((_, rechazar) => {
        reloj = setTimeout(() => rechazar(new BaseSinRespuesta()), topeMs);
      }),
    ]);
  } finally {
    if (reloj) clearTimeout(reloj);
  }
}

/**
 * El unico mensaje que se muestra cuando la base no contesta.
 *
 * Antes decia "Error al iniciar sesion. Intenta de nuevo.", que no dice nada: el dueno
 * leia eso y creia haberse equivocado de clave. **Una pantalla no afirma algo que no
 * comprobo**, y menos si eso manda a la persona a buscar un error que no cometio.
 */
const AVISO_BASE_CAIDA =
  'No se pudo conectar con la base de datos. No es tu clave: espera un momento y volve a intentar.';

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
  /** Perfil que decide a que entra. Ver `lib/auth/perfiles`. */
  perfil?: Perfil;
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
  perfil?: Perfil;
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
// PUBLICA A PROPOSITO: la llama el propio ingreso, antes de que exista sesion.
// No pide cuenta porque todavia no hay ninguna: si ya hay usuarios se va enseguida,
// y para crear el primer administrador necesita la contrasena inicial del entorno.
export async function initializeAdminIfNeeded(): Promise<void> {
  if (!dbAdmin) return;

  try {
    const snapshot = await dbAdmin.collection('users').limit(1).get();
    if (!snapshot.empty) return;
    const initialPassword = process.env.AK_INITIAL_ADMIN_PASSWORD?.trim();
    if (!initialPassword || initialPassword.length < 10) {
      console.error('[auth] AK_INITIAL_ADMIN_PASSWORD is required to bootstrap the first admin securely.');
      return;
    }

    await dbAdmin.collection('users').add({
      email: 'akproduccionessalto@gmail.com',
      passwordHash: hashValue(initialPassword),
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
  /**
   * Cuando el intento falla, la app averigua sola cual de cuatro problemas fue y lo
   * explica en criollo. Viaja dentro de esta respuesta y no como consulta aparte: asi
   * no queda una puerta abierta que cualquiera pueda preguntar sin intentar entrar.
   */
  diagnostico?: DiagnosticoAcceso;
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
  //
  // **Tambien va contra el reloj.** Medido con un navegador: sin tope, esta llamada
  // sola se colgaba unos ocho segundos cuando la base no contestaba, y recien despues
  // empezaba la consulta de verdad. Eran dos esperas encadenadas, y el usuario las
  // sufria las dos: quince segundos mirando "Ingresando...".
  //
  // Si falla, se sigue igual: crear el primer administrador es un extra, no un
  // requisito para entrar. Quien ya tiene cuenta no depende de esto.
  // Tres segundos, no ocho: esto es un extra, no el camino de nadie que ya tiene
  // cuenta. Si se lleva ocho, se los saca de la espera del usuario para nada.
  await conTopeDeEspera(initializeAdminIfNeeded(), 3000).catch(() => undefined);

  try {
    const snapshot = await conTopeDeEspera(
      dbAdmin
        .collection('users')
        .where('email', '==', email.trim().toLowerCase())
        .limit(1)
        .get()
    );

    if (snapshot.empty) {
      // **Si no hay NINGUN usuario, decirlo.** No es lo mismo que equivocarse de
      // correo: significa que la app todavia no tiene cuentas y nadie puede entrar,
      // con la clave que sea. Pasa cuando la creacion del primer administrador no
      // llego a completarse. Decir "correo o contraseña incorrectos" ahi manda a
      // buscar una clave que no existe, y eso ya hizo perder un dia.
      //
      // No revela quien esta anotado: habla del sistema entero, no de este correo.
      const hayAlgunUsuario = await conTopeDeEspera(dbAdmin.collection('users').limit(1).get());
      if (hayAlgunUsuario.empty) {
        return {
          success: false,
          error: 'La app todavia no tiene ninguna cuenta creada. No es tu clave: hay que crear el primer usuario.',
        };
      }
      return {
        success: false,
        error: 'Correo o contraseña incorrectos.',
        diagnostico: await diagnosticarAcceso(),
      };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (!verifyValue(password, data.passwordHash)) {
      return {
        success: false,
        error: 'Correo o contraseña incorrectos.',
        diagnostico: await diagnosticarAcceso(),
      };
    }

    const user: NonNullable<LoginResult['user']> = {
      id: doc.id,
      email: data.email,
      role: data.role,
      modules: Array.isArray(data.modules) ? data.modules : [],
      mustChangePassword: data.mustChangePassword ?? false,
    };

    await writeSessionCookie({
      email: user.email,
      role: user.role,
      userId: user.id,
      // Las cuentas viejas no tienen perfil guardado: se deduce del rol para que
      // nadie quede afuera de lo que ya usaba.
      perfil: esPerfilValido(data.perfil) ? data.perfil : perfilDesdeRolViejo(data.role),
      modules: user.modules,
    });

    return {
      success: true,
      user,
    };
  } catch (err) {
    console.error('[auth] loginUser error:', err);
    // Se distingue "la base no contesta" de cualquier otro fallo. Antes los dos
    // terminaban en el mismo texto vago y el dueno creia que era su clave.
    // El diagnostico va tambien aca: es el camino que recorre el fallo mas comun
    // -la base que no contesta- y era justo el que quedaba sin explicacion.
    const diagnostico = await diagnosticarAcceso().catch(() => undefined);
    if (laBaseNoContesto(err)) {
      return { success: false, error: AVISO_BASE_CAIDA, diagnostico };
    }
    return { success: false, error: 'Error al iniciar sesión. Intentá de nuevo.', diagnostico };
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
  await requireAppSession();
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
          'Solicitá al administrador que restablezca el acceso y luego configurá tus preguntas de seguridad.',
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
          'Solicitá al administrador que restablezca el acceso.',
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

const SECURITY_QUESTIONS = [
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
  // Las preguntas de seguridad son lo que permite recuperar una cuenta. Esta
  // funcion aceptaba cualquier usuario sin comprobar nada: alguien de afuera
  // podia ponerle sus propias respuestas a la cuenta de otro y despues entrar
  // por el camino de "olvide mi clave". Cada uno cambia las suyas; el
  // administrador puede cambiar las de cualquiera.
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error ?? 'Sesion no autorizada.' };
  if (auth.user?.role !== 'admin' && auth.user?.userId !== userId) {
    return { success: false, error: 'Solo podes cambiar tus propias preguntas de seguridad.' };
  }

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
  await requireAppSession();
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

  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error || 'No autorizado' };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Acceso restringido a administradores.' };

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
        perfil: esPerfilValido(d.perfil) ? d.perfil : perfilDesdeRolViejo(d.role),
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
  /** Perfil que decide a que entra. Si no viene, se deduce del rol. */
  perfil?: Perfil;
  modules: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error || 'No autorizado' };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Acceso restringido a administradores.' };

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
      perfil: esPerfilValido(data.perfil) ? data.perfil : perfilDesdeRolViejo(data.role),
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
  role: 'admin' | 'user',
  perfil?: Perfil,
): Promise<{ success: boolean; error?: string }> {
  if (!dbAdmin) return { success: false, error: 'Base de datos no disponible.' };

  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error || 'No autorizado' };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Acceso restringido a administradores.' };

  try {
    await dbAdmin.collection('users').doc(userId).update({
      modules,
      role,
      perfil: esPerfilValido(perfil) ? perfil : perfilDesdeRolViejo(role),
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

  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error || 'No autorizado' };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Acceso restringido a administradores.' };

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

  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error || 'No autorizado' };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Acceso restringido a administradores.' };

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
