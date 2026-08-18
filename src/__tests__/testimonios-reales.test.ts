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
  it('la lista compartida no queda vacía', () => {
    expect(sharedTestimonials.length).toBeGreaterThan(0);
  });

  it('cada catálogo muestra al menos dos testimonios', () => {
    for (const [slug, catalogo] of Object.entries(eventCatalogs)) {
      expect({ slug, cantidad: catalogo.testimonials.length })
        .toEqual({ slug, cantidad: expect.any(Number) });
      expect(catalogo.testimonials.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('cada testimonio tiene autor, texto y fecha', () => {
    const todos = [
      ...sharedTestimonials,
      ...Object.values(eventCatalogs).flatMap((c) => c.testimonials),
    ];
    expect(todos.length).toBeGreaterThanOrEqual(20);
    for (const t of todos) {
      expect(t.authorName.trim().length).toBeGreaterThan(0);
      expect(t.text.trim().length).toBeGreaterThan(0);
      expect(String(t.date || '').trim().length).toBeGreaterThan(0);
    }
  });
});
