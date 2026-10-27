import { modules, PestanaFiesta } from '@/lib/fiesta/fiesta-modules';

describe('La fiesta en cinco pestañas (Orden 182 - Bloque 1)', () => {
  const PESTANAS_VALIDAS: PestanaFiesta[] = [
    'contrato-y-pagos',
    'cliente-e-invitados',
    'comida-y-barra',
    'equipo-y-logistica',
    'noche',
  ];

  it('verifica que todas las tarjetas de la ruta /fiestas/nueva tienen asignada una pestana valida', () => {
    expect(modules.length).toBeGreaterThan(0);

    modules.forEach((mod) => {
      expect(mod.pestana).toBeDefined();
      expect(PESTANAS_VALIDAS).toContain(mod.pestana);
    });
  });

  it('verifica que cada una de las cinco pestanas tiene al menos una tarjeta y no se pierde ninguna', () => {
    const conteoPorPestana: Record<PestanaFiesta, number> = {
      'contrato-y-pagos': 0,
      'cliente-e-invitados': 0,
      'comida-y-barra': 0,
      'equipo-y-logistica': 0,
      'noche': 0,
    };

    modules.forEach((mod) => {
      conteoPorPestana[mod.pestana]++;
    });

    PESTANAS_VALIDAS.forEach((pestana) => {
      expect(conteoPorPestana[pestana]).toBeGreaterThan(0);
    });

    const totalAgrupado = Object.values(conteoPorPestana).reduce((a, b) => a + b, 0);
    expect(totalAgrupado).toBe(modules.length);
  });

  it('comprueba que la ruta /fiestas/nueva preserva todas sus tarjetas operativas', () => {
    const ids = modules.map((m) => m.id);
    expect(ids).toContain('configuracion');
    expect(ids).toContain('invitados');
    expect(ids).toContain('catering');
    expect(ids).toContain('personal');
    expect(ids).toContain('checkin');
    expect(ids).toContain('enVivo');
    expect(ids).toContain('muroSocial');
  });
});
