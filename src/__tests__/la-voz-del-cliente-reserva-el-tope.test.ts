/**
 * @jest-environment node
 */
import { POST } from '@/app/api/asistente/voz-en-vivo/cliente/route';
import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';

jest.mock('@/lib/ai/consumo-servidor', () => ({
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => undefined) })),
  hayPresupuestoParaIA: jest.fn(async () => true),
}));

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn(async (id) => ({ id, configuracion: { nombreEvento: 'Fiesta Test' } })),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (file, defaultValue, mutator) => {
    let curr = defaultValue;
    curr = mutator(curr);
    return curr;
  }),
}));

describe('La voz del cliente reserva el tope con reservarConsumoIA', () => {
  it('reserva consumo de IA antes de llamar a Gemini', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/cliente', {
      method: 'POST',
      body: JSON.stringify({ fiestaId: 'fiesta-123' }),
    });

    await POST(req);
    expect(reservarConsumoIA).toHaveBeenCalledWith('voz-cliente');
  });
});
