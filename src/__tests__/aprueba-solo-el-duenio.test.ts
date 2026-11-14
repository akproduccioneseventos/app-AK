/** Decisión del dueño, 14/11/2026: lo que queda "para tu OK" lo aprueba o rechaza sólo él (no la secretaria). */
import fs from 'fs';
import path from 'path';
import { PERMISOS_POR_PERFIL, PERMISOS } from '@/lib/auth/perfiles';

const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/approvals.ts'), 'utf8');

function permisoDe(funcion: string): string {
  const i = fuente.indexOf(`export async function ${funcion}(`);
  const m = fuente.slice(i).match(/requirePermiso\(PERMISOS\.(\w+)\)/);
  return m ? m[1] : '';
}

describe('aprobar y rechazar es sólo del dueño', () => {
  it.each(['aprobarCambio', 'rechazarCambio'])('%s pide ADMINISTRACION', (f) => {
    expect(permisoDe(f)).toBe('ADMINISTRACION');
  });

  it('la secretaria no tiene ADMINISTRACION y el dueño sí', () => {
    expect(PERMISOS_POR_PERFIL.secretaria).not.toContain(PERMISOS.ADMINISTRACION);
    expect(PERMISOS_POR_PERFIL.dueno).toContain(PERMISOS.ADMINISTRACION);
  });
});
