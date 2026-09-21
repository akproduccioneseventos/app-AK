/**
 * MATAFUEGO — Un codigo de recuperacion que NO se llego a mandar no queda vivo.
 *
 * Encontrado el 21 de setiembre de 2026 al revisar la recuperacion, a pedido del dueno.
 *
 * El codigo se guarda ANTES de mandarlo por correo, y tiene que ser asi: lo que sale en el
 * mail tiene que coincidir con lo guardado. Pero si el correo **no salia** —y hoy no sale,
 * porque la cuenta de Google de la empresa no esta conectada— ese codigo quedaba guardado y
 * valido quince minutos. O sea: un codigo de recuperacion vivo que **nadie recibio y nadie
 * puede usar**, y encima el intento consumido.
 *
 * Lo que queda: si el correo no salio, el codigo se borra en el momento.
 *
 * Se probo rompiendolo a proposito: sacando el borrado, esta prueba se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const CODIGO = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', 'actions', 'simple-auth.ts'),
  'utf-8',
);

/** El cuerpo de la funcion que pide el codigo, para no mirar el archivo entero. */
function cuerpoDelPedido(): string {
  const inicio = CODIGO.indexOf('export async function requestPasswordResetEmail(');
  if (inicio === -1) throw new Error('No encontre el pedido de codigo de recuperacion.');
  const fin = CODIGO.indexOf('\nexport async function ', inicio + 10);
  return CODIGO.slice(inicio, fin === -1 ? undefined : fin);
}

describe('Un codigo que no se mando no queda vivo', () => {
  const pedido = cuerpoDelPedido();

  it('sigue guardando el codigo antes de mandarlo, que es lo correcto', () => {
    expect(pedido.indexOf('resetCodeHash: hashValue(code)')).toBeLessThan(
      pedido.indexOf('sendSecurityEmail('),
    );
  });

  it('si el correo no salio, borra el codigo antes de contestar', () => {
    const fallo = pedido.indexOf('if (!mail.sent) {');
    expect(fallo).toBeGreaterThan(-1);
    const cierre = pedido.indexOf('return {', fallo);
    const dentroDelFallo = pedido.slice(fallo, cierre);
    expect(dentroDelFallo).toContain("resetCodeHash: ''");
    expect(dentroDelFallo).toContain("resetCodeExpiresAt: ''");
  });
});
