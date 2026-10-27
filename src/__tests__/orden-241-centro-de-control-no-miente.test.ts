/**
 * Orden 241 (Codex 238, retest 703): el Centro de control no afirma lo que no hizo.
 * A fiesta real sin relleno · B sin respuestas inventadas · C id inexistente no se aprueba ni se aprende
 * D dos aprobaciones a la vez · E un correo aprobado no figura enviado.
 */
process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

type Fila = Record<string, any>;
let posts: Fila[] = [];
let fiestas: Fila[] = [];
let mensajes: Fila[] = [];
let propuestas: Fila[] = [];

const mockWriteData = jest.fn(async (file: string, data: any) => {
  await new Promise((r) => setTimeout(r, 5));
  if (file === 'social-posts.json') posts = JSON.parse(JSON.stringify(data));
});
const mockReadData = jest.fn(async (file: string, def: any) => {
  await new Promise((r) => setTimeout(r, 5));
  if (file === 'social-posts.json') return JSON.parse(JSON.stringify(posts));
  if (file === 'fiestas.json') return JSON.parse(JSON.stringify(fiestas));
  return def;
});
jest.mock('@/lib/data-service', () => ({
  readData: (f: string, d: any) => mockReadData(f, d),
  writeData: (f: string, d: any) => mockWriteData(f, d),
  mutateDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
}));

const mockDecision = jest.fn(async () => undefined);
const mockRegistrarSola = jest.fn(async () => ({}));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  getReglasDeLaIA: jest.fn(async () => []),
  guardarReglaIA: jest.fn(),
  getReglaParaTarea: jest.fn(async () => 'sola'),
  registrarAccionSola: (...a: any[]) => (mockRegistrarSola as any)(...a),
  getRegistroAccionesSolas: jest.fn(async () => []),
  registrarDecisionDuenio: (...a: any[]) => (mockDecision as any)(...a),
  getResumenMensualAprendizaje: jest.fn(async () => ''),
}));

const mockAceptar = jest.fn(async (id: string) => {
  const p = propuestas.find((x) => x.id === id);
  return p ? { success: true, mensaje: 'ok' } : { success: false, mensaje: 'Propuesta no encontrada.' };
});
const mockDescartar = jest.fn(async () => undefined);
jest.mock('@/lib/asistente/propuestas-service', () => ({
  getPropuestas: jest.fn(async () => propuestas),
  aceptarPropuesta: (id: string) => mockAceptar(id),
  descartarNoAvisarMas: (...a: any[]) => (mockDescartar as any)(...a),
  agregarPropuestasDeduplicadas: jest.fn(async () => undefined),
}));

const mockMarcarEnviado = jest.fn(async () => ({ success: true }));
const mockEditarTexto = jest.fn(async () => ({ success: true }));
jest.mock('@/app/actions/scheduled-messages', () => ({
  getScheduledMessages: jest.fn(async () => mensajes),
  markMessageAsSent: (...a: any[]) => (mockMarcarEnviado as any)(...a),
  cancelScheduledMessage: jest.fn(async () => ({ success: true })),
  updateScheduledMessageText: (...a: any[]) => (mockEditarTexto as any)(...a),
}));

const mockArmar = jest.fn(async () => ({ success: true, invitacionDigital: { cabecera: {} } }));
jest.mock('@/app/actions/fiesta/armar-web-con-ia.actions', () => ({
  armarWebConIA: (...a: any[]) => (mockArmar as any)(...a),
}));
const mockSaveFiesta = jest.fn(async () => ({ success: true }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => ({ id })),
  saveFiesta: (...a: any[]) => (mockSaveFiesta as any)(...a),
}));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  getHistorialEjecuciones: jest.fn(async () => []),
  ejecutarPerseguidorPresupuestos: jest.fn(async () => undefined),
}));
jest.mock('@/lib/whatsapp/internal-token', () => ({ WHATSAPP_AUTOMATION_INTERNAL_TOKEN: 'tok' }));

import { darOrdenPorVozOTexto, aprobarItemOK, rechazarItemOK } from '@/app/actions/centro-de-control';

beforeEach(() => {
  jest.clearAllMocks();
  posts = [
    { id: 'a', text: 'A', status: 'Borrador' },
    { id: 'b', text: 'B', status: 'Borrador' },
  ];
  fiestas = [{ id: 'qa-lucia', configuracion: { nombreEvento: 'Lucía' } }];
  mensajes = [
    { id: 'mail', channel: 'email', status: 'pendiente', messageText: 'OLD' },
    { id: 'wa', channel: 'whatsapp', status: 'pendiente', messageText: 'OLD' },
  ];
  propuestas = [];
});

describe('A. la web se arma para la fiesta que se nombró, nunca para una inventada', () => {
  it('sin fiesta que coincida no arma, no guarda y no anota nada', async () => {
    const r = await darOrdenPorVozOTexto('armá la web de la fiesta de Sofía');
    expect(r.success).toBe(false);
    expect(mockArmar).not.toHaveBeenCalled();
    expect(mockSaveFiesta).not.toHaveBeenCalled();
    expect(mockRegistrarSola).not.toHaveBeenCalled();
  });

  it('con la fiesta Lucía usa su id y su nombre (sin "Sofía" de relleno)', async () => {
    const r = await darOrdenPorVozOTexto('armá la web de la fiesta de Lucia');
    expect(r.success).toBe(true);
    expect(mockArmar).toHaveBeenCalledWith('qa-lucia');
    expect(r.mensaje).toContain('Lucía');
    expect(r.mensaje).not.toMatch(/Sof[ií]a/);
    expect(JSON.stringify(mockRegistrarSola.mock.calls)).not.toMatch(/Sof[ií]a/);
  });

  it('una fiesta sin nombre no coincide con cualquier frase', async () => {
    fiestas = [{ id: 'sin-nombre', configuracion: {} }];
    const r = await darOrdenPorVozOTexto('armá la web');
    expect(r.success).toBe(false);
    expect(mockArmar).not.toHaveBeenCalled();
  });

  it('con dos fiestas que coinciden pide precisión', async () => {
    fiestas = [
      { id: '1', configuracion: { nombreEvento: 'Lucía' } },
      { id: '2', configuracion: { nombreEvento: 'Lucía' } },
    ];
    const r = await darOrdenPorVozOTexto('web de Lucía');
    expect(r.success).toBe(false);
    expect(mockArmar).not.toHaveBeenCalled();
  });
});

describe('B. no se afirma lo que no se consultó', () => {
  it('el sábado: no inventa horario ni menú', async () => {
    const r = await darOrdenPorVozOTexto('qué falta para el sábado');
    expect(r.success).toBe(false);
    expect(r.mensaje).not.toMatch(/18:00|celíaco|encaminado/i);
  });
  it('una orden desconocida no dice que empezó a trabajar', async () => {
    const r = await darOrdenPorVozOTexto('preparame el inventario de cables');
    expect(r.success).toBe(false);
    expect(r.mensaje).not.toMatch(/me pongo a trabajar|anotado/i);
  });
});

describe('C. un id que no existe no se aprueba ni se aprende', () => {
  it('post inexistente', async () => {
    const r = await aprobarItemOK('nada', 'post', 'generador_contenido');
    expect(r.success).toBe(false);
    expect(mockDecision).not.toHaveBeenCalled();
  });
  it('mensaje inexistente', async () => {
    const r = await aprobarItemOK('nada', 'mensaje', 'x');
    expect(r.success).toBe(false);
    expect(mockMarcarEnviado).not.toHaveBeenCalled();
    expect(mockDecision).not.toHaveBeenCalled();
  });
  it('propuesta inexistente (acción hija rechazada)', async () => {
    const r = await aprobarItemOK('nada', 'propuesta', 'x');
    expect(r.success).toBe(false);
    expect(mockDecision).not.toHaveBeenCalled();
  });
  it('rechazar una propuesta o un post inexistente tampoco aprende', async () => {
    expect((await rechazarItemOK('nada', 'propuesta', 'x')).success).toBe(false);
    expect((await rechazarItemOK('nada', 'post', 'x')).success).toBe(false);
    expect(mockDescartar).not.toHaveBeenCalled();
    expect(mockDecision).not.toHaveBeenCalled();
  });
});

describe('D. dos aprobaciones a la vez quedan las dos', () => {
  it('aprobar dos posts distintos en simultáneo', async () => {
    const [r1, r2] = await Promise.all([
      aprobarItemOK('a', 'post', 'generador_contenido'),
      aprobarItemOK('b', 'post', 'generador_contenido'),
    ]);
    expect(r1.success && r2.success).toBe(true);
    expect(posts.map((p) => p.status)).toEqual(['Aprobado', 'Aprobado']);
  });
  it('el texto corregido se guarda', async () => {
    await aprobarItemOK('a', 'post', 'generador_contenido', 'A', 'corregido');
    expect(posts[0].text).toBe('corregido');
  });
});

describe('E. aprobar un correo no es enviarlo', () => {
  it('el correo no se marca enviado ni se aprende como hecho, pero el texto corregido queda', async () => {
    const r = await aprobarItemOK('mail', 'mensaje', 'mandar_mensajes_clientes', 'OLD', 'NUEVO');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/correo/i);
    expect(mockMarcarEnviado).not.toHaveBeenCalled();
    expect(mockDecision).not.toHaveBeenCalled();
    expect(mockEditarTexto).toHaveBeenCalledWith('mail', 'NUEVO');
  });
  it('el WhatsApp sigue el camino manual de siempre', async () => {
    const r = await aprobarItemOK('wa', 'mensaje', 'mandar_mensajes_clientes');
    expect(r.success).toBe(true);
    expect(mockMarcarEnviado).toHaveBeenCalledWith('wa', 'Dueño');
  });
});
