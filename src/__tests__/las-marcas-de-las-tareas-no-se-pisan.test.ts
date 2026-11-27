/**
 * @jest-environment node
 */
import { marcarCorrida, marcarFallo } from '@/lib/automatico/tareas-automaticas';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (file, defaultValue, mutator) => {
    let curr = defaultValue;
    curr = mutator(curr);
    return curr;
  }),
}));

describe('Las marcas de las tareas no se pisan', () => {
  it('usa mutarDocumentoConTransaccion para marcar corrida y fallo', async () => {
    await marcarCorrida('tarea-1');
    await marcarFallo('tarea-1', 'error test');
    expect(mutarDocumentoConTransaccion).toHaveBeenCalled();
  });
});
