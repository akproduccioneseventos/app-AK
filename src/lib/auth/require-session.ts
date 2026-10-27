import { verifySession, type SessionUserData } from '@/lib/auth/session-token';
import {
  NOMBRE_DEL_PERFIL,
  PERMISOS,
  esPerfilValido,
  perfilDe,
  puede,
  type Permiso,
} from '@/lib/auth/perfiles';

export type RequireSessionUser = {
  userId?: string;
  email?: string;
  role?: string;
  perfil?: string;
  modules?: string[];
  versionDeSesion?: number;
};

interface CacheEntry {
  expiresAt: number;
  exists: boolean;
  versionDeSesion: number;
  perfil?: string;
  role?: string;
}

const userSessionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export function clearSessionCache(): void {
  userSessionCache.clear();
}

export function invalidateUserSessionCache(userId: string): void {
  userSessionCache.delete(userId);
}

/**
 * Verifica la sesión de usuario contra la cookie firmada y valida que
 * la versión de sesión coincida con la base de datos (con caché de 60s en memoria).
 * Si la base no responde, cae al contenido de la cookie como respaldo seguro.
 */
export async function requireSession(): Promise<
  | { ok: true; user: RequireSessionUser }
  | { ok: false; error: string }
> {
  const session = await verifySession();
  if (!session.success || !session.user) {
    return { ok: false, error: session.error || 'Sesion no autorizada.' };
  }

  const { user } = session;

  if (
    user.perfil !== undefined &&
    user.perfil !== null &&
    !esPerfilValido(user.perfil)
  ) {
    return { ok: false, error: 'Tu usuario tiene un perfil que no existe. Pedile al dueño que lo corrija.' };
  }

  const userId = user.userId;
  if (!userId) {
    return { ok: true, user };
  }

  const now = Date.now();
  const cached = userSessionCache.get(userId);

  if (cached && cached.expiresAt > now) {
    if (!cached.exists) {
      return { ok: false, error: 'Tu sesión se cerró. Volvé a entrar.' };
    }
    const cookieVersion = typeof user.versionDeSesion === 'number' ? user.versionDeSesion : 1;
    if (cached.versionDeSesion !== cookieVersion) {
      return { ok: false, error: 'Tu sesión se cerró. Volvé a entrar.' };
    }
    return {
      ok: true,
      user: {
        ...user,
        perfil: cached.perfil ?? user.perfil,
        role: cached.role ?? user.role,
        versionDeSesion: cached.versionDeSesion,
      },
    };
  }

  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const isMocked =
        dbAdmin.constructor?.name !== 'Firestore' ||
        Boolean((dbAdmin as any)._isMock) ||
        typeof (dbAdmin.collection as any)?._isMockFunction === 'boolean';

      if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST && !isMocked) {
        // En tests unitarios sin Firestore mockeado, no pegarle a la red
        return { ok: true, user };
      }

      let timer: NodeJS.Timeout | undefined;
      let snap: any;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Firestore timeout')), 1500);
        });
        timeoutPromise.catch(() => {});

        snap = await Promise.race([
          dbAdmin.collection('users').doc(userId).get(),
          timeoutPromise,
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }

      if (!snap || !snap.exists) {
        userSessionCache.set(userId, {
          expiresAt: now + CACHE_TTL_MS,
          exists: false,
          versionDeSesion: 0,
        });
        return { ok: false, error: 'Tu sesión se cerró. Volvé a entrar.' };
      }

      const data = snap.data() || {};
      const dbVersion = typeof data.versionDeSesion === 'number' ? data.versionDeSesion : 1;
      const dbPerfil = data.perfil;
      const dbRole = data.role;

      userSessionCache.set(userId, {
        expiresAt: now + CACHE_TTL_MS,
        exists: true,
        versionDeSesion: dbVersion,
        perfil: dbPerfil,
        role: dbRole,
      });

      const cookieVersion = typeof user.versionDeSesion === 'number' ? user.versionDeSesion : 1;
      if (dbVersion !== cookieVersion) {
        return { ok: false, error: 'Tu sesión se cerró. Volvé a entrar.' };
      }

      return {
        ok: true,
        user: {
          ...user,
          perfil: dbPerfil ?? user.perfil,
          role: dbRole ?? user.role,
          versionDeSesion: dbVersion,
        },
      };
    }
  } catch (error) {
    // Si la base no responde (falla la lectura), NO cortar la sesión:
    // caer al contenido de la cookie como respaldo seguro.
    console.warn('[requireSession] Base de datos no disponible, usando respaldo de sesión firmada.');
  }

  return { ok: true, user };
}

export async function hasAppSession(): Promise<boolean> {
  const session = await requireSession();
  return session.ok;
}

export async function requireAppSession(): Promise<RequireSessionUser> {
  const session = await requireSession();
  if (!session.ok) {
    throw new Error(session.error || 'Sesion no autorizada.');
  }
  return session.user;
}

/**
 * Guarda para acciones destructivas e irreversibles (borrar todo, resetear).
 * Tener sesion no alcanza: cualquier colaborador la tiene. Devuelve el error en
 * vez de tirarlo para que las server actions puedan responder `{ success: false }`
 * como el resto del proyecto.
 */
export async function requireAdminSession(): Promise<
  | { ok: true; user: RequireSessionUser }
  | { ok: false; error: string }
> {
  const session = await verifySession();
  if (!session.success || !session.user) {
    return { ok: false, error: session.error || 'Sesion no autorizada.' };
  }

  if (
    (session.user.perfil !== undefined &&
      session.user.perfil !== null &&
      !esPerfilValido(session.user.perfil)) ||
    !puede(session.user, PERMISOS.ADMINISTRACION)
  ) {
    return { ok: false, error: 'Solo administradores pueden realizar esta accion.' };
  }

  const fullSession = await requireSession();
  if (!fullSession.ok) return { ok: false, error: fullSession.error };

  if (
    (fullSession.user?.perfil !== undefined &&
      fullSession.user?.perfil !== null &&
      !esPerfilValido(fullSession.user.perfil)) ||
    !puede(fullSession.user, PERMISOS.ADMINISTRACION)
  ) {
    return { ok: false, error: 'Solo administradores pueden realizar esta accion.' };
  }

  return { ok: true, user: fullSession.user };
}

/**
 * Guarda por permiso. Es la que hay que usar de aca en adelante.
 *
 * Devuelve el error en vez de tirarlo, para que las server actions contesten
 * `{ success: false, error }` como el resto del proyecto, y el mensaje dice que
 * perfil tiene la persona: si a la secretaria le falta un acceso que necesita,
 * en pantalla se entiende por que y no parece que la app se rompio.
 */
export async function requirePermiso(
  permiso: Permiso,
): Promise<
  | { ok: true; user: RequireSessionUser }
  | { ok: false; error: string }
> {
  const session = await verifySession();
  if (!session.success || !session.user) {
    return { ok: false, error: session.error || 'Sesion no autorizada.' };
  }

  if (
    session.user.perfil !== undefined &&
    session.user.perfil !== null &&
    !esPerfilValido(session.user.perfil)
  ) {
    return { ok: false, error: 'Tu usuario tiene un perfil que no existe. Pedile al dueño que lo corrija.' };
  }

  if (!puede(session.user, permiso)) {
    const perfil = NOMBRE_DEL_PERFIL[perfilDe(session.user)];
    return { ok: false, error: `Tu perfil (${perfil}) no tiene acceso a esta parte.` };
  }

  const fullSession = await requireSession();
  if (!fullSession.ok) return { ok: false, error: fullSession.error };

  if (
    fullSession.user?.perfil !== undefined &&
    fullSession.user?.perfil !== null &&
    !esPerfilValido(fullSession.user.perfil)
  ) {
    return { ok: false, error: 'Tu usuario tiene un perfil que no existe. Pedile al dueño que lo corrija.' };
  }

  if (!puede(fullSession.user, permiso)) {
    const perfil = NOMBRE_DEL_PERFIL[perfilDe(fullSession.user)];
    return { ok: false, error: `Tu perfil (${perfil}) no tiene acceso a esta parte.` };
  }

  return { ok: true, user: fullSession.user };
}

/**
 * Pide alguno de esos permisos y, si no, TIRA (auditoría con las 35 preguntas, 5/10/2026). Para
 * acciones que antes pedían sólo sesión: el personal y el operador también tienen sesión.
 */
export async function requirePermisoAlguno(...permisos: Permiso[]): Promise<void> {
  for (const permiso of permisos) {
    if ((await requirePermiso(permiso)).ok) return;
  }
  throw new Error('Tu perfil no tiene acceso a esta parte.');
}
