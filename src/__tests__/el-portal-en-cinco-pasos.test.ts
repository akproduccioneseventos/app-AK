import { portalModules, PasoPortal } from '@/lib/portal/portal-modules';
import { moduleRedirects } from '@/lib/portal/portal-redirects';

describe('El portal en cinco pasos (Orden 182 - Bloque 2)', () => {
  const PASOS_VALIDOS: PasoPortal[] = [
    'mi-fiesta',
    'mis-invitados',
    'musica-fotos-video',
    'menu-y-barra',
    'contrato-y-pagos',
  ];

  it('verifica que cada modulo del portal tiene un paso asignado y valido', () => {
    expect(portalModules.length).toBeGreaterThan(0);

    portalModules.forEach((modulo) => {
      expect(modulo.paso).toBeDefined();
      expect(PASOS_VALIDOS).toContain(modulo.paso);
    });
  });

  it('verifica que cada uno de los 5 pasos tiene al menos un modulo', () => {
    const conteoPorPaso: Record<PasoPortal, number> = {
      'mi-fiesta': 0,
      'mis-invitados': 0,
      'musica-fotos-video': 0,
      'menu-y-barra': 0,
      'contrato-y-pagos': 0,
    };

    portalModules.forEach((modulo) => {
      conteoPorPaso[modulo.paso]++;
    });

    PASOS_VALIDOS.forEach((paso) => {
      expect(conteoPorPaso[paso]).toBeGreaterThan(0);
    });
  });

  it('verifica que ningun href del portal se repite entre los modulos', () => {
    const dummyFiestaId = 'fiesta-demo-123';
    const hrefs = portalModules
      .filter((modulo) => typeof modulo.href === 'function')
      .map((modulo) => modulo.href!(dummyFiestaId));

    const hrefSet = new Set(hrefs);
    expect(hrefs.length).toBe(hrefSet.size);
  });

  it('verifica que /portal/[id]/documentos sigue redirigiendo al contrato', () => {
    expect(moduleRedirects['documentos']).toBeDefined();
    const destino = moduleRedirects['documentos']('fiesta-456');
    expect(destino).toBe('/portal/fiesta-456/contrato');
  });
});
