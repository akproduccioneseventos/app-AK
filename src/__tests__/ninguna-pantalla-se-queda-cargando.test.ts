import fs from 'fs';
import path from 'path';

/**
 * Limpia comentarios de una cadena de código JS/TS para evitar falsos positivos
 * causados por código comentado.
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/**
 * Orden 72 — Bloque 1: Ninguna pantalla se queda cargando para siempre.
 *
 * Se probó rompiéndola a propósito:
 * Se quitó temporalmente 'setIsLoading(false);' antes de 'return;' en loadMusicaData
 * de src/app/(app)/fiestas/nueva/musica/page.tsx, y la prueba falló en rojo listando
 * exactamente ese archivo como fallido. Al restaurarlo, pasó a verde.
 */

describe('Orden 72 - Bloque 1: Ninguna pantalla se queda cargando para siempre', () => {
  const rootDir = process.cwd();

  const PANTALLAS_A_COMPROBAR = [
    'src/app/(app)/fiestas/nueva/regalos/page.tsx',
    'src/app/(app)/fiestas/nueva/musica/page.tsx',
    'src/app/(app)/fiestas/nueva/itinerario/page.tsx',
    'src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx',
    'src/app/(app)/fiestas/[id]/timeline/page.tsx',
    'src/app/evento/logistica/[fiestaId]/page.tsx',
    'src/app/(app)/fiestas/nueva/tareas/client.tsx',
  ];

  it('cada pantalla que carga apaga la rueda antes de salir cuando falta la fiesta', () => {
    const archivosConFalla: string[] = [];

    for (const relPath of PANTALLAS_A_COMPROBAR) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const rawContent = fs.readFileSync(fullPath, 'utf8');
      const cleanContent = stripComments(rawContent);

      // Si maneja estado de carga (setIsLoading o setLoading)
      if (cleanContent.includes('setIsLoading') || cleanContent.includes('setLoading')) {
        // Buscar bloques if (!fiestaId...) { ... } o if (!id...) { ... } que hagan return
        const guardRegex = /if\s*\(\s*!(?:fiestaId|id|params\.fiestaId)\s*\)\s*\{([^}]+)\}/g;
        let match;

        while ((match = guardRegex.exec(cleanContent)) !== null) {
          const guardBody = match[1];
          // Solo nos interesan los guards que retornan tempranamente de la carga
          // y no los renders principales de componentes React como 'return <...' o 'return (...'
          const esRenderJsx = /return\s*[\(<]/.test(guardBody);
          if (guardBody.includes('return') && !esRenderJsx) {
            const apagaCarga = guardBody.includes('setIsLoading(false)') || guardBody.includes('setLoading(false)');
            if (!apagaCarga) {
              archivosConFalla.push(`${relPath} -> guard sin apagar carga: ${match[0].replace(/\s+/g, ' ').trim()}`);
            }
          }
        }
      }
    }

    if (archivosConFalla.length > 0) {
      throw new Error(
        `Se encontraron pantallas que salen sin apagar el estado de carga (la rueda giraría para siempre):\n` +
        archivosConFalla.map((f) => `  - ${f}`).join('\n')
      );
    }

    expect(archivosConFalla).toEqual([]);
  });

  it('el modelo de referencia (regalos/page.tsx) apaga la carga y muestra estado criollo cuando falta la fiesta', () => {
    const regalosPath = path.join(rootDir, 'src/app/(app)/fiestas/nueva/regalos/page.tsx');
    const content = stripComments(fs.readFileSync(regalosPath, 'utf8'));

    expect(content).toContain('if (!fiestaId)');
    expect(content).toContain('setIsLoading(false)');
    expect(content).toContain('EmptyStateModulo');
  });
});
