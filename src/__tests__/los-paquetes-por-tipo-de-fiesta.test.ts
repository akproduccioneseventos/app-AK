import serviciosCatalogoJson from '@/data/servicios-empresa.json';
import fallbackConfigJson from '@/data/armado-rapido-config.json';
import { generarPaquetesSugeridosPorTipo } from '@/lib/simulator/paquetes-sugeridos';
import {
  isPackageApplicableToEventType,
  mismoTipoDeEvento,
  type ArmadoRapidoConfig,
} from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const serviciosCatalogo = (serviciosCatalogoJson as unknown as ServicioEmpresa[]).filter(
  (s) => s.tipoItem === 'Servicio'
);
const baseConfig = fallbackConfigJson as unknown as ArmadoRapidoConfig;

describe('Paquetes por tipo de fiesta y filtro exacto', () => {
  it('un paquete de "Cumpleaños" NO aplica a "Cumpleaños infantil"', () => {
    const pkgCumple = { tiposDeEventoAplicables: ['Cumpleaños'] };
    const pkgInfantil = { tiposDeEventoAplicables: ['Cumpleaños infantil'] };

    expect(isPackageApplicableToEventType(pkgCumple, 'Cumpleaños infantil')).toBe(false);
    expect(isPackageApplicableToEventType(pkgCumple, 'Cumpleaños')).toBe(true);
    expect(isPackageApplicableToEventType(pkgInfantil, 'Cumpleaños')).toBe(false);
    expect(mismoTipoDeEvento('Cumpleaños', 'Cumpleaños infantil')).toBe(false);
  });

  it('"XV años" aplica a "15 años" y "Evento corporativo" aplica a "Evento empresarial"', () => {
    expect(isPackageApplicableToEventType({ tiposDeEventoAplicables: ['15 años'] }, 'XV años')).toBe(true);
    expect(isPackageApplicableToEventType({ tiposDeEventoAplicables: ['XV años'] }, '15 años')).toBe(true);
    expect(
      isPackageApplicableToEventType({ tiposDeEventoAplicables: ['Evento empresarial'] }, 'Evento corporativo')
    ).toBe(true);
    expect(
      isPackageApplicableToEventType({ tiposDeEventoAplicables: ['Evento corporativo'] }, 'Evento empresarial')
    ).toBe(true);
    expect(isPackageApplicableToEventType({ tiposDeEventoAplicables: ['Otro'] }, '15 años')).toBe(false);
  });

  it('arma los paquetes sugeridos con los servicios correctos por tipo', () => {
    const res = generarPaquetesSugeridosPorTipo({
      configActual: baseConfig,
      serviciosCatalogo,
      fallbackPaquetes: baseConfig.paquetes,
    });

    expect(res.agregados).toBe(15);
    expect(res.avisoGeneralesOtro).toBe("Los tres paquetes generales quedan para 'Otro'");
    expect(res.serviciosSaltados).toEqual([]);

    const quincePackages = res.config.paquetes.filter((p) =>
      isPackageApplicableToEventType(p, '15 años')
    );
    expect(quincePackages).toHaveLength(3);
    for (const pkg of quincePackages) {
      const ids = pkg.serviciosIncluidos.map((s) => s.id);
      expect(ids).not.toContain('serv_foto_civil');
    }
    const quinceIntermedio = quincePackages.find((p) => p.nombre === 'Intermedio — 15 años');
    const quincePremium = quincePackages.find((p) => p.nombre === 'Premium — 15 años');
    expect(quinceIntermedio?.recommended).toBe(true);
    expect(quinceIntermedio?.serviciosIncluidos.map((s) => s.id)).toEqual(
      expect.arrayContaining(['serv_cuadro_firmas', 'serv_foto_pintada'])
    );
    expect(quincePremium?.serviciosIncluidos.map((s) => s.id)).toEqual(
      expect.arrayContaining(['serv_cuadro_firmas', 'serv_foto_pintada', 'serv_filmacion_pintada'])
    );

    const infantilPackages = res.config.paquetes.filter((p) =>
      isPackageApplicableToEventType(p, 'Cumpleaños infantil')
    );
    expect(infantilPackages).toHaveLength(3);
    for (const pkg of infantilPackages) {
      const ids = pkg.serviciosIncluidos.map((s) => s.id);
      expect(ids).not.toContain('serv_cuadro_firmas');
      expect(ids).not.toContain('serv_barra_tragos');
      expect(ids).not.toContain('serv_fuegos_frios');
      expect(ids).not.toContain('serv_1773235482408_86b6rp7');
    }
    const infantilIntermedio = infantilPackages.find(
      (p) => p.nombre === 'Intermedio — Cumpleaños infantil'
    );
    expect(infantilIntermedio?.serviciosIncluidos.map((s) => s.id)).toContain(
      'serv_candy_bar_tematico'
    );

    const bodaPremium = res.config.paquetes.find((p) => p.nombre === 'Premium — Boda');
    expect(bodaPremium?.serviciosIncluidos.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'serv_foto_civil',
        'serv_filmacion_civil',
        'serv_foto_iglesia',
        'serv_filmacion_iglesia',
      ])
    );

    const empresarialPremium = res.config.paquetes.find(
      (p) => p.nombre === 'Premium — Evento empresarial'
    );
    const empIds = empresarialPremium?.serviciosIncluidos.map((s) => s.id) || [];
    expect(empIds).not.toContain('serv_cuadro_firmas');
    expect(empIds).not.toContain('serv_torta_principal');
    expect(empIds).not.toContain('serv_video_vida_regalo');
    expect(empIds).not.toContain('serv_candy_bar_tematico');
    expect(empIds).not.toContain('serv_lluvia_burbujas');
    expect(empIds).toContain('serv_banner');
  });

  it('correr el helper dos veces seguidas no borra ni duplica paquetes existentes', () => {
    const primera = generarPaquetesSugeridosPorTipo({
      configActual: baseConfig,
      serviciosCatalogo,
      fallbackPaquetes: baseConfig.paquetes,
    });
    const segunda = generarPaquetesSugeridosPorTipo({
      configActual: primera.config,
      serviciosCatalogo,
      fallbackPaquetes: baseConfig.paquetes,
    });

    expect(segunda.agregados).toBe(0);
    expect(segunda.config.paquetes).toHaveLength(primera.config.paquetes.length);
    expect(segunda.config.paquetes).toEqual(primera.config.paquetes);

    const generales = segunda.config.paquetes.filter((p) =>
      baseConfig.paquetes.some((orig) => orig.id === p.id)
    );
    expect(generales).toHaveLength(3);
    for (const g of generales) {
      expect(g.tiposDeEventoAplicables).toEqual(['Otro']);
    }
  });

  it('saltea y reporta servicios que no existen en el catálogo del dueño', () => {
    const catalogoReducido = serviciosCatalogo.filter((s) => s.id !== 'serv_foto_pintada');
    const res = generarPaquetesSugeridosPorTipo({
      configActual: baseConfig,
      serviciosCatalogo: catalogoReducido,
      fallbackPaquetes: baseConfig.paquetes,
    });

    expect(res.serviciosSaltados).toContain('serv_foto_pintada');
    const quinceIntermedio = res.config.paquetes.find((p) => p.nombre === 'Intermedio — 15 años');
    expect(quinceIntermedio?.serviciosIncluidos.map((s) => s.id)).not.toContain('serv_foto_pintada');
  });
});
