// REAL scheduler; deterministic storage, no provider or network call.
import { ejecutarAgentesAutonomos } from '@/lib/agentes/motor-agentes';
const now = new Date('2026-10-09T15:00:00Z');
const mockData: Record<string, any> = {
  'fiestas.json': [], 'presupuestos.json': [], 'alertas-descartadas.json': [],
  'agentes-historial.json': [],
  'agentes-configuracion.json': [
    { id: 'vigilante_fiestas', activo: true, intervaloMinutos: 15, ultimaEjecucion: now.toISOString() },
    ...['perseguidor_presupuestos', 'cobrador', 'generador_contenido', 'vigilante_noche', 'vigilante_publicidad'].map(id => ({ id, activo: false })),
  ],
};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => mockData[file] ?? fallback),
  writeData: jest.fn(async (file: string, data: any) => { mockData[file] = data; return true; }),
}));
test('un agente ejecutado hace un minuto no vuelve antes de sus 15 minutos', async () => {
  const registros = await ejecutarAgentesAutonomos(new Date(now.getTime() + 60000));
  expect(registros).toHaveLength(0);
  expect(mockData['agentes-historial.json']).toHaveLength(0);
});
