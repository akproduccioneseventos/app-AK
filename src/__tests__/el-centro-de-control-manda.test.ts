process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';

import fs from 'fs';
import path from 'path';

let mockPerfil = 'dueno';

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: true,
    user: {
      userId: 'test-user-id',
      email: 'dueno@akproducciones.uy',
      perfil: mockPerfil,
      role: mockPerfil === 'dueno' || mockPerfil === 'admin' ? 'admin' : 'user',
    },
  })),
}));

// Mock para armarWebConIA si se ejecuta en modo sola
jest.mock('@/app/actions/fiesta/armar-web-con-ia.actions', () => ({
  armarWebConIA: jest.fn(async (fiestaId: string) => ({
    success: true,
    invitacionDigital: { cabecera: { protagonista1: 'Sofía' } },
  })),
}));

import {
  guardarReglaIA,
  getReglasDeLaIA,
  getReglaParaTarea,
  registrarDecisionDuenio,
  getRegistroAccionesSolas,
} from '@/lib/ia/reglas-de-la-ia';
import { aprenderDeLoAprobado } from '@/lib/ia/aprender-de-lo-aprobado';
import {
  getCentroDeControlDatos,
  aprobarItemOK,
  rechazarItemOK,
  actualizarReglaIA,
  darOrdenPorVozOTexto,
} from '@/app/actions/centro-de-control';
import { getPropuestas } from '@/lib/asistente/propuestas-service';

describe('El Centro de Control Manda (Orden 236)', () => {
  const dataDir = path.join(process.cwd(), 'data');
  const reglasPath = path.join(dataDir, 'reglas-de-la-ia.json');
  const registroPath = path.join(dataDir, 'ia-registro.json');
  const aprendizajePath = path.join(dataDir, 'ia-aprendizaje.json');
  const propuestasPath = path.join(dataDir, 'asistente-propuestas.json');

  let originalReglas: string | null = null;
  let originalRegistro: string | null = null;
  let originalAprendizaje: string | null = null;
  let originalPropuestas: string | null = null;

  beforeAll(() => {
    if (fs.existsSync(reglasPath)) originalReglas = fs.readFileSync(reglasPath, 'utf8');
    if (fs.existsSync(registroPath)) originalRegistro = fs.readFileSync(registroPath, 'utf8');
    if (fs.existsSync(aprendizajePath)) originalAprendizaje = fs.readFileSync(aprendizajePath, 'utf8');
    if (fs.existsSync(propuestasPath)) originalPropuestas = fs.readFileSync(propuestasPath, 'utf8');
  });

  afterAll(() => {
    if (originalReglas !== null) fs.writeFileSync(reglasPath, originalReglas, 'utf8');
    else if (fs.existsSync(reglasPath)) fs.unlinkSync(reglasPath);

    if (originalRegistro !== null) fs.writeFileSync(registroPath, originalRegistro, 'utf8');
    else if (fs.existsSync(registroPath)) fs.unlinkSync(registroPath);

    if (originalAprendizaje !== null) fs.writeFileSync(aprendizajePath, originalAprendizaje, 'utf8');
    else if (fs.existsSync(aprendizajePath)) fs.unlinkSync(aprendizajePath);

    if (originalPropuestas !== null) fs.writeFileSync(propuestasPath, originalPropuestas, 'utf8');
    else if (fs.existsSync(propuestasPath)) fs.unlinkSync(propuestasPath);
  });

  beforeEach(() => {
    mockPerfil = 'dueno';
    fs.writeFileSync(reglasPath, '{}', 'utf8');
    fs.writeFileSync(registroPath, '[]', 'utf8');
    fs.writeFileSync(aprendizajePath, '[]', 'utf8');
    fs.writeFileSync(propuestasPath, '[]', 'utf8');
  });

  // (a) Una tarea en apagada no corre
  it('(a) una tarea en apagada no corre y avisa al dueño', async () => {
    await guardarReglaIA('armar_web_evento', 'apagada', 'dueno');

    const res = await darOrdenPorVozOTexto('armale la web a la fiesta de Sofía');
    expect(res.success).toBe(false);
    expect(res.mensaje).toMatch(/apagada/i);

    const acciones = await getRegistroAccionesSolas();
    expect(acciones).toHaveLength(0);

    const propuestas = await getPropuestas();
    const deSofia = propuestas.filter((p) => p.titulo.includes('Sofía'));
    expect(deSofia).toHaveLength(0);
  });

  // (b) Una tarea en preguntar no actúa y deja una propuesta. Al aceptarla, recién actúa.
  it('(b) una tarea en preguntar no actúa y deja una propuesta; al aceptarla, recién actúa', async () => {
    await guardarReglaIA('armar_web_evento', 'preguntar', 'dueno');

    const res = await darOrdenPorVozOTexto('armale la web a la fiesta de Sofía');
    expect(res.success).toBe(true);
    expect(res.mensaje).toMatch(/Para tu OK|pregunt/i);

    const propuestas = await getPropuestas();
    const propSofia = propuestas.find((p) => p.titulo.includes('Sofía') && p.estado === 'pendiente');
    expect(propSofia).toBeDefined();

    // Aceptamos la propuesta a través de aprobarItemOK
    const resAprobar = await aprobarItemOK(
      propSofia!.id,
      'propuesta',
      'armar_web_evento',
      propSofia!.quePropone
    );
    expect(resAprobar.success).toBe(true);

    const propuestasDespues = await getPropuestas();
    const propActualizada = propuestasDespues.find((p) => p.id === propSofia!.id);
    expect(propActualizada?.estado).toBe('aceptada');
  });

  // (c) Una tarea en sola actúa y queda en ia-registro.json
  it('(c) una tarea en sola actúa y queda en ia-registro.json', async () => {
    await guardarReglaIA('armar_web_evento', 'sola', 'dueno');

    const res = await darOrdenPorVozOTexto('armale la web a la fiesta de Sofía');
    expect(res.success).toBe(true);
    expect(res.mensaje).toMatch(/web|Sofía/i);

    const acciones = await getRegistroAccionesSolas();
    expect(acciones.length).toBeGreaterThanOrEqual(1);
    expect(acciones[0].tareaId).toBe('armar_web_evento');
    expect(acciones[0].que).toMatch(/Sofía/i);
  });

  // (d) Querer poner "mandar mensajes a clientes" o "gastar en publicidad" en sola se rechaza en el servidor (throw Error)
  it('(d) querer poner "mandar mensajes a clientes" o "gastar en publicidad" en sola se rechaza en el servidor', async () => {
    await expect(
      guardarReglaIA('mandar_mensajes_clientes', 'sola', 'dueno')
    ).rejects.toThrow(/seguridad/i);

    await expect(
      guardarReglaIA('gastar_publicidad', 'sola', 'dueno')
    ).rejects.toThrow(/seguridad/i);

    await expect(
      guardarReglaIA('vigilante_publicidad', 'sola', 'dueno')
    ).rejects.toThrow(/seguridad/i);
  });

  // (e) Una sesión de secretaria no puede cambiar reglas (throw Error con 'secretaria')
  it('(e) una sesión de secretaria no puede cambiar reglas (throw Error con "secretaria")', async () => {
    // 1. Directo en guardarReglaIA con perfilUsuario = 'secretaria'
    await expect(
      guardarReglaIA('vigilante_fiestas', 'sola', 'secretaria')
    ).rejects.toThrow(/secretaria/i);

    // 2. Mediante actualizarReglaIA con perfilUsuario = 'secretaria'
    await expect(
      actualizarReglaIA('vigilante_fiestas', 'sola', 'secretaria')
    ).rejects.toThrow(/secretaria/i);

    // 3. Con sesión activa de secretaria
    mockPerfil = 'secretaria';
    await expect(
      actualizarReglaIA('vigilante_fiestas', 'sola')
    ).rejects.toThrow(/secretaria/i);
  });

  // (f) Tres "No" seguidos apagan la regla
  it('(f) tres "No" seguidos apagan la regla', async () => {
    await guardarReglaIA('perseguidor_presupuestos', 'preguntar', 'dueno');

    await registrarDecisionDuenio({ tipoTarea: 'perseguidor_presupuestos', decision: 'no' });
    let regla = await getReglaParaTarea('perseguidor_presupuestos');
    expect(regla).toBe('preguntar');

    await registrarDecisionDuenio({ tipoTarea: 'perseguidor_presupuestos', decision: 'no' });
    regla = await getReglaParaTarea('perseguidor_presupuestos');
    expect(regla).toBe('preguntar');

    await registrarDecisionDuenio({ tipoTarea: 'perseguidor_presupuestos', decision: 'no' });
    regla = await getReglaParaTarea('perseguidor_presupuestos');
    expect(regla).toBe('apagada');

    const acciones = await getRegistroAccionesSolas();
    const avisoApagado = acciones.find((a) => a.tareaId === 'perseguidor_presupuestos');
    expect(avisoApagado).toBeDefined();
    expect(avisoApagado?.que).toMatch(/3 veces seguidas/i);
  });

  // (g) Un texto corregido por el dueño aparece como ejemplo en el pedido siguiente a la IA (con aprenderDeLoAprobado)
  it('(g) un texto corregido por el dueño aparece como ejemplo en el pedido siguiente a la IA', async () => {
    const textoPropuesto = 'Hola, ¿cómo estás? Te queríamos consultar por el presupuesto...';
    const textoCorregido = '¡Hola! Te paso el resumen que me pediste para tu fiesta.';

    await registrarDecisionDuenio({
      tipoTarea: 'web-evento',
      textoPropuesto,
      textoFinal: textoCorregido,
      decision: 'cambiar',
    });

    const ejemplos = await aprenderDeLoAprobado('web-evento');
    expect(ejemplos).toContain(textoCorregido);
    expect(ejemplos).not.toContain(textoPropuesto);
  });
});
