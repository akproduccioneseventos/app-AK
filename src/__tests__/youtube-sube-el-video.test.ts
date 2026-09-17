/**
 * Orden 60 - Bloque A: YouTube sube el video de verdad (subida resumable en dos pasos).
 *
 * Cumple con docs/ordenes/60-youtube-y-tiktok-publican-de-verdad.md:
 * 1. Inspecciona el código real de src/lib/social-media/youtube-publisher.ts.
 * 2. Comprueba que use uploadType=resumable y la dirección contenga upload/youtube.
 * 3. Comprueba que los bytes del video se descarguen y viajen en el cuerpo del PUT.
 * 4. Comprueba que si YouTube no devuelve un id, la función contesta que falló.
 * 5. Comprueba que con un id válido contesta exitoso con dicho videoId.
 */

import fs from 'node:fs';
import path from 'node:path';
import { publishToYouTube } from '@/lib/social-media/youtube-publisher';

describe('Orden 60 - Bloque A: YouTube sube el video de verdad', () => {
  const publisherPath = path.join(process.cwd(), 'src/lib/social-media/youtube-publisher.ts');
  const publisherCode = fs.readFileSync(publisherPath, 'utf8');

  it('el código real usa el endpoint de subida resumable oficial (uploadType=resumable)', () => {
    expect(publisherCode).toContain('uploadType=resumable');
    expect(publisherCode).toContain('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable');
    expect(publisherCode).toContain("initResponse.headers.get('location')");
    expect(publisherCode).toContain("method: 'PUT'");
  });

  describe('Flujo de subida resumable', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('sube los bytes del video a la dirección upload/youtube en el cuerpo del PUT', async () => {
      let videoDownloadCalled = false;
      let initUploadCalled = false;
      let uploadPutCalled = false;
      let targetUploadUrl = '';
      let putBodyReceived: any = null;

      const fakeVideoBytes = Buffer.from('FAKE_MP4_VIDEO_BINARY_DATA');
      const fakeUploadLocation = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=yt_upload_session_12345';

      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        // 1. Descarga del video origen
        if (url === 'https://res.cloudinary.com/demo/video/upload/sample.mp4') {
          videoDownloadCalled = true;
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'content-type': 'video/mp4',
              'content-length': fakeVideoBytes.length.toString(),
            }),
            arrayBuffer: async () => fakeVideoBytes.buffer,
          } as Response;
        }

        // 2. Inicio de subida resumable (POST a upload/youtube)
        if (url.includes('uploadType=resumable')) {
          initUploadCalled = true;
          expect(url).toContain('upload/youtube');
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              location: fakeUploadLocation,
            }),
            json: async () => ({}),
          } as Response;
        }

        // 3. Subida de bytes con PUT a la URL Location obtenida
        if (url === fakeUploadLocation) {
          uploadPutCalled = true;
          targetUploadUrl = url;
          putBodyReceived = init?.body;
          expect(init?.method).toBe('PUT');
          return {
            ok: true,
            status: 200,
            json: async () => ({ id: 'yt_video_recuerdo_789' }),
          } as Response;
        }

        throw new Error('Unexpected fetch call: ' + url);
      });

      const res = await publishToYouTube({
        accessToken: 'fake_access_token_123',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        title: 'Recuerdo de la Fiesta de 15',
        description: 'Video resumen del evento',
      });

      expect(videoDownloadCalled).toBe(true);
      expect(initUploadCalled).toBe(true);
      expect(uploadPutCalled).toBe(true);
      expect(targetUploadUrl).toContain('upload/youtube');
      expect(Buffer.isBuffer(putBodyReceived) || putBodyReceived instanceof Uint8Array).toBe(true);
      expect(res.success).toBe(true);
      expect(res.videoId).toBe('yt_video_recuerdo_789');
    });

    it('si el servidor de YouTube no devuelve un id, la función contesta que falló', async () => {
      const fakeVideoBytes = Buffer.from('FAKE_VIDEO_CONTENT');
      const fakeUploadLocation = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=yt_test_fail';

      global.fetch = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === 'https://res.cloudinary.com/demo/video/upload/sample.mp4') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'video/mp4' }),
            arrayBuffer: async () => fakeVideoBytes.buffer,
          } as Response;
        }

        if (url.includes('uploadType=resumable')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ location: fakeUploadLocation }),
            json: async () => ({}),
          } as Response;
        }

        if (url === fakeUploadLocation) {
          // El servidor contesta pero sin id o con error interno
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Internal transcoding failure in YouTube' } }),
          } as Response;
        }

        throw new Error('Unexpected URL: ' + url);
      });

      const res = await publishToYouTube({
        accessToken: 'fake_access_token',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        title: 'Video de prueba',
        description: 'Descripción',
      });

      expect(res.success).toBe(false);
      expect(res.videoId).toBeUndefined();
      expect(res.error).toMatch(/transcoding failure/i);
    });

    it('si el video supera el límite de tamaño seguro, rechaza la subida para proteger memoria', async () => {
      const hugeBytes = Buffer.alloc(1024 * 1024 * 2); // 2MB
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'video/mp4' }),
        arrayBuffer: async () => hugeBytes.buffer,
      } as Response));

      const res = await publishToYouTube({
        accessToken: 'token',
        videoUrl: 'https://video.mp4',
        title: 'Título',
        description: 'Desc',
        maxSizeBytes: 1024 * 1024 * 1, // Límite de 1MB para el test
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/demasiado pesado/i);
    });
  });
});

