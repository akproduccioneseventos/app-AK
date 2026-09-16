/**
 * LA PANTALLA /settings/backup NO PUEDE DECIR "COMPLETA" CUANDO FALTO ALGO.
 *
 * **Lo encontro Codex el 16 de septiembre de 2026 (BKP03).** El servidor contestaba
 * "salio bien" con la lista de archivos que no habian entrado adentro, y la pantalla
 * miraba solo si la respuesta habia llegado: anunciaba **"Restauracion Completa"** y
 * recargaba a los 1,5 segundos, tapando cualquier aviso. La persona seguia trabajando
 * creyendo que tenia todo restaurado.
 *
 * Esta prueba mira el resultado que ve la persona: que diga, que no diga, y si recarga.
 */
import { comoSalioLaRestauracion, queSeLeDice } from '@/lib/respaldos/como-salio-la-restauracion';

describe('/settings/backup: la restauracion dice la verdad', () => {
  it('si falto un archivo, NO dice "Restauracion Completa" y nombra lo que falto', () => {
    const como = comoSalioLaRestauracion({ errors: ['presupuestos.json'], skipped: [] });
    const aviso = queSeLeDice(como);

    expect(como.estado).toBe('parcial');
    expect(aviso.titulo).not.toMatch(/completa/i);
    expect(aviso.detalle).toContain('presupuestos.json');
  });

  it('si falto algo, la pantalla NO se recarga: la recarga tapa el aviso', () => {
    const aviso = queSeLeDice(comoSalioLaRestauracion({ errors: ['customers.json'] }));

    expect(aviso.puedeRecargar).toBe(false);
  });

  it('si entro todo, si dice completa y si recarga', () => {
    const como = comoSalioLaRestauracion({ errors: [], skipped: ['algo-que-no-va.json'] });
    const aviso = queSeLeDice(como);

    expect(como.estado).toBe('completa');
    expect(aviso.titulo).toMatch(/completa/i);
    expect(aviso.puedeRecargar).toBe(true);
  });
});
