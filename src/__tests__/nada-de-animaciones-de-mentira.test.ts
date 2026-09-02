import fs from 'node:fs';
import path from 'node:path';

/**
 * No se anima un elemento invisible para que un control se calle.
 *
 * **PASO EL 2 DE SEPTIEMBRE DE 2026 Y COSTO UNA REVISION ENTERA.** El control
 * `npm run ordenes?` pedia que las landings usaran `framer-motion`. La entrega
 * agrego a cada landing un elemento **vacio, invisible y escondido a los
 * lectores de pantalla** (`sr-only` + `aria-hidden`) con la animacion encima.
 *
 * El control encontro lo que buscaba y dio verde. **La pagina no se movia nada.**
 *
 * Es la peor forma de fallar que hay, y esta prohibida por la regla del
 * proyecto: *"nunca escribir una prueba —ni codigo— para que el control se
 * calle. Tapa el agujero sin cerrarlo, y es peor que ninguna."*
 *
 * Esto lo agarra: en las paginas publicas, un elemento animado **tiene que
 * poder verse**. Si esta escondido y ademas vacio, no es una animacion: es un
 * senuelo.
 */

const CARPETAS = ['src/app/landing', 'src/app/public', 'src/components/public'];

function archivosDePantalla(dir: string): string[] {
  const completo = path.join(process.cwd(), dir);
  if (!fs.existsSync(completo)) return [];
  return fs
    .readdirSync(completo, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
    .map((e) => path.join(e.parentPath ?? completo, e.name));
}

/**
 * Busca `<motion.algo ... />` que sea invisible: lleva `sr-only` o
 * `aria-hidden` y **no tiene contenido adentro** (se cierra solo).
 */
function senuelos(codigo: string): string[] {
  const etiquetas = codigo.match(/<motion\.[a-zA-Z]+[^>]*?\/>/gs) ?? [];
  // Ojo con la diferencia: un adorno animado marcado `aria-hidden` **se ve** y
  // es correcto -no se le lee a quien usa lector de pantalla, y esta bien-. El
  // senuelo es el que **ademas no se ve**: `sr-only` lo saca de la pantalla.
  return etiquetas.filter((t) => /sr-only/.test(t));
}

describe('nada de animaciones de mentira en las paginas publicas', () => {
  const archivos = CARPETAS.flatMap(archivosDePantalla);

  it('encuentra las pantallas publicas (si no, el control no estaria mirando nada)', () => {
    // Un control que revisa cero archivos da verde siempre. Ya paso con el de
    // acentos, asi que esto se comprueba antes que nada.
    expect(archivos.length).toBeGreaterThan(10);
  });

  it('ningun elemento animado esta vacio y escondido a la vez', () => {
    const culpables: string[] = [];
    for (const archivo of archivos) {
      const encontrados = senuelos(fs.readFileSync(archivo, 'utf8'));
      if (encontrados.length > 0) {
        culpables.push(`${path.relative(process.cwd(), archivo)}: ${encontrados.length}`);
      }
    }
    // Si esto se pone en rojo: hay animaciones sobre elementos invisibles y
    // vacios. Eso no mueve nada; solo hace que el control encuentre
    // "framer-motion" en el archivo. Anima el contenido de verdad, o deja la
    // pagina quieta y sacale la comprobacion a la orden.
    expect(culpables).toEqual([]);
  });
});
