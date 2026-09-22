/**
 * MATAFUEGO — El calendario no mueve la fiesta equivocada ni la muestra el dia que no es.
 *
 * Cuatro defectos que encontro Codex el 22 de setiembre de 2026, todos en el calendario:
 *
 * 1. **Arrastrar una reunion reprogramaba la fiesta entera.** Las reuniones y las fiestas se
 *    dibujan igual y las dos llevan el numero de la fiesta, asi que mover una entrevista
 *    cambiaba el dia de la celebracion **y le salia el aviso al cliente**.
 * 2. **Una fecha rota vaciaba el calendario entero**, porque la conversion tiraba error y el
 *    catch de afuera devolvia una lista vacia. Las reuniones estaban protegidas una por una;
 *    las fiestas no.
 * 3. **Las fiestas de noche aparecian al dia siguiente**, porque el dia se calculaba en hora
 *    de Greenwich. Las 23:00 de Uruguay son las 02:00 del dia siguiente alla. Es la misma
 *    equivocacion que dejo un cobro de la ultima noche afuera del reporte.
 * 4. **Una fecha imposible se guardaba como otra.** El 31 de febrero no falla: se corre solo
 *    al 3 de marzo, se guarda cambiado y sale el aviso al cliente con ese dia.
 *
 * Se probo rompiendolo a proposito: volviendo cada uno de los cuatro a como estaba, la
 * comprobacion que le corresponde se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const leer = (...partes: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...partes), 'utf-8');

const AGENDA = leer('src', 'app', 'actions', 'agenda.ts');
const CALENDARIO = leer('src', 'app', '(app)', 'calendario', 'page.tsx');

/** El cuerpo de una funcion, para no mirar el archivo entero. */
function cuerpo(codigo: string, firma: string): string {
  const inicio = codigo.indexOf(firma);
  if (inicio === -1) throw new Error(`No encontre ${firma}`);
  const siguiente = codigo.indexOf('\nexport ', inicio + firma.length);
  return codigo.slice(inicio, siguiente === -1 ? undefined : siguiente);
}

describe('El calendario no mueve la fiesta equivocada', () => {
  it('arrastrar una reunion no llama a cambiar la fecha de la fiesta', () => {
    const inicio = CALENDARIO.indexOf('const handleDragEnd');
    const hastaGuardar = CALENDARIO.indexOf('updateFiestaDate(', inicio);
    expect(hastaGuardar).toBeGreaterThan(inicio);
    const antesDeGuardar = CALENDARIO.slice(inicio, hastaGuardar);
    // Antes de tocar la fiesta tiene que haberse plantado y salido.
    expect(antesDeGuardar).toMatch(/reunion_|Reunión/);
    expect(antesDeGuardar).toContain('return;');
  });

  it('una fecha rota se saltea sola y no vacia el calendario', () => {
    const fn = cuerpo(AGENDA, 'export async function getCalendarEvents');
    // La fiesta con fecha ilegible devuelve null y las demas siguen.
    expect(fn).toContain('if (!date) {');
    expect(fn).toContain('return null;');
  });

  it('el dia se calcula en Uruguay, no en Greenwich', () => {
    expect(AGENDA).toContain("timeZone: 'America/Montevideo'");
    // Y no queda ningun dia sacado de la hora de Greenwich.
    expect(AGENDA).not.toContain("toISOString().split('T')[0]");
  });

  it('una fecha que no existe se rechaza antes de guardar y de avisarle al cliente', () => {
    const fn = cuerpo(AGENDA, 'export async function updateFiestaDate');
    const corte = fn.indexOf('esUnDiaQueExiste');
    expect(corte).toBeGreaterThan(-1);
    // El rechazo va ANTES del guardado y antes de la sincronizacion que manda el correo.
    expect(corte).toBeLessThan(fn.indexOf('saveFiesta('));
    expect(corte).toBeLessThan(fn.indexOf('syncFiestaToGoogleWorkspace('));
  });
});
