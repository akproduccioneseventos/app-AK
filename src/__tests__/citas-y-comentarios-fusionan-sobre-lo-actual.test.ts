/**
 * @jest-environment node
 *
 * MATAFUEGO (13/10/2026) - Guardar fusionando sobre la lista de AHORA, no la lista que se leyo antes.
 *
 *  - Citas del simulador: `readData` + `push` + `writeData` de toda la lista. Dos prospectos a la
 *    vez perdian una cita, y el mismo horario se podia reservar dos veces.
 *  - Comentarios de redes: la sincronizacion leia la lista, tardaba minutos llamando a las redes
 *    y a la IA, y escribia todo: borraba lo aprobado/ocultado/restaurado mientras tanto.
 * El almacenamiento de mentira devuelve COPIAS (como la base de verdad). Con la lista compartida
 * en memoria estas pruebas no podrian fallar nunca. Probado rompiendolo (vuelta al guardado de la
 * lista entera): las de "a la vez" y "mientras tanto" se ponen en rojo.
 */
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('server-only', () => ({}), { virtual: true });

const base: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn((file: string, cambiar: (l: any[]) => any[] | null) => {
    const r = turno.then(() => {
      const nueva = cambiar(copia(base[file] ?? []));
      if (nueva) base[file] = copia(nueva);
      return nueva;
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f in base ? copia(base[f]) : d)),
  writeData: jest.fn(async (f: string, d: any) => { base[f] = copia(d); }),
}));
const clasificar = jest.fn();
jest.mock('@/lib/social-media/clasificador-comentarios', () => ({ clasificarComentario: (...a: any[]) => clasificar(...a) }));
jest.mock('@/ai/genkit', () => ({ generateWithGeminiFallback: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(async () => false), registrarConsumoIA: jest.fn() }));

import { bookAppointmentFromSimulator, getSimulatorAvailableSlots } from '@/app/actions/simulator-agenda';
import { aplicarParches, parcheEntre, mutarComentarios } from '@/lib/social-media/guardar-comentarios';
import { syncCommentsFromNetworks } from '@/lib/social-media/comments-backfill';

beforeEach(() => {
  delete process.env.AK_USE_LOCAL_JSON_ONLY; // el camino de la base de verdad (transaccion)
  delete process.env.YOUTUBE_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  for (const k of Object.keys(base)) delete base[k];
  turno = Promise.resolve();
  clasificar.mockReset();
});

describe('citas del simulador', () => {
  const dos = async () => {
    const { days } = await getSimulatorAvailableSlots();
    const slots = days.flatMap((d) => d.slots);
    return [slots[0].datetimeIso, slots[1].datetimeIso];
  };
  const pedir = (fechaHora: string, nombre: string) =>
    bookAppointmentFromSimulator({ clienteNombre: nombre, clienteContacto: '099123456', fechaHora });

  it('dos prospectos reservando a la vez horarios distintos: quedan las dos citas', async () => {
    const [a, b] = await dos();
    const [r1, r2] = await Promise.all([pedir(a, 'Ana Pérez'), pedir(b, 'Beto Gómez')]);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(base['crm-appointments.json']).toHaveLength(2);
  });

  it('dos prospectos pidiendo el MISMO horario a la vez: una sola cita, el otro recibe el aviso', async () => {
    const [a] = await dos();
    const [r1, r2] = await Promise.all([pedir(a, 'Ana Pérez'), pedir(a, 'Beto Gómez')]);
    expect([r1.success, r2.success].sort()).toEqual([false, true]);
    expect(base['crm-appointments.json']).toHaveLength(1);
    const perdedor = r1.success ? r2 : r1;
    expect(perdedor.error).toMatch(/ya no está disponible/);
  });

  it('una cita agendada por otra via mientras tanto no se pierde', async () => {
    base['crm-appointments.json'] = [{ id: 'previa', estado: 'Agendada', fechaHora: '2030-01-01T10:00:00.000Z', clienteNombre: 'X' }];
    const [a] = await dos();
    await pedir(a, 'Ana Pérez');
    expect(base['crm-appointments.json'].map((c: any) => c.id)).toContain('previa');
    expect(base['crm-appointments.json']).toHaveLength(2);
  });
});

describe('comentarios de redes', () => {
  const c = (id: string, extra: any = {}) => ({
    id, network: 'Facebook', networkCommentId: `n_${id}`, text: `texto ${id}`, authorName: 'Ana',
    createdAt: '2026-10-01T10:00:00Z', ...extra,
  });

  it('aplicarParches: conserva lo que otro hizo y suma solo lo que cambio la sincronizacion', () => {
    const actual = [c('1', { isTestimonialApproved: true }), c('2', { classifiedAt: 'ya', sentiment: 'positivo' })] as any[];
    const patch1 = parcheEntre(c('1') as any, { ...c('1'), sentiment: 'negativo', classifiedAt: 'hoy' } as any);
    const patch2 = parcheEntre(c('2') as any, { ...c('2'), sentiment: 'negativo', classifiedAt: 'hoy' } as any);
    const nuevo = c('3') as any;
    const r = aplicarParches(actual, [
      { id: '1', parche: patch1, completo: c('1') as any },
      { id: '2', parche: patch2, completo: c('2') as any },
      { id: '3', parche: parcheEntre({}, nuevo), completo: nuevo },
    ]);
    expect(r.find((x) => x.id === '1')).toMatchObject({ isTestimonialApproved: true, sentiment: 'negativo' });
    // el 2 ya lo habia revisado otro: no se pisa
    expect(r.find((x) => x.id === '2')).toMatchObject({ sentiment: 'positivo', classifiedAt: 'ya' });
    expect(r.map((x) => x.id)).toEqual(['1', '2', '3']);
  });

  it('la sincronizacion no borra una aprobacion hecha mientras clasificaba (lectura larga en el medio)', async () => {
    base['social-connections.json'] = [];
    base['social-comments.json'] = [c('1'), c('2')];
    clasificar.mockImplementation(async (texto: string) => {
      // mientras la IA piensa, el dueño aprueba el comentario 2 como testimonio
      await mutarComentarios((lista) => lista.map((x) => (x.id === '2' ? { ...x, isTestimonialApproved: true } : x)));
      return { classified: true, sentiment: 'positivo', sentimentReason: 'ok', isInsultOrSpam: false, isLegitimateComplaint: false, esPregunta: false, autoHideRecommended: false };
    });
    await syncCommentsFromNetworks();
    const guardados = base['social-comments.json'];
    expect(guardados).toHaveLength(2);
    const dos = guardados.find((x: any) => x.id === '2');
    expect(dos.isTestimonialApproved).toBe(true); // la aprobacion de mientras tanto sigue
    expect(dos.classifiedAt).toBeTruthy(); // y la revision tambien quedo
  });

  it('un comentario nuevo que llega de otra sincronizacion mientras tanto no se borra', async () => {
    base['social-connections.json'] = [];
    base['social-comments.json'] = [c('1')];
    clasificar.mockImplementation(async () => {
      await mutarComentarios((lista) => [...lista, c('llegado-despues') as any]);
      return { classified: true, sentiment: 'neutro', sentimentReason: '', isInsultOrSpam: false, isLegitimateComplaint: false, esPregunta: false, autoHideRecommended: false };
    });
    await syncCommentsFromNetworks();
    expect(base['social-comments.json'].map((x: any) => x.id).sort()).toEqual(['1', 'llegado-despues']);
  });
});
