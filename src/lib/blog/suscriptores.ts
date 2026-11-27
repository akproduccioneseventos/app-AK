import 'server-only';

import { randomUUID } from 'crypto';
import { readData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';

export const SUSCRIPTORES_FILE = 'suscriptores-blog.json';
export const TOPE_ENVIOS_SEMANA_POR_PERSONA = 2;

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SuscriptorBlog {
  id: string;
  email: string;
  nombre?: string;
  activo: boolean;
  consentimiento: boolean;
  fechaConsentimiento: string;
  tokenBaja: string;
  notasEnviadas: string[];
  ultimoEnvioAt?: string;
  fechaBaja?: string;
  enviosRecientes?: string[];
}

export interface ResultadoRegistroSuscriptor {
  success: boolean;
  message: string;
}

export interface ResultadoBajaSuscriptor {
  success: boolean;
  message: string;
  yaEstabaDeBaja?: boolean;
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function isValidBlogEmail(email: string): boolean {
  const clean = normalizeEmail(email);
  return clean.length > 0 && clean.length <= 254 && EMAIL_REGEX.test(clean);
}

export function contarEnviosUltimaSemana(
  suscriptor: SuscriptorBlog,
  ahoraMs = Date.now(),
): number {
  const corte = ahoraMs - SIETE_DIAS_MS;
  if (Array.isArray(suscriptor.enviosRecientes) && suscriptor.enviosRecientes.length > 0) {
    return suscriptor.enviosRecientes.filter((fecha) => {
      const ts = new Date(fecha).getTime();
      return !Number.isNaN(ts) && ts >= corte;
    }).length;
  }
  if (suscriptor.ultimoEnvioAt) {
    const ts = new Date(suscriptor.ultimoEnvioAt).getTime();
    if (!Number.isNaN(ts) && ts >= corte) return 1;
  }
  return 0;
}

export function alcanzoTopeSemanal(
  suscriptor: SuscriptorBlog,
  ahoraMs = Date.now(),
): boolean {
  return contarEnviosUltimaSemana(suscriptor, ahoraMs) >= TOPE_ENVIOS_SEMANA_POR_PERSONA;
}

export async function registrarSuscriptorBlog({
  email,
  consentimiento,
  nombre,
}: {
  email: string;
  consentimiento: boolean;
  nombre?: string;
}): Promise<ResultadoRegistroSuscriptor> {
  if (!consentimiento) {
    return {
      success: false,
      message: 'Tenés que aceptar recibir los consejos por mail para suscribirte.',
    };
  }

  const cleanEmail = normalizeEmail(email);
  if (!isValidBlogEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Ingresá un mail válido para suscribirte.',
    };
  }

  const ahora = new Date().toISOString();
  const cleanNombre = nombre?.trim() ? nombre.trim().slice(0, 120) : undefined;

  try {
    await mutateGenericJsonArray<SuscriptorBlog>(SUSCRIPTORES_FILE, (actual) => {
      const lista = Array.isArray(actual) ? [...actual] : [];
      const idx = lista.findIndex((s) => normalizeEmail(s.email) === cleanEmail);

      if (idx >= 0) {
        const existente = lista[idx];
        const actualizado: SuscriptorBlog = {
          ...existente,
          email: cleanEmail,
          ...(cleanNombre ? { nombre: cleanNombre } : {}),
          activo: true,
          consentimiento: true,
          fechaConsentimiento: ahora,
          tokenBaja: existente.tokenBaja || randomUUID(),
          notasEnviadas: Array.isArray(existente.notasEnviadas) ? existente.notasEnviadas : [],
        };
        delete actualizado.fechaBaja;
        lista[idx] = actualizado;
        return lista;
      }

      lista.push({
        id: randomUUID(),
        email: cleanEmail,
        ...(cleanNombre ? { nombre: cleanNombre } : {}),
        activo: true,
        consentimiento: true,
        fechaConsentimiento: ahora,
        tokenBaja: randomUUID(),
        notasEnviadas: [],
      });
      return lista;
    });
  } catch {
    return {
      success: false,
      message: 'No pudimos guardar tu suscripción en este momento. Probá de nuevo en unos minutos.',
    };
  }

  // Registro interno opcional en el CRM propio: nunca se comparte con terceros ni rompe la suscripción si falla.
  try {
    const nombreDelCorreo = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').trim();
    const nombreLead = (
      cleanNombre || (nombreDelCorreo.length >= 3 ? nombreDelCorreo : `Suscriptor ${cleanEmail}`)
    ).slice(0, 120);

    await upsertPublicCommercialLead({
      name: nombreLead,
      phone: '',
      email: cleanEmail,
      permitirSinTelefono: true,
      claveSinTelefono: `blog-suscripcion:${cleanEmail}`,
      notes: 'Se suscribió por mail a los consejos del blog con consentimiento.',
      marketingConsent: true,
      marketingConsentSource: 'blog-suscripcion',
      acquisition: { source: 'web-blog' } as never,
    });
  } catch {
    // Si falla la ficha interna, la suscripción al blog ya quedó guardada correctamente.
  }

  return {
    success: true,
    message: '¡Listo! Quedaste suscripto a los consejos de AK Producciones.',
  };
}

export async function darDeBajaSuscriptor(token: string): Promise<ResultadoBajaSuscriptor> {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    return {
      success: false,
      message: 'El enlace de baja no es válido o está incompleto.',
    };
  }

  let encontrado = false;
  let yaEstabaDeBaja = false;

  try {
    await mutateGenericJsonArray<SuscriptorBlog>(SUSCRIPTORES_FILE, (actual) => {
      const lista = Array.isArray(actual) ? [...actual] : [];
      const idx = lista.findIndex((s) => s.tokenBaja === cleanToken);
      if (idx < 0) return null;

      encontrado = true;
      const existente = lista[idx];
      if (!existente.activo) {
        yaEstabaDeBaja = true;
        return null;
      }

      lista[idx] = {
        ...existente,
        activo: false,
        fechaBaja: new Date().toISOString(),
      };
      return lista;
    });
  } catch {
    return {
      success: false,
      message: 'No pudimos procesar tu baja en este momento. Probá de nuevo en unos minutos.',
    };
  }

  if (!encontrado) {
    return {
      success: false,
      message: 'No encontramos esa suscripción o el enlace ya no corresponde.',
    };
  }

  if (yaEstabaDeBaja) {
    return {
      success: true,
      yaEstabaDeBaja: true,
      message: 'Tu suscripción ya estaba dada de baja. No vas a recibir más mails.',
    };
  }

  return {
    success: true,
    message: 'Te dimos de baja correctamente. No vas a recibir más consejos por mail.',
  };
}

export async function listarSuscriptoresActivos(): Promise<SuscriptorBlog[]> {
  const lista = await readData<SuscriptorBlog[]>(SUSCRIPTORES_FILE, []);
  if (!Array.isArray(lista)) return [];
  return lista.filter((s) => Boolean(s && s.activo && s.consentimiento && isValidBlogEmail(s.email)));
}

export async function marcarNotaEnviadaASuscriptor(email: string, slug: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  const cleanSlug = String(slug || '').trim();
  if (!cleanEmail || !cleanSlug) return;

  const ahora = new Date().toISOString();
  const corte = Date.now() - SIETE_DIAS_MS;

  await mutateGenericJsonArray<SuscriptorBlog>(SUSCRIPTORES_FILE, (actual) => {
    const lista = Array.isArray(actual) ? [...actual] : [];
    const idx = lista.findIndex((s) => normalizeEmail(s.email) === cleanEmail);
    if (idx < 0) return null;

    const existente = lista[idx];
    const notasPrevias = Array.isArray(existente.notasEnviadas) ? existente.notasEnviadas : [];
    const notasEnviadas = notasPrevias.includes(cleanSlug)
      ? notasPrevias
      : [...notasPrevias, cleanSlug];

    const enviosPrevios = Array.isArray(existente.enviosRecientes) ? existente.enviosRecientes : [];
    const enviosVigentes = enviosPrevios.filter((fecha) => {
      const ts = new Date(fecha).getTime();
      return !Number.isNaN(ts) && ts >= corte;
    });

    lista[idx] = {
      ...existente,
      notasEnviadas,
      ultimoEnvioAt: ahora,
      enviosRecientes: [...enviosVigentes, ahora],
    };
    return lista;
  });
}
