/**
 * @jest-environment node
 *
 * MATAFUEGO (13/10/2026) - Una tarea automatica no "corre" si no pudo leer la base.
 *
 * `avisos-al-cliente` leia las fiestas con `readData(..., [])` y `asistente-proactivo` leia
 * fiestas, presupuestos y salones con lista vacia por defecto: con la base caida recorrian cero
 * cosas y se anotaban "corridas". Ahora tiran / devuelven error y NO marcan corrida.
 * Probado rompiendolo: con `readData(..., [])` otra vez, ambas se ponen en rojo.
 */
const marcarCorrida = jest.fn(async () => undefined);
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: (...a: any[]) => (marcarCorrida as any)(...a) }));
jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({ abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true })), respuestaDeLaTarea: (_puerta: unknown, cuerpo: unknown) => cuerpo }));
const leerFiestasCrudas = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: (...a: any[]) => leerFiestasCrudas(...a) }));
const readDataConDetalle = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => d),
  writeData: jest.fn(),
  readDataConDetalle: (...a: any[]) => readDataConDetalle(...a),
}));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn() }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn() }));
jest.mock('@/lib/automatizaciones-engine', () => ({ evaluarReglasParaFiesta: () => [] }));
jest.mock('@/lib/agentes/motor-agentes', () => ({ ejecutarAgentesAutonomos: jest.fn(async () => []) }));
jest.mock('@/lib/alertas/errores-humanos', () => ({ detectarErroresHumanos: () => [] }));
jest.mock('@/lib/automatico/parte-manana', () => ({ getParteDeLaManana: jest.fn(async () => null) }));
jest.mock('@/lib/asistente/clima-de-las-fiestas', () => ({ detectarAlertasClimaFiestas: jest.fn(async () => []) }));
jest.mock('@/lib/asistente/fechas-comerciales', () => ({ obtenerProximasFechasComerciales: () => [] }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ avisarAlDuenio: jest.fn(), getHoraUruguay: () => 12, getAsistenteSettings: jest.fn(async () => ({ avisosProactivosActivos: true })) }));
const agregar = jest.fn(async () => ({ agregadas: [], ignoradas: 0 }));
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...a: any[]) => (agregar as any)(...a),
  guardarResumenMientrasNoEstabas: jest.fn(),
}));

import { correrTareaAvisosAlCliente } from '@/lib/whatsapp/avisos-al-cliente';
import { GET as asistenteProactivo } from '@/app/api/cron/asistente-proactivo/route';

beforeEach(() => {
  marcarCorrida.mockClear();
  agregar.mockClear();
  leerFiestasCrudas.mockReset();
  readDataConDetalle.mockReset();
});

describe('avisos-al-cliente con la base caida', () => {
  it('tira el error y no se anota como corrida', async () => {
    leerFiestasCrudas.mockRejectedValue(new Error('base caída'));
    await expect(correrTareaAvisosAlCliente()).rejects.toThrow('base caída');
    expect(marcarCorrida).not.toHaveBeenCalled();
  });

  it('con la base sana y cero fiestas, si se anota (no es una falla)', async () => {
    leerFiestasCrudas.mockResolvedValue([]);
    await correrTareaAvisosAlCliente();
    expect(marcarCorrida).toHaveBeenCalledWith('avisos-al-cliente');
  });
});

describe('asistente-proactivo con la base caida', () => {
  const pedir = () => asistenteProactivo(new Request('http://x/api/cron/asistente-proactivo'));

  it('si las fiestas no se pueden leer, devuelve error y no marca corrida', async () => {
    leerFiestasCrudas.mockRejectedValue(new Error('base caída'));
    readDataConDetalle.mockResolvedValue({ valor: [], huboFalla: false });
    const res = await pedir();
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
    expect(marcarCorrida).not.toHaveBeenCalled();
    expect(agregar).not.toHaveBeenCalled();
  });

  it('si presupuestos o salones fallan al leer (huboFalla), tampoco corre', async () => {
    leerFiestasCrudas.mockResolvedValue([]);
    readDataConDetalle.mockResolvedValue({ valor: [], huboFalla: true });
    const res = await pedir();
    expect(res.status).toBe(500);
    expect(marcarCorrida).not.toHaveBeenCalled();
  });

  it('con todo sano corre y marca corrida', async () => {
    leerFiestasCrudas.mockResolvedValue([]);
    readDataConDetalle.mockResolvedValue({ valor: [], huboFalla: false });
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(marcarCorrida).toHaveBeenCalledWith('asistente-proactivo');
  });
});
