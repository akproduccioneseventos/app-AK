import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

/**
 * Los botones que confirman o guardan cambios nunca se quedan girando para siempre.
 */
describe('Los botones de mutación y plata no se cuelgan', () => {
  it('confirmar y rechazar un pago tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/pagos-rapidos/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(confirmPagoCliente(');
    expect(fuente).toContain('conTopeDeEspera(rejectPagoCliente(');
  });

  it('guardar un presupuesto tiene tope de espera', () => {
    const fuente = leer('src/app/(app)/presupuestos/nuevo/crear/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(updatePresupuesto(');
    expect(fuente).toContain('conTopeDeEspera(savePresupuesto(');
  });

  it('guardar y resolver incidentes tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/incidentes/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(createIncidente(');
    expect(fuente).toContain('conTopeDeEspera(resolverIncidente(');
  });

  it('guardar módulos de fiesta tiene tope de espera', () => {
    const fuente = leer('src/app/(app)/fiestas/nueva/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(updateModulosContratadosFiestaActual(');
  });

  it('guardar menú y repostería maestra tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/empresa/menus/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(saveReposteriaMasterTemplate(');
  });

  it('el aviso dice que no se guardo nada, para que nadie apriete dos veces', () => {
    const fuente = leer('src/lib/ui/tope-de-espera.ts');

    expect(fuente).toMatch(/No se guardo nada/i);
    // El tope es largo a proposito: el servidor se duerme y la primera operacion del dia
    // tarda. Cortar antes seria peor que no tener tope.
    expect(fuente).toContain('25_000');
  });

  /**
   * Estas cuatro pantallas quedaron afuera hasta el 17 de septiembre de 2026: el servidor ya
   * evitaba el cobro repetido, pero **si el servidor no contestaba, el boton se quedaba
   * girando para siempre** y el del mostrador no sabia si habia cobrado o no.
   */
  it('las pantallas /invoices/new y /invoices/[id] no dejan el boton girando', () => {
    // Las dos pantallas de facturas: la de crear y la de cobrar. Si el servidor no contesta, el
    // boton tiene que soltarse igual; si no, el del mostrador no sabe si cobro o no.
    const crear = leer('src/app/(app)/invoices/new/page.tsx');
    const cobrar = leer('src/app/(app)/invoices/[id]/page.tsx');

    expect(crear).toContain('conTopeDeEspera(saveInvoice(');
    expect(cobrar).toContain('conTopeDeEspera(addPaymentToInvoice(');
    expect(crear.split('finally').length).toBeGreaterThan(1);
    expect(cobrar.split('finally').length).toBeGreaterThan(1);
  });

  it('registrar un cobro y crear una factura tienen tope de espera', () => {
    expect(leer('src/app/(app)/invoices/[id]/page.tsx')).toContain('conTopeDeEspera(addPaymentToInvoice(');
    expect(leer('src/app/(app)/invoices/new/page.tsx')).toContain('conTopeDeEspera(saveInvoice(');
  });

  it('cobrar contra un presupuesto y guardarlo desde el configurador tienen tope de espera', () => {
    expect(leer('src/app/(app)/presupuestos/[id]/ver/page.tsx')).toContain('conTopeDeEspera(addPagoToPresupuesto(');
    expect(leer('src/app/(app)/empresa/configurador-reunion/page.tsx')).toContain('conTopeDeEspera(savePresupuesto(');
  });

  /**
   * Orden 64 - Bloque 4: Las pantallas de entretenimiento, invitado y recepción
   * tampoco dejan los botones girando para siempre.
   */
  it('las pantallas de entretenimiento e invitado no dejan el boton girando para siempre', () => {
    const buzon = leer('src/app/evento/buzon/[fiestaId]/page.tsx');
    const fotocabina = leer('src/app/evento/fotocabina/[fiestaId]/page.tsx');
    const espejo = leer('src/app/evento/espejo-magico/[fiestaId]/page.tsx');
    const p360 = leer('src/app/evento/plataforma-360/[fiestaId]/page.tsx');
    const social = leer('src/app/evento/social/[fiestaId]/page.tsx');
    const rsvp = leer('src/app/invitacion/[fiestaId]/rsvp/page.tsx');
    const feedback = leer('src/app/feedback/[fiestaId]/page.tsx');
    const recepcion = leer('src/app/recepcion/[fiestaId]/RecepcionClient.tsx');

    // Tope de espera en llamadas al servidor
    expect(buzon).toContain('conTopeDeEspera(uploadBuzonMessage(');
    expect(fotocabina).toContain('conTopeDeEspera(uploadEntretenimientoMedia(');
    expect(espejo).toContain('conTopeDeEspera(uploadEntretenimientoMedia(');
    expect(p360).toContain('conTopeDeEspera(uploadEntretenimientoMedia(');
    expect(social).toContain('conTopeDeEspera(uploadSocialPost(');
    expect(rsvp).toContain('conTopeDeEspera(submitPublicRsvp(');
    expect(feedback).toContain('conTopeDeEspera(saveFeedback(');
    expect(recepcion).toContain('conTopeDeEspera(checkInGuest(');

    // Apagado del botón garantizado en finally
    expect(buzon.split('finally').length).toBeGreaterThan(1);
    expect(fotocabina.split('finally').length).toBeGreaterThan(1);
    expect(espejo.split('finally').length).toBeGreaterThan(1);
    expect(p360.split('finally').length).toBeGreaterThan(1);
    expect(social.split('finally').length).toBeGreaterThan(1);
    expect(rsvp.split('finally').length).toBeGreaterThan(1);
    expect(feedback.split('finally').length).toBeGreaterThan(1);
    expect(recepcion.split('finally').length).toBeGreaterThan(1);
  });
});
