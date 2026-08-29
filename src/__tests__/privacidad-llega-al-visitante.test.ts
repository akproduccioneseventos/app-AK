/**
 * QUE LA PAGINA DE PRIVACIDAD LE LLEGUE AL VISITANTE
 *
 * Una página de privacidad que existe y a la que nadie puede llegar no sirve
 * para nada: ni para el visitante, ni para Google, ni si alguna vez hace falta
 * mostrarla.
 *
 * Son tres cosas que se rompen en silencio, y por eso van congeladas acá:
 *
 *   1. Que el guardia de acceso la deje entrar sin cuenta. Si no está
 *      declarada, el visitante termina en la pantalla de ingreso.
 *   2. Que Google la pueda leer. El permiso está cerrado por defecto y se abre
 *      página por página: si no está en la lista, Google la tiene prohibida.
 *   3. Que se llegue desde el pie. Una página sin ningún enlace no la encuentra
 *      nadie.
 *
 * La escribió Claude el 28 de agosto de 2026, después de que el control de
 * promesas frenara la subida por no tener ninguna prueba. Funcionó.
 */

import fs from 'fs';
import path from 'path';
import { isPublicPathPrefix } from '@/lib/auth/public-paths';
import { PAGINAS_PARA_GOOGLE, prioridadDePagina } from '@/lib/seo/paginas-publicas';

const RUTA = '/privacidad';

describe('La página de privacidad le llega al visitante', () => {
  it('existe el archivo de la pantalla', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/privacidad/page.tsx'))).toBe(true);
  });

  it('el visitante entra sin tener cuenta', () => {
    expect(isPublicPathPrefix(RUTA)).toBe(true);
  });

  it('Google la puede leer, y sin competirle a las páginas que venden', () => {
    expect(PAGINAS_PARA_GOOGLE).toContain(RUTA);
    expect(prioridadDePagina(RUTA)).toBeLessThan(prioridadDePagina('/'));
    expect(prioridadDePagina(RUTA)).toBeLessThan(prioridadDePagina('/bodas'));
  });

  it('se llega desde el pie de página', () => {
    const pie = fs.readFileSync(path.join(process.cwd(), 'src/components/public-footer.tsx'), 'utf8');
    expect(pie).toContain('href="/privacidad"');
  });

  it('dice lo que tiene que decir, no un texto de relleno', () => {
    const pagina = fs.readFileSync(
      path.join(process.cwd(), 'src/app/privacidad/page.tsx'),
      'utf8'
    );
    // Lo que el dueño decidió que la página afirme.
    expect(pagina).toMatch(/no vendemos ni prestamos tus datos/i);
    expect(pagina).toMatch(/cookies/i);
    expect(pagina).toMatch(/borramos/i);
  });

  it('no le salta ningún cartel encima al visitante', () => {
    // La condición del dueño fue "mientras no molesten". Si alguien agrega un
    // banner de cookies, esta prueba se pone en rojo y hay que hablarlo.
    const pie = fs.readFileSync(path.join(process.cwd(), 'src/components/public-footer.tsx'), 'utf8');
    expect(pie).not.toMatch(/CookieConsent|CookieBanner|cookie-banner/i);
  });
});
