/**
 * MATAFUEGO: EL PROSPECTO NO ESPERA A QUE DESPIERTE EL SERVIDOR, Y NADIE MAS VE
 * UNA PAGINA QUE NO ES SUYA.
 *
 * El 10 de setiembre de 2026 la app quedaba cargando y Google cortaba la conexion.
 * El servidor se duerme a proposito para no pagar de mas; lo que no puede pasar es
 * que el que llega desde una busqueda espere a que despierte, porque se va.
 *
 * La solucion no cuesta plata: las paginas de venta se ven IGUAL para todo el mundo,
 * asi que las guarda la red de Google y las entrega sin tocar el servidor.
 *
 * **Y aca esta el peligro que esta prueba vigila.** Guardar una pagina que cambia
 * segun quien mira es entregarsela al siguiente que entre: el portal de un cliente,
 * una pantalla del equipo, una lista de presupuestos. Por eso la lista de paginas
 * guardadas esta escrita a mano y esta prueba controla las dos cosas: que las de
 * venta esten, y que **ninguna otra** se cuele.
 *
 * Se probo rompiendola: agregandole `portal` a la lista, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

/**
 * Se lee el archivo de configuracion como texto a proposito: cargarlo de verdad
 * arrastra el complemento de la aplicacion instalable, que no arranca fuera de un
 * navegador. Lo que importa aca es QUE LISTA quedo escrita, y eso se lee igual.
 */
function configuracion(): string {
  return fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
}

function reglaDeGuardado(): { source: string; value: string } | null {
  const texto = configuracion();
  const m = texto.match(/source:\s*'([^']*)'\s*,\s*headers:\s*\[\s*\{\s*key:\s*'Cache-Control'\s*,\s*value:\s*'([^']*)'/);
  return m ? { source: m[1], value: m[2] } : null;
}

function listaGuardada(source: string): string[] {
  return source.slice(source.indexOf('(') + 1, source.lastIndexOf(')')).split('|');
}

const PAGINAS_DE_VENTA = ['', 'bodas', 'quinceaneras', 'cumpleanos', 'club-uruguay', 'blog', 'privacidad', 'experiencia-ak'];

/** Nada de esto puede guardarse: cambia segun quien mira. */
const NUNCA_SE_GUARDAN = [
  'portal',
  'portal-cliente',
  'presupuestos',
  'settings',
  'eventos',
  'contabilidad',
  'invoices',
  'customers',
  'evento',
  'invitado',
  'album',
  'login',
  'admin',
  'api',
];

describe('las paginas de venta las guarda Google', () => {
  it('la regla existe y guarda exactamente las paginas de venta', () => {
    const regla = reglaDeGuardado();
    expect(regla).not.toBeNull();
    expect(regla!.value).toMatch(/s-maxage=\d+/);
    expect(listaGuardada(regla!.source).sort()).toEqual([...PAGINAS_DE_VENTA].sort());
  });

  it('ninguna pantalla que cambia segun quien mira queda guardada', () => {
    const regla = reglaDeGuardado();
    const lista = listaGuardada(regla!.source);
    const coladas = NUNCA_SE_GUARDAN.filter((r) => lista.includes(r));
    expect(coladas).toEqual([]);
  });

  it('la copia guardada se entrega igual cuando quedo vieja, para que nadie espere', () => {
    // Sin esto, al vencer la copia el prospecto vuelve a esperar al servidor dormido.
    expect(reglaDeGuardado()!.value).toMatch(/stale-while-revalidate=\d{3,}/);
  });
});
