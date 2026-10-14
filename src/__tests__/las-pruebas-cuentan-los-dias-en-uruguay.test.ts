/**
 * LAS PRUEBAS CUENTAN "HOY" COMO LA APP (14 de octubre de 2026).
 *
 * La app cuenta los días en hora de Uruguay. Tres pruebas armaban "hoy" o "en 2 días" con la hora del
 * servidor (Greenwich): entre las 21 y la medianoche de Uruguay ya era mañana, daban un día de más y
 * frenaron la puerta de noche. Este control no deja escribir una fecha "de hoy" con `getDate()` y
 * `getFullYear()` en una prueba: se usa `hoyEnUruguay()`.
 */
import fs from 'fs';
import path from 'path';

const carpeta = path.join(process.cwd(), 'src/__tests__');
const FORMA = /\$\{\s*\w+\.getFullYear\(\)\s*\}-\$\{[^}]*getMonth\(\)[^}]*\}-\$\{[^}]*getDate\(\)[^}]*\}/;

it('ninguna prueba arma la fecha de hoy con la hora del servidor', () => {
  const archivos = fs.readdirSync(carpeta).filter((f) => /\.test\.tsx?$/.test(f));
  expect(archivos.length).toBeGreaterThan(100);
  const conLaForma = archivos.filter((f) => f !== path.basename(__filename) && FORMA.test(fs.readFileSync(path.join(carpeta, f), 'utf8')));
  expect(conLaForma).toEqual([]);
});
