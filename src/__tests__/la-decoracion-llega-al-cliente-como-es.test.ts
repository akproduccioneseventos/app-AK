/**
 * MATAFUEGO: la decoracion que ve el cliente es la de ahora, y llega entera.
 *
 * Dos defectos encontrados por Codex el 10 de septiembre de 2026, los dos con la
 * misma forma: la pantalla del equipo dice una cosa y al cliente le llega otra.
 *
 * 1. **La paleta vieja.** El equipo edita los colores en `paletaColores`; el portal
 *    leia `colorPalette`, que es la lista que quedo de antes. El cliente veia
 *    colores que ya nadie habia elegido.
 * 2. **La captura de la vista 3D.** Al capturarla, la pantalla del equipo anuncia
 *    "preview guardado en el portal del cliente". El recorte que sale del servidor
 *    **no incluia ese campo**, asi que no llegaba nunca. La promesa estaba y el
 *    dato no.
 *
 * Se probo rompiendolo: sacando el campo del recorte y volviendo la paleta al orden
 * viejo, las comprobaciones se ponen en rojo.
 */
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';

const FIESTA = {
  id: 'fiesta-deco-1',
  configuracion: { nombreEvento: 'Boda de Ana y Luis' },
  decoracion: {
    tema: 'Jardin de noche',
    paletaColores: { primary: '#123456', secondary: '#654321', accent: '#abcdef' },
    colorPalette: { primary: '#222222', secondary: '#333333', accent: '#444444' },
    salonPreview3dUrl: 'data:image/png;base64,laCaptura',
    generalNotesDecoracion: 'OJO: el padre de la novia no quiere flores blancas, no decirle nada',
    notaDecoracionParaElCliente: 'Elegimos jazmines y luces cálidas para tu entrada',
    itemsDecoracion: [{ nombre: 'Arco de flores', costo: 4500 }],
  },
} as any;

describe('la decoracion llega al cliente como es', () => {
  it('la captura de la vista 3D viaja al portal del cliente', () => {
    const paraElCliente = mapFiestaToClientPortal(FIESTA) as any;
    expect(paraElCliente.decoracion?.salonPreview3dUrl).toBe('data:image/png;base64,laCaptura');
  });

  it('la paleta que el equipo edito es la que sale, no la vieja', () => {
    const paraElCliente = mapFiestaToClientPortal(FIESTA) as any;
    const deco = paraElCliente.decoracion;
    // El orden que usa la pantalla: primero la editada.
    const paletaQueVeElCliente = deco?.paletaColores || deco?.colorPalette;
    expect(paletaQueVeElCliente?.primary).toBe('#123456');
  });

  /**
   * El cuadro "Notas Generales" de la pantalla de decoracion dice, en su propio
   * texto de ayuda, "notas para el equipo". Y se le publicaba al cliente tal cual.
   * Lo encontro Codex el 10 de septiembre de 2026.
   */
  it('la nota INTERNA del equipo no sale del servidor', () => {
    const paraElCliente = mapFiestaToClientPortal(FIESTA) as any;
    const enviado = JSON.stringify(paraElCliente);
    expect(enviado).not.toContain('no quiere flores blancas');
    // Y la que si es para el cliente, viaja.
    expect(paraElCliente.decoracion?.notaDecoracionParaElCliente).toContain('jazmines');
  });

  it('el costo de cada elemento de decoracion NO sale hacia el cliente', () => {
    const paraElCliente = mapFiestaToClientPortal(FIESTA) as any;
    const enviado = JSON.stringify(paraElCliente.decoracion || {});
    expect(enviado).not.toContain('4500');
  });
});
