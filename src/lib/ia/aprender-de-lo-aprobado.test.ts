jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(),
}));

import { readDataConDetalle } from '@/lib/data-service';
import { aprenderDeLoAprobado } from './aprender-de-lo-aprobado';

const read = readDataConDetalle as jest.Mock;

describe('aprendizaje de estilo por tarea', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa decisiones compartidas, coincidencia exacta normalizada y omite ejemplos con importes', async () => {
    read.mockResolvedValue({ huboFalla: false, valor: [
      { tipoTarea: 'redes_sociales', decision: 'si', textoFinal: 'Cálido y directo.', fecha: '2026-10-28T10:00:00.000Z' },
      { tipoTarea: 'mis-redes-sociales-ventas', decision: 'si', textoFinal: 'No debe coincidir.', fecha: '2026-10-29T10:00:00.000Z' },
      { tipoTarea: 'redes-sociales', decision: 'cambiar', textoFinal: 'El precio: $500.', fecha: '2026-10-27T10:00:00.000Z' },
      { tipoTarea: 'redes-sociales', decision: 'no', textoFinal: 'No aprobado.', fecha: '2026-10-26T10:00:00.000Z' },
    ] });

    await expect(aprenderDeLoAprobado('Redes-sociales')).resolves.toEqual(['Cálido y directo.']);
    expect(read).toHaveBeenCalledWith('ia-aprendizaje.json', []);
  });

  it('no toma datos locales ni devuelve decisiones si falla la lectura autoritativa', async () => {
    read.mockResolvedValue({ huboFalla: true, valor: [
      { tipoTarea: 'web-evento', decision: 'si', textoFinal: 'Obsoleto.' },
    ] });
    await expect(aprenderDeLoAprobado('web-evento')).resolves.toEqual([]);
  });

  it('una tarea vacía nunca coincide con todas las decisiones', async () => {
    read.mockResolvedValue({ huboFalla: false, valor: [
      { tipoTarea: 'general', decision: 'si', textoFinal: 'Texto.' },
    ] });
    await expect(aprenderDeLoAprobado('')).resolves.toEqual([]);
  });

  it('toma los últimos cinco por fecha real y produce guía abstracta sin nombres ni texto de clientes', async () => {
    read.mockResolvedValue({ huboFalla: false, valor: Array.from({ length: 7 }, (_, index) => ({
      tipoTarea: 'redes-sociales', decision: 'si', fecha: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      textoFinal: index === 6 ? 'Hola Ana Pérez, llamame al 099123456. Cálido y directo.' : `Cálido, directo y breve ${index}`,
    })) });
    const ejemplos = await aprenderDeLoAprobado('redes-sociales');
    expect(ejemplos).toHaveLength(5);
    expect(ejemplos.join(' ')).not.toMatch(/Ana Pérez|099123456/);
  });
});
