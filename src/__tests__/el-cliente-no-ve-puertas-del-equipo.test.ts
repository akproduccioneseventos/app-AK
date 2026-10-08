/**
 * Codex, auditoria 79: el presupuesto abierto con el enlace del cliente mostraba "Ir al panel
 * principal", "Personalizar asistentes" y "Ver sincronizaciones". Pedian ingreso, pero son
 * puertas del equipo y el cliente no tiene por que verlas.
 */
import fs from 'fs';
import path from 'path';
import { esVistaDelCliente } from '@/hooks/use-es-vista-del-cliente';

describe('el cliente no ve puertas del equipo', () => {
  it('reconoce el enlace del cliente y deja al equipo como estaba', () => {
    expect(esVistaDelCliente('/presupuestos/p1/ver', '?cliente=1&token=abc')).toBe(true);
    expect(esVistaDelCliente('/presupuestos/p1/ver', '?token=abc')).toBe(true);
    expect(esVistaDelCliente('/presupuestos/p1/ver', '?public=1')).toBe(true);
    expect(esVistaDelCliente('/presupuestos/p1/ver', '')).toBe(false);
    expect(esVistaDelCliente('/contabilidad/crm', '?token=abc')).toBe(false);
  });

  it('el armazon esconde las tres puertas cuando lo abre el cliente', () => {
    const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');
    const dock = leer('src/components/module-navigation-dock.tsx');
    expect(dock).toMatch(/showDashboardButton = [^;]*!esVistaDelCliente/);
    const indicador = leer('src/components/assistant/contextual-assistant-indicator.tsx');
    const bloque = indicador.slice(indicador.indexOf('{!esVistaDelCliente'));
    expect(bloque.indexOf('{!esVistaDelCliente')).toBeGreaterThanOrEqual(0);
    expect(bloque).toContain('/settings/asistentes-contextuales');
    expect(bloque).toContain('/settings/sincronizaciones');
  });
});
