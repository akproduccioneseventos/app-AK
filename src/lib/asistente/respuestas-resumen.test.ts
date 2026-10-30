jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutarDocumentoConTransaccion: jest.fn() }));
import { readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { atenderRespuestaResumen, type RegistroResumenManana } from './respuestas-resumen';

const ahora = new Date('2026-10-29T12:00:00Z');
let registro: RegistroResumenManana;
beforeEach(() => {
  jest.clearAllMocks();
  registro = { fecha: '2026-10-29', estado: 'whatsapp_enviado', destinatario: '59899123456', items: [
    { id: 'p1', tipo: 'prospecto', titulo: 'Revisar un seguimiento', detalle: '', accionHref: '/contabilidad/crm/outbox' },
  ] };
  (readDataConDetalle as jest.Mock).mockImplementation(async () => ({ valor: registro, huboFalla: false }));
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (_file, _fallback, update) => {
    const next = update(registro); if (next) registro = next; return next;
  });
});

it('resolves the number against the delivered snapshot and prepares a safe internal handoff', async () => {
  const result = await atenderRespuestaResumen('1', '099123456', true, ahora);
  expect(result).toContain('https://akproducciones.uy/contabilidad/crm/outbox');
  expect(result).toContain('No ejecuté cambios');
  expect(mutarDocumentoConTransaccion).not.toHaveBeenCalled();
  expect(await atenderRespuestaResumen('4', '099123456', true, ahora)).toContain('no corresponde');
});

it('does not disclose a summary to other profiles, phones, old days or after uncertain delivery', async () => {
  expect(await atenderRespuestaResumen('1', '099123456', false, ahora)).not.toContain('seguimiento');
  expect(await atenderRespuestaResumen('1', '099888888', true, ahora)).not.toContain('seguimiento');
  registro.estado = 'reservado';
  expect(await atenderRespuestaResumen('1', '099123456', true, ahora)).not.toContain('seguimiento');
  registro.estado = 'whatsapp_enviado'; registro.fecha = '2026-10-28';
  expect(await atenderRespuestaResumen('1', '099123456', true, ahora)).not.toContain('seguimiento');
});

it('postpones stable item ids without changing money or dates and preserves concurrent fields', async () => {
  registro.motivo = 'No borrar este dato';
  expect(await atenderRespuestaResumen('después', '099123456', true, ahora)).toContain('mañana si siguen pendientes');
  expect(registro.pospuestosIds).toEqual(['p1']);
  expect(registro.motivo).toBe('No borrar este dato');
  await atenderRespuestaResumen('despues', '099123456', true, ahora);
  expect(registro.pospuestosIds).toEqual(['p1']);
});

it('fails closed on unreadable records and on a transaction retry that lost its turn', async () => {
  (readDataConDetalle as jest.Mock).mockResolvedValueOnce({ valor: registro, huboFalla: true });
  expect(await atenderRespuestaResumen('1', '099123456', true, ahora)).toContain('No pude verificar');
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (_file, _fallback, update) => {
    update(registro); update({ ...registro, fecha: '2026-10-30' }); return null;
  });
  expect(await atenderRespuestaResumen('despues', '099123456', true, ahora)).toContain('No pude posponer');
});

it('does not follow external links or treat ordinary messages as numeric commands', async () => {
  registro.items![0].accionHref = '//evil.example/capture';
  expect(await atenderRespuestaResumen('1', '099123456', true, ahora)).not.toContain('evil');
  expect(await atenderRespuestaResumen('necesito 1 fiesta', '099123456', true, ahora)).toBeNull();
});
