import fs from 'fs';
import path from 'path';

/**
 * Los frenos que protegen la plata tienen que frenar de verdad.
 *
 * Dos errores que ya se cometieron y esta prueba impide que vuelvan:
 *
 * 1. **Contar por un dato que escribe el visitante.** El freno del chat del
 *    simulador contaba por el nombre o el contacto que ponia el prospecto: un
 *    programa automatico cambia el nombre en cada pedido y el freno no frena
 *    nada. Se cuenta por la direccion de quien llama, que no la elige el
 *    visitante.
 * 2. **Un techo por fiesta que en realidad no lo es.** El techo se armaba con la
 *    direccion adentro de la cuenta, asi que cien celulares distintos pidiendo
 *    una vez cada uno pasaban igual. Para eso esta `ignoreClientAddress`.
 *
 * Y lo tercero: **todo lo que se paga pasa por el contador de gasto**. Los dos
 * chats gastaban sin aparecer en ningun lado y el tope mensual no los frenaba.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const CHATS = [
  'src/app/actions/simulador-copilot.ts',
  'src/app/actions/salon-ia.actions.ts',
];

const CON_TECHO_POR_FIESTA = [
  'src/app/actions/espejo-magico-ai.ts',
  'src/app/actions/touchpix-ai.ts',
  'src/app/actions/salon-ia.actions.ts',
];

describe('los frenos contra robots', () => {
  it.each(CHATS)('%s tiene freno y cuenta el gasto', (archivo) => {
    const fuente = leer(archivo);

    expect(fuente).toContain('enforcePublicRateLimit');
    expect(fuente).toContain('hayPresupuestoParaIA');
    expect(fuente).toContain('registrarConsumoIA');
  });

  it('el freno del simulador NO cuenta por lo que escribe el visitante', () => {
    const fuente = leer('src/app/actions/simulador-copilot.ts');

    expect(fuente).not.toContain('identity: normalizedInput.currentState?.clienteContacto');
    expect(fuente).not.toContain('clienteNombre?.trim()\n        || \'anonimo\'');
  });

  it.each(CON_TECHO_POR_FIESTA)('%s tiene un techo por fiesta que cuenta sin la direccion', (archivo) => {
    const fuente = leer(archivo);

    expect(fuente).toContain('ignoreClientAddress: true');
  });

  it('el freno puede contar sin la direccion, a proposito', () => {
    const fuente = leer('src/lib/commercial/public-rate-limit.ts');

    expect(fuente).toContain('ignoreClientAddress');
    // Sigue contando por direccion cuando no se le pide lo contrario.
    expect(fuente).toContain('getClientAddress()');
  });
});
