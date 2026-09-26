/**
 * MATAFUEGO — Orden 91 (Codex, 26 de septiembre de 2026): la captura de la cabina con IA
 * sobrevive a un servidor lento y a una IA lenta.
 *
 * P1. La original se guardaba en el equipo recién cuando el servidor contestaba el "grabando":
 *     con el servidor colgado, recargar la perdía. Se prueba con el `handleCapture` REAL,
 *     extraído del archivo, y el aviso al servidor retenido sin contestar.
 * P2. La original quedaba retenida tres minutos fijos: con la IA lenta se publicaban la original
 *     y el resultado. Se prueban la cola REAL y `terminarTrabajoIA` REAL sobre una base de mentira
 *     que devuelve copias y decide con las reglas reales (`sePuedeRetener`, `sePuedeReclamar`).
 *
 * Se probó rompiéndolo: volviendo a esperar el aviso antes de guardar, P1 se pone en rojo; y
 * sacando el reclamo de la cola, "la IA tarda diez minutos" publica dos fotos.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const PAGINA = path.join(process.cwd(), 'src/app/evento/touchpix/[fiestaId]/page.tsx');

function extraer(nombre: string): string {
  const texto = fs.readFileSync(PAGINA, 'utf8');
  const fuente = ts.createSourceFile(PAGINA, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let hallado = '';
  const recorrer = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && n.name.getText(fuente) === nombre) hallado = n.getText(fuente);
    ts.forEachChild(n, recorrer);
  };
  recorrer(fuente);
  if (!hallado) throw new Error(`No está ${nombre} en la pantalla`);
  return ts.transpileModule(`const ${hallado}; globalThis.fn = ${nombre};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText;
}

describe('P1: la original se guarda aunque el servidor no conteste', () => {
  for (const pestaña of ['ai_themes', 'faceswap']) {
    it(`${pestaña}: con el aviso al servidor colgado, la original ya está en el equipo y el trabajo en la fila`, async () => {
      let contestar!: (v: unknown) => void;
      const avisoColgado = new Promise((r) => { contestar = r; });
      let guardadas = 0;
      let trabajos: any[] = [];
      let ids = 0;
      const ctx: Record<string, any> = {
        useCallback: (f: any) => f,
        captureRawPhoto: () => 'data:image/jpeg;base64,AA==',
        updateEntertainmentSessionStatus: () => avisoColgado,
        fiestaId: 'f1', accessToken: 'op', session: { captureId: 'cap-vieja' },
        setRawCapturedImage: () => {}, setProcessingResult: () => {}, stopCamera: () => {},
        activeTab: pestaña, selectedTheme: 'none', selectedCharacter: 'pj', selectedAiTheme: 'tema',
        TOUCHPIX_THEMES: [{ id: 'tema', label: 'Tema' }],
        FACE_SWAP_CHARACTERS: [{ id: 'pj', label: 'Personaje', filter: 'none', frameEmojis: [], emoji: '' }],
        applyFilterToCanvas: () => {},
        consentAccepted: true, guestId: 'inv-a', guestAccessToken: 'tok-a',
        guardarOriginalRetenida: async () => { guardadas++; return `orig-${guardadas}`; },
        capturasDeSesionRef: { current: new Map() },
        liberarEstacion: () => {},
        setTrabajosIA: (f: any) => { trabajos = f(trabajos); },
        setUltimoAvisoIA: () => {},
        crypto: { randomUUID: () => `job-${++ids}` },
        Date,
      };
      vm.runInNewContext(extraer('handleCapture'), ctx);

      // Dos capturas seguidas con el servidor sin contestar.
      await ctx.fn();
      await ctx.fn();
      expect(guardadas).toBe(2);
      expect(trabajos.map((t) => t.originalEnEquipoId)).toEqual(['orig-1', 'orig-2']);

      // Cuando contesta, cada trabajo sabe de qué captura de la sesión salió.
      contestar({ success: true, captureId: 'cap-nueva' });
      await expect(ctx.capturasDeSesionRef.current.get('job-1')).resolves.toBe('cap-nueva');
    });
  }
});

// ── P2 ─────────────────────────────────────────────────────────────────────────────────────
type Item = Record<string, any>;
let base: Map<string, Item>;
let ahora: number;
const enviados: string[] = [];

jest.mock('@/lib/offline/offline-db', () => {
  const real = jest.requireActual('@/lib/offline/offline-db');
  const copia = (x: Item | undefined) => (x ? { ...x } : undefined);
  return {
    ...real,
    getPendingOfflineMedia: async () => [...base.values()].map((x) => copia(x)!),
    removeOfflineMedia: async (id: string) => { base.delete(id); },
    updateOfflineMediaAttempt: async (id: string) => {
      const x = base.get(id);
      if (x) { delete x.subiendoDesde; x.attempts++; }
    },
    renovarRetencionOfflineMedia: async (id: string, hasta: string) => {
      const x = copia(base.get(id));
      if (!real.sePuedeRetener(x)) return false;
      base.set(id, { ...x!, retenidaHasta: hasta });
      return true;
    },
    reclamarOfflineMediaParaSubir: async (id: string) => {
      const x = copia(base.get(id));
      if (!real.sePuedeReclamar(x, ahora)) return false;
      base.set(id, { ...x!, subiendoDesde: new Date(ahora).toISOString() });
      return true;
    },
  };
});
jest.mock('@/app/actions/touchpix-ai', () => ({
  uploadTouchpixPhoto: async (f: FormData) => { enviados.push((f.get('file') as File).name); return { success: true }; },
}));
jest.mock('@/app/actions/fiesta/entretenimiento.actions', () => ({}));
jest.mock('@/app/actions/buzon', () => ({}));
jest.mock('@/app/actions/fiesta/video-vida.actions', () => ({}));

describe('P2: una sola foto por captura, aunque la IA tarde', () => {
  const RETENCION = 3 * 60_000;
  let db: typeof import('@/lib/offline/offline-db');
  let cola: typeof import('@/lib/offline/offline-sync-manager');
  let terminar: typeof import('@/lib/touchpix/terminar-trabajo-ia');

  beforeAll(() => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    db = require('@/lib/offline/offline-db');
    cola = require('@/lib/offline/offline-sync-manager');
    terminar = require('@/lib/touchpix/terminar-trabajo-ia');
  });
  beforeEach(() => {
    ahora = Date.parse('2026-09-26T22:00:00Z');
    jest.spyOn(Date, 'now').mockImplementation(() => ahora);
    enviados.length = 0;
    base = new Map([['orig', {
      id: 'orig', fiestaId: 'f1', moduleId: 'touchpix', fileBlob: new Blob(['o']), fileName: 'original.jpg',
      mimeType: 'image/jpeg', authorName: 'Cabina', createdAt: new Date(ahora).toISOString(), attempts: 0,
      retenidaHasta: new Date(ahora + RETENCION).toISOString(),
    }]]);
  });
  afterEach(() => jest.restoreAllMocks());

  const fin = () => terminar.terminarTrabajoIA({
    subir: async () => { enviados.push('resultado-ia.jpg'); return { success: true }; },
    guardarEnEquipo: async () => undefined,
    soltarOriginal: async () => { base.delete('orig'); },
    retenerOriginal: () => db.renovarRetencionOfflineMedia('orig', new Date(ahora + RETENCION).toISOString()),
  });

  it('la IA tarda diez minutos con la pantalla viva: la cola no sube la original y sale sólo el resultado', async () => {
    for (let minuto = 1; minuto <= 10; minuto++) {
      ahora += 60_000;
      await db.renovarRetencionOfflineMedia('orig', new Date(ahora + RETENCION).toISOString()); // el latido
      await cola.processOfflineMediaQueue({ fiestaId: 'f1' });
    }
    expect(enviados).toEqual([]);
    const r = await fin();
    expect(r.destino).toBe('subida');
    expect(enviados).toEqual(['resultado-ia.jpg']);
  });

  it('la pantalla se cerró: a los tres minutos sale la original, y si la IA vuelve tarde no se sube el resultado', async () => {
    ahora += RETENCION + 1;
    await cola.processOfflineMediaQueue({ fiestaId: 'f1' });
    expect(enviados).toEqual(['original.jpg']);
    const r = await fin();
    expect(r.destino).toBe('publicada-la-original');
    expect(enviados).toEqual(['original.jpg']);
  });

  it('la cola la reclamó y está subiendo cuando termina la IA: el trabajo no sube el resultado', async () => {
    ahora += RETENCION + 1;
    await db.reclamarOfflineMediaParaSubir('orig');
    const r = await fin();
    expect(r.destino).toBe('publicada-la-original');
    expect(enviados).toEqual([]);
  });

  it('otra pestaña está subiendo la original: esta vuelta de la cola no la manda de nuevo', async () => {
    ahora += RETENCION + 1;
    await db.reclamarOfflineMediaParaSubir('orig');
    await cola.processOfflineMediaQueue({ fiestaId: 'f1' });
    expect(enviados).toEqual([]);
  });

  it('las reglas: una original reclamada no se puede volver a retener, y un reclamo viejo se retoma', () => {
    const t = Date.now();
    expect(db.sePuedeRetener({ subiendoDesde: new Date(t).toISOString() } as any)).toBe(false);
    expect(db.sePuedeRetener(undefined)).toBe(false);
    expect(db.sePuedeReclamar({ retenidaHasta: new Date(t + 1).toISOString() } as any, t)).toBe(false);
    expect(db.sePuedeReclamar({ subiendoDesde: new Date(t - db.RECLAMO_DE_SUBIDA_MS - 1).toISOString() } as any, t)).toBe(true);
  });

  it('el latido de la pantalla renueva las originales de los trabajos vivos, y no las de los terminados', () => {
    const renovadas: string[] = [];
    const ctx: Record<string, any> = {
      useCallback: (f: any) => f, Date, RETENCION_DE_LA_ORIGINAL_MS: RETENCION,
      renovarRetencionOfflineMedia: async (id: string) => { renovadas.push(id); return true; },
      trabajosIARef: { current: [
        { originalEnEquipoId: 'a', estado: 'pendiente' },
        { originalEnEquipoId: 'b', estado: 'procesando' },
        { originalEnEquipoId: 'c', estado: 'completado' },
        { originalEnEquipoId: 'd', estado: 'error' },
        { estado: 'pendiente' },
      ] },
    };
    vm.runInNewContext(extraer('renovarOriginalesVivas'), ctx);
    ctx.fn();
    expect(renovadas).toEqual(['a', 'b']);
    // Y la pantalla lo llama cada minuto: con tres de retención, dos latidos pueden fallar.
    expect(fs.readFileSync(PAGINA, 'utf8')).toMatch(/setInterval\(renovarOriginalesVivas, 60_000\)/);
  });

  it('el aviso al invitado dice que se publicó la original', () => {
    expect(terminar.avisoDelDestino('publicada-la-original', true)).toMatch(/original/);
  });
});
