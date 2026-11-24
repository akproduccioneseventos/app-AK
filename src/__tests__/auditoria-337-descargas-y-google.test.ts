/** @jest-environment node */
/**
 * Orden 337 — Bloque 2 y Bloque 4:
 * Verifica safe-fiesta-file (traversal + SSRF), decodeGoogleState + callback OAuth,
 * permisos y bloqueos en las 4 rutas de descarga, permisos en /api/multiagent/message
 * y /api/asistente/voz-parte, y TAREAS_SECRET en abrirPuertaDeLaTarea.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let sesionActual: { success: boolean; user?: any; error?: string } = { success: false };
let portalAutorizado = false;
let buzonMensajesMock: Array<{
  id: string;
  fiestaId: string;
  authorName: string;
  mediaType: 'audio' | 'video' | 'photo';
  mediaUrl: string;
  storagePath: string;
}> = [];
let socialZipPhotosMock: Array<{
  id: string;
  name: string;
  path: string;
  approved?: boolean;
  source?: string;
  sourceModule?: string;
}> = [];
let socialPostsMock: Array<any> = [];
let dedicationsMock: Array<any> = [];

const saveGoogleWorkspaceAccountFromOAuthMock = jest.fn(async (..._args: unknown[]) => undefined);
const sendPersistentMultiAgentMessageMock = jest.fn(async (..._args: unknown[]) => ({
  success: true,
  response: 'Respuesta de prueba',
  message: 'Respuesta de prueba',
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesionActual),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => portalAutorizado),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'op-1', email: 'op1@ak.test', nombre: 'Operador Asignado' },
    { id: 'op-2', email: 'op2@ak.test', nombre: 'Operador Ajeno' },
  ]),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
  ),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => ({
    valor: almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
    huboFalla: false,
  })),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    almacen[archivo] = { ...(almacen[archivo] || {}), ...copia(parcial) };
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (filePath: string, _vacio: any, cambiar: (a: any) => any) => {
    const actual = almacen[filePath] !== undefined ? copia(almacen[filePath]) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    almacen[filePath] = copia(nuevo);
    return copia(nuevo);
  }),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => (almacen['fiestas/f1.json'] ? [copia(almacen['fiestas/f1.json'])] : [])),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('@/lib/firebase/storage', () => ({
  downloadFromStorage: jest.fn(async () => null),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/multiagent', () => ({
  sendPersistentMultiAgentMessage: (...args: unknown[]) => sendPersistentMultiAgentMessageMock(...args),
}));

jest.mock('@/app/actions/google-workspace', () => ({
  saveGoogleWorkspaceAccountFromOAuth: (...args: unknown[]) => saveGoogleWorkspaceAccountFromOAuthMock(...args),
}));

jest.mock('@/app/actions/buzon', () => {
  const actual = jest.requireActual('@/app/actions/buzon');
  return {
    ...actual,
    getBuzonMessagesConDetalle: jest.fn(async () => ({
      mensajes: buzonMensajesMock,
      huboFalla: false,
    })),
  };
});

jest.mock('@/app/actions/social-gallery', () => ({
  getSocialPosts: jest.fn(async () => socialPostsMock),
  getPhotoFilePathsForZip: jest.fn(async () => ({
    photos: socialZipPhotosMock,
    stats: {
      total: socialZipPhotosMock.length,
      approved: socialZipPhotosMock.filter((p) => p.approved !== false).length,
      pending: 0,
      hidden: 0,
    },
  })),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  getDedications: jest.fn(async () => dedicationsMock),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({
    vozGeminiActiva: true,
    vozTelefonoActiva: true,
    vozSeleccionada: 'Aoede',
  })),
}));

jest.mock('@/lib/asistente/cuota-voz-gemini', () => ({
  reservarCupoDiarioVozGemini: jest.fn(async () => true),
}));

jest.mock('@/lib/asistente/voz-gemini', () => ({
  sintetizarVozGemini: jest.fn(async () => Buffer.from('RIFFtest')),
}));

import { NextRequest } from 'next/server';
import {
  getFiestaLocalAllowedDirs,
  isStorageUrlAllowed,
  leerArchivoSeguroDeFiesta,
  resolverRutaSeguraDeFiesta,
  validarFiestaIdSeguro,
} from '@/lib/security/safe-fiesta-file';
import { decodeGoogleState, encodeGoogleState } from '@/lib/google-workspace';
import { GET as googleOAuthCallbackGET } from '@/app/api/google/oauth/callback/route';
import { GET as downloadBuzonGET } from '@/app/api/buzon/[fiestaId]/download/route';
import { GET as downloadSocialGET } from '@/app/api/social-gallery/[fiestaId]/download/route';
import { GET as downloadRecuerdosGET } from '@/app/api/fiestas/[fiestaId]/download-recuerdos/route';
import { GET as downloadDocFiestaGET } from '@/app/api/documentos-fiesta/[...parts]/route';
import { POST as multiagentMessagePOST } from '@/app/api/multiagent/message/route';
import { POST as vozPartePOST } from '@/app/api/asistente/voz-parte/route';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';

const DUENO = { userId: 'dueno-1', email: 'dueno@ak.test', perfil: 'dueno' };
const PERSONAL = { userId: 'p1', email: 'mozo@ak.test', perfil: 'personal' };
const OPERADOR_ASIGNADO = { userId: 'op-1', email: 'op1@ak.test', perfil: 'operador' };
const OPERADOR_AJENO = { userId: 'op-2', email: 'op2@ak.test', perfil: 'operador' };

const FIESTA_BASE = {
  id: 'f1',
  estado: 'Contratada',
  configuracion: {
    nombreEvento: 'XV de Martina',
    tipoCelebracion: '15 años',
    fechaEvento: '2026-12-10',
    invitadosEstimados: 100,
    clienteId: 'cli-1',
  },
  modulosContratados: {
    social: true,
    catering: false,
  },
  clientPortalSettings: {
    enabled: true,
    accessKey: 'clave-portal-segura',
  },
  personalAsignado: [{ empleadoId: 'op-1', rolId: 'dj', eventSalary: 8500 }],
  othersDocumentos: [{ fileName: 'contrato-ok.pdf' }],
};

describe('Orden 337 — Seguridad de descargas, OAuth Google, permisos IA y TAREAS_SECRET', () => {
  const prevEnv = { ...process.env };
  let tmpRoot = '';

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-337-safe-'));
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
    process.env.AK_SESSION_SECRET = 'secret-de-prueba-orden-337';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    process.env = prevEnv;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['fiestas/f1.json'] = copia(FIESTA_BASE);
    sesionActual = { success: false };
    portalAutorizado = false;
    buzonMensajesMock = [];
    socialZipPhotosMock = [];
    socialPostsMock = [];
    dedicationsMock = [];
    jest.clearAllMocks();
  });

  describe('1. safe-fiesta-file.ts: traversal y SSRF guard', () => {
    it('validarFiestaIdSeguro rechaza secuencias peligrosas y acepta IDs válidos', () => {
      expect(validarFiestaIdSeguro('fiesta-123')).toBe('fiesta-123');
      expect(validarFiestaIdSeguro('..')).toBeNull();
      expect(validarFiestaIdSeguro('.')).toBeNull();
      expect(validarFiestaIdSeguro('../otra')).toBeNull();
      expect(validarFiestaIdSeguro('..\\otra')).toBeNull();
      expect(validarFiestaIdSeguro('f1/f2')).toBeNull();
      expect(validarFiestaIdSeguro('f1\\f2')).toBeNull();
      expect(validarFiestaIdSeguro('f1\0')).toBeNull();
      expect(validarFiestaIdSeguro(' f1 ')).toBeNull();
      expect(validarFiestaIdSeguro('')).toBeNull();
    });

    it('rechaza traversal (.env, package.json, otra fiesta) y lee archivos reales dentro de la carpeta permitida', async () => {
      const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpRoot);
      try {
        const buzonDirF1 = path.join(tmpRoot, 'data', 'buzon', 'f1');
        const buzonDirOtra = path.join(tmpRoot, 'data', 'buzon', 'otra-fiesta');
        const publicUploadsF1 = path.join(tmpRoot, 'public', 'uploads', 'buzon', 'f1');

        fs.mkdirSync(buzonDirF1, { recursive: true });
        fs.mkdirSync(buzonDirOtra, { recursive: true });
        fs.mkdirSync(publicUploadsF1, { recursive: true });
        fs.writeFileSync(path.join(tmpRoot, '.env'), 'SECRET=123\n', 'utf8');
        fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{"name":"ak"}\n', 'utf8');
        fs.writeFileSync(path.join(buzonDirOtra, 'ajeno.webm'), 'AJENO', 'utf8');
        fs.writeFileSync(path.join(buzonDirF1, 'saludo.webm'), 'AUDIO_OK', 'utf8');
        fs.writeFileSync(path.join(publicUploadsF1, 'publico.webm'), 'PUBLIC_OK', 'utf8');

        const allowed = getFiestaLocalAllowedDirs('buzon', 'f1');

        // Rechaza traversal y archivos fuera de la carpeta de la fiesta
        expect(resolverRutaSeguraDeFiesta('../otra-fiesta/ajeno.webm', allowed)).toBeNull();
        expect(resolverRutaSeguraDeFiesta('..\\..\\package.json', allowed)).toBeNull();
        expect(resolverRutaSeguraDeFiesta('.env', allowed)).toBeNull();
        expect(resolverRutaSeguraDeFiesta(path.join(tmpRoot, 'package.json'), allowed)).toBeNull();
        await expect(leerArchivoSeguroDeFiesta('package.json', allowed)).rejects.toThrow();
        expect(resolverRutaSeguraDeFiesta(path.join(tmpRoot, '.env'), allowed)).toBeNull();
        expect(resolverRutaSeguraDeFiesta(path.join(buzonDirOtra, 'ajeno.webm'), allowed)).toBeNull();
        expect(resolverRutaSeguraDeFiesta('/uploads/buzon/otra-fiesta/ajeno.webm', allowed)).toBeNull();

        await expect(leerArchivoSeguroDeFiesta('../../.env', allowed)).rejects.toThrow('Ruta local no permitida');
        await expect(leerArchivoSeguroDeFiesta('..\\..\\package.json', allowed)).rejects.toThrow('Ruta local no permitida');
        await expect(
          leerArchivoSeguroDeFiesta(path.join(buzonDirOtra, 'ajeno.webm'), allowed),
        ).rejects.toThrow('Ruta local no permitida');

        // Acepta archivo dentro de la carpeta de esa fiesta (relativo al dir, absoluto y /uploads/)
        const bufRel = await leerArchivoSeguroDeFiesta('saludo.webm', allowed);
        expect(bufRel.toString('utf8')).toBe('AUDIO_OK');

        const bufAbs = await leerArchivoSeguroDeFiesta(path.join(buzonDirF1, 'saludo.webm'), allowed);
        expect(bufAbs.toString('utf8')).toBe('AUDIO_OK');

        const bufPub = await leerArchivoSeguroDeFiesta('/uploads/buzon/f1/publico.webm', allowed);
        expect(bufPub.toString('utf8')).toBe('PUBLIC_OK');
      } finally {
        cwdSpy.mockRestore();
      }
    });

    it('isStorageUrlAllowed rechaza localhost, metadata IP, HTTP y dominios falsos, y acepta Storage oficial', () => {
      expect(isStorageUrlAllowed('http://127.0.0.1/secret')).toBe(false);
      expect(isStorageUrlAllowed('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isStorageUrlAllowed('https://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isStorageUrlAllowed('http://firebasestorage.googleapis.com/v0/b/demo/o/a.jpg')).toBe(false);
      expect(isStorageUrlAllowed('https://evil.example.com/foto.jpg')).toBe(false);
      expect(isStorageUrlAllowed('https://firebasestorage.googleapis.com.evil.com/foto.jpg')).toBe(false);
      expect(isStorageUrlAllowed('https://user:pass@firebasestorage.googleapis.com/v0/b/demo/o/a.jpg')).toBe(false);
      expect(isStorageUrlAllowed('')).toBe(false);

      expect(isStorageUrlAllowed('https://firebasestorage.googleapis.com/v0/b/demo/o/foto.jpg?alt=media')).toBe(true);
      expect(isStorageUrlAllowed('https://storage.googleapis.com/demo-bucket/foto.jpg')).toBe(true);
      expect(isStorageUrlAllowed('https://demo-ak.firebasestorage.app/o/foto.jpg')).toBe(true);
      expect(isStorageUrlAllowed('https://firebasestorage.app/o/foto.jpg')).toBe(true);
    });
  });

  describe('2. decodeGoogleState y GET /api/google/oauth/callback', () => {
    it('decodeGoogleState devuelve null si falta, tiene HMAC alterado, formato inválido o iat expirado', () => {
      expect(decodeGoogleState(null)).toBeNull();
      expect(decodeGoogleState('')).toBeNull();
      expect(decodeGoogleState('formato_sin_punto')).toBeNull();
      expect(decodeGoogleState('a.b.c')).toBeNull();

      const valid = encodeGoogleState({ kind: 'company', uid: 'dueno-1', returnTo: '/settings/google-workspace' });
      const [payload, sig] = valid.split('.');
      const tamperedSig = `${sig.slice(0, -1)}${sig.endsWith('0') ? '1' : '0'}`;
      expect(decodeGoogleState(`${payload}.${tamperedSig}`)).toBeNull();
      expect(decodeGoogleState(`${payload}.firma_mala`)).toBeNull();

      const expired = encodeGoogleState({
        kind: 'company',
        uid: 'dueno-1',
        iat: Date.now() - 31 * 60 * 1000,
      });
      expect(decodeGoogleState(expired)).toBeNull();

      const decoded = decodeGoogleState(valid);
      expect(decoded).toEqual(
        expect.objectContaining({
          kind: 'company',
          uid: 'dueno-1',
          returnTo: '/settings/google-workspace',
        }),
      );
    });

    it('GET /api/google/oauth/callback rechaza firma mala y uid distinto sin intercambiar tokens', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'no-debe-usarse' }), { status: 200 }),
      );

      try {
        // Sin sesión -> 401
        const unauthReq = new NextRequest('http://localhost:3000/api/google/oauth/callback?state=firma_mala&code=abc');
        const unauthRes = await googleOAuthCallbackGET(unauthReq);
        expect(unauthRes.status).toBe(401);

        // Con sesión válida pero state con firma mala -> redirect con error esperado y sin fetch
        sesionActual = { success: true, user: DUENO };
        const badStateReq = new NextRequest('http://localhost:3000/api/google/oauth/callback?state=firma_mala&code=abc');
        const badStateRes = await googleOAuthCallbackGET(badStateReq);
        expect(badStateRes.status).toBeGreaterThanOrEqual(300);
        expect(badStateRes.status).toBeLessThan(400);
        const badLocation = badStateRes.headers.get('location') || '';
        const badRedirectUrl = new URL(badLocation);
        expect(badRedirectUrl.pathname).toBe('/settings/google-workspace');
        expect(badRedirectUrl.searchParams.get('error')).toContain('El enlace venció, volvé a conectar');
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(saveGoogleWorkspaceAccountFromOAuthMock).not.toHaveBeenCalled();

        // Con sesión válida pero state.uid !== session.user.userId -> también rechaza sin intercambiar tokens
        const otherUidState = encodeGoogleState({
          kind: 'company',
          uid: 'otro-usuario',
          returnTo: '/settings/google-workspace',
        });
        const wrongUidReq = new NextRequest(
          `http://localhost:3000/api/google/oauth/callback?state=${encodeURIComponent(otherUidState)}&code=abc`,
        );
        const wrongUidRes = await googleOAuthCallbackGET(wrongUidReq);
        expect(wrongUidRes.status).toBeGreaterThanOrEqual(300);
        expect(wrongUidRes.status).toBeLessThan(400);
        const wrongUidUrl = new URL(wrongUidRes.headers.get('location') || '');
        expect(wrongUidUrl.searchParams.get('error')).toContain('El enlace venció, volvé a conectar');
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(saveGoogleWorkspaceAccountFromOAuthMock).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe('3. Handlers HTTP de las 4 descargas: auth, permisos, traversal y SSRF', () => {
    it('sin sesión devuelven 401 en las 4 rutas de descarga', async () => {
      sesionActual = { success: false };
      const req = new NextRequest('http://localhost:3000/api/test');

      expect((await downloadBuzonGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(401);
      expect((await downloadSocialGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(401);
      expect((await downloadRecuerdosGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(401);
      expect(
        (await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-ok.pdf'] }) })).status,
      ).toBe(401);
    });

    it('personal sin permiso y operador ajeno son rechazados en las 4 descargas', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      for (const user of [PERSONAL, OPERADOR_AJENO]) {
        sesionActual = { success: true, user };
        expect((await downloadBuzonGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(403);
        expect((await downloadSocialGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(403);
        expect((await downloadRecuerdosGET(req, { params: Promise.resolve({ fiestaId: 'f1' }) })).status).toBe(403);
        // documentos-fiesta verifica esDelEquipoDeLaFiesta || verifyPortalSession -> 401 si no es del equipo de la fiesta
        expect(
          (await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-ok.pdf'] }) })).status,
        ).toBe(401);
      }

      // Incluso con sesión de portal de cliente, download-all.zip y documentos no listados devuelven 403
      sesionActual = { success: false };
      portalAutorizado = true;
      expect(
        (await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'download-all.zip'] }) })).status,
      ).toBe(403);
      expect(
        (await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'otro-archivo.pdf'] }) })).status,
      ).toBe(403);
    });

    it('bloquea paths fuera de carpeta de fiesta y URLs SSRF en buzon, social-gallery, download-recuerdos y documentos-fiesta', async () => {
      sesionActual = { success: true, user: DUENO };
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('FAIL', { status: 200 }));

      try {
        // A) Buzón: messageId traversal y SSRF devuelven 400, y en ZIP se omiten sin llamar a fetch
        buzonMensajesMock = [
          {
            id: 'msg-trav',
            fiestaId: 'f1',
            authorName: 'Ana',
            mediaType: 'audio',
            mediaUrl: '../../.env',
            storagePath: 'a.webm',
          },
          {
            id: 'msg-ssrf',
            fiestaId: 'f1',
            authorName: 'Luis',
            mediaType: 'audio',
            mediaUrl: 'http://169.254.169.254/latest/meta-data/',
            storagePath: 'b.webm',
          },
        ];

        const buzonTravRes = await downloadBuzonGET(
          new Request('http://localhost:3000/api/buzon/f1/download?messageId=msg-trav'),
          { params: Promise.resolve({ fiestaId: 'f1' }) },
        );
        expect(buzonTravRes.status).toBe(400);

        const buzonSsrfRes = await downloadBuzonGET(
          new Request('http://localhost:3000/api/buzon/f1/download?messageId=msg-ssrf'),
          { params: Promise.resolve({ fiestaId: 'f1' }) },
        );
        expect(buzonSsrfRes.status).toBe(400);

        const buzonZipRes = await downloadBuzonGET(
          new Request('http://localhost:3000/api/buzon/f1/download'),
          { params: Promise.resolve({ fiestaId: 'f1' }) },
        );
        expect(buzonZipRes.status).toBe(200);
        const buzonZip = await JSZip.loadAsync(Buffer.from(await buzonZipRes.arrayBuffer()));
        expect(Object.keys(buzonZip.files)).toHaveLength(0);
        expect(fetchSpy).not.toHaveBeenCalled();

        // B) Social gallery: traversal y SSRF se omiten y se reportan en ESTADO_DE_FOTOS.txt
        socialZipPhotosMock = [
          { id: 'p-trav', name: 'trav.jpg', path: '../../../package.json', approved: true },
          { id: 'p-ssrf', name: 'ssrf.jpg', path: 'http://127.0.0.1:8080/internal', approved: true },
        ];
        const socialRes = await downloadSocialGET(
          new Request('http://localhost:3000/api/social-gallery/f1/download'),
          { params: Promise.resolve({ fiestaId: 'f1' }) },
        );
        expect(socialRes.status).toBe(200);
        const socialZip = await JSZip.loadAsync(Buffer.from(await socialRes.arrayBuffer()));
        const estadoTexto = await socialZip.file('ESTADO_DE_FOTOS.txt')?.async('string');
        expect(estadoTexto).toContain('Fotos incluidas en este archivo ZIP: 0');
        expect(estadoTexto).toContain('URL no permitida por seguridad');
        expect(estadoTexto).toContain('Ruta local no permitida');
        expect(fetchSpy).not.toHaveBeenCalled();

        // C) download-recuerdos: traversal y SSRF en posts y dedicatorias se omiten sin fetch
        socialPostsMock = [
          {
            id: 'post-trav',
            authorName: 'Ana',
            mediaType: 'photo',
            imageUrl: '../../../.env',
          },
          {
            id: 'post-ssrf',
            authorName: 'Luis',
            mediaType: 'photo',
            imageUrl: 'http://169.254.169.254/latest/meta-data/',
          },
        ];
        dedicationsMock = [
          {
            id: 'ded-ssrf',
            authorName: 'Sol',
            audioUrl: 'http://127.0.0.1/secret.wav',
          },
        ];
        const recuerdosRes = await downloadRecuerdosGET(
          new Request('http://localhost:3000/api/fiestas/f1/download-recuerdos'),
          { params: Promise.resolve({ fiestaId: 'f1' }) },
        );
        expect(recuerdosRes.status).toBe(200);
        const recuerdosZip = await JSZip.loadAsync(Buffer.from(await recuerdosRes.arrayBuffer()));
        const archivosReales = Object.values(recuerdosZip.files).filter((f) => !f.dir);
        expect(archivosReales).toHaveLength(0);
        expect(fetchSpy).not.toHaveBeenCalled();

        // D) documentos-fiesta: rechaza traversal en params y omite rutas/URLs inseguras en download-all.zip
        const docTravRes = await downloadDocFiestaGET(
          new NextRequest('http://localhost:3000/api/documentos-fiesta/f1/..'),
          { params: Promise.resolve({ parts: ['f1', '../../.env'] }) },
        );
        expect(docTravRes.status).toBe(400);

        const fiestaTravRes = await downloadDocFiestaGET(
          new NextRequest('http://localhost:3000/api/documentos-fiesta/..'),
          { params: Promise.resolve({ parts: ['..', 'package.json'] }) },
        );
        expect(fiestaTravRes.status).toBe(400);

        almacen['fiestas/f1.json'] = {
          ...copia(FIESTA_BASE),
          othersDocumentos: [
            { fileName: '../otro.pdf' },
            { fileName: 'http://127.0.0.1/privado.pdf' },
          ],
        };
        const docAllRes = await downloadDocFiestaGET(
          new NextRequest('http://localhost:3000/api/documentos-fiesta/f1/download-all.zip'),
          { params: Promise.resolve({ parts: ['f1', 'download-all.zip'] }) },
        );
        expect(docAllRes.status).toBe(404);
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe('4. POST /api/multiagent/message y POST /api/asistente/voz-parte', () => {
    it('multiagent/message bloquea sin sesión (401), a personal (403), sin permiso contable (403) y fiesta ajena (403)', async () => {
      const makeReq = (body: Record<string, unknown>) =>
        new NextRequest('http://localhost:3000/api/multiagent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

      sesionActual = { success: false };
      expect((await multiagentMessagePOST(makeReq({ message: 'Hola' }))).status).toBe(401);

      sesionActual = { success: true, user: PERSONAL };
      expect((await multiagentMessagePOST(makeReq({ message: 'Hola' }))).status).toBe(403);

      // Operador tiene NOCHE y ORGANIZACION, pero NO tiene CONTABILIDAD ni está asignado a f1
      sesionActual = { success: true, user: OPERADOR_ASIGNADO };
      const resContable = await multiagentMessagePOST(makeReq({ message: 'Balance', agentType: 'contable' }));
      expect(resContable.status).toBe(403);
      expect((await resContable.json()).error).toContain('módulo contable');

      sesionActual = { success: true, user: OPERADOR_AJENO };
      const resFiestaAjena = await multiagentMessagePOST(makeReq({ message: 'Resumen', fiestaId: 'f1' }));
      expect(resFiestaAjena.status).toBe(403);
      expect(sendPersistentMultiAgentMessageMock).not.toHaveBeenCalled();

      // Operador asignado a f1 sí puede consultar sobre esa fiesta en agente de fiesta
      sesionActual = { success: true, user: OPERADOR_ASIGNADO };
      const resOk = await multiagentMessagePOST(makeReq({ message: 'Horario del DJ', fiestaId: 'f1', agentType: 'fiesta' }));
      expect(resOk.status).toBe(200);
      expect(sendPersistentMultiAgentMessageMock).toHaveBeenCalledTimes(1);
    });

    it('asistente/voz-parte bloquea sin sesión (401), a personal (403) y a operador ajeno a la fiesta (403)', async () => {
      const makeReq = (body: Record<string, unknown>) =>
        new NextRequest('http://localhost:3000/api/asistente/voz-parte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

      sesionActual = { success: false };
      expect((await vozPartePOST(makeReq({ texto: 'Hola' }))).status).toBe(401);

      sesionActual = { success: true, user: PERSONAL };
      expect((await vozPartePOST(makeReq({ texto: 'Hola' }))).status).toBe(403);

      sesionActual = { success: true, user: OPERADOR_AJENO };
      expect((await vozPartePOST(makeReq({ texto: 'Hola', fiestaId: 'f1' }))).status).toBe(403);

      sesionActual = { success: true, user: OPERADOR_ASIGNADO };
      const resOk = await vozPartePOST(makeReq({ texto: 'Hola', fiestaId: 'f1' }));
      expect(resOk.status).toBe(200);
      expect(resOk.headers.get('Content-Type')).toBe('audio/wav');
    });
  });

  describe('5. abrirPuertaDeLaTarea acepta TAREAS_SECRET cuando falta CRON_SECRET', () => {
    it('exige y valida TAREAS_SECRET por cabecera Bearer o query ?clave= cuando CRON_SECRET no está definido', async () => {
      const prevCron = process.env.CRON_SECRET;
      const prevTareas = process.env.TAREAS_SECRET;
      delete process.env.CRON_SECRET;
      process.env.TAREAS_SECRET = 'clave-tareas-337';

      try {
        const sinClave = await abrirPuertaDeLaTarea(
          new Request('http://localhost:3000/api/cron/asistente-proactivo'),
          'asistente-proactivo',
        );
        expect(sinClave.permitido).toBe(false);
        expect(sinClave.estado).toBe(401);

        const claveMala = await abrirPuertaDeLaTarea(
          new Request('http://localhost:3000/api/cron/asistente-proactivo', {
            headers: { Authorization: 'Bearer incorrecta' },
          }),
          'asistente-proactivo',
        );
        expect(claveMala.permitido).toBe(false);
        expect(claveMala.estado).toBe(401);

        const porHeader = await abrirPuertaDeLaTarea(
          new Request('http://localhost:3000/api/cron/asistente-proactivo', {
            headers: { Authorization: 'Bearer clave-tareas-337' },
          }),
          'asistente-proactivo',
        );
        expect(porHeader.permitido).toBe(true);
        expect(porHeader.conClave).toBe(true);

        const porQuery = await abrirPuertaDeLaTarea(
          new Request('http://localhost:3000/api/cron/asistente-proactivo?clave=clave-tareas-337'),
          'asistente-proactivo',
        );
        expect(porQuery.permitido).toBe(true);
        expect(porQuery.conClave).toBe(true);
      } finally {
        if (prevCron === undefined) delete process.env.CRON_SECRET;
        else process.env.CRON_SECRET = prevCron;
        if (prevTareas === undefined) delete process.env.TAREAS_SECRET;
        else process.env.TAREAS_SECRET = prevTareas;
      }
    });
  });
});
