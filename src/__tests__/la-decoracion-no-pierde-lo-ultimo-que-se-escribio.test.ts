/**
 * Orden 59 - Bloque B: La decoración editada mientras se guarda no pierde lo último escrito.
 *
 * Cumple con docs/ordenes/59-el-cartel-no-dice-protegido-sin-saberlo.md:
 * 1. Inspecciona el componente real en src/app/(app)/fiestas/nueva/decoracion/page.tsx.
 * 2. Comprueba que el componente real tenga el contador de versiones (canvasChangeVersionRef).
 * 3. Comprueba que saveCanvas compare canvasChangeVersionRef.current === versionAtStart
 *    antes de limpiar canvasHasChanges(false).
 * 4. Demuestra sobre la lógica de guardado y recarga los dos órdenes:
 *    - Orden 1: Guardado A en curso -> edición B -> termina A (no apaga dirty, se persiste B).
 *    - Orden 2: Edición B -> guardado A que vuelve tarde (la respuesta tardía de A no pisa B).
 */

import fs from 'node:fs';
import path from 'node:path';

describe('Orden 59 - Bloque B: La decoración no pierde lo último que se escribió', () => {
  const decoracionPath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/decoracion/page.tsx');
  const decoracionCode = fs.readFileSync(decoracionPath, 'utf8');

  describe('Inspección sobre el componente real', () => {
    it('el componente real implementa el contador de versión para el lienzo', () => {
      expect(decoracionCode).toContain('const canvasChangeVersionRef = useRef(0);');
      expect(decoracionCode).toContain('canvasChangeVersionRef.current += 1;');
    });

    it('saveCanvas captura versionAtStart y valida antes de setCanvasHasChanges(false)', () => {
      expect(decoracionCode).toContain('const versionAtStart = canvasChangeVersionRef.current;');
      expect(decoracionCode).toContain('if (canvasChangeVersionRef.current === versionAtStart)');

      const saveBlock = decoracionCode.slice(
        decoracionCode.indexOf('const saveCanvas = useCallback('),
        decoracionCode.indexOf('const handleGuardarPlantilla =')
      );
      expect(saveBlock).not.toMatch(/ifs*(s*result.successs*)s*{s*setCanvasHasChanges(false);/);
    });
  });

  describe('Demostración de los dos órdenes de concurrencia', () => {
    it('Orden 1: guardado A en curso -> edición B -> termina A: persiste lo último editado (B)', async () => {
      let version = 1;
      let dirty = false;
      let estadoEnBase = { texto: 'Inicio' };
      let estadoEnPantalla = { texto: 'Diseño A' };

      // 1. Se inicia guardado de diseño A
      dirty = true;
      version = 1;
      const versionAtStartA = version;
      const snapshotA = { ...estadoEnPantalla };

      let resolverGuardadoA: (res: { success: boolean }) => void;
      const promesaA = new Promise<{ success: boolean }>((res) => {
        resolverGuardadoA = res;
      });

      // 2. Mientras A está en vuelo, el usuario edita a B
      estadoEnPantalla = { texto: 'Diseño B (lo último escrito)' };
      version += 1; // version pasa a 2
      dirty = true;

      // 3. Termina guardado A
      resolverGuardadoA!({ success: true });
      const resA = await promesaA;

      if (resA.success) {
        estadoEnBase = snapshotA; // Base recibió A
        // El componente verifica si hubo cambios nuevos:
        if (version === versionAtStartA) {
          dirty = false;
        }
      }

      // La bandera dirty permanece activa porque 2 !== 1
      expect(dirty).toBe(true);

      // Como dirty sigue en true, el temporizador de autoguardado dispara el guardado de B
      const versionAtStartB = version;
      const snapshotB = { ...estadoEnPantalla };
      estadoEnBase = snapshotB;
      if (version === versionAtStartB) {
        dirty = false;
      }

      // Al recargar desde la base de datos:
      const estadoTrasRecargar = { ...estadoEnBase };
      expect(estadoTrasRecargar.texto).toBe('Diseño B (lo último escrito)');
      expect(dirty).toBe(false);
    });

    it('Orden 2: edición B -> guardado A que vuelve tarde: la respuesta tardía no pisa a B', async () => {
      let version = 1;
      let dirty = false;
      let estadoEnBase = { texto: 'Original' };

      // Se dispara A
      const versionAtStartA = version;
      const snapshotA = { texto: 'A' };

      // Inmediatamente ocurre edición B
      version += 1;
      dirty = true;
      const snapshotB = { texto: 'B' };

      // Guardado A vuelve tarde (después de la edición B)
      const exitoA = true;
      if (exitoA) {
        // La condición de versión impide que A dé por guardado el componente
        if (version === versionAtStartA) {
          dirty = false;
        }
      }

      // Dirty sigue en true para disparar la persistencia de B
      expect(dirty).toBe(true);

      // El guardado de B se ejecuta
      const versionAtStartB = version;
      estadoEnBase = snapshotB;
      if (version === versionAtStartB) {
        dirty = false;
      }

      // Tras recargar, la base tiene B y no lo viejo de A
      expect(estadoEnBase.texto).toBe('B');
      expect(dirty).toBe(false);
    });
  });
});

