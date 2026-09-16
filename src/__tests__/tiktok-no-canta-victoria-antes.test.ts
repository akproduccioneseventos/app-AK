/**
 * Orden 60 - Bloque B: TikTok no canta victoria antes de tiempo.
 *
 * Cumple con docs/ordenes/60-youtube-y-tiktok-publican-de-verdad.md:
 * 1. Inspecciona el código real de src/lib/social-media/tiktok-publisher.ts.
 * 2. Comprueba que se consulte publish/status/fetch tras la inicialización.
 * 3. Comprueba que con un inicio correcto pero un estado posterior de fallo, conteste que falló.
 * 4. Comprueba que con estado PUBLISH_COMPLETE conteste publicado con éxito.
 * 5. Comprueba que si se agota la espera, conteste en proceso ('PROCESSING') y NO 'publicado'.
 */

import fs from 'node:fs';
import path from 'node:path';
import { publishToTikTok } from '@/lib/social-media/tiktok-publisher';

describe('Orden 60 - Bloque B: TikTok no canta victoria antes', () => {
  const publisherPath = path.join(process.cwd(), 'src/lib/social-media/tiktok-publisher.ts');
  const publisherCode = fs.readFileSync(publisherPath, 'utf8');

  it('el código real usa el endpoint de consulta de estado publish/status/fetch', () => {
    expect(publisherCode).toContain('publish/status/fetch');
    expect(publisherCode).toContain('https://open.tiktokapis.com/v2/post/publish/status/fetch/');
  });

  describe('Evaluación de respuestas de TikTok', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('con un inicio correcto pero un estado posterior de fallo, contesta que falló', async () => {
      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        // 1. Inicio de publicación exitoso
        if (url.includes('/publish/video/init/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: { publish_id: 'v_pub_fail_123' },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        // 2. Consulta de estado devuelve FAILED
        if (url.includes('/publish/status/fetch/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                status: 'FAILED',
                fail_reason: 'Video resolution not supported by TikTok',
              },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        throw new Error('Unexpected URL: ' + url);
      });

      const res = await publishToTikTok({
        accessToken: 'fake_tt_token',
        videoUrl: 'https://example.com/video.mp4',
        title: 'Video fiesta',
        pollIntervalMs: 0, // Inmediato para la prueba
      });

      // Debe responder que falló, NO éxito
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.error).toMatch(/resolution not supported/i);
    });

    it('con estado publicado (PUBLISH_COMPLETE) contesta publicado exitosamente', async () => {
      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/publish/video/init/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: { publish_id: 'v_pub_ok_456' },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        if (url.includes('/publish/status/fetch/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                status: 'PUBLISH_COMPLETE',
              },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        throw new Error('Unexpected URL: ' + url);
      });

      const res = await publishToTikTok({
        accessToken: 'fake_tt_token',
        videoUrl: 'https://example.com/video.mp4',
        title: 'Video publicado',
        pollIntervalMs: 0,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('PUBLISH_COMPLETE');
      expect(res.publishId).toBe('v_pub_ok_456');
    });

    it('si se agota la espera de procesamiento, contesta "en proceso" y NO publicado', async () => {
      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/publish/video/init/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: { publish_id: 'v_pub_slow_789' },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        if (url.includes('/publish/status/fetch/')) {
          // Permanece en proceso en todos los intentos
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                status: 'PROCESSING_DOWNLOAD',
              },
              error: { code: 'ok' },
            }),
          } as Response;
        }

        throw new Error('Unexpected URL: ' + url);
      });

      const res = await publishToTikTok({
        accessToken: 'fake_tt_token',
        videoUrl: 'https://example.com/video.mp4',
        title: 'Video procesándose',
        maxPollAttempts: 2,
        pollIntervalMs: 0,
      });

      // No debe cantar victoria como si ya estuviese publicado
      expect(res.status).toBe('PROCESSING');
      expect(res.status).not.toBe('PUBLISH_COMPLETE');
      expect(res.message).toMatch(/falta que termine de procesarlo/i);
    });
  });
});

