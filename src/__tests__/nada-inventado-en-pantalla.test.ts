/**
 * Que no vuelva a entrar contenido de relleno en pantallas que ve un cliente,
 * un prospecto o un invitado.
 *
 * Ya pasó cinco veces, y la peor la vieron los invitados de todas las fiestas:
 * la invitación mostraba una historia de vida inventada, dos hoteles que no
 * existen con direcciones de Buenos Aires y teléfonos argentinos, y música de
 * prueba traída de un sitio ajeno.
 *
 * Esta prueba recorre el código de las pantallas públicas y falla si encuentra
 * algo de eso. Si falla por algo legítimo, la solución NO es sacar el patrón de
 * la lista: es dejar el dato afuera del código y que salga de lo que el equipo
 * carga.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

/** Carpetas cuyo contenido termina en una pantalla pública. */
const CARPETAS_PUBLICAS = [
  'src/app/invitacion',
  'src/app/evento',
  'src/app/portal',
  'src/app/portal-cliente',
  'src/app/portal-invitado',
  'src/app/public',
  'src/app/catalogo',
  'src/components/public',
  'src/components/landing',
  'src/components/invitacion',
  'src/data/event-catalogs',
];

const PATRONES: { nombre: string; regex: RegExp; porQue: string }[] = [
  {
    nombre: 'fotos al azar de internet',
    regex: /picsum\.photos|placeholder\.com|dummyimage|placehold\.it/i,
    porQue: 'la pantalla mostraria una foto cualquiera de internet en vez de la del cliente',
  },
  {
    nombre: 'audio o video de prueba de un sitio ajeno',
    regex: /soundhelix|sample-videos\.com|filesamples\.com/i,
    porQue: 'sonaria una cancion de demostracion que el anfitrion nunca eligio',
  },
  {
    nombre: 'direcciones de mentira',
    regex: /calle falsa|123 fake|fake street/i,
    porQue: 'el invitado leeria una direccion que no existe',
  },
  {
    nombre: 'lugares de otro pais',
    regex: /\bPalermo\b|\bRecoleta\b|Buenos Aires/i,
    porQue: 'los clientes son de Salto: una direccion de otro pais confunde y queda mal',
  },
  {
    nombre: 'telefonos que no son uruguayos',
    regex: /\+(?:54|55|34|56|51|57)[\s-]?\d{1,4}[\s-]\d{3,}/,
    porQue: 'nadie atiende ese numero, y el que llama se queda sin respuesta',
  },
  {
    nombre: 'texto de relleno',
    regex: /lorem ipsum/i,
    porQue: 'texto de relleno visible en una pantalla que ve un cliente',
  },
];

function archivosDe(carpeta: string): string[] {
  const completa = path.join(RAIZ, carpeta);
  if (!fs.existsSync(completa)) return [];
  const salida: string[] = [];
  for (const entrada of fs.readdirSync(completa, { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivosDe(ruta));
    else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) salida.push(ruta);
  }
  return salida;
}

/** Una línea que empieza con // o * es un comentario: ahí el patrón está explicado, no usado. */
function esComentario(linea: string): boolean {
  const limpia = linea.trim();
  return limpia.startsWith('//') || limpia.startsWith('*') || limpia.startsWith('/*');
}

describe('Nada inventado en las pantallas que ve el cliente o el invitado', () => {
  const archivos = CARPETAS_PUBLICAS.flatMap(archivosDe);

  it('encuentra archivos para revisar', () => {
    expect(archivos.length).toBeGreaterThan(50);
  });

  it.each(PATRONES)('no hay $nombre', ({ regex, porQue }) => {
    const hallazgos: string[] = [];

    for (const archivo of archivos) {
      const lineas = fs.readFileSync(path.join(RAIZ, archivo), 'utf8').split('\n');
      lineas.forEach((linea, i) => {
        if (esComentario(linea)) return;
        if (regex.test(linea)) hallazgos.push(`${archivo}:${i + 1} -> ${linea.trim().slice(0, 110)}`);
      });
    }

    if (hallazgos.length > 0) {
      throw new Error(
        `Contenido de relleno en pantallas publicas (${porQue}):\n` +
        hallazgos.join('\n') +
        '\n\nSacalo del codigo: el dato tiene que salir de lo que carga el equipo. ' +
        'Si no hay dato, la seccion no se muestra.'
      );
    }
  });
});
