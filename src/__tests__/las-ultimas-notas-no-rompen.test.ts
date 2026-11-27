/**
 * @jest-environment node
 *
 * Pruebas unitarias de la Orden 378 (Bloque 8):
 * - Las últimas notas externas (Blogger y WordPress) nunca rompen la web si los feeds fallan.
 * - Con feeds válidos devuelve hasta 3 notas ordenadas por fecha con fuente, título y enlace.
 * - La suscripción al blog exige consentimiento explícito y guarda en memoria/base propia con token de baja.
 * - La baja con token marca al suscriptor como inactivo.
 */

jest.mock('server-only', () => ({}), { virtual: true });

const memoryStore = new Map<string, unknown>();

const mockReadData = jest.fn(async <T>(file: string, fallback: T): Promise<T> => {
  if (!memoryStore.has(file)) return fallback;
  return JSON.parse(JSON.stringify(memoryStore.get(file))) as T;
});

const mockWriteData = jest.fn(async (file: string, data: unknown) => {
  memoryStore.set(file, JSON.parse(JSON.stringify(data)));
});

const mockMutateGenericJsonArray = jest.fn(
  async <T>(file: string, mutator: (actual: T[]) => T[] | null) => {
    const actual = (memoryStore.has(file)
      ? JSON.parse(JSON.stringify(memoryStore.get(file)))
      : []) as T[];
    const next = mutator(actual);
    if (next !== null) {
      memoryStore.set(file, JSON.parse(JSON.stringify(next)));
    }
    return next;
  },
);

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => (mockReadData as (...a: unknown[]) => unknown)(...args),
  writeData: (...args: unknown[]) => (mockWriteData as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: (...args: unknown[]) =>
    (mockMutateGenericJsonArray as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async () => undefined),
}));

const mockRequirePermisoAlguno = jest.fn(async () => ({ ok: true }));
const mockExigirQueNoSalgaAfuera = jest.fn(async () => undefined);
const mockGetBlogPostBySlug = jest.fn();
const mockEnsureFreshGoogleAccount = jest.fn(async (acc: unknown) => acc);
const mockSendGoogleGmailMessage = jest.fn(async () => ({ id: 'msg-1' }));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: (...args: unknown[]) =>
    (mockRequirePermisoAlguno as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueNoSalgaAfuera: (...args: unknown[]) =>
    (mockExigirQueNoSalgaAfuera as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/app/actions/blog', () => ({
  getBlogPostBySlug: (...args: unknown[]) =>
    (mockGetBlogPostBySlug as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/lib/google-workspace', () => ({
  ensureFreshGoogleAccount: (...args: unknown[]) =>
    (mockEnsureFreshGoogleAccount as (...a: unknown[]) => unknown)(...args),
  sendGoogleGmailMessage: (...args: unknown[]) =>
    (mockSendGoogleGmailMessage as (...a: unknown[]) => unknown)(...args),
}));

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BLOGGER_FEED_URL,
  WORDPRESS_FEED_URL,
  getUltimasNotasExternas,
} from '@/lib/blog/ultimas-notas';
import { UltimasNotasExternas } from '@/components/public/UltimasNotasExternas';
import {
  SUSCRIPTORES_FILE,
  darDeBajaSuscriptor,
  listarSuscriptoresActivos,
  registrarSuscriptorBlog,
  type SuscriptorBlog,
} from '@/lib/blog/suscriptores';
import { POST as suscribirsePOST } from '@/app/api/suscribirse/route';
import {
  enviarNotaASuscriptoresManual,
  getResumenSuscriptoresBlog,
  suscribirBlogConConsentimiento,
} from '@/app/actions/blog-suscripcion.actions';

describe('Orden 378 — Últimas notas externas y suscripción al blog', () => {
  beforeEach(() => {
    memoryStore.clear();
    jest.clearAllMocks();
  });

  it('Test 1: con feeds caídos (rechazo de red, status 500 o XML roto) devuelve [] sin lanzar y el componente no muestra nada', async () => {
    const fetchRechazado = jest.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    await expect(getUltimasNotasExternas(3, fetchRechazado)).resolves.toEqual([]);

    const fetch500 = jest.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })) as unknown as typeof fetch;

    await expect(getUltimasNotasExternas(3, fetch500)).resolves.toEqual([]);

    const fetchXmlRoto = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '<html-roto><sin-cerrar',
    })) as unknown as typeof fetch;

    await expect(getUltimasNotasExternas(3, fetchXmlRoto)).resolves.toEqual([]);

    expect(UltimasNotasExternas({ notas: [] })).toBeNull();
    const html = renderToStaticMarkup(React.createElement(UltimasNotasExternas, { notas: [] }));
    expect(html).toBe('');
  });

  it('Test 2: con feeds Atom y RSS válidos devuelve hasta 3 notas ordenadas por fecha con fuente, título y enlace', async () => {
    const bloggerAtom = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <id>tag:blogger.com,1999:blog-1.post-101</id>
          <title>Guía de iluminación para bodas en Salto</title>
          <published>2026-11-20T12:00:00Z</published>
          <link rel="alternate" type="text/html" href="https://akproduccionessalto.blogspot.com/2026/11/iluminacion-bodas.html" />
        </entry>
        <entry>
          <id>tag:blogger.com,1999:blog-1.post-102</id>
          <title>Nota vieja de archivo</title>
          <published>2026-10-01T12:00:00Z</published>
          <link rel="alternate" type="text/html" href="https://akproduccionessalto.blogspot.com/2026/10/nota-vieja.html" />
        </entry>
      </feed>`;

    const wordpressRss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <guid>https://akproduccionessalto.wordpress.com/?p=201</guid>
            <title>Checklist para fiestas de 15 en Club Uruguay</title>
            <link>https://akproduccionessalto.wordpress.com/2026/11/25/checklist-15/</link>
            <pubDate>Wed, 25 Nov 2026 15:00:00 +0000</pubDate>
          </item>
          <item>
            <guid>https://akproduccionessalto.wordpress.com/?p=202</guid>
            <title>Cómo calcular bebidas por invitado</title>
            <link>https://akproduccionessalto.wordpress.com/2026/11/22/bebidas-invitado/</link>
            <pubDate>Sun, 22 Nov 2026 10:00:00 +0000</pubDate>
          </item>
        </channel>
      </rss>`;

    const mockFetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === BLOGGER_FEED_URL) {
        return { ok: true, status: 200, text: async () => bloggerAtom };
      }
      if (url === WORDPRESS_FEED_URL) {
        return { ok: true, status: 200, text: async () => wordpressRss };
      }
      return { ok: false, status: 404, text: async () => '' };
    }) as unknown as typeof fetch;

    const notas = await getUltimasNotasExternas(3, mockFetch);

    expect(notas).toHaveLength(3);
    expect(notas[0]).toMatchObject({
      fuente: 'WordPress',
      titulo: 'Checklist para fiestas de 15 en Club Uruguay',
      url: 'https://akproduccionessalto.wordpress.com/2026/11/25/checklist-15/',
    });
    expect(notas[1]).toMatchObject({
      fuente: 'WordPress',
      titulo: 'Cómo calcular bebidas por invitado',
      url: 'https://akproduccionessalto.wordpress.com/2026/11/22/bebidas-invitado/',
    });
    expect(notas[2]).toMatchObject({
      fuente: 'Blogger',
      titulo: 'Guía de iluminación para bodas en Salto',
      url: 'https://akproduccionessalto.blogspot.com/2026/11/iluminacion-bodas.html',
    });

    const html = renderToStaticMarkup(React.createElement(UltimasNotasExternas, { notas }));
    expect(html).toContain('Checklist para fiestas de 15 en Club Uruguay');
    expect(html).toContain('Blogger');
    expect(html).toContain('WordPress');
  });

  it('Test 3: sin consentimiento NO guarda nada y devuelve 400; con consentimiento guarda suscriptor activo con tokenBaja', async () => {
    const resDirectoSinConsent = await registrarSuscriptorBlog({
      email: 'test@ejemplo.com',
      consentimiento: false,
    });
    expect(resDirectoSinConsent.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockMutateGenericJsonArray).not.toHaveBeenCalled();

    const reqSinConsent = new Request('http://localhost/api/suscribirse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@ejemplo.com', consentimiento: false }),
    });
    const resApiSinConsent = await suscribirsePOST(reqSinConsent);
    const bodySinConsent = (await resApiSinConsent.json()) as { success: boolean; message: string };

    expect(resApiSinConsent.status).toBe(400);
    expect(bodySinConsent.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockMutateGenericJsonArray).not.toHaveBeenCalled();
    expect(memoryStore.get(SUSCRIPTORES_FILE)).toBeUndefined();

    const reqConConsent = new Request('http://localhost/api/suscribirse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@ejemplo.com', consentimiento: true }),
    });
    const resApiConConsent = await suscribirsePOST(reqConConsent);
    const bodyConConsent = (await resApiConConsent.json()) as { success: boolean; message: string };

    expect(resApiConConsent.status).toBe(200);
    expect(bodyConConsent.success).toBe(true);
    expect(mockMutateGenericJsonArray).toHaveBeenCalledTimes(1);

    const guardados = memoryStore.get(SUSCRIPTORES_FILE) as SuscriptorBlog[];
    expect(Array.isArray(guardados)).toBe(true);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({
      email: 'test@ejemplo.com',
      activo: true,
      consentimiento: true,
    });
    expect(typeof guardados[0].tokenBaja).toBe('string');
    expect(guardados[0].tokenBaja.length).toBeGreaterThan(8);
  });

  it('Test 4: darDeBajaSuscriptor(token) marca activo: false y lo quita de los suscriptores activos', async () => {
    const alta = await registrarSuscriptorBlog({
      email: 'baja@ejemplo.com',
      consentimiento: true,
    });
    expect(alta.success).toBe(true);

    const guardadosAntes = memoryStore.get(SUSCRIPTORES_FILE) as SuscriptorBlog[];
    expect(guardadosAntes).toHaveLength(1);
    const token = guardadosAntes[0].tokenBaja;

    const activosAntes = await listarSuscriptoresActivos();
    expect(activosAntes.map((s) => s.email)).toContain('baja@ejemplo.com');

    const baja = await darDeBajaSuscriptor(token);
    expect(baja.success).toBe(true);

    const guardadosDespues = memoryStore.get(SUSCRIPTORES_FILE) as SuscriptorBlog[];
    expect(guardadosDespues[0].activo).toBe(false);
    expect(guardadosDespues[0].fechaBaja).toBeTruthy();

    const activosDespues = await listarSuscriptoresActivos();
    expect(activosDespues).toHaveLength(0);
  });

  it('Test 5: blog-suscripcion.actions valida consentimiento y exige permiso para ver resumen o enviar mails', async () => {
    const sinConsent = await suscribirBlogConConsentimiento({
      email: 'accion@ejemplo.com',
      consentimiento: false,
    });
    expect(sinConsent.success).toBe(false);

    const conConsent = await suscribirBlogConConsentimiento({
      email: 'accion@ejemplo.com',
      consentimiento: true,
    });
    expect(conConsent.success).toBe(true);

    mockRequirePermisoAlguno.mockRejectedValueOnce(new Error('Sin permiso'));
    await expect(getResumenSuscriptoresBlog()).rejects.toThrow('Sin permiso');

    mockRequirePermisoAlguno.mockRejectedValueOnce(new Error('Sin permiso'));
    await expect(enviarNotaASuscriptoresManual('nota-prueba')).rejects.toThrow('Sin permiso');
  });

  it('Test 6: enviarNotaASuscriptoresManual envía con botón del dueño, incluye baja y evita reenvíos duplicados', async () => {
    await registrarSuscriptorBlog({ email: 'lector@ejemplo.com', consentimiento: true });
    memoryStore.set('_google-workspace-accounts.json', [
      { kind: 'company', status: 'connected', accessToken: 'tok-ok', email: 'hola@akproducciones.uy' },
    ]);
    mockGetBlogPostBySlug.mockResolvedValue({
      slug: 'organizar-boda-salto',
      title: 'Cómo organizar tu boda en Salto',
      excerpt: 'Guía paso a paso para celebrar sin estrés.',
      status: 'published',
      publishedAt: '2026-11-27',
    });

    const resumen = await getResumenSuscriptoresBlog();
    expect(resumen.activos).toBe(1);

    const primerEnvio = await enviarNotaASuscriptoresManual('organizar-boda-salto');
    expect(primerEnvio).toEqual({
      success: true,
      enviados: 1,
      omitidosPorTope: 0,
      fallidos: 0,
    });
    expect(mockSendGoogleGmailMessage).toHaveBeenCalledTimes(1);
    const [, toArg, , htmlArg] = mockSendGoogleGmailMessage.mock.calls[0] as unknown as [
      unknown,
      string,
      string,
      string,
    ];
    expect(toArg).toBe('lector@ejemplo.com');
    expect(htmlArg).toContain('/api/suscribirse/baja?token=');

    const segundoEnvio = await enviarNotaASuscriptoresManual('organizar-boda-salto');
    expect(segundoEnvio).toEqual({
      success: true,
      enviados: 0,
      omitidosPorTope: 1,
      fallidos: 0,
    });
    expect(mockSendGoogleGmailMessage).toHaveBeenCalledTimes(1);
  });
});
