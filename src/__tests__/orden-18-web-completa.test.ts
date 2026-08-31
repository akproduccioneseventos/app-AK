import { buscarEnElSitio } from '@/lib/buscador/buscar-sitio';
import { suscribirANovedades } from '@/app/actions/novedades-suscripcion';
import { catalogList } from '@/data/event-catalogs';

describe('Orden 18: Lo que le falta a la web para estar completa', () => {
  describe('Bloque 1: Migas de pan declaradas y visibles', () => {
    it('todos los catalogos tienen migas consistentes de Inicio y Nombre de evento', () => {
      for (const catalog of catalogList) {
        expect(catalog.name).toBeTruthy();
        expect(catalog.slug).toBeTruthy();
        const breadcrumbItems = [
          { name: 'Inicio', url: '/' },
          { name: catalog.name, url: `/public/${catalog.slug}` },
        ];
        expect(breadcrumbItems[0].name).toBe('Inicio');
        expect(breadcrumbItems[1].name).toBe(catalog.name);
      }
    });
  });

  describe('Bloque 2: Buscador dentro del sitio', () => {
    it('encuentra articulos del blog por palabra clave', () => {
      const res = buscarEnElSitio('quince');
      expect(res.length).toBeGreaterThan(0);
      expect(res.some((r) => r.tipo === 'articulo' || r.tipo === 'servicio')).toBe(true);
    });

    it('encuentra catalogos y servicios por sinonimos o tipo de fiesta', () => {
      const res = buscarEnElSitio('boda');
      expect(res.length).toBeGreaterThan(0);
      expect(res.some((r) => r.tipo === 'servicio')).toBe(true);
    });

    it('devuelve array vacio para consultas inexistentes o vacias', () => {
      expect(buscarEnElSitio('')).toEqual([]);
      expect(buscarEnElSitio('xyz-termino-imposible-999')).toEqual([]);
    });
  });

  describe('Bloque 5: Suscripcion a novedades', () => {
    it('valida correos invalidos', async () => {
      const res = await suscribirANovedades('correo-sin-arroba');
      expect(res.success).toBe(false);
      expect(res.message).toContain('correo electrónico válido');
    });

    it('acepta suscripciones validas', async () => {
      const res = await suscribirANovedades('invitado.nuevo@ejemplo.com');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Gracias por suscribirte');
    });
  });
});
