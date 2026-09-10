/**
 * MATAFUEGO: NINGUN AUTOGUARDADO DICE "GUARDADO" SIN HABER GUARDADO.
 *
 * De donde sale. Codex encontro el 10 de septiembre de 2026 que el autoguardado de
 * `/fiestas/nueva/invitados/layout` llamaba al guardado, **tiraba el resultado a la
 * basura** y devolvia `{ success: true }` siempre. Si el guardado fallaba, el
 * cartelito decia "guardado" y el trabajo del salon se perdia sin aviso. Al mirar
 * toda la app con la misma pregunta aparecio lo mismo en
 * `/fiestas/nueva/planner-costo-fiesta`.
 *
 * Que comprueba. Todas las pantallas que usan `useAutoSave`: dentro de su `onSave`,
 * cada guardado que se llama tiene que **mirar lo que devuelve** —guardarlo en una
 * variable, devolverlo, o mirarlo con `.success`—. Un `await guardar(...)` solo en su
 * linea, sin nadie que mire el resultado, es este defecto exacto.
 *
 * Por que aca y no solo en el control general: el control general
 * (`npm run "dice-que-si?"`) necesita saber que la funcion devuelve `{ success }`.
 * Esta prueba no necesita saberlo: mira la FORMA del autoguardado, que es lo que
 * hace que la pantalla mienta.
 *
 * Se probo rompiendolo: volviendo cualquiera de las dos pantallas al
 * `await updateDecoracionFiestaActual(...)` suelto, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const PANTALLAS_CON_AUTOGUARDADO = [
  'src/app/(app)/fiestas/nueva/invitados/layout/page.tsx',
  'src/app/(app)/fiestas/nueva/planner-costo-fiesta/page.tsx',
  'src/app/(app)/fiestas/nueva/itinerario/page.tsx',
  'src/app/(app)/fiestas/nueva/configuracion/page.tsx',
  'src/app/(app)/fiestas/nueva/fotografia/page.tsx',
  'src/app/(app)/fiestas/nueva/logistica/page.tsx',
  'src/app/(app)/fiestas/nueva/musica/page.tsx',
  'src/app/(app)/fiestas/nueva/pagina-web/page.tsx',
  'src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx',
  'src/app/(app)/fiestas/[id]/timeline/page.tsx',
  'src/app/(app)/settings/notifications/page.tsx',
  'src/app/(app)/settings/contenido-publico/page.tsx',
];

/** El cuerpo del `onSave:` que se le pasa a useAutoSave, contando llaves. */
function cuerpoDelAutoguardado(texto: string): string | null {
  const inicio = texto.indexOf('useAutoSave(');
  if (inicio === -1) return null;
  const desdeOnSave = texto.indexOf('onSave', inicio);
  if (desdeOnSave === -1) return null;
  const abre = texto.indexOf('{', texto.indexOf('=>', desdeOnSave));
  if (abre === -1) return null;
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}') {
      nivel--;
      if (nivel === 0) return texto.slice(abre, i + 1);
    }
  }
  return null;
}

describe('el autoguardado no miente', () => {
  it.each(PANTALLAS_CON_AUTOGUARDADO)('%s mira el resultado de lo que guarda', (relativa) => {
    const completa = path.join(process.cwd(), relativa);
    if (!fs.existsSync(completa)) return; // una pantalla que se movio no rompe la prueba
    const texto = fs.readFileSync(completa, 'utf8');
    if (!texto.includes('useAutoSave(')) return;

    const cuerpo = cuerpoDelAutoguardado(texto);
    expect(cuerpo).not.toBeNull();

    // Envolverlo en un try/catch que devuelve el fallo tambien es mirarlo.
    const atajaElFallo = /catch\s*\([^)]*\)\s*\{[^}]*success:\s*false/.test(cuerpo as string);
    if (atajaElFallo) return;

    const sueltos = (cuerpo as string)
      .split('\n')
      .map((l) => l.trim())
      // `await algo(` al principio de la linea y sin nadie que reciba el resultado.
      .filter((l) => /^await\s+[A-Za-z0-9_.]+\s*\(/.test(l))
      // Un guardado que se envuelve en su propio try/catch y despues devuelve el
      // error tambien vale; lo que no vale es que no lo mire nadie.
      .filter((l) => !l.includes('.catch('));

    expect(sueltos).toEqual([]);
  });
});
