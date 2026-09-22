/**
 * MATAFUEGO — El recibo y el contrato de sena imprimen el dia que el cliente contrato.
 *
 * Lo encontro el barrido del 22 de setiembre de 2026, con la pregunta de la hora de Uruguay.
 *
 * `new Date('2026-10-10').toLocaleDateString(...)` entiende el dia suelto como medianoche de
 * Greenwich, y en Uruguay —tres horas menos— lo muestra **un dia antes**. Eso salia impreso en
 * el recibo y en el contrato de sena: **el papel que firma el cliente con la fecha de su fiesta
 * corrida un dia**. Es la misma equivocacion que ya habia dejado un cobro de la ultima noche
 * afuera del reporte y que mostraba las fiestas de noche al dia siguiente en el calendario.
 *
 * Se probo rompiendolo a proposito: volviendo las dos fechas a la conversion del navegador,
 * las dos primeras comprobaciones se ponen en rojo.
 */
import fs from 'fs';
import path from 'path';
import { diaCalendario } from '@/lib/reportes/rango-de-dias';

const PAPEL = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', '(app)', 'presupuestos', '[id]', 'recibo-contrato', 'page.tsx'),
  'utf-8',
);

describe('El recibo y el contrato no corren la fecha', () => {
  it('las dos fechas del evento pasan por el dia de Uruguay', () => {
    const usos = PAPEL.match(/diaDelEventoParaElPapel\(overriddenFecha\)/g) || [];
    expect(usos).toHaveLength(2);
  });

  it('ninguna fecha del evento se convierte con el reloj del navegador', () => {
    expect(PAPEL).not.toContain("new Date(overriddenFecha).toLocaleDateString");
  });

  it('un dia suelto no retrocede: el 10 de octubre sigue siendo el 10', () => {
    expect(diaCalendario('2026-10-10')).toBe('2026-10-10');
  });

  it('una fiesta de las once de la noche en Uruguay no salta al dia siguiente', () => {
    expect(diaCalendario('2026-10-10T23:00:00-03:00')).toBe('2026-10-10');
  });
});
