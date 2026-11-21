/**
 * MATAFUEGO — Auditoría externa del 21/11/2026 (IA-01): el asistente pedía el presupuesto "p_B" y le llegaba el de
 * otro cliente, porque un nombre vacío coincidía con todos y ganaba el primero de la lista. Los cuatro casos del
 * informe, en los dos órdenes de la lista.
 */
jest.mock('@/ai/genkit', () => ({ generateWithGeminiFallback: jest.fn() }));
jest.mock('@/ai/flows/multiagent-flow', () => ({ runMultiAgent: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ savePresupuesto: jest.fn(), getPresupuestos: jest.fn() }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: jest.fn(), addCrmLead: jest.fn() }));
jest.mock('@/app/actions/servicios-empresa', () => ({ getServiciosEmpresaPublicos: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(), getFiestas: jest.fn() }));
jest.mock('@/app/actions/multiagent', () => ({ crearTareaDesdeMultiagente: jest.fn(), crearRecordatorioDesdeMultiagente: jest.fn() }));

import { elegirPresupuestoPedido } from '@/lib/multiagent/encargado';

const A = { id: 'p_A', clienteNombre: 'PRUEBA ALFA', estado: 'Enviado' };
const B = { id: 'p_B', clienteNombre: 'PRUEBA BETA', estado: 'Enviado' };

describe.each([
  ['A primero', [A, B]],
  ['B primero', [B, A]],
])('el asistente lee el presupuesto que se pidió (%s)', (_orden, lista) => {
  it('con el número, devuelve ese y no el primero de la lista', () => {
    expect(elegirPresupuestoPedido(lista, { id: 'p_B' })).toEqual({ ok: true, presupuesto: B });
  });
  it('con un número que no existe, no encuentra nada', () => {
    expect(elegirPresupuestoPedido(lista, { id: 'no_existe' })).toEqual({ ok: true, presupuesto: undefined });
  });
  it('con un nombre que coincide con dos, pregunta cuál', () => {
    const r = elegirPresupuestoPedido(lista, { nombreCliente: 'PRUEBA' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.candidatos?.map((c) => c.id).sort()).toEqual(['p_A', 'p_B']);
  });
  it('con número y nombre que no coinciden, frena en vez de elegir', () => {
    expect(elegirPresupuestoPedido(lista, { id: 'p_B', nombreCliente: 'PRUEBA ALFA' }).ok).toBe(false);
  });
  it('sin número ni nombre, no elige ninguno', () => {
    expect(elegirPresupuestoPedido(lista, {})).toEqual({ ok: true, presupuesto: undefined });
  });
});

describe('el asistente no elige un cliente o una fiesta con un nombre vacío o ambiguo', () => {
  it('assistant.ts no busca con un nombre que puede venir vacío (coincide con todos)', () => {
    const fs = jest.requireActual('fs') as typeof import('fs');
    const fuente = fs.readFileSync(require('path').join(process.cwd(), 'src/app/actions/assistant.ts'), 'utf8');
    expect(fuente).not.toMatch(/\.includes\(\(d\.clienteNombre \|\| ''\)/);
    expect(fuente).toMatch(/function unoSoloPorNombre/);
    expect(fuente).toMatch(/if \(quiero\.length < 3\) return undefined;/);
  });
});
