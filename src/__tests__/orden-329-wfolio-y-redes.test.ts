/** @jest-environment node */
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

describe('Orden 329 — Bloque 1: descarga por carpetas para Wfolio', () => {
  const fiestaId = `fiesta-329-test-${Date.now()}`;
  let tempDir: string;
  let fotoCabinaPath: string;
  let fotoTiraPath: string;
  let video360Path: string;
  let fotoInvitadoPath: string;
  let fotoVoguePath: string;
  let fotoOcultaPath: string;
  let fotoPendientePath: string;

  beforeAll(async () => {
    tempDir = path.join(process.cwd(), 'src', 'data', 'social-gallery', fiestaId);
    await fs.mkdir(tempDir, { recursive: true });
    fotoCabinaPath = path.join(tempDir, 'cabina_01.jpg');
    fotoTiraPath = path.join(tempDir, 'tira_02.jpg');
    video360Path = path.join(tempDir, 'clip_360.mp4');
    fotoInvitadoPath = path.join(tempDir, 'invitado_01.jpg');
    fotoVoguePath = path.join(tempDir, 'vogue_01.jpg');
    fotoOcultaPath = path.join(tempDir, 'oculta_01.jpg');
    fotoPendientePath = path.join(tempDir, 'pendiente_01.jpg');

    await Promise.all([
      fs.writeFile(fotoCabinaPath, Buffer.from('CABINA_01')),
      fs.writeFile(fotoTiraPath, Buffer.from('TIRA_02')),
      fs.writeFile(video360Path, Buffer.from('VIDEO_360')),
      fs.writeFile(fotoInvitadoPath, Buffer.from('INVITADO_01')),
      fs.writeFile(fotoVoguePath, Buffer.from('VOGUE_01')),
      fs.writeFile(fotoOcultaPath, Buffer.from('OCULTA_NO_DEBE_SALIR')),
      fs.writeFile(fotoPendientePath, Buffer.from('PENDIENTE_NO_DEBE_SALIR')),
    ]);
  });

  afterAll(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  function cargarRuta(hasSession: boolean) {
    let modulo: typeof import('@/app/api/social-gallery/[fiestaId]/download/route');
    jest.isolateModules(() => {
      jest.doMock('@/lib/auth/require-session', () => ({
        hasAppSession: jest.fn(async () => hasSession),
        requireAppSession: jest.fn(async () => {
          if (!hasSession) throw new Error('Unauthorized');
          return { user: { role: 'admin' } };
        }),
      }));
      jest.doMock('@/lib/auth/event-access', () => ({
        requireEventPermission: jest.fn(async () => {
          if (!hasSession) throw new Error('No autorizado');
          return { id: fiestaId };
        }),
      }));
      jest.doMock('@/app/actions/social-gallery', () => ({
        getPhotoFilePathsForZip: jest.fn(async () => ({
          photos: [
            {
              id: 'p1',
              path: fotoCabinaPath,
              imageUrl: fotoCabinaPath,
              name: 'cabina_01.jpg',
              approved: true,
              moderationStatus: 'approved' as const,
              source: 'entertainment',
              sourceModule: 'fotocabina',
            },
            {
              id: 'p2',
              path: fotoTiraPath,
              imageUrl: fotoTiraPath,
              name: 'tira_02.jpg',
              approved: true,
              moderationStatus: 'approved' as const,
              caption: 'Tira de recuerdos',
              source: 'entertainment',
            },
            {
              id: 'p3',
              path: video360Path,
              imageUrl: video360Path,
              name: 'clip_360.mp4',
              approved: true,
              moderationStatus: 'approved' as const,
              source: 'entertainment',
              sourceModule: 'plataforma-360',
              mediaType: 'video' as const,
            },
            {
              id: 'p4',
              path: fotoInvitadoPath,
              imageUrl: fotoInvitadoPath,
              name: 'invitado_01.jpg',
              approved: true,
              moderationStatus: 'approved' as const,
              source: 'guest',
            },
            {
              id: 'p5',
              path: fotoVoguePath,
              imageUrl: fotoVoguePath,
              name: 'vogue_01.jpg',
              approved: true,
              moderationStatus: 'approved' as const,
              source: 'entertainment',
              sourceModule: 'vogue',
            },
            {
              id: 'p6',
              path: fotoOcultaPath,
              imageUrl: fotoOcultaPath,
              name: 'oculta_01.jpg',
              approved: false,
              moderationStatus: 'hidden' as const,
              source: 'guest',
            },
            {
              id: 'p7',
              path: fotoPendientePath,
              imageUrl: fotoPendientePath,
              name: 'pendiente_01.jpg',
              approved: false,
              moderationStatus: 'pending' as const,
              source: 'entertainment',
              sourceModule: 'fotocabina',
            },
          ],
          stats: {
            total: 7,
            approved: 5,
            pending: 1,
            hidden: 1,
          },
        })),
      }));
      modulo = require('@/app/api/social-gallery/[fiestaId]/download/route');
    });
    return modulo!;
  }

  it('sin sesión responde 401 igual que hoy', async () => {
    const ruta = cargarRuta(false);
    const res = await ruta.GET(
      new Request(`http://localhost/api/social-gallery/${fiestaId}/download?carpetas=1`),
      { params: Promise.resolve({ fiestaId }) },
    );
    expect(res.status).toBe(401);
  });

  it('con sesión y ?carpetas=1 entrega las carpetas esperadas sin las fotos ocultas ni pendientes', async () => {
    const ruta = cargarRuta(true);
    const res = await ruta.GET(
      new Request(`http://localhost/api/social-gallery/${fiestaId}/download?carpetas=1`),
      { params: Promise.resolve({ fiestaId }) },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');

    const buf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);
    const archivos = Object.keys(zip.files);

    expect(archivos).toContain('Fotocabina/cabina_01.jpg');
    expect(archivos).toContain('Fotocabina/tira_02.jpg');
    expect(archivos).toContain('Plataforma 360/clip_360.mp4');
    expect(archivos).toContain('Fotos de los invitados/invitado_01.jpg');
    expect(archivos).toContain('Vogue/vogue_01.jpg');

    expect(archivos.some((a) => a.includes('oculta_01.jpg'))).toBe(false);
    expect(archivos.some((a) => a.includes('pendiente_01.jpg'))).toBe(false);
  });

  it('sin ?carpetas=1 conserva la descarga plana actual', async () => {
    const ruta = cargarRuta(true);
    const res = await ruta.GET(
      new Request(`http://localhost/api/social-gallery/${fiestaId}/download`),
      { params: Promise.resolve({ fiestaId }) },
    );

    expect(res.status).toBe(200);
    const buf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);
    const archivos = Object.keys(zip.files);

    expect(archivos).toContain('cabina_01.jpg');
    expect(archivos).toContain('clip_360.mp4');
    expect(archivos).toContain('invitado_01.jpg');
  });
});
