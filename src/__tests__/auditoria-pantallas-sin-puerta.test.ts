/**
 * CONTROL AUTOMÁTICO 2 — Ninguna pantalla del evento queda sin puerta.
 *
 * Apareció cuatro veces: pantallas terminadas y andando a las que **no se llegaba
 * desde ningún lado**. Había que escribir la dirección a mano, cosa que nadie
 * adivina. Pasó con el buzón de saludos, el moderador móvil, la cola de impresión
 * y el planificador gastronómico.
 *
 * Es un defecto que ninguna auditoría de código encuentra, porque el código está
 * bien: lo que falta es el enlace. Se encuentra contando, y eso hace esta prueba.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

/**
 * Pantallas a las que se llega por un código QR, un enlace que manda el equipo por
 * WhatsApp, o escribiendo la dirección en la tablet de la estación. No necesitan un
 * botón dentro de la aplicación.
 */
const SE_LLEGA_POR_FUERA = new Set([
  'accesos',      // el equipo entra con su propio enlace
  'actual',       // puente para invitaciones viejas, redirige
  'staff',        // cronograma del personal, se manda por WhatsApp
  'video-vida',   // se proyecta, se abre en la notebook del salón
  'touchpix',     // estación con su propia tablet
  'bogue',        // estación con su propia tablet
  'en-vivo',      // se comparte con la familia que no viaja
  'album',        // se comparte después de la fiesta
  'zona-digital', // selector que se abre en la tablet
  'hub',          // centro al que llega el invitado por QR
  'invitado',     // portal personal, llega por su enlace
  'logistica',    // pantalla del coordinador
  'dj',           // pantalla del DJ
]);

function carpetasDeEvento(): string[] {
  const base = path.join(RAIZ, 'src/app/evento');
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('['))
    .map((e) => e.name);
}

/** Cuenta desde cuántos archivos se enlaza esta pantalla. */
function puertasHacia(nombre: string): number {
  const salida: string[] = [];
  const recorrer = (carpeta: string) => {
    for (const e of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
      const r = path.join(carpeta, e.name);
      if (e.isDirectory()) recorrer(r);
      else if (/\.tsx?$/.test(e.name)) salida.push(r);
    }
  };
  recorrer('src');

  let puertas = 0;
  for (const archivo of salida) {
    // No cuentan: la pantalla misma, las pruebas, ni la lista de rutas públicas.
    if (archivo.startsWith(`src/app/evento/${nombre}`)) continue;
    if (archivo.includes('__tests__') || /\.test\.tsx?$/.test(archivo)) continue;
    if (archivo.includes('public-paths')) continue;
    const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
    if (texto.includes(`evento/${nombre}`)) puertas++;
  }
  return puertas;
}

describe('Ninguna pantalla del evento sin puerta', () => {
  const carpetas = carpetasDeEvento();

  it('encuentra las pantallas del evento', () => {
    expect(carpetas.length).toBeGreaterThan(15);
  });

  it('a todas se llega desde algún lado de la aplicación', () => {
    const sinPuerta = carpetas
      .filter((nombre) => !SE_LLEGA_POR_FUERA.has(nombre))
      .filter((nombre) => puertasHacia(nombre) === 0);

    if (sinPuerta.length > 0) {
      throw new Error(
        'Estas pantallas estan terminadas y no se llega a ellas desde ningun lado ' +
        '(hay que escribir la direccion a mano, y nadie la adivina):\n' +
        sinPuerta.map((n) => `  /evento/${n}`).join('\n') +
        '\n\nPonele un boton donde corresponda, o agregala a SE_LLEGA_POR_FUERA si ' +
        'de verdad se entra por un QR o un enlace que manda el equipo.'
      );
    }
  });
});
