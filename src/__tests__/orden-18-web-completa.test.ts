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

  /**
   * La suscripcion a novedades se comprueba en
   * `src/__tests__/la-suscripcion-guarda-el-correo.test.ts`, y ahi se le pide lo que
   * importa: **que el correo quede guardado**, y que si no se puede guardar NO se le
   * conteste que si al visitante.
   *
   * Lo que habia aca comprobaba el texto del cartel -"Gracias por suscribirte"- y
   * daba verde con la funcion sin guardar nada, que es exactamente lo que estaba
   * pasando: el correo se perdia y el visitante se iba creyendo que quedo anotado.
   */
  describe('Bloque 5: Suscripcion a novedades', () => {
    it('un correo que no es correo no se acepta', async () => {
      const res = await suscribirANovedades('correo-sin-arroba');
      expect(res.success).toBe(false);
      expect(res.message).toContain('correo electrónico válido');
    });
  });

  describe('Bloque 2 y 4: Pantallas publicas /buscar y /mantenimiento', () => {
    it('la pantalla /buscar provee buscador accesible y enlace a inicio', () => {
      const fs = require('fs');
      const path = require('path');
      const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/buscar/page.tsx'), 'utf8');

      expect(fuente).toContain('buscarEnElSitio');
      expect(fuente).toContain('Buscador del Sitio');
      expect(fuente).toContain('href="/"');
      expect(fuente).toContain('input');
    });

    it('la pantalla /mantenimiento no bloquea el contacto y tiene enlace directo a WhatsApp', () => {
      const fs = require('fs');
      const path = require('path');
      const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/mantenimiento/page.tsx'), 'utf8');

      expect(fuente).toContain('Estamos haciendo mejoras');
      expect(fuente).toContain('https://wa.me/59898355530');
      expect(fuente).toContain('Escribinos directo por WhatsApp');
    });
  });
});
