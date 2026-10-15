/** @jest-environment node */
/**
 * DOS PERSONAS GUARDANDO LA FIESTA A LA VEZ: NO SE PIERDE NINGUNA (pregunta 22 de COMO-AUDITAR.md).
 *
 * El defecto, 13 de octubre de 2026: muchas acciones leian la fiesta AFUERA del turno, le
 * cambiaban una sub-lista y guardaban la fiesta (o la lista) armada con esa lectura. Con dos
 * personas a la vez, la segunda guardaba la lista vieja con lo suyo y la primera desaparecia;
 * las dos pantallas decian "guardado".
 *
 * Aca el almacenamiento simulado devuelve COPIAS (como la base de verdad), las transacciones
 * son optimistas (si alguien escribio en el medio, se reintenta) y hay una BARRERA: las dos
 * primeras lecturas esperan a que lleguen las dos (A lee, B lee, A escribe, B escribe).
 *
 * Se probo rompiendolo: con `addTarea` leyendo afuera y guardando con `updateFiestaPartial`
 * (el codigo viejo), la primera se pone en rojo.
 */
process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const almacen: Record<string, any> = {};
const version: Record<string, number> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── La barrera: las dos primeras lecturas esperan a la otra (con tope, por si la otra no llega).
let barreraActiva = false;
let llegaron = 0;
let soltar!: () => void;
let puerta: Promise<void>;
function armarBarrera() {
  barreraActiva = true;
  llegaron = 0;
  puerta = new Promise<void>((r) => { soltar = r; });
}
async function barrera() {
  if (!barreraActiva) return;
  llegaron++;
  if (llegaron > 2) return;
  if (llegaron === 2) soltar();
  await Promise.race([puerta, dormir(60)]);
}

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  hasAppSession: jest.fn().mockResolvedValue(true),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { userId: 'admin', role: 'admin' } }),
  verifyPortalSession: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/carta-tragos/leer-carta-master', () => ({ leerCartaTragosMaster: jest.fn(async () => []) }));
jest.mock('@/app/actions/carta-tragos-master.actions', () => ({ getCartaTragosMaster: jest.fn() }));
jest.mock('@/app/actions/social-gallery', () => ({ createSocialMediaPostFromUrlForStation: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/app/actions/google-workspace-extended', () => ({
  syncReunionToGoogleWorkspace: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const norm = archivo.replace(/\\/g, '/');
    await barrera();
    return almacen[norm] === undefined ? porDefecto : copia(almacen[norm]);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    const norm = archivo.replace(/\\/g, '/');
    await dormir(5);
    almacen[norm] = copia(datos);
    version[norm] = (version[norm] || 0) + 1;
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    const norm = archivo.replace(/\\/g, '/');
    await dormir(5);
    almacen[norm] = { ...(almacen[norm] || {}), ...copia(parcial) };
    version[norm] = (version[norm] || 0) + 1;
  }),
}));
// Transaccion optimista como la de la base: si alguien escribio entre la lectura y la escritura,
// se vuelve a leer y se reintenta.
jest.mock('@/lib/generic-json-store', () => ({
  ...jest.requireActual('@/lib/generic-json-store'),
  mutarDocumentoConTransaccion: jest.fn(async (archivo: string, vacio: any, cambiar: (a: any) => any) => {
    const norm = archivo.replace(/\\/g, '/');
    for (let intento = 0; intento < 20; intento++) {
      const v = version[norm] || 0;
      await barrera();
      const nuevo = await cambiar(almacen[norm] === undefined ? vacio : copia(almacen[norm]));
      if (nuevo === null) return null;
      if ((version[norm] || 0) !== v) continue;
      almacen[norm] = copia(nuevo);
      version[norm] = v + 1;
      return nuevo;
    }
    throw new Error('demasiados reintentos');
  }),
}));

import { addTarea, marcarTarea } from '@/app/actions/fiesta/tareas.actions';
import { addReunion } from '@/app/actions/fiesta/reuniones.actions';
import { marcarLlegadaPersonal } from '@/app/actions/personal-fiestas';
import { marcarHitoPrograma } from '@/app/actions/fiesta/itinerario.actions';
import { addInvitado } from '@/app/actions/fiesta/invitados.actions';
import { saveSugerenciaMusical } from '@/app/actions/fiesta/musica.actions';
import { updateGiftRegistry, claimGift } from '@/app/actions/fiesta/regalos.actions';
import { guardarCierreDeBarra, createBarDrinkOrder } from '@/app/actions/fiesta/barra-tecnologica.actions';

const ID = 'f_guardados';
const RUTA = `fiestas/${ID}.json`;

function fiestaInicial() {
  return {
    id: ID,
    configuracion: { nombreEvento: 'Fiesta de prueba', fechaEvento: '2026-12-15T20:00:00.000Z' },
    tareas: [{ id: 't_base', texto: 'Base', completada: false }],
    reuniones: [],
    personalAsignado: [
      { empleadoId: 'e1', nombre: 'Ana', rol: 'Mozo' },
      { empleadoId: 'e2', nombre: 'Beto', rol: 'Mozo' },
    ],
    programa: [{ id: 'h1', titulo: 'Brindis', completado: false }],
    invitados: [],
    musica: {},
    cartaTragos: {
      items: [
        { id: 'gin', nombre: 'Gin con Pomelo', recetaIngredientes: [], stockDisponible: 5 },
        { id: 'ron', nombre: 'Ron cola', recetaIngredientes: [{ insumoId: 'ron-botella', cantidad: 0.1 }], stockDisponible: 5 },
      ],
    },
    invitacionDigital: {
      regalos: {
        visible: true, titulo: { text: '' }, texto: { text: '' }, datosBancarios: '',
        items: [
          { id: 'g1', name: 'Licuadora', isClaimed: false },
          { id: 'g2', name: 'Plancha', isClaimed: false },
        ],
      },
    },
    others: { barraTecnologica: { settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [] } },
  };
}

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  for (const k of Object.keys(version)) delete version[k];
  almacen[RUTA] = fiestaInicial();
  almacen['insumos.json'] = [{ id: 'ron-botella', nombre: 'Ron', unidad: 'botella', cantidadDisponible: 10 }];
  armarBarrera();
});
afterAll(() => { barreraActiva = false; });

describe('Dos guardados a la vez sobre la misma fiesta: no se pierde ninguno', () => {
  it('dos tareas agregadas a la vez quedan las dos (y tildar otra en el medio tambien)', async () => {
    const [a, b, c] = await Promise.all([
      addTarea(ID, { texto: 'Tarea A' }),
      addTarea(ID, { texto: 'Tarea B' }),
      marcarTarea(ID, 't_base', true),
    ]);
    expect([a.success, b.success, c.success]).toEqual([true, true, true]);
    const tareas = almacen[RUTA].tareas;
    expect(tareas.map((t: any) => t.texto).sort()).toEqual(['Base', 'Tarea A', 'Tarea B']);
    expect(tareas.find((t: any) => t.id === 't_base').completada).toBe(true);
  });

  it('dos reuniones agregadas a la vez quedan las dos', async () => {
    const [a, b] = await Promise.all([
      addReunion({ fiestaId: ID, titulo: 'Reunion A', fecha: '2026-11-01' } as any),
      addReunion({ fiestaId: ID, titulo: 'Reunion B', fecha: '2026-11-02' } as any),
    ]);
    expect([a.success, b.success]).toEqual([true, true]);
    expect(almacen[RUTA].reuniones.map((r: any) => r.titulo).sort()).toEqual(['Reunion A', 'Reunion B']);
  });

  it('dos empleados marcando su llegada a la vez quedan marcados los dos', async () => {
    const [a, b] = await Promise.all([marcarLlegadaPersonal(ID, 'e1'), marcarLlegadaPersonal(ID, 'e2')]);
    expect([a.success, b.success]).toEqual([true, true]);
    const personal = almacen[RUTA].personalAsignado;
    expect(personal.every((p: any) => Boolean(p.checkInTimestamp))).toBe(true);
  });

  it('un hito tildado en el cronograma no pisa un invitado anotado en el medio', async () => {
    const [hito, invitado] = await Promise.all([
      marcarHitoPrograma(ID, 'h1', true),
      addInvitado(ID, { nombre: 'Lucia', rsvp: 'Confirmado' } as any),
    ]);
    expect(hito.success).toBe(true);
    expect(invitado.success).toBe(true);
    expect(almacen[RUTA].programa[0].completado).toBe(true);
    expect(almacen[RUTA].invitados.map((i: any) => i.nombre)).toEqual(['Lucia']);
  });

  it('dos sugerencias de musica a la vez quedan las dos', async () => {
    const [a, b] = await Promise.all([saveSugerenciaMusical(ID, 'Cumbia'), saveSugerenciaMusical(ID, 'Rock')]);
    expect([a.success, b.success]).toEqual([true, true]);
    const texto: string = almacen[RUTA].musica.sugerenciasInvitados;
    expect(texto).toContain('Cumbia');
    expect(texto).toContain('Rock');
  });

  it('el cierre de barra no pisa un pedido nuevo, y el pedido no pisa el cierre', async () => {
    const [cierre, pedido] = await Promise.all([
      guardarCierreDeBarra(ID, { 'ron-botella': 8 }, false),
      createBarDrinkOrder({ fiestaId: ID, drinkId: 'gin', guestName: 'Lucia', clientRequestId: 'req-1' } as any),
    ]);
    expect(cierre.success).toBe(true);
    expect(pedido.success).toBe(true);
    const barra = almacen[RUTA].others.barraTecnologica;
    expect(barra.cierre?.filas?.[0]?.contado).toBe(8);
    expect(barra.orders).toHaveLength(1);
  });

  it('un doble toque en "ajustar el deposito" lo ajusta UNA vez', async () => {
    const [a, b] = await Promise.all([
      guardarCierreDeBarra(ID, { 'ron-botella': 8 }, true),
      guardarCierreDeBarra(ID, { 'ron-botella': 8 }, true),
    ]);
    expect([a.success, b.success]).toEqual([true, true]);
    expect(almacen['insumos.json'][0].cantidadDisponible).toBe(8);
    expect(almacen[RUTA].others.barraTecnologica.cierre.depositoAjustado).toBe(true);
    expect(almacen[RUTA].others.barraTecnologica.cierre.ajustePendiente).toBeUndefined();
  });

  it('el equipo guarda una lista vieja de regalos despues de que un invitado reservo uno: la reserva sobrevive', async () => {
    // La pantalla del equipo se abrio con g1 libre; el invitado lo reserva; el equipo guarda su lista.
    const reserva = await claimGift(ID, 'g1', 'Lucia');
    const guardado = await updateGiftRegistry(ID, [
      { id: 'g1', name: 'Licuadora nueva', isClaimed: false },
      { id: 'g2', name: 'Plancha', isClaimed: false },
    ]);
    expect(reserva.success).toBe(true);
    expect(guardado.success).toBe(true);
    const items = almacen[RUTA].invitacionDigital.regalos.items;
    expect(items.find((i: any) => i.id === 'g1')).toMatchObject({ name: 'Licuadora nueva', isClaimed: true, claimedBy: 'Lucia' });
  });

  it('un regalo que el equipo borra, se borra', async () => {
    await updateGiftRegistry(ID, [{ id: 'g1', name: 'Licuadora', isClaimed: false }]);
    expect(almacen[RUTA].invitacionDigital.regalos.items.map((i: any) => i.id)).toEqual(['g1']);
  });

  it('dos invitados agregados en el mismo milisegundo son dos invitados', async () => {
    const ahora = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(ahora);
    try {
      const [a, b] = await Promise.all([
        addInvitado(ID, { nombre: 'Uno', rsvp: 'Pendiente' } as any),
        addInvitado(ID, { nombre: 'Dos', rsvp: 'Pendiente' } as any),
      ]);
      expect(a.success && b.success).toBe(true);
    } finally {
      spy.mockRestore();
    }
    const invitados = almacen[RUTA].invitados;
    expect(invitados).toHaveLength(2);
    expect(new Set(invitados.map((i: any) => i.id)).size).toBe(2);
  });
});
