/** @jest-environment node */
/**
 * Orden 233 (26/10/2026). Once controles de permisos miraban `role === 'admin'` y no el perfil:
 * una cuenta vieja de administrador a la que el dueño le puso perfil de secretaria seguía
 * entrando a lo del dueño, incluido el borrado de la base. Comprobado rompiéndolo: volviendo a
 * poner `role !== 'admin'` en `ai-consumo.ts`, el candado de abajo se pone en rojo.
 */
import fs from 'fs';
import path from 'path';
import { esAdministrador } from '@/lib/auth/perfiles';

describe('el rol viejo admin no pasa por encima del perfil', () => {
  it('decide el perfil', () => {
    expect(esAdministrador({ role: 'admin', perfil: 'secretaria' })).toBe(false);
    expect(esAdministrador({ role: 'admin', perfil: 'operador' })).toBe(false);
    expect(esAdministrador({ role: 'admin', perfil: 'administrador' })).toBe(false);
    expect(esAdministrador({ role: 'user', perfil: 'dueno' })).toBe(true);
    expect(esAdministrador({ role: 'admin' })).toBe(true);
    expect(esAdministrador({ role: 'user' })).toBe(false);
    expect(esAdministrador(null)).toBe(false);
  });

  it('ningún control de permisos compara el rol con admin', () => {
    const raiz = path.join(process.cwd(), 'src');
    const permitidos = new Set([
      path.join('lib', 'auth', 'perfiles.ts'),
      path.join('app', 'actions', 'auth.ts'),
      path.join('app', '(app)', 'admin', 'usuarios', 'page.tsx'),
    ]);
    const malos: string[] = [];
    const recorrer = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === '__tests__' || e.name === 'node_modules') continue;
          recorrer(p);
        } else if (/\.(ts|tsx)$/.test(e.name)) {
          const rel = path.relative(raiz, p);
          if (permitidos.has(rel)) continue;
          const texto = fs.readFileSync(p, 'utf8');
          if (/role\s*[!=]==\s*['"]admin['"]/.test(texto)) malos.push(rel);
        }
      }
    };
    recorrer(raiz);
    expect(malos).toEqual([]);
  });

  it('en auth.ts el rol sólo se mira en el ingreso', () => {
    const texto = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/auth.ts'), 'utf8');
    const lineas = texto.split('\n').filter((l) => /role\s*[!=]==\s*['"]admin['"]/.test(l));
    expect(lineas.every((l) => /data\.role/.test(l))).toBe(true);
  });
});
