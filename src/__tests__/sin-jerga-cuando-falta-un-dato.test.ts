import fs from 'fs';
import path from 'path';

/**
 * Defecto real, visto mirando las 243 pantallas de la aplicacion: cuando una
 * pantalla se abria sin el dato que necesitaba, en vez de explicarlo en criollo
 * mostraba jerga. Una llegaba a imprimir "?fiestaId=..." tal cual, con el codigo
 * a la vista, y la de la invitacion decia "Evento no encontrado." y nada mas,
 * que es lo que leia el INVITADO cuando el enlace fallaba.
 *
 * Esta prueba mira el texto del codigo. Es barata y frena la vuelta atras.
 */

const leer = (ruta: string) => fs.readFileSync(path.join(process.cwd(), ruta), 'utf-8');

describe('cuando falta un dato, la app no habla como programador', () => {
  it('los paneles de evento sin fiesta no muestran la direccion web con parametros', () => {
    for (const ruta of [
      'src/components/panels/costos--reporte.tsx',
      'src/components/fiestas/panels/planner-costo-fiesta.tsx',
    ]) {
      const pantalla = leer(ruta);
      expect(pantalla).not.toContain('?fiestaId=...');
      expect(pantalla).not.toContain('Usá el parámetro');
    }
  });

  it('las pantallas que necesitan una fiesta piden elegirla, no tiran error', () => {
    for (const ruta of [
      'src/app/(app)/fiestas/nueva/tareas/client.tsx',
      'src/components/panels/reuniones--imprimir.tsx',
      'src/components/panels/costos--reporte.tsx',
    ]) {
      const pantalla = leer(ruta);
      expect(pantalla).not.toContain('No se ha especificado un ID de fiesta');
      expect(pantalla).toContain('Elegí una fiesta');
    }
  });

  it('el aviso de empleado no muestra el identificador interno', () => {
    const pantalla = leer('src/app/(app)/empleados/[id]/editar/page.tsx');
    expect(pantalla).not.toContain('No se encontró el empleado con ID');
    expect(pantalla).toContain('No encontramos a esa persona');
  });

  it('al invitado se le dice que el enlace no sirve y que pida uno nuevo', () => {
    const pantalla = leer('src/app/invitacion/[fiestaId]/rsvp/page.tsx');
    expect(pantalla).toContain('Este enlace no está disponible');
    expect(pantalla).toContain('Pedile el enlace nuevo a quien te invitó');
  });

  it('el aviso de Instagram no nombra Graph API ni token', () => {
    const accion = leer('src/app/actions/social-media.ts');
    expect(accion).not.toContain('no esta conectado a Graph API');
    expect(accion).toContain('Instagram todavia no esta conectado');
  });
});
