import { getEntertainmentStationConfig } from '@/lib/entertainment/station-config';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque 1 - Los ajustes del panel llegan a la estación', () => {
  it('cuadrosDelLoop configurado en el panel llega a la estación de Bogue', () => {
    const fiesta = {
      id: 'fiesta-test-bogue',
      configuracion: {
        nombreEvento: 'Boda AK',
      },
      others: {
        entretenimiento: {
          modules: {
            bogue: {
              cuadrosDelLoop: 30,
              orientation: 'horizontal',
            },
          },
        },
      },
    } as unknown as FiestaEnPlanificacion;

    const runtimeConfig = getEntertainmentStationConfig(fiesta, 'bogue');
    expect(runtimeConfig.cuadrosDelLoop).toBe(30);
    expect(runtimeConfig.orientation).toBe('horizontal');
  });

  it('vueltas360 configurado en el panel llega a la estación de Plataforma 360', () => {
    const fiesta = {
      id: 'fiesta-test-360',
      configuracion: {
        nombreEvento: 'Cumple 360',
      },
      others: {
        entretenimiento: {
          modules: {
            plataforma360: {
              vueltas360: 4,
            },
          },
        },
      },
    } as unknown as FiestaEnPlanificacion;

    const runtimeConfig = getEntertainmentStationConfig(fiesta, 'plataforma360');
    expect(runtimeConfig.vueltas360).toBe(4);
  });

  it('todos los ajustes de fotocabina configurados en el panel llegan a la estación', () => {
    const fiesta = {
      id: 'fiesta-test-fotocabina',
      configuracion: {
        nombreEvento: '15 Años Glamour',
      },
      others: {
        entretenimiento: {
          modules: {
            fotocabina: {
              fotosPorTanda: 4,
              copiasImpresion: 2,
              tamanoPapel: '13x18',
              disenoImpresion: 'dos',
              velocidadRecuerdo: 'boomerang',
              enableBeautyFilter: true,
              enableChromaKey: true,
              recorteSinTela: true,
              orientation: 'cuadrada',
            },
          },
        },
      },
    } as unknown as FiestaEnPlanificacion;

    const runtimeConfig = getEntertainmentStationConfig(fiesta, 'fotocabina');
    expect(runtimeConfig.fotosPorTanda).toBe(4);
    expect(runtimeConfig.copiasImpresion).toBe(2);
    expect(runtimeConfig.tamanoPapel).toBe('13x18');
    expect(runtimeConfig.disenoImpresion).toBe('dos');
    expect(runtimeConfig.velocidadRecuerdo).toBe('boomerang');
    expect(runtimeConfig.enableBeautyFilter).toBe(true);
    expect(runtimeConfig.enableChromaKey).toBe(true);
    expect(runtimeConfig.recorteSinTela).toBe(true);
    expect(runtimeConfig.orientation).toBe('cuadrada');
  });

  it('usa valores por defecto seguros si el panel no especifica ajustes', () => {
    const fiesta = {
      id: 'fiesta-default',
      configuracion: {
        nombreEvento: 'Evento Simple',
      },
      others: {
        entretenimiento: {
          modules: {},
        },
      },
    } as unknown as FiestaEnPlanificacion;

    const bogueConfig = getEntertainmentStationConfig(fiesta, 'bogue');
    expect(bogueConfig.cuadrosDelLoop).toBe(15);

    const p360Config = getEntertainmentStationConfig(fiesta, 'plataforma360');
    expect(p360Config.vueltas360).toBe(2);

    const cabinaConfig = getEntertainmentStationConfig(fiesta, 'fotocabina');
    expect(cabinaConfig.fotosPorTanda).toBe(3);
    expect(cabinaConfig.copiasImpresion).toBe(1);
    expect(cabinaConfig.tamanoPapel).toBe('10x15');
    expect(cabinaConfig.disenoImpresion).toBe('tira');
    expect(cabinaConfig.velocidadRecuerdo).toBe('normal');
    expect(cabinaConfig.recorteSinTela).toBe(false);
  });
});
