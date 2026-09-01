import fs from 'node:fs';
import path from 'node:path';

/**
 * El cliente nunca termina en el trabajo de otro cliente.
 *
 * El album profesional del fotografo vive afuera de la app (Wfolio, Drive) y se
 * carga por fiesta. **Si esa fiesta no tenia el enlace cargado, el boton "Ir al
 * Album Digital" llevaba al DISCO GENERAL del fotografo**, donde esta el
 * material de todos los clientes. Un cliente tocaba y terminaba en la fiesta de
 * otro.
 *
 * Es de lo mas delicado que hay: quien ve que. Por eso queda vigilado.
 *
 * Esta prueba mira el codigo, no la pantalla, a proposito: lo que hay que
 * impedir es que alguien **vuelva a escribir una direccion fija** como respaldo.
 */

const PANTALLA = path.join(process.cwd(), 'src/components/social-wall/PostEventMemoryHub.tsx');

describe('el album profesional del cliente', () => {
  const codigo = fs.readFileSync(PANTALLA, 'utf8');

  it('no manda a ninguna direccion fija cuando la fiesta no tiene enlace cargado', () => {
    // Ni al disco general del fotografo, ni a ningun otro lugar clavado.
    expect(codigo).not.toMatch(/galeriaUrl\s*\|\|\s*['"]https?:\/\//);
  });

  it('solo muestra el boton si esa fiesta tiene su propio enlace', () => {
    expect(codigo).toContain('hayAlbumProfesional');
    // Y cuando no lo tiene, se lo dice en criollo en vez de esconderlo sin mas.
    expect(codigo).toMatch(/todav[ií]a est[aá] editando/i);
  });
});
