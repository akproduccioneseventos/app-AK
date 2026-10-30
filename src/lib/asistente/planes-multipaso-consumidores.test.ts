const mockLecturaDetalle = jest.fn();
const mockAgregar = jest.fn();
const mockEnviar = jest.fn();
const mockRegla = jest.fn();
let mockPerfil = 'secretaria';
let mockConFinanzas = true;

jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: (...args: unknown[]) => mockLecturaDetalle(...args),
  readData: jest.fn(), writeData: jest.fn(),
}));
jest.mock('@/lib/asistente/propuestas-service', () => ({ agregarPropuestasDeduplicadas: (...args: unknown[]) => mockAgregar(...args) }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ getAsistenteSettings: async () => ({ numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: mockPerfil === 'dueno' ? 'Dueño' : 'Secretaria' }] }) }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: (...args: unknown[]) => mockRegla(...args) }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: (...args: unknown[]) => mockEnviar(...args) }));
jest.mock('@/lib/asistente/whatsapp-media', () => ({ descargarMediaWhatsApp: jest.fn(), transcribirAudioWhatsApp: jest.fn(), clasificarImagenWhatsApp: jest.fn() }));
jest.mock('@/lib/asistente/whatsapp-voz', () => ({ enviarRespuestaConVozWhatsApp: jest.fn() }));
jest.mock('@/lib/asistente/respuestas-resumen', () => ({ atenderRespuestaResumen: jest.fn(async () => null) }));
jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { CRM: 'crm', ORGANIZACION: 'organizacion', CONTABILIDAD: 'contabilidad', ADMINISTRACION: 'administracion' },
  puede: (user: { perfil: string }, permiso: string) => user.perfil === 'dueno' || (user.perfil === 'secretaria' && (['crm', 'organizacion'].includes(permiso) || permiso === 'contabilidad' && mockConFinanzas)),
}));
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn(async () => mockPerfil === 'dueno' ? { ok: true, user: { perfil: 'dueno' } } : { ok: false, error: 'Sin permiso' }) }));
jest.mock('@/app/actions/scheduled-messages', () => ({}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({}));
jest.mock('@/app/actions/fiesta/armar-web-con-ia.actions', () => ({}));
jest.mock('@/lib/agentes/motor-agentes', () => ({}));
jest.mock('@/lib/asistente/memoria', () => ({ ID_MEMORIA_DUENO: 'dueno' }));

import { atenderAlEquipo } from './por-whatsapp';
import { darOrdenPorVozOTexto } from '@/app/actions/centro-de-control';

describe('consumidor WhatsApp de planes y reglas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerfil = 'secretaria';
    mockConFinanzas = true;
    mockRegla.mockResolvedValue('preguntar');
    mockLecturaDetalle.mockImplementation(async (file: string, fallback: unknown) => ({ valor: file === 'fiestas.json' ? [{
      id: 'f-1', presupuestoId: 'p-1', reuniones: [], tareas: [], decoracion: { tema: 'Bosque', items: [{ id: 'i-1', name: 'Centro de mesa', quantity: 1 }] },
      configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-11-07' },
    }] : fallback, huboFalla: false }));
    mockAgregar.mockImplementation(async (items: unknown[]) => ({ agregadas: items, ignoradas: 0 }));
    mockEnviar.mockResolvedValue({ success: true, messageId: 'test' });
  });

  test('secretaria no lee presupuestos ni ejecuta/envía; crea propuesta con fiesta exacta', async () => {
    const result = await atenderAlEquipo({ from: '59899123456', messageId: 'plan-1', text: 'Prepará la semana del evento "Boda Pérez"' });
    expect(result.accionIdentificada).toBe('plan_multi_paso');
    expect(mockLecturaDetalle).toHaveBeenCalledWith('fiestas.json', []);
    expect(mockLecturaDetalle).not.toHaveBeenCalledWith('presupuestos.json', []);
    expect(mockAgregar.mock.calls[0][0][0].quePropone).toMatch(/no hay presupuesto vinculado encontrado/i);
    expect(mockEnviar).not.toHaveBeenCalled();
  });

  test('regla apagada evita lecturas y respuestas de tarea', async () => {
    mockRegla.mockResolvedValue('apagada');
    const result = await atenderAlEquipo({ from: '59899123456', text: 'Prepará la semana del evento "Boda Pérez"' });
    expect(result.respuestaEnviada).toMatch(/apagada/i);
    expect(mockLecturaDetalle).not.toHaveBeenCalled();
    expect(mockAgregar).not.toHaveBeenCalled();
  });

  test('el dueño recibe respuesta numérica del resumen y no cae al plan', async () => {
    mockPerfil = 'dueno';
    const { atenderRespuestaResumen } = jest.requireMock('@/lib/asistente/respuestas-resumen');
    atenderRespuestaResumen.mockResolvedValueOnce('Abrí la pantalla interna; no ejecuté cambios.');
    const result = await atenderAlEquipo({ from: '59899123456', text: '1' });
    expect(result).toMatchObject({ atendido: true, accionIdentificada: 'respuesta_resumen', nivel: 'pregunta' });
    expect(result.respuestaEnviada).toBe('Abrí la pantalla interna; no ejecuté cambios.');
    expect(mockAgregar).not.toHaveBeenCalled();
  });

  const pedidoReunion = 'Organizá reunión con cliente del evento "Boda Pérez"';
  const lecturasReunion = (fallaCitas = false) => mockLecturaDetalle.mockImplementation(async (file: string, fallback: unknown) => ({
    valor: file === 'fiestas.json' ? [{
      id: 'f-1', presupuestoId: 'p-1', reuniones: [], tareas: [],
      configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-11-07', horaInicio: '20:00', horaFin: '23:00' },
    }] : file === 'presupuestos.json' ? [{ id: 'p-1', estado: 'Enviado', clienteNombre: 'Pérez', clienteContacto: '59899111111' }] : fallback,
    huboFalla: file === 'crm-appointments.json' && fallaCitas,
  }));

  test('WhatsApp carga citas reales y propaga candidato/borrador solo con permisos', async () => {
    lecturasReunion();
    const result = await atenderAlEquipo({ from: '59899123456', text: pedidoReunion });
    expect(result.accionIdentificada).toBe('plan_multi_paso');
    expect(mockLecturaDetalle).toHaveBeenCalledWith('crm-appointments.json', []);
    expect(mockAgregar.mock.calls[0][0][0].accion.data).toMatchObject({
      horarioCandidato: { googleVerificado: false, duracionMinutos: 30 },
      borrador: { telefono: '59899111111', presupuestoId: 'p-1' },
    });
    mockLecturaDetalle.mockClear();
    mockAgregar.mockClear();
    mockConFinanzas = false;
    const rechazado = await atenderAlEquipo({ from: '59899123456', text: pedidoReunion });
    expect(rechazado.accionIdentificada).toBe('aclarar_plan_multi_paso');
    expect(mockLecturaDetalle).not.toHaveBeenCalled();
    expect(mockAgregar).not.toHaveBeenCalled();
  });

  test('citas fallidas hacen preguntar sin propuestas en WhatsApp y Centro', async () => {
    lecturasReunion(true);
    const whatsapp = await atenderAlEquipo({ from: '59899123456', text: pedidoReunion });
    expect(whatsapp.accionIdentificada).toBe('aclarar_plan_multi_paso');
    mockPerfil = 'dueno';
    const centro = await darOrdenPorVozOTexto(pedidoReunion);
    expect(centro).toMatchObject({ success: false, mensaje: expect.stringMatching(/citas de la agenda interna/) });
    expect(mockAgregar).not.toHaveBeenCalled();
  });

  test('Centro aplica sesión/regla antes de leer citas y no las consulta para frases ajenas', async () => {
    await darOrdenPorVozOTexto(pedidoReunion);
    expect(mockLecturaDetalle).not.toHaveBeenCalled();
    mockPerfil = 'dueno';
    mockRegla.mockResolvedValueOnce('apagada');
    await darOrdenPorVozOTexto(pedidoReunion);
    await darOrdenPorVozOTexto('hola');
    expect(mockLecturaDetalle).not.toHaveBeenCalled();
    expect(mockAgregar).not.toHaveBeenCalled();
  });

  test('Centro prepara una tarjeta con candidato y teléfono real sin ejecutar acciones', async () => {
    mockPerfil = 'dueno';
    lecturasReunion();
    expect(await darOrdenPorVozOTexto(pedidoReunion)).toMatchObject({ success: true });
    expect(mockLecturaDetalle).toHaveBeenCalledWith('crm-appointments.json', []);
    expect(mockAgregar).toHaveBeenCalledTimes(1);
    expect(mockAgregar.mock.calls[0][0][0].accion.data).toMatchObject({
      horarioCandidato: { duracionMinutos: 30, googleVerificado: false }, borrador: { telefono: '59899111111' },
    });
    expect(mockEnviar).not.toHaveBeenCalled();
  });
});
