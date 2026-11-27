'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { exigirQueNoSalgaAfuera } from '@/lib/auth/solo-lectura';
import { getBlogPostBySlug } from '@/app/actions/blog';
import { readData } from '@/lib/data-service';
import { ensureFreshGoogleAccount, sendGoogleGmailMessage } from '@/lib/google-workspace';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import { hoyEnUruguay } from '@/lib/utils';
import {
  alcanzoTopeSemanal,
  listarSuscriptoresActivos,
  marcarNotaEnviadaASuscriptor,
  registrarSuscriptorBlog,
  type ResultadoRegistroSuscriptor,
} from '@/lib/blog/suscriptores';

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function suscribirBlogConConsentimiento(input: {
  email: string;
  consentimiento: boolean;
}): Promise<ResultadoRegistroSuscriptor> {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await enforcePublicRateLimit({
        scope: 'suscripcion-blog',
        limit: 5,
        windowMs: 60_000,
      });
    } catch {
      return { success: false, message: 'Aguardá un momento antes de reintentar.' };
    }
  }

  return registrarSuscriptorBlog({
    email: input?.email || '',
    consentimiento: Boolean(input?.consentimiento),
  });
}

export async function getResumenSuscriptoresBlog(): Promise<{ activos: number }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM);
  const activos = await listarSuscriptoresActivos();
  return { activos: activos.length };
}

export type ResultadoEnvioNotaBlog =
  | {
      success: true;
      enviados: number;
      omitidosPorTope: number;
      fallidos: number;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Envío manual de una nota publicada del blog a los suscriptores activos.
 * Sólo la dispara el dueño o equipo autorizado desde el panel; nunca corre sola.
 */
export async function enviarNotaASuscriptoresManual(
  slug: string,
): Promise<ResultadoEnvioNotaBlog> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM);

  try {
    await exigirQueNoSalgaAfuera();
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'No autorizado para enviar correos externos.',
    };
  }

  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) {
    return { success: false, error: 'Falta elegir la nota para enviar.' };
  }

  const post = await getBlogPostBySlug(cleanSlug);
  if (!post) {
    return { success: false, error: 'No encontramos esa nota en el blog.' };
  }

  const estado = String(post.status || 'published');
  const fechaPublicacion = String(post.publishedAt || '').slice(0, 10);
  const hoy = hoyEnUruguay();
  const estaPublicada = estado !== 'draft' && (!fechaPublicacion || fechaPublicacion <= hoy);
  if (!estaPublicada) {
    return {
      success: false,
      error: 'Esta nota todavía es borrador o está programada. Publicala antes de enviarla por mail.',
    };
  }

  const accounts = await readData<GoogleWorkspaceAccount[]>('_google-workspace-accounts.json', []);
  const companyAccount = Array.isArray(accounts)
    ? accounts.find((a) => a.kind === 'company')
    : undefined;
  const freshCompany = companyAccount
    ? await ensureFreshGoogleAccount(companyAccount).catch(() => null)
    : null;

  if (!freshCompany || freshCompany.status !== 'connected' || !freshCompany.accessToken) {
    return {
      success: false,
      error: 'Conectá Google en Ajustes para enviar mails a tus suscriptores.',
    };
  }

  const activos = await listarSuscriptoresActivos();
  const ahoraMs = Date.now();
  const postUrl = `https://akproducciones.uy/blog/${post.slug}`;
  const subject = `Nuevo consejo en el blog de AK Producciones: ${post.title}`;

  let enviados = 0;
  let omitidosPorTope = 0;
  let fallidos = 0;

  for (const suscriptor of activos) {
    const yaRecibio =
      Array.isArray(suscriptor.notasEnviadas) && suscriptor.notasEnviadas.includes(post.slug);
    if (yaRecibio || alcanzoTopeSemanal(suscriptor, ahoraMs)) {
      omitidosPorTope += 1;
      continue;
    }

    const bajaUrl = `https://akproducciones.uy/api/suscribirse/baja?token=${encodeURIComponent(suscriptor.tokenBaja)}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6; background-color: #ffffff;">
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #b91c1c; margin: 0 0 8px 0;">
          Blog AK Producciones · Salto, Uruguay
        </p>
        <h1 style="font-size: 24px; line-height: 1.3; margin: 0 0 14px 0; color: #0f172a;">
          ${escapeHtml(post.title)}
        </h1>
        <p style="font-size: 15px; color: #334155; margin: 0 0 22px 0;">
          ${escapeHtml(post.excerpt)}
        </p>
        <div style="margin: 24px 0;">
          <a href="${postUrl}" style="display: inline-block; background-color: #b91c1c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 6px;">
            Leer la nota completa
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0;">
          Recibís este mail porque te suscribiste a los consejos de AK Producciones en nuestra web.
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0;">
          ¿No querés recibir más mails? <a href="${bajaUrl}" style="color: #475569; text-decoration: underline;">Date de baja con un clic acá</a>.
        </p>
      </div>
    `;

    try {
      await sendGoogleGmailMessage(freshCompany, suscriptor.email, subject, html);
      await marcarNotaEnviadaASuscriptor(suscriptor.email, post.slug).catch(() => {});
      enviados += 1;
    } catch {
      fallidos += 1;
    }
  }

  return {
    success: true,
    enviados,
    omitidosPorTope,
    fallidos,
  };
}
