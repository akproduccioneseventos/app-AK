/**
 * MATAFUEGO — Los ajustes que carga el operador tienen que LLEGAR a la estación.
 *
 * Un ajuste que se guarda y no llega es peor que no tenerlo: el operador cree que
 * lo dejó configurado y la estación hace otra cosa. Esta prueba mira la traducción
 * de "lo guardado" a "lo que usa la pantalla", sin navegador y sin base de datos.
 */
import { getEntertainmentStationConfig } from '@/lib/entertainment/station-config';

function fiestaCon(ajustesFotocabina: Record<string, unknown>) {
  return {
    id: 'fiesta_de_prueba',
    configuracion: { nombreEvento: 'Fiesta de Prueba' },
    others: { entretenimiento: { modules: { fotocabina: ajustesFotocabina } } },
  } as never;
}

describe('Los ajustes de la estación llegan a la pantalla', () => {
  it('la velocidad del recuerdo llega tal cual se configuró', () => {
    for (const velocidad of ['boomerang', 'normal'] as const) {
      const config = getEntertainmentStationConfig(fiestaCon({ velocidadRecuerdo: velocidad }), 'fotocabina');
      expect(config.velocidadRecuerdo).toBe(velocidad);
    }
  });

  it('lenta en la fotocabina llega como normal', () => {
    const config = getEntertainmentStationConfig(fiestaCon({ velocidadRecuerdo: 'lenta' }), 'fotocabina');
    expect(config.velocidadRecuerdo).toBe('normal');
  });

  it('sin configurar nada, la velocidad es la normal', () => {
    expect(getEntertainmentStationConfig(fiestaCon({}), 'fotocabina').velocidadRecuerdo).toBe('normal');
  });

  it('un valor inventado no rompe la estación: queda en normal', () => {
    const config = getEntertainmentStationConfig(fiestaCon({ velocidadRecuerdo: 'turbo' }), 'fotocabina');
    expect(config.velocidadRecuerdo).toBe('normal');
  });

  it('el diseño de la hoja, las copias y el papel también llegan', () => {
    const config = getEntertainmentStationConfig(
      fiestaCon({ disenoImpresion: 'dos', copiasImpresion: 3, tamanoPapel: '13x18' }),
      'fotocabina'
    );
    expect(config.disenoImpresion).toBe('dos');
    expect(config.copiasImpresion).toBe(3);
    expect(config.tamanoPapel).toBe('13x18');
  });

  it('el recorte sin tela viene APAGADO salvo que se prenda a propósito', () => {
    expect(getEntertainmentStationConfig(fiestaCon({}), 'fotocabina').recorteSinTela).toBe(false);
    expect(getEntertainmentStationConfig(fiestaCon({ recorteSinTela: true }), 'fotocabina').recorteSinTela).toBe(true);
  });

  it('overlayName llega configurado o con fallback del nombre del evento', () => {
    const configConOverlay = getEntertainmentStationConfig(
      fiestaCon({ overlayName: 'Mis 15 Sofi - Marco Oro' }),
      'fotocabina'
    );
    expect(configConOverlay.overlayName).toBe('Mis 15 Sofi - Marco Oro');

    const configPorDefecto = getEntertainmentStationConfig(fiestaCon({}), 'fotocabina');
    expect(configPorDefecto.overlayName).toBe('Fiesta de Prueba - AK');
  });

  it('deliveryChannels llega con los canales configurados o con los predeterminados', () => {
    const configPersonalizada = getEntertainmentStationConfig(
      fiestaCon({ deliveryChannels: ['qr', 'whatsapp', 'email', 'galeria'] }),
      'fotocabina'
    );
    expect(configPersonalizada.deliveryChannels).toEqual(['qr', 'whatsapp', 'email', 'galeria']);

    const configPorDefecto = getEntertainmentStationConfig(fiestaCon({}), 'fotocabina');
    expect(configPorDefecto.deliveryChannels).toEqual(['qr', 'galeria']);
  });
});
