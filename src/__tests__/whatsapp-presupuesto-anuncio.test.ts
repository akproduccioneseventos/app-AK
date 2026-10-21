/**
 * @fileOverview Pruebas para la atención del prospecto que llega por anuncio en WhatsApp
 * (Órdenes 105, 117 y 202 Bloque 3).
 */

const mockGenerateBudgetAndLeadFromSimulator = jest.fn(async () => ({
  success: true,
  presupuestoId: 'presupuesto_test_123',
  token: 'token_seguro_456',
  leadId: 'lead_test_789',
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  generateBudgetAndLeadFromSimulator: (...args: any[]) => mockGenerateBudgetAndLeadFromSimulator(...args),
}));

const mockSaveScheduledMessage = jest.fn(async () => ({ success: true }));
jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: (...args: any[]) => mockSaveScheduledMessage(...args),
}));

import {
  extraerDatosPresupuestoProspecto,
  atenderProspectoAnuncioWhatsApp,
} from '@/lib/asistente/por-whatsapp';

describe('Atención a prospectos de anuncio por WhatsApp (Órdenes 105, 117, 202)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extrae fecha, cantidad de invitados y salón del texto con lenguaje natural', () => {
    const texto = 'Hola! Quiero festejar el 15 de noviembre de 2026 para 120 personas en el salón Los Robles.';
    const datos = extraerDatosPresupuestoProspecto(texto);

    expect(datos.fecha).toBe('2026-11-15');
    expect(datos.invitados).toBe(120);
    expect(datos.salon).toBe('Los Robles');
  });

  it('si falta la fecha, los invitados o el salón, no llama a generateBudgetAndLeadFromSimulator y pregunta lo que falta', async () => {
    // Caso 1: sólo menciona invitados
    const res1 = await atenderProspectoAnuncioWhatsApp({
      phone: '59899111222',
      name: 'María',
      text: 'Hola, somos 80 personas, cuánto nos saldría?',
    });

    expect(res1.completo).toBe(false);
    expect(res1.faltantes).toContain('la fecha aproximada');
    expect(res1.faltantes).toContain('el salón o zona del evento');
    expect(mockGenerateBudgetAndLeadFromSimulator).not.toHaveBeenCalled();
    expect(mockSaveScheduledMessage).not.toHaveBeenCalled();

    // Caso 2: sólo fecha y salón, faltan invitados
    const res2 = await atenderProspectoAnuncioWhatsApp({
      phone: '59899111222',
      name: 'María',
      text: 'Quisiéramos hacerlo el 2027-04-10 en salón Club Uruguay',
    });

    expect(res2.completo).toBe(false);
    expect(res2.faltantes).toContain('la cantidad estimada de invitados');
    expect(mockGenerateBudgetAndLeadFromSimulator).not.toHaveBeenCalled();
  });

  it('con fecha, invitados y salón llama a generateBudgetAndLeadFromSimulator y prepara el borrador sin prometer precios ni plazos', async () => {
    const res = await atenderProspectoAnuncioWhatsApp({
      phone: '59899333444',
      name: 'Gonzalo',
      text: 'Hola! Nos casamos el 20 de setiembre de 2027, calculamos 150 invitados en el salón Haras del Lago',
    });

    expect(res.completo).toBe(true);
    expect(res.faltantes).toEqual([]);
    expect(mockGenerateBudgetAndLeadFromSimulator).toHaveBeenCalledTimes(1);

    const callArg = mockGenerateBudgetAndLeadFromSimulator.mock.calls[0][0];
    expect(callArg.clienteContacto).toBe('59899333444');
    expect(callArg.invitados).toBe(150);
    expect(callArg.eventoFecha).toBe('2027-09-20');
    expect(callArg.salonFiestas).toBe('Haras del Lago');

    // Prepara el borrador en la bandeja de salida (scheduled-messages)
    expect(mockSaveScheduledMessage).toHaveBeenCalledTimes(1);
    const draftCall = mockSaveScheduledMessage.mock.calls[0][0];
    expect(draftCall.channel).toBe('whatsapp');
    expect(draftCall.status).toBe('draft');
    expect(draftCall.targetPhone).toBe('59899333444');
    expect(draftCall.messageText).toContain('https://akproducciones.uy/presupuestos/presupuesto_test_123/ver');

    // Mensaje de respuesta al usuario: no da nada por cerrado ni promete plazos
    expect(res.respuestaTexto).toContain('https://akproducciones.uy/presupuestos/presupuesto_test_123/ver');
    expect(res.respuestaTexto).toContain('sin compromiso');
  });
});
