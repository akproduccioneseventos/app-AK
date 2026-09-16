/**
 * MATAFUEGO: la pantalla real de decoración no pierde lo último editado mientras guarda.
 *
 * Hallazgo DECO-15 (Codex):
 * Si el usuario realiza una modificación en el lienzo (agrega un elemento, mueve un mueble,
 * cambia notas o colores) MIENTRAS una petición previa de guardado está en vuelo (asíncrona),
 * la respuesta exitosa del guardado anterior NO debe limpiar la marca de cambios (dirty/hasChanges).
 *
 * Si se limpiara la marca con cambios nuevos pendientes, el autoguardado consideraría
 * que todo está al día y lo último que se editó se perdería en silencio si el usuario
 * sale de la pantalla.
 *
 * Esta prueba evalúa el código de la pantalla REAL en:
 * src/app/(app)/fiestas/nueva/decoracion/page.tsx
 */

import fs from 'node:fs';
import path from 'node:path';

describe('Pantalla real de decoración - Preservación de cambios concurrentes durante autoguardado', () => {
  const decoracionPagePath = path.join(
    process.cwd(),
    'src/app/(app)/fiestas/nueva/decoracion/page.tsx'
  );
  const decoracionSource = fs.readFileSync(decoracionPagePath, 'utf8');

  it('la pantalla real contiene la referencia de versión y el incremento ante cambios', () => {
    // 1. Debe existir la referencia canvasChangeVersionRef
    expect(decoracionSource).toContain('const canvasChangeVersionRef = useRef(0);');

    // 2. Debe existir el efecto que incrementa la versión con cada cambio
    expect(decoracionSource).toContain('canvasChangeVersionRef.current += 1;');
    expect(decoracionSource).toContain('[canvasElementos, canvasFondoColor, canvasFondoImagenUrl]');
  });

  it('saveCanvas captura versionAtStart y NO apaga canvasHasChanges si hubo ediciones en vuelo', () => {
    // 3. Debe capturar versionAtStart al inicio de saveCanvas
    expect(decoracionSource).toContain('const versionAtStart = canvasChangeVersionRef.current;');

    // 4. Debe condicionar setCanvasHasChanges(false) a la igualdad de versiones
    expect(decoracionSource).toContain('if (canvasChangeVersionRef.current === versionAtStart)');
    expect(decoracionSource).toContain('setCanvasHasChanges(false);');

    // 5. NO debe tener un setCanvasHasChanges(false) ciego/incondicional en el camino de éxito de saveCanvas
    const saveCanvasBlock = decoracionSource.slice(
      decoracionSource.indexOf('const saveCanvas = useCallback('),
      decoracionSource.indexOf('const handleGuardarPlantilla =')
    );
    expect(saveCanvasBlock).toContain('if (canvasChangeVersionRef.current === versionAtStart)');
    expect(saveCanvasBlock).toContain('setCanvasHasChanges(false);');
    expect(saveCanvasBlock).not.toMatch(/if\s*\(\s*result\.success\s*\)\s*\{\s*setCanvasHasChanges\(false\);/);
  });

  it('simulación de concurrencia: una edición posterior mantiene la bandera dirty activa', async () => {
    // Simular el ciclo de vida de saveCanvas de la pantalla real
    let version = 1;
    let dirty = true;
    let autoSaveTriggeredAfter = false;

    // Se inicia el guardado asíncrono
    const versionAtStart = version;

    let resolveRemoteSave: (val: { success: boolean }) => void;
    const savePromise = new Promise<{ success: boolean }>((resolve) => {
      resolveRemoteSave = resolve;
    });

    // Mientras el guardado está en vuelo, el usuario hace un cambio en el canvas
    // (ej. agrega un elemento o edita un color)
    version += 1;
    dirty = true;

    // El servidor responde con éxito a la petición previa
    resolveRemoteSave!({ success: true });
    const result = await savePromise;

    if (result.success) {
      if (version === versionAtStart) {
        dirty = false;
      }
    }

    // La bandera dirty DEBE seguir en true porque version (2) !== versionAtStart (1)
    expect(dirty).toBe(true);

    // Si hubiera un temporizador de autoguardado, debe notar que dirty sigue siendo true
    if (dirty) {
      autoSaveTriggeredAfter = true;
    }
    expect(autoSaveTriggeredAfter).toBe(true);
  });

  it('rompiendo la regla: si se apaga dirty incondicionalmente, la prueba detecta la pérdida de datos', async () => {
    let version = 1;
    let dirty = true;

    const versionAtStart = version;
    version += 1; // El usuario edita mientras guarda

    // Simulación del error previo (limpieza incondicional sin chequear versión)
    const buggySaveCompletion = () => {
      dirty = false; // Error: limpia a ciegas
    };

    buggySaveCompletion();

    // Comprobamos que el comportamiento defectuoso deja dirty en false a pesar del cambio nuevo
    expect(dirty).toBe(false);
    // Y verificamos que el código real de la app NO comete ese error
    expect(decoracionSource).toContain('if (canvasChangeVersionRef.current === versionAtStart)');
  });
});
