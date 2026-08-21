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

  describe('Pantallas operativas, de negocio y configuración (Orden 5)', () => {
    const PANTALLAS_REQUERIDAS = [
      // Bloque 1: El día de la fiesta
      { ruta: 'fiestas/nueva/buzon', archivo: 'src/app/(app)/fiestas/nueva/buzon/page.tsx', desc: 'Buzón de saludos' },
      { ruta: 'fiestas/nueva/carteleria', archivo: 'src/app/(app)/fiestas/nueva/carteleria/page.tsx', desc: 'Cartelería' },
      { ruta: 'fiestas/nueva/playlist-pantalla', archivo: 'src/app/(app)/fiestas/nueva/playlist-pantalla/page.tsx', desc: 'Playlist de pantalla' },
      { ruta: 'fiestas/nueva/logistica', archivo: 'src/app/(app)/fiestas/nueva/logistica/page.tsx', desc: 'Logística' },
      { ruta: 'fiestas/nueva/fiesta-lista', archivo: 'src/app/(app)/fiestas/nueva/fiesta-lista/page.tsx', desc: 'Fiesta lista / checklist' },
      { ruta: 'fiestas/nueva/reuniones/imprimir', archivo: 'src/app/(app)/fiestas/nueva/reuniones/imprimir/page.tsx', desc: 'Impresión de minutas' },
      { ruta: 'cierre-mundial', archivo: 'src/app/(app)/fiestas/[id]/cierre-mundial/page.tsx', desc: 'Cierre del evento' },
      { ruta: 'experiencia-tecnologica-ak', archivo: 'src/app/(app)/fiestas/[id]/experiencia-tecnologica-ak/page.tsx', desc: 'Tecnología contratada' },

      // Bloque 2: Las del negocio
      { ruta: '/repaso-diario', archivo: 'src/app/(app)/repaso-diario/page.tsx', desc: 'Repaso diario' },
      { ruta: '/recursos-multi-evento', archivo: 'src/app/recursos-multi-evento/page.tsx', desc: 'Superposición de personal' },
      { ruta: '/empresa/dashboard', archivo: 'src/app/(app)/empresa/dashboard/page.tsx', desc: 'Panel gerencial / métricas' },
      { ruta: '/contabilidad/crm/marketing-ads', archivo: 'src/app/(app)/contabilidad/crm/marketing-ads/page.tsx', desc: 'Rendimiento de anuncios' },
      { ruta: 'todos-los-servicios', archivo: 'src/app/(app)/empresa/todos-los-servicios/[id]/editar/page.tsx', desc: 'Editor visual de servicios' },
      { ruta: '/empresa/presentacion-led/configuracion', archivo: 'src/app/(app)/empresa/presentacion-led/configuracion/page.tsx', desc: 'Presentación LED' },

      // Bloque 3: Las de configuración
      { ruta: '/settings/promos', archivo: 'src/app/(app)/settings/promos/page.tsx', desc: 'Promociones' },
      { ruta: '/settings/ai-assistant', archivo: 'src/app/(app)/settings/ai-assistant/page.tsx', desc: 'Asistente IA' },
      { ruta: '/settings/mapa-tecnologico-ak', archivo: 'src/app/(app)/settings/mapa-tecnologico-ak/page.tsx', desc: 'Mapa tecnológico' },
    ];

    it.each(PANTALLAS_REQUERIDAS)('la pantalla $desc ($ruta) tiene al menos un enlace de entrada', ({ ruta, archivo }) => {
      // Verificar que el archivo destino existe
      expect(fs.existsSync(path.join(RAIZ, archivo))).toBe(true);

      // Buscar si algún archivo del código fuente enlaza a esta ruta
      const salida: string[] = [];
      const recorrer = (carpeta: string) => {
        for (const e of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
          const r = path.join(carpeta, e.name);
          if (e.isDirectory()) recorrer(r);
          else if (/\.tsx?$/.test(e.name)) salida.push(r);
        }
      };
      recorrer('src');

      let enlaces = 0;
      for (const fuente of salida) {
        if (fuente.replace(/\\/g, '/') === archivo) continue;
        if (fuente.includes('__tests__') || /\.test\.tsx?$/.test(fuente)) continue;
        const texto = fs.readFileSync(path.join(RAIZ, fuente), 'utf8');
        if (texto.includes(ruta)) enlaces++;
      }

      expect(enlaces).toBeGreaterThan(0);
    });
  });
});
