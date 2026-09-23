/**
 * MATAFUEGO — Un trago que no se llego a guardar no deja botellas descontadas ni dice
 * "pedido enviado".
 *
 * Dos defectos que encontro Codex el 22 de setiembre de 2026, los dos en la barra:
 *
 * 1. **El guardado de respaldo devuelve el error en vez de tirarlo**, y nadie lo miraba. Si
 *    fallaba, se seguia de largo y se contestaba `success: true`. El invitado veia su trago
 *    confirmado y **al barman no le llegaba nada**.
 * 2. **Las botellas se descuentan antes de guardar.** Con el guardado fallado quedaba el stock
 *    bajado por un pedido que no existe: la barra se quedaba sin bebida con el sistema
 *    marcando que habia de sobra.
 *
 * Lo que queda: se mira si se guardo; si no, **se devuelven las botellas** y se contesta que
 * no se pudo.
 *
 * Se probo rompiendolo a proposito: sacando la mirada al resultado del respaldo, o sacando la
 * devolucion de las botellas, las comprobaciones que les corresponden se ponen en rojo.
 */
import fs from 'fs';
import path from 'path';

const CODIGO = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', 'actions', 'fiesta', 'barra-tecnologica.actions.ts'),
  'utf-8',
);

/** El cuerpo del pedido del invitado, para no mirar el archivo entero. */
function cuerpoDelPedido(): string {
  const inicio = CODIGO.indexOf('export async function createBarDrinkOrder(');
  if (inicio === -1) throw new Error('No encontre el pedido de trago del invitado.');
  const fin = CODIGO.indexOf('\nexport async function ', inicio + 10);
  return CODIGO.slice(inicio, fin === -1 ? undefined : fin);
}

/** El cuerpo del cambio de trago. */
function cuerpoDelCambio(): string {
  const inicio = CODIGO.indexOf('export async function changeBarDrinkOrder(');
  if (inicio === -1) throw new Error('No encontre el cambio de trago.');
  const fin = CODIGO.indexOf('\nexport async function ', inicio + 10);
  return CODIGO.slice(inicio, fin === -1 ? undefined : fin);
}

describe('Un trago que no se guardo no descuenta botellas', () => {
  const pedido = cuerpoDelPedido();

  it('mira el resultado del guardado de respaldo, no lo tira a la basura', () => {
    // Las dos llamadas al respaldo —la del camino sin base y la del error de la base—
    // tienen que quedar guardadas en una variable, no sueltas.
    const sueltas = pedido.match(/^\s*await saveFallbackOrders\(/gm) || [];
    expect(sueltas).toHaveLength(0);
    expect(pedido).toContain('seGuardo');
  });

  it('un respaldo que TIRA el error cuenta igual que uno que lo devuelve', () => {
    // Las dos cosas significan lo mismo: el pedido no quedo guardado. Antes solo se miraba
    // la primera. Lo marco Codex el 22 de setiembre de 2026.
    expect(pedido).toContain('guardarEnElRespaldo');
    const fn = pedido.slice(pedido.indexOf('const guardarEnElRespaldo'), pedido.indexOf('if (db) {'));
    expect(fn).toContain('catch');
    expect(fn).toContain('return false;');
  });

  it('si tampoco se pueden devolver las botellas, queda escrito con el detalle', () => {
    const corte = pedido.indexOf('if (!seGuardo)');
    const dentro = pedido.slice(corte, pedido.indexOf('return {', corte));
    expect(dentro).toContain('logger.error');
    expect(dentro).toContain('movimientos');
  });

  it('si no se guardo, devuelve las botellas antes de contestar', () => {
    const corte = pedido.indexOf('if (!seGuardo)');
    expect(corte).toBeGreaterThan(-1);
    const dentro = pedido.slice(corte, pedido.indexOf('}', pedido.indexOf('return', corte)));
    expect(dentro).toContain('reponerStock');
  });

  it('si no se guardo, NO contesta que salio bien', () => {
    const corte = pedido.indexOf('if (!seGuardo)');
    const dentro = pedido.slice(corte, pedido.indexOf('}', pedido.indexOf('return {', corte)));
    expect(dentro).toContain('success: false');
  });

  it('el exito solo se contesta despues de haber comprobado el guardado', () => {
    expect(pedido.indexOf('if (!seGuardo)')).toBeLessThan(pedido.lastIndexOf('return { success: true'));
  });

  // ─── Cambiar de trago ──────────────────────────────────────────────────────
  //
  // Antes se cancelaba el viejo y despues se pedia el nuevo. Si el nuevo no salia —sin
  // stock, barra pausada, fuera de horario, o el guardado fallado— el invitado se quedaba
  // SIN NADA. Lo encontro Codex el 22 de setiembre de 2026.

  it('consigue el trago nuevo ANTES de cancelar el viejo', () => {
    const cambio = cuerpoDelCambio();
    expect(cambio.indexOf('createBarDrinkOrder(')).toBeLessThan(
      cambio.indexOf("updateBarDrinkOrderStatusInternal(fiestaId, orderId, 'cancelado')"),
    );
  });

  it('si el trago nuevo no sale, no se toca el viejo', () => {
    const cambio = cuerpoDelCambio();
    const corte = cambio.indexOf('if (!nuevo.success');
    expect(corte).toBeGreaterThan(-1);
    expect(corte).toBeLessThan(cambio.indexOf("updateBarDrinkOrderStatusInternal(fiestaId, orderId, 'cancelado')"));
  });

  it('si falla cancelar el viejo, se cancela el nuevo y el invitado no queda con dos', () => {
    const cambio = cuerpoDelCambio();
    const corte = cambio.indexOf('if (!cancellation.success)');
    const dentro = cambio.slice(corte, cambio.indexOf('return {', corte));
    expect(dentro).toContain("updateBarDrinkOrderStatusInternal(fiestaId, nuevo.order.id, 'cancelado')");
  });
});
