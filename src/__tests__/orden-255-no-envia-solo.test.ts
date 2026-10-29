jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(async (_filename: string, fallback: unknown) => ({
    valor: fallback,
    huboFalla: false,
  })),
  writeData: jest.fn(async () => undefined),
}));

import { guardarReglaIA } from '@/lib/ia/reglas-de-la-ia';

describe('Orden 255: las tareas que contactan clientes no se ejecutan solas', () => {
  it.each(['mandar_mensajes_clientes', 'perseguidor_presupuestos', 'recontacto_automatico'])(
    'rechaza configurar %s como sola',
    async (tareaId) => {
      await expect(guardarReglaIA(tareaId, 'sola', 'dueno')).rejects.toThrow(
        'Esta tarea no puede ejecutarse sola por seguridad'
      );
    }
  );

  it.each(['vigilante_fiestas', 'generador_contenido', 'armar_web_evento'])(
    'mantiene permitida la tarea inocua %s',
    async (tareaId) => {
      await expect(guardarReglaIA(tareaId, 'sola', 'dueno')).resolves.toEqual({ success: true });
    }
  );
});
