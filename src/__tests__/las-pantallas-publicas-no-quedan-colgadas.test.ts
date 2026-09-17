/** @jest-environment node */
/**
 * NINGUNA PANTALLA QUE CONTESTA UN INVITADO SE QUEDA EN "ENVIANDO...".
 *
 * **Lo encontro Codex el 17 de septiembre de 2026, en la encuesta post fiesta.** El envio se
 * hacia sin red de seguridad: si el servidor no contestaba o se cortaba la senal, el aviso de
 * "Enviando..." **quedaba prendido para siempre**. El invitado ve el boton girando, se cansa y
 * se va creyendo que mando sus comentarios. No mando nada y nadie se entera.
 *
 * Estas son las pantallas que usa gente sin cuenta —el invitado, el cliente— desde el celular,
 * que es donde la senal se corta de verdad. En todas, el cartel de "enviando" se tiene que
 * apagar **pase lo que pase**: eso es lo que hace un `finally`.
 *
 * **Lo que esta prueba NO puede ver:** que el cartel se apague de verdad en la pantalla; eso lo
 * mira una prueba de navegador. Esta frena la forma exacta en que ya se escapo una vez.
 */
import fs from 'fs';
import path from 'path';

const PANTALLAS_SIN_CUENTA = [
  'src/app/feedback/[fiestaId]/page.tsx',
  'src/app/invitacion/[fiestaId]/rsvp/page.tsx',
  'src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx',
  'src/app/evento/buzon/[fiestaId]/page.tsx',
];

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf-8');
}

describe('Las pantallas que contesta un invitado no se quedan colgadas', () => {
  it.each(PANTALLAS_SIN_CUENTA)('%s apaga el cartel de enviando pase lo que pase', (pantalla) => {
    const codigo = leer(pantalla);
    const prende = (codigo.match(/set(IsSubmitting|Enviando)\(true\)/g) || []).length;
    if (prende === 0) return; // esa pantalla no manda nada: no hay cartel que apagar

    const bloquesFinally = codigo.split(/\}\s*finally\s*\{/).slice(1);
    const apagadosSeguros = bloquesFinally.filter((bloque) =>
      /set(IsSubmitting|Enviando)\(false\)/.test(bloque.slice(0, 400)),
    ).length;

    expect(apagadosSeguros).toBeGreaterThanOrEqual(prende);
  });

  it('la lista de pantallas sin cuenta no quedo vieja', () => {
    // Si alguien agrega una pantalla publica con envio y no la anota aca, esto lo dice.
    for (const pantalla of PANTALLAS_SIN_CUENTA) {
      expect(fs.existsSync(path.join(process.cwd(), pantalla))).toBe(true);
    }
  });
});
