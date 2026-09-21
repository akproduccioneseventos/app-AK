/**
 * MATAFUEGO — Cambiar una clave NO le puede cambiar la clave a otro.
 *
 * Aparecio el 21 de septiembre de 2026, en una entrega que buscaba que el dueño pudiera
 * entrar por los dos caminos. La sincronizacion tenia un repuesto: si ninguna cuenta
 * coincidia por correo, le ponia **esa misma clave a los primeros cinco usuarios con rol
 * de administrador**, y encima les sacaba el aviso de "tiene que cambiarla".
 *
 * O sea: una persona cambiaba su clave y **se llevaba puestas las cuentas de los demas**,
 * sin que nadie se enterara. Eso es entregarle la cuenta de uno a otro.
 *
 * La regla que queda: **la clave de una persona se sincroniza solo con SU cuenta**, por
 * correo. Si no existe ninguna con ese correo, se crea la del dueño y nada mas.
 *
 * Se probo rompiendolo a proposito: volviendo a poner el repuesto que escribe sobre los
 * usuarios con rol de administrador, esta prueba se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const CODIGO = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', 'actions', 'simple-auth.ts'),
  'utf-8',
);

/** El cuerpo de la funcion que sincroniza, para no mirar el archivo entero. */
function cuerpoDeLaSincronizacion(): string {
  const inicio = CODIGO.indexOf('async function syncPasswordToUsersCollection(');
  if (inicio === -1) throw new Error('No encontre la sincronizacion de claves.');
  const siguiente = CODIGO.indexOf('\nexport async function ', inicio);
  return CODIGO.slice(inicio, siguiente === -1 ? undefined : siguiente);
}

describe('La clave de uno no le cambia la clave a otro', () => {
  const sincronizacion = cuerpoDeLaSincronizacion();

  it('la sincronizacion busca la cuenta POR CORREO', () => {
    expect(sincronizacion).toContain("where('email', '==', email)");
  });

  it('NO escribe la clave sobre los usuarios con rol de administrador', () => {
    // Escribir por rol es lo que le cambiaba la clave a otras personas.
    const escribePorRol =
      /where\('role',\s*'==',\s*'admin'\)[\s\S]{0,600}?passwordHash:\s*newHash/.test(sincronizacion);
    expect(escribePorRol).toBe(false);
  });

  it('solo crea una cuenta nueva si NO hay ninguna todavia', () => {
    expect(sincronizacion).toContain('anyUserSnap.empty');
  });
});
