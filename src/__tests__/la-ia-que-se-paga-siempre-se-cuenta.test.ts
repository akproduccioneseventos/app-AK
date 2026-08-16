import fs from 'fs';
import path from 'path';
import { COSTO_ESTIMADO_UYU } from '@/lib/ai/consumo';

/**
 * Toda llamada de inteligencia artificial que se paga tiene que pasar por el
 * contador del mes y por el tope de gasto.
 *
 * Por que existe esta prueba: los generadores de seguimiento comercial y de
 * material post-evento se sumaron sin contador. El gasto de esos botones no
 * aparecia en ningun lado hasta que llegaba la factura. Es facil que vuelva a
 * pasar con la proxima funcion que use IA.
 */

/** Archivos que llaman a Gemini y cuyo costo paga AK. */
const ACCIONES_QUE_GASTAN = [
  'src/app/actions/commercial-intelligence.ts',
  'src/app/actions/post-event-intelligence.ts',
  'src/app/actions/asistente-virtual.ts',
  'src/app/actions/touchpix-ai.ts',
  'src/app/actions/espejo-magico-ai.ts',
];

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('la inteligencia artificial que se paga siempre se cuenta', () => {
  it.each(ACCIONES_QUE_GASTAN)('%s anota lo que gasta', relativo => {
    const fuente = leer(relativo);

    expect(fuente).toContain('registrarConsumoIA');
  });

  it.each(ACCIONES_QUE_GASTAN)('%s respeta el tope del mes', relativo => {
    const fuente = leer(relativo);

    expect(fuente).toContain('hayPresupuestoParaIA');
  });

  it('los dos generadores nuevos tienen un costo estimado cargado', () => {
    expect(COSTO_ESTIMADO_UYU['seguimiento-comercial']).toBeGreaterThan(0);
    expect(COSTO_ESTIMADO_UYU['material-post-evento']).toBeGreaterThan(0);
  });

  it('al llegar al tope no se corta: queda el texto de siempre', () => {
    const comercial = leer('src/app/actions/commercial-intelligence.ts');
    const postEvento = leer('src/app/actions/post-event-intelligence.ts');

    // Misma decision que la fotocabina: nunca se deja al equipo sin mensaje por
    // una cuestion de plata. Se deja de gastar, no de funcionar.
    expect(comercial).toContain('tope de gasto');
    expect(comercial).toContain('messageForLead(input.name, input.reason)');
    expect(postEvento).toContain('tope de gasto');
    expect(postEvento).toContain('buildMessages(');
  });
});
