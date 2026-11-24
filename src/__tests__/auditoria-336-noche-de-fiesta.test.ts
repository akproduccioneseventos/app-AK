/**
 * @jest-environment jsdom
 */
import fs from 'fs';
import path from 'path';
import { hoyEnUruguay } from '@/lib/utils';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/kiosk/instalar-esta-estacion', () => ({
  InstalarEstaEstacion: () => null,
}));

jest.mock('framer-motion', () => {
  const ReactLib = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Comp = ReactLib.forwardRef(
          ({ children, ...props }: ReactLib.HTMLAttributes<HTMLElement>, ref: ReactLib.Ref<HTMLElement>) =>
            ReactLib.createElement(tag, { ...props, ref }, children),
        );
        Comp.displayName = `Motion(${tag})`;
        return Comp;
      },
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const mockUploadBuzonMessage = jest.fn(async () => ({ success: true }));
jest.mock('@/app/actions/buzon', () => ({
  uploadBuzonMessage: (...args: any[]) => mockUploadBuzonMessage(...args),
}));

jest.mock('@/app/actions/fiesta/entretenimiento.actions', () => {
  const actual = jest.requireActual('@/app/actions/fiesta/entretenimiento.actions');
  return {
    ...actual,
  };
});

const RAIZ = process.cwd();
const leer = (ruta: string) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');

describe('Orden 336 — Bloque 4 (Sección F: La noche de la fiesta, estaciones y offline)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockUploadBuzonMessage.mockClear();
  });

  it('F.1: getFiestasParaKiosco y getKioskStationGuestToken funcionan sin sesión para la fiesta de hoy y por código', async () => {
    const fechaHoy = hoyEnUruguay();
    const fiestasMock = [
      {
        id: 'fiesta_hoy',
        estado: 'Confirmada',
        codigoFiesta: 'HOY123',
        configuracion: { nombreEvento: 'Casamiento Hoy', fechaEvento: fechaHoy, horaInicio: '21:00' },
        invitados: [{ id: 'inv1', nombre: 'Secreto' }],
        others: { entretenimiento: { modules: { fotocabina: { enabled: true } } } },
      },
      {
        id: 'fiesta_futura',
        estado: 'Confirmada',
        codigoFiesta: 'FUT456',
        configuracion: { nombreEvento: 'Cumple Futuro', fechaEvento: '2099-05-10' },
        invitados: [{ id: 'inv2', nombre: 'Privado' }],
        others: { entretenimiento: { modules: { fotocabina: { enabled: true } } } },
      },
    ];

    jest.resetModules();
    jest.doMock('@/lib/fiesta/leer-fiestas', () => ({
      leerFiestasCrudas: jest.fn(async () => fiestasMock),
    }));
    jest.doMock('@/lib/auth/equipo-de-la-fiesta', () => ({
      usuarioDelEquipo: jest.fn(async () => null),
      quienEsElEquipo: jest.fn(async () => () => false),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn(async (id: string) => fiestasMock.find((f) => f.id === id) || null),
      saveFiesta: jest.fn(),
    }));
    jest.doMock('@/lib/fiesta/get-fiesta-raw', () => ({
      getFiestaByIdRaw: jest.fn(async (id: string) => fiestasMock.find((f) => f.id === id) || null),
    }));
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => {
        throw new Error('No autorizado');
      }),
      hasAppSession: jest.fn(async () => false),
      requirePermiso: jest.fn(),
    }));
    jest.doMock('@/lib/auth/event-access', () => ({
      requireEventPermission: jest.fn(async () => {
        throw new Error('Sin sesión');
      }),
    }));

    const { getFiestasParaKiosco } = require('@/app/actions/fiesta-actual');
    const { getKioskStationGuestToken } = require('@/app/actions/fiesta/entretenimiento.actions');
    const { verifyEntertainmentAccessToken } = require('@/lib/auth/entertainment-token');

    const resHoy = await getFiestasParaKiosco();
    expect(resHoy.success).toBe(true);
    expect(resHoy.requiereCodigo).toBe(true);
    expect(resHoy.fiestas).toHaveLength(1);
    expect(resHoy.fiestas[0].id).toBe('fiesta_hoy');
    expect((resHoy.fiestas[0] as any).invitados).toBeUndefined();

    const resCodigo = await getFiestasParaKiosco('fut456');
    expect(resCodigo.fiestas.map((f: any) => f.id)).toContain('fiesta_futura');

    const tokenHoy = await getKioskStationGuestToken('fiesta_hoy', 'fotocabina');
    expect(tokenHoy.success).toBe(true);
    expect(tokenHoy.guestToken).toBeTruthy();
    expect(verifyEntertainmentAccessToken(tokenHoy.guestToken, 'fiesta_hoy', 'fotocabina', 'guest')).toBe(true);
    expect(verifyEntertainmentAccessToken(tokenHoy.guestToken, 'fiesta_hoy', 'fotocabina', 'operator')).toBe(false);

    const tokenFuturoSinCodigo = await getKioskStationGuestToken('fiesta_futura', 'fotocabina');
    expect(tokenFuturoSinCodigo.success).toBe(false);
    expect(tokenFuturoSinCodigo.guestToken).toBeUndefined();

    const tokenFuturoConCodigo = await getKioskStationGuestToken('fiesta_futura', 'fotocabina', 'FUT456');
    expect(tokenFuturoConCodigo.success).toBe(true);
    expect(verifyEntertainmentAccessToken(tokenFuturoConCodigo.guestToken, 'fiesta_futura', 'fotocabina', 'guest')).toBe(true);
  });

  it('F.1b: KioskSetup usa getFiestasParaKiosco (sin sesión de equipo) y arma enlaces con ?access=', () => {
    const kioskSetup = leer('src/components/kiosk/kiosk-setup.tsx');
    expect(kioskSetup).not.toContain('getFiestas(false)');
    expect(kioskSetup).toContain('getFiestasParaKiosco');
    expect(kioskSetup).toContain('getKioskStationGuestToken');
    expect(kioskSetup).toContain('?access=${encodeURIComponent(accessToken)}');
  });

  it('F.2: Barra no corta cámara ni micrófono al cambiar isRecording', () => {
    const barra = leer('src/app/evento/barra/[fiestaId]/page.tsx');
    expect(barra).toContain('isRecordingRef');
    expect(barra).toMatch(/const stopCamera = useCallback\([\s\S]*?\}, \[\]\);/);
  });

  it('F.3: Buzón sin señal envía isTimeCapsule, unlockYears y durationSeconds que lee el servidor', async () => {
    const pendingItems = [
      {
        id: 'off_buzon_1',
        fiestaId: 'fiesta_buzon',
        moduleId: 'buzon',
        fileBlob: new Blob(['audio-data'], { type: 'audio/webm' }),
        fileName: 'saludo.webm',
        mimeType: 'audio/webm',
        createdAt: new Date().toISOString(),
        authorName: 'Lucía',
        accessToken: 'acc_buzon',
        metadata: {
          mediaType: 'audio',
          durationSeconds: 27,
          isTimeCapsule: true,
          unlockYears: 5,
          timeCapsuleYears: 5,
          recipientNote: 'Abrir en 5 años',
        },
        attempts: 0,
      },
    ];

    jest.resetModules();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    jest.doMock('@/lib/offline/offline-db', () => ({
      getPendingOfflineMedia: jest.fn(async () => pendingItems),
      removeOfflineMedia: jest.fn(async () => {}),
      reclamarOfflineMediaParaSubir: jest.fn(async () => true),
      anotarRescate: jest.fn(),
      updateOfflineMediaAttempt: jest.fn(async () => {}),
    }));
    const uploadSpy = jest.fn(async () => ({ success: true }));
    jest.doMock('@/app/actions/buzon', () => ({
      uploadBuzonMessage: uploadSpy,
    }));

    const { processOfflineMediaQueue } = require('@/lib/offline/offline-sync-manager');
    const res = await processOfflineMediaQueue({ fiestaId: 'fiesta_buzon' });

    expect(res.processed).toBe(1);
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const sentFormData: FormData = uploadSpy.mock.calls[0][0];
    expect(sentFormData.get('isTimeCapsule')).toBe('true');
    expect(sentFormData.get('unlockYears')).toBe('5');
    expect(sentFormData.get('durationSeconds')).toBe('27');
    expect(sentFormData.get('recipientNote')).toBe('Abrir en 5 años');

    const buzonClient = leer('src/app/evento/buzon/[fiestaId]/page.tsx');
    expect(buzonClient).toContain('durationSeconds: snapshotDurationSeconds');
    expect(buzonClient).toContain('isTimeCapsule: snapshotIsTimeCapsule || undefined');
    expect(buzonClient).toContain('unlockYears: snapshotIsTimeCapsule ? snapshotUnlockYears : undefined');
  });

  it('F.4: Espejo Mágico reinicia consentAccepted en retake() y muestra KioskUnlockButton sin ?kiosk=1', () => {
    const espejo = leer('src/app/evento/espejo-magico/[fiestaId]/page.tsx');
    const retakeSlice = espejo.slice(espejo.indexOf('const retake = () =>'), espejo.indexOf('useEffect(() => {\r\n    takePhotoRef'));
    expect(retakeSlice).toContain('setConsentAccepted(false)');
    expect(espejo).not.toContain('showKioskUnlock');
    expect(espejo).toContain('<KioskUnlockButton />');
  });

  it('F.5: Impresión móvil espera la imagen antes de window.print y marca printed recién tras confirmar', () => {
    const impresion = leer('src/app/evento/impresion/[fiestaId]/page.tsx');
    expect(impresion).toContain('await waitForImageToLoad(post.imageUrl)');
    const mobileBtnSlice = impresion.slice(
      impresion.indexOf('Imprimir'),
      impresion.indexOf('Cantar #'),
    );
    expect(mobileBtnSlice).not.toContain("updateMobilePrintStatus(fiestaId, req.id, 'printed')");
    const confirmSlice = impresion.slice(
      impresion.indexOf('const confirmPrinted ='),
      impresion.indexOf('const retryPrint ='),
    );
    expect(confirmSlice).toContain("updateMobilePrintStatus(fiestaId, mobileId, 'printed')");
  });

  it('F.6a y F.6c: offline-db cierra conexiones, SyncStatusIndicator no lee cada 3s y offline-action-queue tiene candado y relanza QuotaExceededError', async () => {
    const offlineDbCode = leer('src/lib/offline/offline-db.ts');
    expect(offlineDbCode).toContain('closeDatabase(db)');
    expect(offlineDbCode).toContain("database.transaction(STORE_NAME, 'readonly')");

    const syncIndicatorCode = leer('src/components/offline/sync-status-indicator.tsx');
    expect(syncIndicatorCode).not.toContain('}, 3000)');
    expect(syncIndicatorCode).toContain('15000');

    jest.resetModules();
    const { enqueueOfflineAction, flushOfflineQueue } = require('@/lib/offline/offline-action-queue');
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    });

    try {
      expect(() =>
        enqueueOfflineAction({
          id: 'act_quota',
          type: 'barra_pedido',
          fiestaId: 'f1',
          payload: {},
        }),
      ).toThrow();
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }

    localStorage.clear();
    enqueueOfflineAction({
      id: 'act_lock_1',
      type: 'barra_pedido',
      fiestaId: 'f1',
      payload: {},
    });

    let calls = 0;
    let resolveSlow!: (val: { success: boolean }) => void;
    const p1 = flushOfflineQueue(
      () =>
        new Promise((resolve) => {
          calls++;
          resolveSlow = resolve;
        }),
    );
    const p2 = flushOfflineQueue(async () => {
      calls++;
      return { success: true };
    });

    await Promise.resolve();
    const res2 = await p2;
    expect(res2.processed).toBe(0);
    expect(calls).toBe(1);

    resolveSlow({ success: true });
    const res1 = await p1;
    expect(res1.processed).toBe(1);
  });

  it('F.6b, F.6d, F.6e, F.6f, F.6g, F.6h, F.6i: fugas de AudioContext/blob, extractor facial, fotocabina, álbum, Touchpix QR y next.config.js', () => {
    // F.6b AudioContext close y URL.revokeObjectURL
    for (const file of [
      'src/app/evento/fotocabina/[fiestaId]/page.tsx',
      'src/app/evento/espejo-magico/[fiestaId]/page.tsx',
      'src/app/evento/touchpix/[fiestaId]/page.tsx',
      'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx',
      'src/app/evento/plataforma-360/[fiestaId]/page.tsx',
      'src/app/evento/bogue/[fiestaId]/page.tsx',
      'src/app/evento/barra/[fiestaId]/barman/page.tsx',
    ]) {
      const code = leer(file);
      expect(code).toContain('.close()');
    }

    expect(leer('src/app/evento/fotocabina/[fiestaId]/page.tsx')).toContain('URL.revokeObjectURL(videoRecuerdoUrl)');
    expect(leer('src/app/evento/plataforma-360/[fiestaId]/page.tsx')).toContain('URL.revokeObjectURL(finalVideoUrl)');
    expect(leer('src/app/evento/bogue/[fiestaId]/page.tsx')).toContain('URL.revokeObjectURL(finalVideoUrl)');

    // Video de vida: no ?t= sobre blob:
    const videoVida = leer('src/app/evento/video-vida/[fiestaId]/page.tsx');
    expect(videoVida).toContain("url.startsWith('blob:')");
    expect(videoVida).toContain('URL.revokeObjectURL');

    // F.6d Extractor facial no corta a los 1000 ms
    const extractor = leer('src/lib/caras/extractor-facial.ts');
    expect(extractor).not.toContain('1000)');
    expect(extractor).toContain('8000');

    // F.6e Fotocabina respeta fotosPorTanda
    const fotocabina = leer('src/app/evento/fotocabina/[fiestaId]/page.tsx');
    expect(fotocabina).toContain('if (fotosDeLaTanda.length < limiteFotos) return;');
    expect(fotocabina).toContain('Foto {fotoEnCurso} de {fiesta?.station.fotosPorTanda || FOTOS_POR_TANDA}');
    expect(fotocabina).not.toContain("'Tus tres fotos'");

    // F.6f y F.6g Álbum: pausa música en unmount y dibuja caras agrupadas
    const album = leer('src/app/evento/album/[fiestaId]/page.tsx');
    expect(album).toContain('audioRef.current?.pause()');
    expect(album).toContain('data-testid="album-grilla-caras"');
    expect(album).toContain('personasCaras.map');

    // F.6h Touchpix QR limpia access de operador y role=operator
    const { sanitizarUrlCompartirTouchpix } = require('@/lib/entertainment/touchpix-share-url');
    const { createEntertainmentAccessToken } = require('@/lib/auth/entertainment-token');
    const opToken = createEntertainmentAccessToken('f1', 'espejoMagicoIA', 'operator');
    const guestToken = createEntertainmentAccessToken('f1', 'espejoMagicoIA', 'guest');

    const cleanedOp = sanitizarUrlCompartirTouchpix(
      `https://akproducciones.uy/evento/touchpix/f1?role=operator&access=${encodeURIComponent(opToken)}&kiosk=1&guestId=g1`,
    );
    expect(cleanedOp).toBe('https://akproducciones.uy/evento/touchpix/f1');

    const cleanedGuest = sanitizarUrlCompartirTouchpix(
      `https://akproducciones.uy/evento/touchpix/f1?access=${encodeURIComponent(guestToken)}&kiosk=1`,
    );
    expect(cleanedGuest).toContain(`access=${encodeURIComponent(guestToken)}`);
    expect(cleanedGuest).not.toContain('kiosk=1');

    // F.6i next.config.js excluye rutas internas de la caché sin conexión
    const nextConfigCode = leer('next.config.js');
    expect(nextConfigCode).toContain('/admin');
    expect(nextConfigCode).toContain('/contabilidad');
    expect(nextConfigCode).toContain('/fiestas');
    expect(nextConfigCode).toContain('/portal');
  });
});
