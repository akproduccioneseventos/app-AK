import { describe, it, expect } from '@jest/globals';
import {
  mapaParaLaAsistente,
  esPantallaReal,
  MENU_DEL_STAFF,
  CUANTAS_PANTALLAS,
} from '@/lib/multiagent/mapa-app.generado';

describe('Bloque 1 — Asistente de IA: Mapa y Control de Navegación', () => {
  it('el mapa para la asistente contiene las 39 opciones de menú del staff', () => {
    const mapaTexto = mapaParaLaAsistente();
    expect(MENU_DEL_STAFF.length).toBe(39);
    expect(mapaTexto).toContain('MAPA DEL PANEL (39 opciones de menu');
    expect(mapaTexto).toContain('Lista de Compras → /compras');
    expect(mapaTexto).toContain('Facturas → /invoices');
    expect(mapaTexto).toContain('Prospectos → /contabilidad/crm');
    expect(mapaTexto).toContain('Panel Contable → /empresa/contabilidad');
  });

  it('esPantallaReal reconoce correctamente rutas reales de la app', () => {
    expect(esPantallaReal('/compras')).toBe(true);
    expect(esPantallaReal('/invoices')).toBe(true);
    expect(esPantallaReal('/contabilidad/crm')).toBe(true);
    expect(esPantallaReal('/fiestas/nueva/configuracion')).toBe(true);
    expect(esPantallaReal('/fiestas/nueva/plan-pagos')).toBe(true);
    expect(esPantallaReal('/portal-cliente/123/menu')).toBe(true);
    expect(esPantallaReal('/evento/hub/fiesta-456')).toBe(true);
  });

  it('esPantallaReal rechaza rutas inventadas o pantallas inexistentes para evitar navegación rota', () => {
    expect(esPantallaReal('/pantalla-inventada-que-no-existe')).toBe(false);
    expect(esPantallaReal('/admin/pantalla-fantasma')).toBe(false);
    expect(esPantallaReal('/plan-pagos')).toBe(false); // La ruta real es /fiestas/nueva/plan-pagos
    expect(esPantallaReal('/rutas/magicas/ia')).toBe(false);
  });

  it('cada una de las 39 opciones del menú del staff apunta a una pantalla real', () => {
    for (const opcion of MENU_DEL_STAFF) {
      expect(esPantallaReal(opcion.ruta)).toBe(true);
    }
  });

  it('el mapa contiene más de 300 pantallas indexadas en total', () => {
    expect(CUANTAS_PANTALLAS).toBeGreaterThanOrEqual(300);
  });
});
