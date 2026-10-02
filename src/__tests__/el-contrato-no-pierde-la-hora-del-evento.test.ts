/**
 * El contrato no pierde la hora del evento (Codex, 1/10/2026).
 * "15/12/2026 a las 21:00" salía "15 de diciembre de 2026": la hora acordada desaparecía.
 */
import { replaceContractPlaceholders } from '@/lib/contract-template';

const llenar = (fechaEvento: string) => replaceContractPlaceholders('Evento: {{FECHA_EVENTO}}.', { fechaEvento });

describe('El contrato no pierde la hora del evento', () => {
  it('con barras y hora: queda la fecha en letras y la hora', () => {
    expect(llenar('15/12/2026 a las 21:00')).toBe('Evento: 15 de diciembre de 2026 a las 21:00.');
  });

  it('sólo la fecha: en letras, como antes', () => {
    expect(llenar('05/09/2026')).toBe('Evento: 5 de setiembre de 2026.');
    expect(llenar('2026-09-05')).toBe('Evento: 5 de setiembre de 2026.');
  });

  it('la hora de guardado de la máquina no se confunde con la del evento', () => {
    expect(llenar('2026-09-05T03:00:00.000Z')).toBe('Evento: 5 de setiembre de 2026.');
  });

  it('formato de máquina con un horario escrito al lado: el horario queda', () => {
    expect(llenar('2026-12-15 de 21 a 04 hs')).toBe('Evento: 15 de diciembre de 2026 de 21 a 04 hs.');
  });
});
