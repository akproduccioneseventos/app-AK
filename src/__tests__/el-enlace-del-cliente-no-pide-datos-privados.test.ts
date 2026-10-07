/**
 * Codex, auditoria 78 (orden 128 B): la pantalla que abre el cliente con el enlace de su
 * presupuesto pedia la ficha PRIVADA de la empresa (`getCompanyInfo`, con las cuentas de
 * cobro). Sin sesion del equipo esa lectura se rechaza, y el cliente veia "no encontrado".
 *
 * El candado: ninguna pantalla que se abre con un enlace (`get('token')`) llama a la version
 * privada. Para eso esta `getCompanyInfoPublica`. Recorre toda la app, no un archivo.
 */
import fs from 'fs';
import path from 'path';

function paginas(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return paginas(p);
    return /\.(tsx?|jsx?)$/.test(e.name) ? [p] : [];
  });
}

describe('lo que se abre con el enlace del cliente no pide datos privados', () => {
  it('ninguna pantalla con token llama a getCompanyInfo()', () => {
    const conToken = paginas(path.join(process.cwd(), 'src', 'app'))
      .filter((p) => !p.includes(`${path.sep}actions${path.sep}`))
      .filter((p) => /get\(\s*['"]token['"]\s*\)/.test(fs.readFileSync(p, 'utf-8')));
    expect(conToken.length).toBeGreaterThan(0);
    const malas = conToken.filter((p) => /\bgetCompanyInfo\s*\(/.test(fs.readFileSync(p, 'utf-8')));
    expect(malas.map((p) => path.relative(process.cwd(), p))).toEqual([]);
  });

  it('la pantalla del presupuesto usa la ficha publica', () => {
    const pagina = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'presupuestos', '[id]', 'ver', 'page.tsx'),
      'utf-8',
    );
    expect(pagina).toMatch(/getCompanyInfoPublica\(\)/);
  });
});
