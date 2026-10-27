/**
 * Orden 239 (propuestas de web con lo que el dueño escribió) y orden 240 (cocina y encuestas).
 */
const mockSave = jest.fn(async (f: any) => ({ success: true, fiesta: f }));
const mockFlow = jest.fn(async () => [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);
let guardada: any;
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(guardada))),
  saveFiesta: (f: any) => mockSave(f),
}));
jest.mock('@/ai/flows/armar-web-del-evento-flow', () => ({
  armarWebDelEventoFlow: jest.fn(),
  generarTresPropuestasFlow: (a: any) => (mockFlow as any)(a),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => false) }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => ({ success: true })) }));

import fs from 'fs';
import path from 'path';
import { crearTresPropuestasDeWeb, armarWebConIA } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import { detectarChoquesMenuYAlergias } from '@/lib/catering/choques-alergias';
import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';
import { generarResumenFeedbackMensual } from '@/lib/feedback/resumen-feedback';

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => false),
  registrarConsumoIA: jest.fn(async () => undefined),
}));
jest.mock('@/ai/genkit', () => ({ generateWithGeminiFallback: jest.fn(), getGeminiModelForAgent: jest.fn() }));
jest.mock('@/ai/flows/generate-testimonial-flow', () => ({
  generateTestimonialFlow: jest.fn(async () => ({ testimonial: 't', shortQuote: 'q' })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  guardada = {
    id: 'f1',
    configuracion: { nombreEvento: 'Base' },
    invitacionConfig: { nombreHomenajeada: 'Vieja', fechaEvento: '2026-01-01', nombreSalon: 'Salón viejo', colorPrincipal: '#000000' },
    cuentasBancarias: [{ banco: 'X' }],
  };
});

describe('orden 239: las propuestas usan lo escrito en el diálogo', () => {
  it('aplica nombre, fecha y salón nuevos sobre la fiesta del servidor y los guarda', async () => {
    const r = await crearTresPropuestasDeWeb('f1', '#ff00aa', { nombre: ' Valentina ', fecha: '2026-12-05', salon: 'Club Uruguay' });
    expect(r.success).toBe(true);
    const usada = (mockFlow.mock.calls[0] as any[])[0].fiesta;
    expect(usada.invitacionConfig).toMatchObject({ nombreHomenajeada: 'Valentina', fechaEvento: '2026-12-05', nombreSalon: 'Club Uruguay', colorPrincipal: '#ff00aa' });
    const guardado = (mockSave.mock.calls[0] as any[])[0];
    expect(guardado.invitacionConfig.nombreHomenajeada).toBe('Valentina');
    expect(guardado.cuentasBancarias).toEqual([{ banco: 'X' }]); // lo ajeno no se toca
  });

  it('sin datos del diálogo deja la fiesta como está', async () => {
    await crearTresPropuestasDeWeb('f1');
    expect((mockFlow.mock.calls[0] as any[])[0].fiesta.invitacionConfig.nombreHomenajeada).toBe('Vieja');
  });

  it('rechaza una fecha inválida o un nombre larguísimo sin generar nada', async () => {
    expect((await crearTresPropuestasDeWeb('f1', undefined, { fecha: 'mañana' })).success).toBe(false);
    expect((await crearTresPropuestasDeWeb('f1', undefined, { nombre: 'x'.repeat(500) })).success).toBe(false);
    expect(mockFlow).not.toHaveBeenCalled();
  });

  it('si no se pudo guardar, no anuncia propuestas', async () => {
    mockSave.mockResolvedValueOnce({ success: false, error: 'sin guardar' } as any);
    const r = await crearTresPropuestasDeWeb('f1', undefined, { nombre: 'Nueva' });
    expect(r.success).toBe(false);
  });

  it('la pantalla manda los datos actuales y no la fiesta entera', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/pagina-web/page.tsx'), 'utf8');
    expect(src).toMatch(/crearTresPropuestasDeWeb\(fiestaId, propuestasColor, \{\s*nombre: propuestasNombre,\s*fecha: propuestasFecha,\s*salon: propuestasSalon/);
  });
});

describe('pregunta 104: sin nombre cargado no se inventa uno', () => {
  it('armar la web sin nombre del agasajado pide el dato', async () => {
    guardada = { id: 'f1', configuracion: {} };
    const r = await armarWebConIA('f1');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/nombre/i);
  });

  it('no queda ningún relleno inventado en los lugares barridos', () => {
    const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    expect(leer('src/ai/flows/armar-web-del-evento-flow.ts')).not.toMatch(/\|\|\s*'Agasajado'/);
    expect(leer('src/ai/flows/multiagent-flow.ts')).not.toMatch(/partyType\s*\|\|\s*'Fiesta'/);
    const motor = leer('src/lib/agentes/motor-agentes.ts');
    expect(motor).not.toMatch(/nombreAgasajado\s*\|\|\s*'Evento'/);
    expect(motor).not.toMatch(/salon\s*\|\|\s*'Salón'/);
  });
});

describe('orden 240: cocina y encuestas', () => {
  it('el plato con mariscos choca con la alergia a mariscos cargada', () => {
    const menu: any = { items: [{ name: 'Arroz con camarones', type: 'Principal' }, { name: 'Ensalada', type: 'Entrada' }] };
    const invitados: any[] = [{ id: 'g', nombre: 'G', rsvp: 'Confirmado', partySize: 2, dietaryRestriction: 'Alergia Mariscos' }];
    const choques = detectarChoquesMenuYAlergias(menu, invitados);
    expect(choques).toHaveLength(1);
    expect(choques[0]).toMatchObject({ platoNombre: 'Arroz con camarones', personasAfectadas: 2 });
  });

  it('la hoja de cocina cuenta al celíaco marcado sólo con el interruptor', () => {
    const fiesta: any = {
      id: 'f', configuracion: { nombreEvento: 'F' },
      invitados: [{ id: '1', nombre: 'A', rsvp: 'Confirmado', partySize: 3, isCeliac: true }],
    };
    const hoja = armarHojaDeCocina(fiesta, [], { adultos: 3, chicos: 0 });
    expect(hoja.especiales).toEqual([expect.objectContaining({ restriccion: 'Celiaco', personas: 3 })]);
  });

  it('el resumen de encuestas sin IA dice que no se pudo analizar y no inventa temas', async () => {
    const r = await generarResumenFeedbackMensual([{ id: 's', clientName: 'C', ratingComida: 5 } as any]);
    expect(r).not.toBeNull();
    expect(r!.analisisDisponible).toBe(false);
    expect(r!.avisoAnalisis).toMatch(/no se pudo analizar/i);
    expect(r!.temasRepetidos).toEqual([]);
    expect(r!.mejorasPropuestas).toEqual([]);
  });
});

describe('pregunta 103: sincronizar con el presupuesto guarda antes', () => {
  it('handleSyncPresupuesto espera el guardado antes de sincronizar', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/configuracion/page.tsx'), 'utf8');
    const cuerpo = src.slice(src.indexOf('const handleSyncPresupuesto'));
    const guardar = cuerpo.indexOf('await saveNow()');
    const sincronizar = cuerpo.indexOf('syncFiestaFromBudget(');
    expect(guardar).toBeGreaterThan(-1);
    expect(guardar).toBeLessThan(sincronizar);
  });
});
