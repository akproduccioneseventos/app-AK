/**
 * El auditor prueba todo desde el 17/11/2026, menos usuarios, permisos, claves y accesos: si pudiera crearse una cuenta
 * de dueño, seguiría entrando después de cerrarle el acceso.
 */
import fs from 'node:fs';
import path from 'node:path';

const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/auth.ts'), 'utf8');

function cuerpo(nombre: string): string {
  const i = fuente.indexOf(`export async function ${nombre}(`);
  expect(i).toBeGreaterThan(-1);
  const siguiente = fuente.indexOf('\nexport async function ', i + 10);
  return fuente.slice(i, siguiente === -1 ? undefined : siguiente);
}

describe('El auditor no maneja usuarios ni permisos', () => {
  it.each(['createUser', 'updateUserModules', 'deleteUser', 'adminResetUserPassword', 'abrirAccesoAuditor', 'cerrarAccesoAuditor'])(
    '%s frena al auditor',
    (nombre) => {
      expect(cuerpo(nombre)).toMatch(/esSesionDeAuditor\(\)\) return \{ success: false/);
    },
  );
});
