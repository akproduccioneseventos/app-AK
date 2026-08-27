import fs from 'node:fs';
import path from 'node:path';

/**
 * El candado del defecto que dejaba todas las estaciones muertas.
 *
 * Pasó de verdad, y se vio recién abriendo la app en un navegador: el operador
 * tocaba "Iniciar cuenta regresiva" en la Plataforma 360, en Bogue o en el
 * Espejo Mágico y le aparecía un cartel rojo en inglés hablando de un campo de
 * la base. La estación no arrancaba. La causa era una sola: cada estación manda
 * únicamente los ajustes que usa, los que no manda quedaban como claves vacías,
 * y la base rechaza el documento entero si encuentra una sola.
 *
 * Esta prueba no reemplaza a la de navegador: sirve para que el arreglo no se
 * deshaga sin que nadie lo note, que es como volvería a pasar.
 */

const ARCHIVO = path.join(process.cwd(), 'src', 'app', 'actions', 'fiesta', 'sesion-entretenimiento.ts');
const codigo = fs.readFileSync(ARCHIVO, 'utf8');

describe('las estaciones pueden abrir su sesión', () => {
  it('los ajustes de la estación viajan sin claves vacías', () => {
    const sanitizador = codigo.match(/function sanitizeSessionSettings[\s\S]*?\n}/)?.[0] ?? '';
    expect(sanitizador).not.toBe('');
    expect(sanitizador).toContain('sinClavesVacias');
  });

  it('existe el filtro que saca las claves vacías', () => {
    expect(codigo).toMatch(/function sinClavesVacias[\s\S]*?valor !== undefined/);
  });

  it('al operador no se le muestra el error crudo de la base', () => {
    // `e.message` trae texto en inglés, nombres de campos y consejos de
    // programador. En una fiesta eso no le sirve a nadie.
    expect(codigo).not.toContain('error: e.message');
    expect(codigo).toContain('MENSAJE_DE_FALLA');
  });
});
