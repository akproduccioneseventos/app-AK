/**
 * MATAFUEGO — La cabina con IA dice dónde quedó la foto de verdad (devolución 89, Codex).
 *
 * Antes, todos los caminos terminaban en "¡Foto lista en la galería!": con la señal caída, con la
 * foto rechazada y con el equipo sin lugar para guardarla.
 *
 * Se probó rompiéndolo: haciendo que `terminarTrabajoIA` devuelva siempre `subida`, se ponen en
 * rojo "sin señal", "rechazada" y "sin lugar en el equipo".
 */
import { terminarTrabajoIA, avisoDelDestino } from '@/lib/touchpix/terminar-trabajo-ia';

function pasos(subir: () => Promise<{ success: boolean; error?: string }>, guardar: () => Promise<unknown> = async () => 'ok') {
  const hechos: string[] = [];
  return {
    hechos,
    p: {
      subir: async () => { hechos.push('subir'); return subir(); },
      guardarEnEquipo: async () => { hechos.push('guardar'); return guardar(); },
      soltarOriginal: async () => { hechos.push('soltar-original'); },
    },
  };
}

describe('La cabina con IA no anuncia fotos que no están', () => {
  it('subida: dice que está en la galería y suelta la original (no se publican dos)', async () => {
    const { p, hechos } = pasos(async () => ({ success: true }));
    const r = await terminarTrabajoIA(p);
    expect(r.destino).toBe('subida');
    expect(hechos).toEqual(['subir', 'soltar-original']);
    expect(avisoDelDestino(r.destino, true)).toMatch(/galería/);
  });

  it('sin señal: queda en el equipo, NO dice que está en la galería', async () => {
    const { p, hechos } = pasos(async () => { throw new Error('Failed to fetch'); });
    const r = await terminarTrabajoIA(p);
    expect(r.destino).toBe('en-el-equipo');
    expect(hechos).toEqual(['subir', 'guardar', 'soltar-original']);
    expect(avisoDelDestino(r.destino, true)).not.toMatch(/ya se subió|en la galería/);
  });

  it('rechazada por una regla: no la guarda para reintentar, no la anuncia, y la original tampoco sube', async () => {
    const { p, hechos } = pasos(async () => ({ success: false, error: 'Contenido inapropiado' }));
    const r = await terminarTrabajoIA(p);
    expect(r.destino).toBe('rechazada');
    expect(hechos).toEqual(['subir', 'soltar-original']);
    expect(avisoDelDestino(r.destino, true)).toMatch(/no se pudo publicar/);
  });

  it('sin lugar en el equipo: no-guardada, y la original NO se suelta (sube ella cuando pueda)', async () => {
    const { p, hechos } = pasos(async () => { throw new Error('Failed to fetch'); }, async () => { throw new Error('QuotaExceededError'); });
    const r = await terminarTrabajoIA(p);
    expect(r.destino).toBe('no-guardada');
    expect(hechos).not.toContain('soltar-original');
    expect(avisoDelDestino(r.destino, true)).toMatch(/Bajar foto/);
  });

  it('el servidor ya la tenía (respuesta perdida): cuenta como subida, sin guardar otra copia', async () => {
    const { p, hechos } = pasos(async () => ({ success: false, error: 'Esta imagen ya fue subida anteriormente.' }));
    const r = await terminarTrabajoIA(p);
    expect(r.destino).toBe('subida');
    expect(hechos).not.toContain('guardar');
  });

  it('el aviso dice si fue IA o efecto local', () => {
    expect(avisoDelDestino('subida', false)).toMatch(/efecto local/);
    expect(avisoDelDestino('subida', true)).not.toMatch(/efecto local/);
  });
});

// ── T89-02: la original retenida no sube mientras trabaja la IA, y sube sola si se vence ──
describe('La cola del equipo respeta la original retenida', () => {
  const ahora = Date.now();
  const items = [
    { id: 'orig-retenida', fiestaId: 'f1', moduleId: 'touchpix', fileBlob: new Blob(['a']), fileName: 'o.jpg', mimeType: 'image/jpeg', authorName: 'Cabina', createdAt: new Date(ahora - 1000).toISOString(), attempts: 0, retenidaHasta: new Date(ahora + 60_000).toISOString() },
    { id: 'orig-vencida', fiestaId: 'f1', moduleId: 'touchpix', fileBlob: new Blob(['b']), fileName: 'v.jpg', mimeType: 'image/jpeg', authorName: 'Cabina', createdAt: new Date(ahora - 500).toISOString(), attempts: 0, retenidaHasta: new Date(ahora - 1).toISOString() },
  ];
  const subir = jest.fn(async () => ({ success: true }));
  beforeAll(() => {
    jest.resetModules();
    jest.doMock('@/lib/offline/offline-db', () => ({
      getPendingOfflineMedia: jest.fn(async () => items),
      removeOfflineMedia: jest.fn(async () => undefined),
      updateOfflineMediaAttempt: jest.fn(async () => undefined),
    }));
    jest.doMock('@/app/actions/touchpix-ai', () => ({ uploadTouchpixPhoto: subir }));
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
  });

  it('sube la vencida y deja la retenida para después', async () => {
    const { processOfflineMediaQueue } = require('@/lib/offline/offline-sync-manager');
    await processOfflineMediaQueue({ fiestaId: 'f1' });
    const nombres = subir.mock.calls.map((c: any[]) => (c[0] as FormData).get('file') as File).map((f) => f.name);
    expect(nombres).toEqual(['v.jpg']);
  });
});
