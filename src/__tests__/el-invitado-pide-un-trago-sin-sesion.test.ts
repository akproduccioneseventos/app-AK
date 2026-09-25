/**
 * MATAFUEGO — El pedido de un invitado no se corta por pedirle la sesion del equipo.
 *
 * Encontrado el 25 de septiembre de 2026 (lo destapo la prueba de navegador de la orden 81):
 * la barra, despues de descontar las botellas, llamaba a `invalidateInsumosCache`, que es una
 * accion del equipo y **exige sesion**. El invitado no la tiene: la llamada tiraba "Sesion no
 * autorizada", el pedido no se guardaba y **las botellas quedaban descontadas**.
 *
 * La barra atiende a invitados, asi que no puede llamar a ninguna accion que pida sesion
 * del equipo para limpiar un cache: usa `limpiarCacheInsumos`, que no es una accion.
 *
 * Lo mismo pasaba con la carta de tragos de la empresa: `getCartaTragosMaster` pide sesion,
 * fallaba en silencio y al invitado le salia la carta de fabrica. Ahora se lee con
 * `leerCartaTragosMaster`, que no es una accion.
 *
 * Se probo rompiendolo: volviendo a importar `invalidateInsumosCache` o
 * `getCartaTragosMaster` se pone en rojo.
 */
import fs from 'node:fs';
import path from 'node:path';

const BARRA = path.join(process.cwd(), 'src/app/actions/fiesta/barra-tecnologica.actions.ts');

describe('El invitado pide un trago sin sesion del equipo', () => {
  const texto = fs.readFileSync(BARRA, 'utf8');

  it('la barra no llama a la accion de insumos que exige sesion', () => {
    expect(texto).not.toMatch(/from ['"]@\/app\/actions\/insumos['"]/);
    expect(texto).not.toMatch(/invalidateInsumosCache/);
  });

  it('limpia el cache de insumos con la funcion interna, despues de mover stock', () => {
    expect(texto).toMatch(/import \{ limpiarCacheInsumos \} from '@\/lib\/insumos\/leer-insumos'/);
    const usos = texto.match(/limpiarCacheInsumos\(\)/g) || [];
    expect(usos.length).toBeGreaterThanOrEqual(4);
  });

  it('la carta de la empresa se lee sin pedir sesion: el invitado no ve la de fabrica', () => {
    expect(texto).not.toMatch(/getCartaTragosMaster/);
    expect(texto).toMatch(/leerCartaTragosMaster\(\)/);
  });

  it('las devoluciones pendientes se toman y vacian en una sola operacion con base', () => {
    const cuerpo = texto.slice(texto.indexOf('async function reintentarDevolucionesPendientes'));
    expect(cuerpo.slice(0, 900)).toMatch(/mutateGenericJsonArray<DevolucionPendiente>/);
  });
});
