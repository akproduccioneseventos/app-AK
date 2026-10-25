/**
 * Barrido de la pregunta 35 (21/10/2026). `requirePermiso` y `requireAdminSession` DEVUELVEN el
 * resultado, no cortan: escribir `await requirePermiso(...)` sin mirar `.ok` deja pasar a cualquiera.
 * Pasó en `extractReceiptDataAction` (gastos), que gastaba IA con cualquier sesión. Además
 * `ejecutarTareaManual`, `notifyGuestsWithCalendarLinks`, `notifyContractSignedToClient`,
 * `activateUltimateEventSystem` y `deleteDocumento` pedían sólo sesión.
 */
import fs from 'fs';
import path from 'path';

function archivos(dir: string, out: string[] = []): string[] {
  for (const n of fs.readdirSync(dir)) {
    const r = path.join(dir, n);
    if (fs.statSync(r).isDirectory()) archivos(r, out);
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(r);
  }
  return out;
}

describe('un permiso que no se mira no frena a nadie', () => {
  it('nadie llama a requirePermiso o requireAdminSession sin mirar el resultado', () => {
    const malos: string[] = [];
    for (const f of archivos(path.join(process.cwd(), 'src'))) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
        if (/^\s*await (requirePermiso|requireAdminSession)\(/.test(l)) malos.push(`${path.relative(process.cwd(), f)}:${i + 1}`);
      });
    }
    expect(malos).toEqual([]);
  });

  it('las cinco acciones que pedían sólo sesión ahora piden permiso', () => {
    const leer = (a: string) => fs.readFileSync(path.join(process.cwd(), a), 'utf8');
    const cuerpo = (codigo: string, fn: string) => codigo.slice(codigo.indexOf(`export async function ${fn}`), codigo.indexOf(`export async function ${fn}`) + 900);
    expect(cuerpo(leer('src/app/actions/tareas-automaticas.actions.ts'), 'ejecutarTareaManual')).toMatch(/requirePermiso\(PERMISOS\.ADMINISTRACION\)/);
    expect(cuerpo(leer('src/app/actions/experience-total.ts'), 'activateUltimateEventSystem')).toMatch(/requirePermiso\(PERMISOS\.ADMINISTRACION\)/);
    expect(cuerpo(leer('src/app/actions/google-workspace-extended.ts'), 'notifyGuestsWithCalendarLinks')).toMatch(/requirePermisoAlguno\(PERMISOS\.ORGANIZACION\)/);
    expect(cuerpo(leer('src/app/actions/google-workspace-extended.ts'), 'notifyContractSignedToClient')).toMatch(/requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/);
    expect(cuerpo(leer('src/app/actions/fiesta/documentos.actions.ts'), 'deleteDocumento')).toMatch(/requirePermiso\(PERMISOS\.CONTABILIDAD\)/);
  });
});
