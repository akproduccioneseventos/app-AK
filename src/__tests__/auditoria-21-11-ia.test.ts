import { claveDelMes } from '../lib/ai/consumo';
import { generarResumenCompetenciaIA } from '../lib/presencia-digital/competencia';
import { darOrdenPorVozOTexto } from '../app/actions/centro-de-control';
import * as genericJsonStore from '@/lib/generic-json-store';
import * as consumoServidor from '@/lib/ai/consumo-servidor';
import * as cerebroAi from '@/ai/cerebro';
import * as presupuestosActions from '@/app/actions/presupuestos';

jest.mock('@/lib/generic-json-store');
jest.mock('@/lib/ai/consumo-servidor');
jest.mock('@/ai/cerebro', () => ({
  pedirTexto: jest.fn(),
}));
jest.mock('@/lib/auth/require-session', () => ({
  ...jest.requireActual('@/lib/auth/require-session'),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  ...jest.requireActual('@/app/actions/presupuestos'),
  getPresupuestos: jest.fn().mockResolvedValue([
    { id: 'p1', estado: 'Enviado', totalConDescuento: 1000 },
    { id: 'p2', estado: 'Pendiente', totalConDescuento: 2000 },
  ]),
}));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  ...jest.requireActual('@/lib/agentes/motor-agentes'),
  ejecutarPerseguidorPresupuestos: jest.fn(),
}));

describe('Auditoría 21-11 IA y Bloques', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('a) claveDelMes usa Uruguay (2026-11-21T23:30:00.000Z -> 2026-11)', () => {
    const fechaTarde = new Date('2026-11-21T23:30:00.000Z');
    const clave = claveDelMes(fechaTarde);
    expect(clave).toBe('2026-11');
  });

  test('b) generarResumenCompetenciaIA() llama a pedirTexto cuando hay cuentas y devuelve No hay análisis esta semana cuando falla', async () => {
    jest.spyOn(genericJsonStore, 'readGenericJsonFile').mockResolvedValue([
      { username: 'test_competencia', activo: true, seguidores: 100, publicacionesCount: 5 }
    ]);
    (cerebroAi.pedirTexto as jest.Mock).mockResolvedValueOnce({ ok: true, texto: 'Análisis IA de competencia' });

    const res = await generarResumenCompetenciaIA();
    expect(cerebroAi.pedirTexto).toHaveBeenCalled();
    expect(res).toBe('Análisis IA de competencia');

    // Caso fallo
    (cerebroAi.pedirTexto as jest.Mock).mockResolvedValueOnce({ ok: false, texto: '', motivo: 'error' });
    const resFail = await generarResumenCompetenciaIA();
    expect(resFail).toBe('No hay análisis esta semana');
  });

  test('c) darOrdenPorVozOTexto responden con cantidad y NO llaman a ejecutarPerseguidorPresupuestos', async () => {
    const motorAgentes = require('@/lib/agentes/motor-agentes');

    const r1 = await darOrdenPorVozOTexto('¿Cuántos presupuestos tengo?');
    expect(r1.success).toBe(true);
    expect(r1.mensaje).toContain('2');

    const r2 = await darOrdenPorVozOTexto('cuántos presupuestos hay pendientes');
    expect(r2.success).toBe(true);
    expect(r2.mensaje).toContain('2');

    expect(motorAgentes.ejecutarPerseguidorPresupuestos).not.toHaveBeenCalled();
  });

  test('d) getPresupuestos catch devuelve success: false', async () => {
    (presupuestosActions.getPresupuestos as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    const r = await darOrdenPorVozOTexto('¿Cuántos presupuestos tengo?');
    expect(r.success).toBe(false);
    expect(r.mensaje).toBe('No pude consultar los presupuestos en este momento.');
  });
});
