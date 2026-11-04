import { armarLineaDeTiempo360 } from '@/lib/entretenimiento/edicion-360';

describe('Orden 264: La plataforma 360 edita sola', () => {
  describe('(a) Con 300 cuadros a 30 fps y estilo "lento_y_vuelta"', () => {
    const linea = armarLineaDeTiempo360(300, 30, 'lento_y_vuelta');

    it('el tramo del medio repite cuadros unas 3 veces', () => {
      // El cuadro 150 está en pleno tramo central de cámara lenta
      const repeticiones150 = linea.filter((cuadro) => cuadro === 150).length;
      expect(repeticiones150).toBe(3);

      // Verificamos que varios cuadros del centro se repitan 3 veces
      const repeticiones140 = linea.filter((cuadro) => cuadro === 140).length;
      const repeticiones160 = linea.filter((cuadro) => cuadro === 160).length;
      expect(repeticiones140).toBe(3);
      expect(repeticiones160).toBe(3);
    });

    it('el principio y el final no se repiten', () => {
      // Tramo 1 (0 al 25% = cuadros 0 a 74): sin repeticiones adyacentes
      for (let i = 0; i < 74; i++) {
        expect(linea[i]).toBe(i);
        expect(linea[i]).not.toBe(linea[i + 1]);
      }

      // En el tramo 3 antes del boomerang (cuadros 225 a 299):
      // Los cuadros avanzan secuencialmente a velocidad normal 1x
      const cuadrosBoomerang = Math.round(1.5 * 30); // 45 cuadros
      const finTramo3 = linea.length - cuadrosBoomerang;
      const inicioTramo3 = finTramo3 - (300 - 225);

      for (let i = inicioTramo3; i < finTramo3 - 1; i++) {
        expect(linea[i + 1]).toBe(linea[i] + 1);
      }
    });

    it('el final contiene los últimos cuadros en orden inverso (boomerang)', () => {
      const cuadrosBoomerang = Math.round(1.5 * 30);
      const tramoFinal = linea.slice(-cuadrosBoomerang);

      expect(tramoFinal.length).toBe(cuadrosBoomerang);
      // El tramo final arranca en el último cuadro y retrocede
      expect(tramoFinal[0]).toBe(299);
      expect(tramoFinal[tramoFinal.length - 1]).toBeLessThan(tramoFinal[0]);

      // Verifica orden decreciente
      for (let i = 0; i < tramoFinal.length - 1; i++) {
        expect(tramoFinal[i]).toBeGreaterThanOrEqual(tramoFinal[i + 1]);
      }
    });
  });

  describe('(b) "solo_camara_lenta" no tiene tramo inverso', () => {
    it('ejecuta tramos 1 a 5 sin el tramo inverso boomerang', () => {
      const linea = armarLineaDeTiempo360(300, 30, 'solo_camara_lenta');
      const ultimos45 = linea.slice(-45);

      // El último elemento debe ser el último cuadro original
      expect(linea[linea.length - 1]).toBe(299);

      // Los últimos cuadros no están invertidos; avanzan de forma creciente
      for (let i = 0; i < ultimos45.length - 1; i++) {
        expect(ultimos45[i + 1]).toBeGreaterThanOrEqual(ultimos45[i]);
      }
    });
  });

  describe('(c) "normal" devuelve los cuadros en orden, sin repetir', () => {
    it('devuelve exactamente [0, 1, ..., cantidadCuadros - 1]', () => {
      const linea = armarLineaDeTiempo360(300, 30, 'normal');

      expect(linea.length).toBe(300);
      for (let i = 0; i < 300; i++) {
        expect(linea[i]).toBe(i);
      }
    });
  });

  describe('(d) La duración final queda entre 12 y 20 segundos para grabaciones de 10 a 15 segundos', () => {
    // 10s = 300 cuadros, 12s = 360 cuadros, 15s = 450 cuadros a 30 fps
    const casos = [300, 360, 450];
    const estilos = ['lento_y_vuelta', 'solo_camara_lenta'] as const;

    casos.forEach((cantidadCuadros) => {
      estilos.forEach((estilo) => {
        it(`grabación de ${cantidadCuadros / 30}s (${cantidadCuadros} cuadros) con estilo "${estilo}" resulta entre 12s y 20s`, () => {
          const fps = 30;
          const linea = armarLineaDeTiempo360(cantidadCuadros, fps, estilo);
          const duracionSegundos = linea.length / fps;

          expect(duracionSegundos).toBeGreaterThanOrEqual(12);
          expect(duracionSegundos).toBeLessThanOrEqual(20);
        });
      });
    });
  });

  describe('Orden 266: Duraciones proporcionales y acotadas según duración grabada', () => {
    it('para 10s grabados (300 cuadros) con "lento_y_vuelta" dura ~14-15s (420-450 cuadros)', () => {
      const linea = armarLineaDeTiempo360(300, 30, 'lento_y_vuelta');
      expect(linea.length).toBeGreaterThanOrEqual(420);
      expect(linea.length).toBeLessThanOrEqual(450);
      const duracionSec = linea.length / 30;
      expect(duracionSec).toBeGreaterThanOrEqual(14);
      expect(duracionSec).toBeLessThanOrEqual(15);
    });

    it('para 12s grabados (360 cuadros) con "lento_y_vuelta" dura ~16-17s (480-510 cuadros)', () => {
      const linea = armarLineaDeTiempo360(360, 30, 'lento_y_vuelta');
      expect(linea.length).toBeGreaterThanOrEqual(480);
      expect(linea.length).toBeLessThanOrEqual(510);
      const duracionSec = linea.length / 30;
      expect(duracionSec).toBeGreaterThanOrEqual(16);
      expect(duracionSec).toBeLessThanOrEqual(17);
    });

    it('para 15s grabados (450 cuadros) con "lento_y_vuelta" dura ~18-19s (540-570 cuadros)', () => {
      const linea = armarLineaDeTiempo360(450, 30, 'lento_y_vuelta');
      expect(linea.length).toBeGreaterThanOrEqual(540);
      expect(linea.length).toBeLessThanOrEqual(570);
      const duracionSec = linea.length / 30;
      expect(duracionSec).toBeGreaterThanOrEqual(18);
      expect(duracionSec).toBeLessThanOrEqual(19);
    });

    it('para 2s grabados (60 cuadros, ej. corte de red) dura entre 3s y 4s (90 a 120 cuadros)', () => {
      const linea = armarLineaDeTiempo360(60, 30, 'lento_y_vuelta');
      expect(linea.length).toBeGreaterThanOrEqual(90);
      expect(linea.length).toBeLessThanOrEqual(120);
      const duracionSec = linea.length / 30;
      expect(duracionSec).toBeGreaterThanOrEqual(3);
      expect(duracionSec).toBeLessThanOrEqual(4);
    });
  });

  describe('Casos borde', () => {
    it('maneja 0 cuadros o negativos sin fallar', () => {
      expect(armarLineaDeTiempo360(0, 30)).toEqual([]);
      expect(armarLineaDeTiempo360(-10, 30)).toEqual([]);
    });

    it('maneja 1 cuadro sin fallar', () => {
      expect(armarLineaDeTiempo360(1, 30)).toEqual([0]);
    });

    it('maneja cantidades pequeñas de cuadros sin crashear', () => {
      const linea = armarLineaDeTiempo360(5, 30);
      expect(linea).toEqual([0, 1, 2, 3, 4]);
    });

    it('acepta variantes de texto con mayúsculas y acentos', () => {
      const conAcentos = armarLineaDeTiempo360(300, 30, 'Sólo cámara lenta');
      expect(conAcentos[conAcentos.length - 1]).toBe(299);

      const conEspaciosYMayus = armarLineaDeTiempo360(300, 30, 'Lento y vuelta');
      expect(conEspaciosYMayus.length).toBeGreaterThan(0);
    });
  });
});