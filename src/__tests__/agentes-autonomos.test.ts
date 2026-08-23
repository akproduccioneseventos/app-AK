import {
  getConfiguracionAgentes,
  guardarConfiguracionAgentes,
  ejecutarVigilanteFiestas,
  ejecutarPerseguidorPresupuestos,
  ejecutarCobrador,
  ejecutarAgentesAutonomos,
} from '@/lib/agentes/motor-agentes';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const mockData: Record<string, any> = {
  'fiestas.json': [],
  'presupuestos.json': [],
  'scheduled-messages.json': [],
  'alertas-descartadas.json': [],
  'agentes-configuracion.json': [],
  'agentes-historial.json': [],
};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn((file: string, fallback: any) => {
    return Promise.resolve(mockData[file] ?? fallback);
  }),
  writeData: jest.fn((file: string, data: any) => {
    mockData[file] = data;
    return Promise.resolve(true);
  }),
}));

describe('Bloque 7: Agentes Autónomos con Guardrails y Trazabilidad', () => {
  beforeEach(() => {
    mockData['fiestas.json'] = [];
    mockData['presupuestos.json'] = [];
    mockData['scheduled-messages.json'] = [];
    mockData['alertas-descartadas.json'] = [];
    mockData['agentes-configuracion.json'] = [];
    mockData['agentes-historial.json'] = [];
  });

  it('obtiene los 5 agentes con sus configuraciones por defecto', async () => {
    const agentes = await getConfiguracionAgentes();
    expect(agentes).toHaveLength(5);
    const ids = agentes.map((a) => a.id);
    expect(ids).toContain('vigilante_fiestas');
    expect(ids).toContain('perseguidor_presupuestos');
    expect(ids).toContain('cobrador');
    expect(ids).toContain('generador_contenido');
    expect(ids).toContain('vigilante_noche');
  });

  it('el perseguidor de presupuestos prepara el borrador en la bandeja a los 5 días sin enviar directamente', async () => {
    const fechaCincoDiasAtras = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const presupuestoEnviado: Presupuesto = {
      id: 'pres_123',
      clienteNombre: 'Mariana Silva',
      clienteContacto: '099111222',
      eventoTipo: 'Boda',
      eventoFecha: '2026-11-20',
      invitadosCantidad: 120,
      costoTotalEstimado: 150000,
      timestamp: fechaCincoDiasAtras,
      estado: 'Enviado',
    };

    mockData['presupuestos.json'] = [presupuestoEnviado];

    const registro = await ejecutarPerseguidorPresupuestos();
    expect(registro.estado).toBe('exito');
    expect(registro.hallazgos.length).toBeGreaterThan(0);

    // Verifica que el borrador fue preparado en scheduled-messages.json
    const mensajes = mockData['scheduled-messages.json'];
    expect(mensajes).toHaveLength(1);
    expect(mensajes[0].targetName).toBe('Mariana Silva');
    expect(mensajes[0].targetPhone).toBe('099111222');
    expect(mensajes[0].status).toBe('pendiente'); // En bandeja, NO enviado
    expect(mensajes[0].messageText).toMatch(/¿cómo estás\? Te escribo de AK Producciones/i);
  });

  it('el cobrador prepara recordatorio de saldo para eventos cercanos sin tocar plata ni marcar pagado', async () => {
    const fechaTresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiesta: FiestaEnPlanificacion = {
      id: 'f_cobro_1',
      presupuestoId: 'pres_cobro_1',
      configuracion: {
        nombreEvento: 'Cumpleaños de Martín',
        fechaEvento: fechaTresDias,
      } as any,
      personalAsignado: [],
    };
    const presupuesto: Presupuesto = {
      id: 'pres_cobro_1',
      clienteNombre: 'Martín Pérez',
      clienteContacto: '098333444',
      eventoTipo: 'Cumpleaños',
      eventoFecha: fechaTresDias,
      invitadosCantidad: 50,
      costoTotalEstimado: 40000,
      pagosCliente: [{ id: 'p1', monto: 15000, estadoPago: 'confirmado' }] as any, // Saldo 25.000
      timestamp: new Date().toISOString(),
      estado: 'Aceptado',
    };

    mockData['fiestas.json'] = [fiesta];
    mockData['presupuestos.json'] = [presupuesto];

    const reg = await ejecutarCobrador();
    expect(reg.estado).toBe('exito');

    const mensajes = mockData['scheduled-messages.json'];
    expect(mensajes).toHaveLength(1);
    expect(mensajes[0].targetName).toBe('Martín Pérez');
    expect(mensajes[0].messageText).toMatch(/saldo pendiente para tu fiesta.*25\.000/i);
    expect(mensajes[0].status).toBe('pendiente');
  });

  it('el vigilante de fiestas deja rastro de actividad y no repite trabajo innecesario', async () => {
    const reg = await ejecutarVigilanteFiestas();
    expect(reg.agenteId).toBe('vigilante_fiestas');
    expect(reg.ejecutadoEn).toBeDefined();

    const historial = mockData['agentes-historial.json'];
    expect(historial.length).toBeGreaterThan(0);
    expect(historial[0].agenteNombre).toBe('Vigilante de Fiestas');
  });

  it('un agente pausado no se ejecuta al correr la ronda global', async () => {
    const config = await getConfiguracionAgentes();
    // Pausar cobrador
    const modificada = config.map((c) => (c.id === 'cobrador' ? { ...c, activo: false } : c));
    mockData['agentes-configuracion.json'] = modificada;

    const resultados = await ejecutarAgentesAutonomos();
    const idsEjecutados = resultados.map((r) => r.agenteId);

    expect(idsEjecutados).not.toContain('cobrador');
  });
});

