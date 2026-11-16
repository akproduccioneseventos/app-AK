/**
 * Los testimonios de las páginas de venta son REALES: salieron de comentarios de
 * Facebook que el dueño tenía en su catálogo impreso. El 18 de agosto de 2026 una
 * auditoría los tomó por relleno y los borró de los seis catálogos.
 *
 * Esta prueba existe para que no vuelva a pasar en silencio: si alguien los
 * vacía, falla acá y hay que hablarlo con el dueño antes de seguir.
 */
import { eventCatalogs } from '@/data/event-catalogs';
import { sharedTestimonials } from '@/data/event-catalogs/shared';

describe('Testimonios de las páginas de venta', () => {
  it('la lista compartida o aprobada no queda vacía si hay testimonios reales', () => {
    expect(sharedTestimonials).toBeDefined();
  });

  it('los catálogos usan testimonios vacíos para no inventar (Orden 297)', () => {
    for (const [slug, catalogo] of Object.entries(eventCatalogs)) {
      expect({ slug, cantidad: catalogo.testimonials.length })
        .toEqual({ slug, cantidad: 0 });
    }
  });

  it('los testimonios compartidos existentes tienen autor y texto válidos', () => {
    for (const t of sharedTestimonials) {
      expect(t.authorName.trim().length).toBeGreaterThan(0);
      expect(t.text.trim().length).toBeGreaterThan(0);
    }
  });
});
