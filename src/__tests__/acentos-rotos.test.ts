import fs from 'node:fs';
import path from 'node:path';

/**
 * Los acentos no se pueden volver a romper.
 *
 * Defecto real: el catálogo de menús que ve el cliente en el simulador tenía 29
 * platos con los acentos rotos — "JamÃ³n", "ChampiÃ±on", "POLLO ARROLLADO C/
 * GUARNICIÓN". Pasa cuando un archivo se guarda leyendo bytes en castellano
 * como si fueran de otro idioma, normalmente al editarlo con una herramienta mal
 * configurada.
 *
 * Se revisan los datos que se muestran, no el código: en el código un "Ã" puede
 * ser legítimo (por ejemplo, la pantalla que explica este mismo problema).
 */

const CARPETA_DATOS = path.join(process.cwd(), 'src', 'data');

/** `Ã` o `Â` seguidos de un carácter raro: la firma de un acento mal guardado. */
const ACENTO_ROTO = /[ÃÂ][-¿‘-”ˆ‹›'"]/;

function archivosDeDatos(carpeta: string): string[] {
  const encontrados: string[] = [];
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...archivosDeDatos(ruta));
    else if (entrada.name.endsWith('.json')) encontrados.push(ruta);
  }
  return encontrados;
}

describe('acentos en los datos que ve el cliente', () => {
  it('ningún archivo de datos tiene acentos rotos', () => {
    const rotos: string[] = [];

    for (const ruta of archivosDeDatos(CARPETA_DATOS)) {
      const contenido = fs.readFileSync(ruta, 'utf8');
      if (!ACENTO_ROTO.test(contenido)) continue;
      const linea = contenido.split('\n').find((l) => ACENTO_ROTO.test(l)) ?? '';
      rotos.push(`${path.relative(process.cwd(), ruta)} → ${linea.trim().slice(0, 70)}`);
    }

    // El mensaje va dentro del valor: Jest no acepta un texto aparte.
    expect(rotos.join('\n')).toBe('');
  });

  it('ningún archivo de datos empieza con la marca invisible que rompe los acentos', () => {
    // Esa marca al principio del archivo es lo que suele arrastrar el problema.
    const conMarca = archivosDeDatos(CARPETA_DATOS)
      .filter((ruta) => fs.readFileSync(ruta, 'utf8').charCodeAt(0) === 0xfeff)
      .map((ruta) => path.relative(process.cwd(), ruta));

    expect(conMarca.join('\n')).toBe('');
  });
});
