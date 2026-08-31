import fs from 'node:fs';
import path from 'node:path';
import {
  getAllRoutes,
  getModuleForRoute,
  isPassiveRoute,
  resolveDynamicSegments,
  crearCookieDeSesion,
  crearPermisoDeEstacion,
  FIXTURE_IDS,
} from '../../scripts/helpers/route-inventory.mjs';
import { calcularMetricasAuditadas } from '../../scripts/actualizar-auditado.mjs';

describe('Orden 21: Recorrido de Pantallas y Lista Automática', () => {
  it('descubre exactamente todas las pantallas de la app en src/app (mínimo 353)', () => {
    const routes = getAllRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(353);
    expect(routes.every((r: any) => typeof r.testUrl === 'string' && r.testUrl.startsWith('/'))).toBe(true);
    expect(routes.every((r: any) => typeof r.moduleName === 'string' && r.moduleName.length > 0)).toBe(true);
  });

  it('resuelve correctamente los segmentos dinámicos y query params obligatorios', () => {
    const dynamicSegments = ['fiestas', '[id]', 'centro'];
    const resolved = resolveDynamicSegments(dynamicSegments);
    expect(resolved).toEqual(['fiestas', FIXTURE_IDS.fiesta, 'centro']);

    // Espejo mágico debe requerir ?mode=foto
    const all = getAllRoutes();
    const espejo = all.find((r: any) => r.routeTemplate.includes('/evento/espejo-magico'));
    expect(espejo).toBeDefined();
    expect(espejo.testUrl).toContain('mode=foto');

    // Estaciones deben llevar permiso firmado ?access=
    const fotocabina = all.find((r: any) => r.routeTemplate.includes('/evento/fotocabina'));
    expect(fotocabina).toBeDefined();
    expect(fotocabina.testUrl).toContain('access=');
  });

  it('clasifica las pantallas pasivas (pantalla gigante, totems, muro)', () => {
    expect(isPassiveRoute('/evento/muro-en-vivo/123')).toBe(true);
    expect(isPassiveRoute('/evento/totem/123/456')).toBe(true);
    expect(isPassiveRoute('/evento/fotocabina/123')).toBe(false);
    expect(isPassiveRoute('/admin/finanzas')).toBe(false);
  });

  it('calcula métricas de auditoría respetando los 16 módulos y la regla del método más fuerte', () => {
    const metricas = calcularMetricasAuditadas();
    expect(metricas.totalPantallas).toBeGreaterThanOrEqual(353);
    expect(metricas.totalModulos).toBe(16);
    expect(metricas.totalAuditadasNivel4Mas).toBeGreaterThanOrEqual(5);
    expect(metricas.porcentaje).toBeGreaterThanOrEqual(1);
    expect(metricas.auditadasFinal.length).toBeGreaterThanOrEqual(353);
  });
});
