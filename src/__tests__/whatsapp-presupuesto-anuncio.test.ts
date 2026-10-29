/**
 * @fileOverview Pruebas para la atención del prospecto que llega por anuncio en WhatsApp
 * (Órdenes 105, 117, 202, 222 Bloque 2).
 */

const mockPrepareCommercialDraft = jest.fn();
jest.mock('@/lib/asistente/comercial-borrador', () => ({
  prepararBorradorProspectoAnuncio: (...args: any[]) => mockPrepareCommercialDraft(...args),
}));
const mockAddProposals = jest.fn();
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...args: any[]) => mockAddProposals(...args),
}));

import {
  extraerDatosPresupuestoProspecto,
  atenderProspectoAnuncioWhatsApp,
} from '@/lib/asistente/por-whatsapp';

describe('Atención a prospectos de anuncio por WhatsApp (Órdenes 105, 117, 202, 203, 222)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareCommercialDraft.mockResolvedValue({
      status: 'draft_created',
      presupuestoId: 'budget-test-1',
      messageDraftId: 'message-test-1',
      photoIds: ['photo-1', 'photo-2'],
    });
    mockAddProposals.mockResolvedValue(undefined);
  });

  it('extrae fecha, cantidad de invitados y salón del texto con lenguaje natural', () => {
    const texto = 'Hola! Quiero festejar el 15 de noviembre de 2026 para 120 personas en el salón Los Robles.';
    const datos = extraerDatosPresupuestoProspecto(texto);

    expect(datos.fecha).toBe('2026-11-15');
    expect(datos.invitados).toBe(120);
    expect(datos.salon).toBe('Los Robles');
  });

  it('si falta fecha, invitados, salón o tipo de fiesta, pregunta sin generar presupuesto', async () => {
    // Caso 1: sólo menciona invitados
    const res1 = await atenderProspectoAnuncioWhatsApp({
      phone: '59899111222',
      name: 'María',
      text: 'Hola, somos 80 personas, cuánto nos saldría?',
    });

    expect(res1.completo).toBe(false);
    expect(res1.faltantes).toContain('la fecha aproximada');
    expect(res1.faltantes).toContain('el salón o zona del evento');
    expect(res1.faltantes).toContain('el tipo de fiesta');
    expect(mockPrepareCommercialDraft).not.toHaveBeenCalled();

    // Caso 2: sólo fecha y salón, faltan invitados
    const res2 = await atenderProspectoAnuncioWhatsApp({
      phone: '59899111222',
      name: 'María',
      text: 'Quisiéramos hacerlo el 2027-04-10 en salón Club Uruguay',
    });

    expect(res2.completo).toBe(false);
    expect(res2.faltantes).toContain('la cantidad estimada de invitados');
    expect(res2.faltantes).toContain('el tipo de fiesta');
    expect(mockPrepareCommercialDraft).not.toHaveBeenCalled();
  });

  it('con los cuatro datos solicita un presupuesto y borrador reales, sin exponer enlace simulado', async () => {
    const res = await atenderProspectoAnuncioWhatsApp({
      phone: '59899333444',
      name: 'Gonzalo',
      text: 'Hola! Nos casamos el 20 de setiembre de 2027, calculamos 150 invitados en el salón Haras del Lago',
    });

    expect(res.completo).toBe(true);
    expect(res.faltantes).toEqual([]);

    expect(mockPrepareCommercialDraft).toHaveBeenCalledWith(expect.objectContaining({
      phone: '59899333444',
      name: 'Gonzalo',
      fecha: '2027-09-20',
      invitados: 150,
      salon: 'Haras del Lago',
      tipoEvento: 'Boda',
    }));
    expect(res.presupuestoId).toBe('budget-test-1');
    expect(res.respuestaTexto).toContain('quedaron en la bandeja');
    expect(res.respuestaTexto).not.toContain('https://akproducciones.uy/simulador-de-presupuesto?');
  });

  it('deja una propuesta interna con contacto y datos del evento cuando requiere revisión manual', async () => {
    mockPrepareCommercialDraft.mockResolvedValue({
      status: 'manual_review',
      photoIds: [],
      reason: 'No hay paquete vigente con precio.',
    });
    const result = await atenderProspectoAnuncioWhatsApp({
      phone: '59899333444',
      name: 'Gonzalo',
      messageId: 'wamid.manual-review-255',
      text: 'Nos casamos el 20 de setiembre de 2027, 150 invitados en el salón Haras del Lago',
    });
    expect(result.completo).toBe(false);
    expect(result.error).toContain('No hay paquete vigente');
    expect(mockAddProposals).toHaveBeenCalledWith([expect.objectContaining({
      clave: 'prospecto-presupuesto-revision:wamid.manual-review-255',
      tipoPropuesta: 'presupuesto_revision_manual',
      quePropone: expect.stringContaining('59899333444'),
      quePasa: expect.stringContaining('No hay paquete vigente'),
    })]);
  });
});
