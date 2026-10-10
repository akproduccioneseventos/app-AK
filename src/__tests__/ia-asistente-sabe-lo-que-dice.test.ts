/**
 * MATAFUEGO — El asistente de la app tiene que SERVIR (dueño, 10/10/2026: "no hace nada, pura
 * pavada").
 *
 * Lo que fallaba, y lo que esta prueba mira (sobre `runMultiAgent` con la IA simulada, mirando
 * el prompt que de verdad se le manda al modelo y la respuesta que de verdad sale):
 *  1. Las cinco acciones del secretario (agendar_reunion, ver_mi_semana, preparar_mail,
 *     buscar_en_la_web, cuanto_me_deben) existían en el servidor y el prompt no las ofrecía.
 *  2. Todos los agentes reciben FIESTAS PRÓXIMOS 30 DÍAS ordenadas, y quien ve plata recibe el
 *     total que le deben calculado sobre TODOS los presupuestos vivos con pagos confirmados.
 *     Quien NO tiene el permiso de contabilidad no recibe ni una cifra de deuda.
 *  3. Si la lectura falla, la respuesta lo dice al principio (no parece "no hay nada").
 *  4. El modo respaldo avisa con su línea explícita y la marca `modoRespaldo`.
 *  6. El prompt ya no pide "4-5 líneas y 3 a 6 emojis".
 *  7. Sólo los aprendizajes de confianza alta (tope 5) entran al prompt.
 *
 * Probado rompiéndolo: (a) sacando `cuanto_me_deben` del prompt, la prueba 1 da rojo; (b) quitando
 * el `conPlata ?` que protege el bloque PLATA, la prueba del perfil sin contabilidad da rojo;
 * (c) calculando la deuda sobre los últimos 12 en vez de todos, la del total da rojo; (d) sacando
 * `conAvisoDeLectura`, las de lectura fallida dan rojo; (e) poniendo el filtro de aprendizajes en
 * `!== 'low'`, la de memoria da rojo.
 */

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// ── Estado que cada prueba acomoda ───────────────────────────────────────────
let perfilDeLaSesion: string | undefined;
let fiestasLeidas: any[] | 'FALLA';
let presupuestosCrudos: any[] | 'FALLA';
let presupuestosPorAccion: any[];
let memoriaLearnings: any[];
let manualFalla = false;
let briefing: any;
let iaResponde: (args: any) => Promise<{ text: string }>;
const llamadasIA: any[] = [];

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(async (args: any) => {
    llamadasIA.push(args);
    return iaResponde(args);
  }),
  getGeminiModelForAgent: () => 'googleai/modelo-de-prueba',
  getGeminiGenerationConfigForAgent: () => ({ maxOutputTokens: 4096 }),
}));
jest.mock('@/ai/flows/marketing-agent-flow', () => ({ chatWithMarketingAgent: jest.fn() }));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', email: 'a@b.c', role: 'user', perfil: perfilDeLaSesion } })),
}));
jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(async (_f: string, defecto: any) =>
    presupuestosCrudos === 'FALLA' ? { valor: defecto, huboFalla: true } : { valor: copia(presupuestosCrudos), huboFalla: false },
  ),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => {
    if (fiestasLeidas === 'FALLA') throw new Error('base caída');
    return copia(fiestasLeidas);
  }),
  getFiestaById: jest.fn(async () => null),
}));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => copia(presupuestosPorAccion)) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: jest.fn(async () => []) }));
jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn(async () => ({ success: true, data: { alerts: [], presupuestosPendientes: 0, facturasPorVencer: 0 } })),
}));
jest.mock('@/lib/multiagent/memory-store', () => ({
  getAgentMemoryProfile: jest.fn(async () => ({ id: 'p', summary: 'RESUMEN-AUTOMATICO-RUIDOSO', learnings: copia(memoriaLearnings) })),
  saveAgentLearning: jest.fn(async () => undefined),
}));
jest.mock('@/lib/multiagent/diagnostics', () => ({
  buildMultiAgentTeamBriefing: jest.fn(async () => briefing),
  formatAgentDiagnosticsForPrompt: jest.fn(() => 'DIAGNOSTICO-DE-PRUEBA'),
}));
jest.mock('@/lib/multiagent/manual-ak', () => ({
  formatManualForAgentPrompt: jest.fn(() => {
    if (manualFalla) throw new Error('manual roto');
    return 'MANUAL-DE-PRUEBA';
  }),
}));
jest.mock('@/lib/multiagent/assistant-crm-actions', () => ({
  prepareAssistantLeadProposal: jest.fn(),
  prepareAssistantBudgetProposal: jest.fn(),
  prepareWhatsAppMessage: jest.fn(),
}));

import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { LINEA_MODO_RESPALDO, calcularDeudas } from '@/lib/multiagent/contexto-negocio';
import { hoyEnUruguay } from '@/lib/utils';

function sumarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const HOY = hoyEnUruguay();

const fiesta = (id: string, nombre: string, dias: number, extra: any = {}) => ({
  id,
  estado: 'confirmada',
  configuracion: { nombreEvento: nombre, fechaEvento: sumarDias(HOY, dias) },
  tareas: [{ id: `${id}-t1`, texto: 'algo', completada: false }],
  ...extra,
});

const presupuesto = (id: string, cliente: string, total: number, pagado: number, extra: any = {}) => ({
  id,
  clienteNombre: cliente,
  estado: 'Aceptado',
  eventoTipo: 'Boda',
  totalConDescuento: total,
  timestamp: '2026-01-01',
  fechaFirmaContrato: '2026-01-01',
  eventoFecha: '2026-12-01',
  pagosCliente: pagado > 0 ? [{ id: `${id}-p`, monto: pagado, fecha: '2026-02-01', estadoPago: 'confirmado' }] : [],
  ...extra,
});

const respuestaJson = (response = 'Todo bien, ya te cuento cómo viene la semana con los números reales.') =>
  ({ text: JSON.stringify({ response, action: { type: 'none', data: null } }) });

const ultimoPrompt = () => String(llamadasIA[llamadasIA.length - 1].prompt);
const ultimoSistema = () => String(llamadasIA[llamadasIA.length - 1].system);

beforeEach(() => {
  llamadasIA.length = 0;
  perfilDeLaSesion = 'dueno';
  fiestasLeidas = [];
  presupuestosCrudos = [];
  presupuestosPorAccion = [];
  memoriaLearnings = [];
  manualFalla = false;
  briefing = { items: [] };
  iaResponde = async () => respuestaJson();
});

describe('El prompt ofrece lo que el servidor sabe hacer', () => {
  it('las cinco acciones del secretario están en el enum y descritas', async () => {
    await runMultiAgent({ message: 'qué tengo hoy', agentType: 'secretaria' });
    const sistema = ultimoSistema();
    for (const accion of ['agendar_reunion', 'ver_mi_semana', 'preparar_mail', 'buscar_en_la_web', 'cuanto_me_deben']) {
      // en el enum del formato…
      expect(sistema).toMatch(new RegExp(`"type": "none"[^\\n]*"${accion}"`));
      // …y descrita con su propio `"type": "<accion>"` (cuándo usarla y con qué datos).
      expect(sistema).toContain(`"type": "${accion}"`);
    }
    // El mail sigue siendo "preparar": lo manda una persona.
    expect(sistema).toMatch(/NO se envía/);
  });

  it('el prompt ya no pide 4-5 líneas ni "muchos emojis", y pide listas completas con cifras reales', async () => {
    await runMultiAgent({ message: 'hola', agentType: 'central' });
    const sistema = ultimoSistema();
    expect(sistema).not.toMatch(/máximo 4-5 líneas/);
    expect(sistema).not.toMatch(/de 3 a 6 emojis/);
    expect(sistema).toMatch(/Emojis: como mucho 1 o 2/);
    expect(sistema).not.toMatch(/muchos emojis/);
    expect(sistema).toMatch(/COMPLETO/);
    expect(sistema).toMatch(/nunca los redondees ni los inventes/);
  });

  it('la IA recibe un tope de salida explícito (así el piso de tokens se aplica)', async () => {
    await runMultiAgent({ message: 'hola', agentType: 'central' });
    expect(llamadasIA[0].config.maxOutputTokens).toBeGreaterThanOrEqual(4096);
  });
});

describe('El contexto de negocio que recibe CADA agente', () => {
  const agentes = ['central', 'secretaria', 'comercial', 'contable', 'marketing', 'fiestas_general'] as const;

  it.each(agentes)('%s recibe las fiestas de los próximos 30 días ordenadas por fecha, sin las pasadas ni las lejanas', async (agente) => {
    fiestasLeidas = [
      fiesta('f-lejos', 'Boda Lejana', 45),
      fiesta('f-tarde', 'Cumple Tarde', 20),
      fiesta('f-pasada', 'Fiesta Pasada', -3),
      fiesta('f-hoy', 'Quince de Hoy', 0),
      fiesta('f-cancelada', 'Cancelada', 5, { estado: 'cancelada' }),
      fiesta('f-pronto', 'Boda Pronto', 4),
    ];
    await runMultiAgent({ message: 'cómo viene el mes', agentType: agente });
    const prompt = ultimoPrompt();
    const bloque = prompt.slice(prompt.indexOf('FIESTAS PRÓXIMOS 30 DÍAS'));
    const orden = ['Quince de Hoy', 'Boda Pronto', 'Cumple Tarde'].map((n) => bloque.indexOf(n));
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden); // ya vienen en orden de fecha
    expect(bloque).toContain('HOY');
    expect(bloque).toContain('en 4 días');
    expect(bloque).not.toContain('Boda Lejana');
    expect(bloque).not.toContain('Fiesta Pasada');
    expect(bloque).not.toContain('Cancelada');
    expect(bloque).toMatch(/AGENDA \(hoy/);
  });

  it('el total que te deben se calcula sobre TODOS los presupuestos vivos y sólo cuenta pagos confirmados', async () => {
    // 15 presupuestos con saldo 1.000 cada uno: los últimos 12 darían 12.000, no 15.000.
    const muchos = Array.from({ length: 15 }, (_, i) => presupuesto(`p${i}`, `Cliente ${i}`, 11000, 10000));
    presupuestosCrudos = [
      ...muchos,
      // 5.000 pagados pero "pendiente_confirmacion": NO descuenta.
      presupuesto('pp', 'Pago Sin Confirmar', 30000, 0, {
        pagosCliente: [{ id: 'x', monto: 5000, fecha: '2026-02-01', estadoPago: 'pendiente_confirmacion' }],
      }),
      presupuesto('arch', 'Archivado', 99999, 0, { archived: true }),
      presupuesto('ver', 'Prueba', 88888, 0, { estado: 'Pendiente Verificación' }),
      presupuesto('env', 'Sólo Enviado', 77777, 0, { estado: 'Enviado' }),
    ];
    await runMultiAgent({ message: 'cuánto me deben', agentType: 'contable' });
    const prompt = ultimoPrompt();
    // 15 × 1.000 + 30.000 = 45.000
    expect(prompt).toContain('PLATA: total que te deben $45.000 en 16 presupuestos');
    expect(prompt).toContain('Pago Sin Confirmar (Boda): $30.000');
    const bloque = prompt.slice(prompt.indexOf('PLATA:'), prompt.indexOf('AGENDA ('));
    for (const fuera of ['Archivado', 'Prueba', 'Sólo Enviado', '99.999', '88.888', '77.777']) {
      expect(bloque).not.toContain(fuera);
    }
    // Los 5 que más deben, de mayor a menor.
    expect(bloque.indexOf('Pago Sin Confirmar')).toBeLessThan(bloque.indexOf('Cliente 0'));
  });

  it('las cuotas vencidas del plan de pagos aparecen con el atraso, y las pagadas o futuras no', async () => {
    fiestasLeidas = [
      fiesta('fx', 'Boda Atrasada', 40, {
        planDePagos: {
          cuotas: [
            { id: 'c1', descripcion: 'Cuota 1', monto: 8000, fechaVencimiento: sumarDias(HOY, -10), estado: 'vencido' },
            { id: 'c2', descripcion: 'Cuota 2', monto: 9000, fechaVencimiento: sumarDias(HOY, -20), estado: 'pagado' },
            { id: 'c3', descripcion: 'Cuota 3', monto: 7000, fechaVencimiento: sumarDias(HOY, 15), estado: 'pendiente' },
            { id: 'c4', descripcion: 'Cuota 4', monto: 6000, montoPagado: 2500, fechaVencimiento: sumarDias(HOY, -2), estado: 'parcial' },
          ],
        },
      }),
    ];
    presupuestosCrudos = [presupuesto('p1', 'Ana', 10000, 0)];
    await runMultiAgent({ message: 'cuotas', agentType: 'contable' });
    const bloque = ultimoPrompt().slice(ultimoPrompt().indexOf('PLATA:'));
    expect(bloque).toContain('Cuotas vencidas sin cobrar (2), total $11.500');
    expect(bloque).toContain('Boda Atrasada — Cuota 1: $8.000 (10 días de atraso)');
    expect(bloque).toContain('Cuota 4: $3.500 (2 días de atraso)');
    expect(bloque).not.toContain('Cuota 2:');
    expect(bloque).not.toContain('Cuota 3:');
  });

  it('un perfil SIN contabilidad (operador) no recibe ni el bloque PLATA ni saldos por presupuesto', async () => {
    perfilDeLaSesion = 'operador';
    presupuestosCrudos = [presupuesto('p1', 'Ana Secreta', 123456, 0)];
    presupuestosPorAccion = [presupuesto('p1', 'Ana Secreta', 123456, 0, { sena: 777 })];
    fiestasLeidas = [fiesta('f1', 'Boda X', 3, {
      planDePagos: { cuotas: [{ id: 'c', descripcion: 'Cuota 1', monto: 4321, fechaVencimiento: sumarDias(HOY, -5), estado: 'vencido' }] },
    })];
    await runMultiAgent({ message: 'cuánto me deben', agentType: 'secretaria' });
    const prompt = ultimoPrompt();
    expect(prompt).not.toContain('PLATA:');
    expect(prompt).not.toMatch(/total que te deben/);
    expect(prompt).not.toContain('Saldo:');
    expect(prompt).not.toContain('Seña:');
    expect(prompt).not.toContain('4.321');
    expect(prompt).not.toContain('123.456');
    expect(prompt).not.toMatch(/Cuotas vencidas/);
    // Lo que no es plata sí le llega.
    expect(prompt).toContain('Boda X');
    expect(prompt).toContain('Ana Secreta');
  });

  it('la secretaria (con contabilidad) sí recibe el bloque PLATA', async () => {
    perfilDeLaSesion = 'secretaria';
    presupuestosCrudos = [presupuesto('p1', 'Ana', 10000, 4000)];
    await runMultiAgent({ message: 'plata', agentType: 'secretaria' });
    expect(ultimoPrompt()).toContain('PLATA: total que te deben $6.000');
  });

  it('todo lo que cambia con los datos queda acotado a ~8000 caracteres', async () => {
    fiestasLeidas = Array.from({ length: 200 }, (_, i) => fiesta(`f${i}`, `Fiesta ${i} ${'x'.repeat(60)}`, (i % 28) + 1));
    presupuestosCrudos = Array.from({ length: 300 }, (_, i) => presupuesto(`p${i}`, `Cliente ${i} ${'y'.repeat(40)}`, 20000, 1000));
    await runMultiAgent({ message: 'todo', agentType: 'central' });
    const prompt = ultimoPrompt();
    const inicio = prompt.indexOf('══════════ DATOS EN TIEMPO REAL');
    const fin = prompt.indexOf('MENSAJE DE ALEXANDER');
    expect(fin - inicio).toBeLessThan(8400);
  });
});

describe('Si la lectura falla, la respuesta lo dice', () => {
  it('una lectura de fiestas caída NO se parece a "no hay fiestas": el bloque dice que no se pudo leer y la respuesta avisa', async () => {
    fiestasLeidas = 'FALLA';
    const r = await runMultiAgent({ message: 'qué fiestas hay', agentType: 'central' });
    expect(ultimoPrompt()).toContain('no se pudo leer la lista de fiestas');
    expect(ultimoPrompt()).not.toContain('No hay fiestas cargadas');
    expect(r.response.startsWith('Ojo: ahora no pude leer las fiestas')).toBe(true);
  });

  it('una lectura de presupuestos caída (con permiso de plata) no inventa "nadie debe": dice que no pudo leer', async () => {
    presupuestosCrudos = 'FALLA';
    const r = await runMultiAgent({ message: 'cuánto me deben', agentType: 'contable' });
    expect(ultimoPrompt()).toContain('PLATA: no se pudieron leer los presupuestos');
    expect(ultimoPrompt()).not.toContain('Nadie debe saldo');
    expect(r.response).toMatch(/^Ojo: ahora no pude leer los presupuestos/);
  });

  it('si no se pudo armar el contexto entero, la respuesta empieza diciéndolo con todas las letras', async () => {
    manualFalla = true;
    const r = await runMultiAgent({ message: 'cómo estamos', agentType: 'central' });
    expect(r.response.startsWith('No pude leer los datos del negocio ahora mismo')).toBe(true);
    expect(ultimoPrompt()).toMatch(/NO SE PUDO LEER NINGÚN DATO/);
  });
});

describe('Modo respaldo: no se hace pasar por una respuesta de la IA', () => {
  it('si la IA falla, la primera línea lo dice, viene la marca modoRespaldo y no se guarda como éxito silencioso', async () => {
    iaResponde = async () => { throw new Error('IA caída'); };
    briefing = { items: [{ priority: 'alta', title: 'Cuotas', detail: 'Hay 2 vencidas' }] };
    const r = await runMultiAgent({ message: 'resumen', agentType: 'central' });
    expect(r.modoRespaldo).toBe(true);
    expect(r.response.split('\n')[0]).toBe(LINEA_MODO_RESPALDO);
    expect(r.response).toContain('Hay 2 vencidas');
    expect(r.response).not.toMatch(/Sin datos inventados/);
    expect(r.error).toBeTruthy();
  });

  it('con el diagnóstico vacío PERO leído, no dice "sin pendientes detectados"; con el diagnóstico sin leer, dice que no pudo', async () => {
    iaResponde = async () => { throw new Error('IA caída'); };
    briefing = { items: [] };
    const leido = await runMultiAgent({ message: 'resumen', agentType: 'central' });
    expect(leido.response).not.toMatch(/Sin pendientes detectados/);

    briefing = null;
    const sinLeer = await runMultiAgent({ message: 'resumen', agentType: 'central' });
    expect(sinLeer.modoRespaldo).toBe(true);
    expect(sinLeer.response).toMatch(/No pude leer tus datos ahora, así que no puedo decirte si hay pendientes/);
    expect(sinLeer.response).not.toMatch(/sin pendientes/i);
  });

  it('una respuesta normal de la IA NO lleva la marca de respaldo', async () => {
    const r = await runMultiAgent({ message: 'hola', agentType: 'central' });
    expect(r.modoRespaldo).toBeUndefined();
  });
});

describe('La memoria que entra al prompt', () => {
  it('sólo los aprendizajes de confianza alta, con tope de 5, y sin el resumen automático', async () => {
    memoriaLearnings = [
      ...Array.from({ length: 8 }, (_, i) => ({ title: `Alta ${i}`, content: `contenido alto ${i}`, confidence: 'high' })),
      ...Array.from({ length: 6 }, (_, i) => ({ title: `Baja ${i}`, content: `ruido auto ${i}`, confidence: 'low' })),
      { title: 'Media chat', content: 'chat guardado solo', confidence: 'medium' },
    ];
    await runMultiAgent({ message: 'hola', agentType: 'central' });
    const prompt = ultimoPrompt();
    const altas = (prompt.match(/Alta \d/g) || []).length;
    expect(altas).toBe(5);
    expect(prompt).not.toMatch(/Baja \d/);
    expect(prompt).not.toContain('Media chat');
    expect(prompt).not.toContain('RESUMEN-AUTOMATICO-RUIDOSO');
  });

  it('una confianza media (el chat guardado solo) tampoco entra, aunque sobre lugar', async () => {
    memoriaLearnings = [
      { title: 'Alta uno', content: 'a', confidence: 'high' },
      { title: 'Media chat', content: 'chat guardado solo', confidence: 'medium' },
      { title: 'Baja auto', content: 'auto', confidence: 'low' },
    ];
    await runMultiAgent({ message: 'hola', agentType: 'central' });
    expect(ultimoPrompt()).toContain('Alta uno');
    expect(ultimoPrompt()).not.toContain('Media chat');
    expect(ultimoPrompt()).not.toContain('Baja auto');
  });

  it('si no hay nada aprobado, lo dice en vez de rellenar con ruido', async () => {
    memoriaLearnings = [{ title: 'Baja', content: 'x', confidence: 'low' }];
    await runMultiAgent({ message: 'hola', agentType: 'central' });
    expect(ultimoPrompt()).toContain('Sin memoria aprobada.');
  });
});

describe('calcularDeudas (la cuenta que comparten el contexto y cuanto_me_deben)', () => {
  it('suma saldos de contratados vivos y ordena de mayor a menor', () => {
    const r = calcularDeudas([
      presupuesto('a', 'Chico', 10000, 9000),
      presupuesto('b', 'Grande', 50000, 10000),
      presupuesto('c', 'Pagado', 5000, 5000),
    ]);
    expect(r.total).toBe(41000);
    expect(r.deudores.map((d) => d.cliente)).toEqual(['Grande', 'Chico']);
  });
});
