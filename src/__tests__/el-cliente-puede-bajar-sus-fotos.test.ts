import fs from 'node:fs';
import path from 'node:path';

/**
 * Las descargas del portal del cliente llevan a las fotos de la fiesta.
 *
 * **PASO EL 2 DE SEPTIEMBRE DE 2026 Y LO CAUSO UNA CORRECCION PROPIA.** Al sacar
 * el enlace fijo que mandaba al disco de todos los clientes, las cuatro
 * tarjetas de descarga quedaron colgadas del dato equivocado: `customAlbumUrl`,
 * que es **el album editado del fotografo**, otro material.
 *
 * Quedaba mal de las dos maneras:
 * - **Sin ese enlace cargado**, el cliente veia *"247 fotos compartidas en
 *   vivo"* y **ningun boton**. Una promesa sin forma de cumplirla.
 * - **Con el enlace cargado**, el boton decia "Descargar" abajo de *"Fotos de
 *   los Invitados"* y **lo llevaba al album del fotografo**.
 *
 * Y hay una trampa que casi se pisa al arreglarlo: la descarga interna
 * `/api/fiestas/[fiestaId]/download-recuerdos` **pide sesion de administrador**.
 * Enchufarsela a esos botones le habria contestado "no autorizado" al cliente.
 * Por eso van a la **galeria publica**, que es donde el cliente si puede entrar.
 */

const HUB = path.join(process.cwd(), 'src/components/social-wall/PostEventMemoryHub.tsx');
const GALERIA = path.join(process.cwd(), 'src/app/evento/galeria/[fiestaId]/page.tsx');

describe('las descargas del portal del cliente', () => {
  const hub = fs.readFileSync(HUB, 'utf8');

  it('las tarjetas de la fiesta NO llevan al album del fotografo', () => {
    // Son dos materiales distintos: lo que se saco en la fiesta y lo que el
    // fotografo edito despues. El album profesional tiene su propia tarjeta.
    const tarjetasDeLaFiesta = hub.split('Album Digital')[0];
    expect(tarjetasDeLaFiesta).not.toContain('href={customAlbumUrl}');
  });

  it('el boton se ve aunque la fiesta no tenga album profesional cargado', () => {
    // Lo que rompia antes: el boton colgaba de `hayAlbumProfesional`.
    expect(hub).not.toMatch(/hayAlbumProfesional\s*&&\s*<a href=\{customAlbumUrl\}/);
  });

  it('llevan a la galeria publica, no a la descarga que pide ser administrador', () => {
    expect(hub).toContain('enlaceALaGaleria');
    // Se mira el ENLACE, no el texto: el archivo nombra esa ruta en un
    // comentario que explica por que NO se usa, y eso no es un problema.
    expect(hub).not.toMatch(/href=\{?["'`][^"'`]*download-recuerdos/);
  });

  it('la galeria entiende la estacion que le llega por la direccion', () => {
    const galeria = fs.readFileSync(GALERIA, 'utf8');
    expect(galeria).toContain("get('estacion')");
    // Y la valida: lo que viene por la direccion lo escribe cualquiera.
    expect(galeria).toContain('FILTROS.includes');
  });
});
