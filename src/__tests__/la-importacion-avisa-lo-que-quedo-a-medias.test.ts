/** @jest-environment node */
/**
 * /presupuestos/importar NO PUEDE IRSE DE LA PANTALLA SIN AVISAR LO QUE FALTO.
 *
 * El caso real: el presupuesto se crea y la fiesta no. Antes el aviso quedaba en una
 * lista que solo se mostraba si la importacion fallaba entera; en este caso la pantalla
 * saltaba al presupuesto nuevo y el evento nunca habia existido.
 */
import { queSeLeDiceAlImportar } from '@/lib/presupuestos/aviso-de-importacion';

describe('/presupuestos/importar avisa cuando algo quedo a medias', () => {
  it('si el presupuesto se creo pero la fiesta no, lo dice y no lo llama exito', () => {
    const aviso = queSeLeDiceAlImportar({
      presupuestoId: 'P-1',
      warnings: ['El presupuesto se creó pero no se pudo crear la fiesta: la base no contesta'],
    });

    expect(aviso.esAMedias).toBe(true);
    expect(aviso.titulo).toMatch(/a medias/i);
    expect(aviso.detalle).toMatch(/no se pudo crear la fiesta/i);
  });

  it('si entro todo, avisa normal', () => {
    const aviso = queSeLeDiceAlImportar({ presupuestoId: 'P-2', warnings: [] });

    expect(aviso.esAMedias).toBe(false);
    expect(aviso.detalle).toContain('P-2');
  });
});
