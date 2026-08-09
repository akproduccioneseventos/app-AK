import fs from 'fs';
import path from 'path';

/**
 * Defecto real que motivo estas pruebas: los conteos de invitados confirmados
 * contaban FILAS y no PERSONAS. Un invitado que confirma y trae tres
 * acompanantes son cuatro personas, pero figuraba como uno.
 *
 * Donde mas dolia: esos conteos se comparan contra `invitadosEstimados`, que si
 * son personas. Con 100 estimados y 30 filas que en realidad eran 90 personas,
 * el sistema decia 30% de avance y disparaba avisos de "faltan confirmaciones"
 * cuando la fiesta ya estaba casi llena.
 *
 * Se prueba sobre el codigo fuente porque son funciones internas repartidas en
 * varios archivos, y lo que hay que impedir es que vuelva el `.length`.
 */

const sourceRoot = path.resolve(__dirname, '..');

const ARCHIVOS_CON_CONTEO = [
  'lib/event-progress.ts',
  'lib/automatizaciones-engine.ts',
  'lib/fiesta-progress.ts',
  'lib/experience-center/experience-center.ts',
  'lib/world-class-experience/world-class-experience.ts',
  'app/actions/fiesta/invitados.actions.ts',
];

describe('conteo de invitados confirmados', () => {
  it.each(ARCHIVOS_CON_CONTEO)('en %s cuenta personas y no filas', (archivo) => {
    const source = fs.readFileSync(path.join(sourceRoot, archivo), 'utf8');

    // El patron prohibido: filtrar confirmados y cerrar con .length.
    const cuentaFilas = /rsvp === 'Confirmado'\)\s*\.length/.test(source)
      || /rsvp === 'si' \|\| rsvp === 'sí';\s*\}\)\.length/.test(source);

    expect(cuentaFilas).toBe(false);
    // Cada archivo lo escribe un poco distinto segun como tenga tipado el
    // invitado, pero todos tienen que caer en "el partySize, y si no hay, uno".
    expect(source).toMatch(/partySize\)? \|\| 1/);
  });

  it('un invitado con acompanantes suma todos, y el que cancela no suma', () => {
    // La cuenta que hacen todos los archivos de arriba, replicada acá para
    // dejar escrito el resultado esperado.
    const invitados = [
      { rsvp: 'Confirmado', partySize: 4 },
      { rsvp: 'Confirmado', partySize: undefined },
      { rsvp: 'Rechazado', partySize: 5 },
      { rsvp: 'Pendiente', partySize: 2 },
    ];

    const personas = invitados
      .filter((i) => i.rsvp === 'Confirmado')
      .reduce((total, i) => total + (i.partySize || 1), 0);

    // 4 del primero + 1 del que no declaro acompanantes. El que cancelo no
    // suma aunque tenga partySize cargado de antes.
    expect(personas).toBe(5);
  });
});
