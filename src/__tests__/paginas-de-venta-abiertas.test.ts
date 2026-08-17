/**
 * Ata las dos listas que ya se desincronizaron cuatro veces.
 *
 * `paginas-publicas.ts` decide que le mostramos a Google y a que pagina le
 * armamos titulo y descripcion. `public-paths.ts` decide que deja pasar el
 * middleware sin pedir cuenta.
 *
 * Cuando una pagina esta en la primera y no en la segunda, pasa lo peor que
 * puede pasar sin que nadie se entere: **el prospecto que llega desde Google o
 * desde un enlace de WhatsApp cae en la pantalla de ingreso**, y Google tampoco
 * puede leerla. La pagina de venta existe, se ve linda y no la abre nadie.
 *
 * Ya paso con `/catalogo`, con `/galeria-led`, y despues con las cuatro paginas
 * de venta del negocio: bodas, quince, cumpleanos y la experiencia AK.
 */
import { isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

function seAbreSinCuenta(ruta: string): boolean {
  return PUBLIC_EXACT_PATHS.has(ruta) || isPublicPathPrefix(ruta);
}

describe('Las páginas que se le ofrecen a Google', () => {
  it('se pueden abrir sin tener cuenta', () => {
    const tapadas = (PAGINAS_PARA_GOOGLE as readonly string[]).filter(
      (ruta) => !seAbreSinCuenta(ruta),
    );

    // Si esta prueba falla, la ruta que aparezca acá está en el listado que ve
    // Google pero el middleware la manda al login: nadie la puede abrir.
    expect(tapadas).toEqual([]);
  });

  it('las cuatro páginas de venta siguen abiertas', () => {
    expect(seAbreSinCuenta('/bodas')).toBe(true);
    expect(seAbreSinCuenta('/quinceaneras')).toBe(true);
    expect(seAbreSinCuenta('/cumpleanos')).toBe(true);
    expect(seAbreSinCuenta('/experiencia-ak')).toBe(true);
  });

  it('abrirlas no abrió de paso nada del equipo', () => {
    // Las que tienen que seguir pidiendo cuenta.
    expect(seAbreSinCuenta('/contabilidad')).toBe(false);
    expect(seAbreSinCuenta('/admin/finanzas')).toBe(false);
    expect(seAbreSinCuenta('/presupuestos')).toBe(false);
    expect(seAbreSinCuenta('/empleados')).toBe(false);
    // Y la distribución de mesas, que vive bajo una ruta pública pero es del
    // equipo: ya se coló una vez y mostraba la lista de invitados.
    expect(seAbreSinCuenta('/portal/mesas')).toBe(false);
  });
});
